#!/usr/bin/env python3
"""
Advisor Pipeline - Research Assistant Mode
============================================
For broad/advisory queries, uses plan-then-retrieve-then-synthesize architecture.

Flow:
1. Intent classifier (FACTUAL vs ADVISORY) - Llama 8B
2. If ADVISORY:
   a. Planner generates research brief (3-6 topics with focus type)  - gpt-oss-120b
   b. Per-topic parallel retrieval using existing fusion pipeline
   c. Structured synthesis from per-topic evidence - Llama 70B
3. If FACTUAL: existing fast path in retrieval-fusion.py

Usage:
  python3 scripts/retrieval-advisor.py "How do I get started with SBTi?"
  python3 scripts/retrieval-advisor.py --compare  # Compare advisor vs basic pipeline
"""

import argparse
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor

_env = os.path.join(os.path.dirname(__file__), "..", ".env.local")
if os.path.exists(_env):
    with open(_env) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                if k not in os.environ:
                    os.environ[k] = v

import importlib.util
spec = importlib.util.spec_from_file_location("rf", "scripts/retrieval-fusion.py")
rf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rf)


GROQ_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0"


def groq_stream(model: str, system: str, user: str, max_tokens: int = 2500,
                temperature: float = 0.2):
    """
    Streaming Groq call. Yields each text delta as it arrives.
    Final yield is None (sentinel) followed by usage dict if available.
    """
    import urllib.request, urllib.error

    api_keys = [k.strip() for k in os.environ.get("GROQ_API_KEYS", "").split(",") if k.strip()]
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
    }

    last_error = None
    for api_key in api_keys:
        try:
            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=json.dumps(payload).encode(),
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "User-Agent": GROQ_UA,
                    "Accept": "text/event-stream",
                }
            )
            resp = urllib.request.urlopen(req, timeout=120)
            buffer = b""
            for chunk in iter(lambda: resp.read(2048), b""):
                if not chunk:
                    break
                buffer += chunk
                while b"\n" in buffer:
                    line, buffer = buffer.split(b"\n", 1)
                    line = line.strip()
                    if not line or not line.startswith(b"data: "):
                        continue
                    data_str = line[6:].decode("utf-8", errors="replace")
                    if data_str == "[DONE]":
                        return
                    try:
                        evt = json.loads(data_str)
                        choices = evt.get("choices", [])
                        if choices:
                            delta = choices[0].get("delta", {}).get("content", "")
                            if delta:
                                yield delta
                    except json.JSONDecodeError:
                        continue
            return
        except urllib.error.HTTPError as e:
            last_error = e
            if e.code in (401, 403, 429):
                continue
            raise
        except Exception as e:
            last_error = e
            continue

    raise RuntimeError(f"All Groq keys failed for streaming: {last_error}")


def groq_call(model: str, system: str, user: str, json_mode: bool = False,
              max_tokens: int = 1500, temperature: float = 0.1) -> tuple[str, dict]:
    """Generic Groq API call with fallback across keys. Returns (content, usage)."""
    import urllib.request, urllib.error

    api_keys = [k.strip() for k in os.environ.get("GROQ_API_KEYS", "").split(",") if k.strip()]

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    for api_key in api_keys:
        try:
            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=json.dumps(payload).encode(),
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "User-Agent": GROQ_UA,
                }
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read().decode())
            return result["choices"][0]["message"]["content"], result.get("usage", {})
        except urllib.error.HTTPError as e:
            if e.code in (401, 403, 429):
                continue
            raise
    raise RuntimeError("All Groq keys failed")


# -----------------------------------------------------------------------------
# Step 1: Intent Classification
# -----------------------------------------------------------------------------
def classify_intent(query: str) -> tuple[str, float]:
    """
    Classify query as FACTUAL (lookup) or ADVISORY (broad/practitioner).
    Returns (intent, ms_elapsed).
    """
    system = """You are a query intent classifier for a sustainability knowledge system.

Classify the user query as one of:
- FACTUAL: A specific lookup with a single-chunk answer (e.g., "What is baseline period?", "What's the formula for X?", "When does CBAM apply?")
- ADVISORY: A broad question requiring synthesis across multiple sections (e.g., "How do I get started with X?", "What's the difference between X, Y, Z?", "Should I do X?", "Compare A and B", "What are the risks of X?")

Output JSON only: {"intent": "FACTUAL" | "ADVISORY", "reason": "brief reason"}"""

    t0 = time.time()
    try:
        content, _ = groq_call("llama-3.1-8b-instant", system, query, json_mode=True, max_tokens=200)
        parsed = json.loads(content)
        return parsed.get("intent", "ADVISORY"), (time.time() - t0) * 1000
    except Exception:
        return "ADVISORY", (time.time() - t0) * 1000  # Default to advisory if unclear


# -----------------------------------------------------------------------------
# Step 2: Research Planner
# -----------------------------------------------------------------------------
def plan_research(query: str) -> tuple[list[dict], float]:
    """
    Generate a research brief: list of topics a practitioner needs covered.
    Returns (topics, ms_elapsed).
    """
    system = """You are a research planner for a sustainability knowledge system serving practitioners (sustainability managers, compliance officers, ESG analysts).

Given the user's question, produce a research brief: the specific sub-topics that must be covered to answer well. Think about what a practitioner really needs to know, not just what the question literally asks.

For each topic, specify its focus:
- "procedural": step-by-step process, how-to
- "decision": decision criteria, options, tradeoffs
- "definition": core concept or term clarification
- "risk": pitfalls, compliance risks, common mistakes
- "example": concrete examples, case studies
- "requirement": hard requirements, thresholds, scope

Output JSON only:
{"topics": [
  {"topic": "specific retrievable topic statement", "focus": "procedural|decision|definition|risk|example|requirement"},
  ...
]}

Produce 3-6 topics. Each topic should be specific enough to guide retrieval (not vague).

Example for "How do I get started with SBTi?":
{
  "topics": [
    {"topic": "The SBTi 5-step target-setting process (Commit, Develop, Submit, Communicate, Disclose)", "focus": "procedural"},
    {"topic": "Ambition level selection between 1.5°C and well-below-2°C pathways", "focus": "decision"},
    {"topic": "Scope 3 inclusion criteria including the 40% materiality trigger", "focus": "requirement"},
    {"topic": "Base year selection rules and recalculation triggers", "focus": "requirement"},
    {"topic": "Common reasons SBTi submissions get rejected", "focus": "risk"}
  ]
}"""

    t0 = time.time()
    try:
        content, _ = groq_call("openai/gpt-oss-120b", system, query, json_mode=True, max_tokens=1500)
        parsed = json.loads(content)
        topics = parsed.get("topics", [])
        if not topics:
            # Fallback: single topic = original query
            topics = [{"topic": query, "focus": "definition"}]
        return topics[:6], (time.time() - t0) * 1000
    except Exception as e:
        print(f"  Planner failed: {e}")
        return [{"topic": query, "focus": "definition"}], (time.time() - t0) * 1000


# -----------------------------------------------------------------------------
# Step 3: Per-topic retrieval (parallel)
# -----------------------------------------------------------------------------
def retrieve_for_topic(topic: dict, chunks_data: dict, defs_data: dict, forms_data: dict,
                       chunks_matrix, defs_matrix, forms_matrix) -> list[dict]:
    """Retrieve chunks for a single topic, biased by focus type."""
    topic_text = topic["topic"]
    focus = topic.get("focus", "definition")

    # Embed the topic as query
    topic_emb = rf.embed_query(topic_text)

    # Focus-based retrieval strategy:
    # - procedural/requirement/risk: boost chunks, limit defs
    # - definition: definitions are fine
    # - example: chunks preferred
    # - decision: chunks + formulas
    if focus in ("procedural", "requirement", "risk", "example"):
        chunks_k, defs_k, forms_k = 10, 1, 1  # Emphasize chunks
    elif focus == "decision":
        chunks_k, defs_k, forms_k = 8, 2, 2
    else:  # definition
        chunks_k, defs_k, forms_k = 5, 4, 1

    chunk_hits = rf.search_chunks(topic_text, topic_emb, chunks_data, chunks_matrix, top_k=chunks_k)
    def_hits = rf.search_definitions(topic_text, topic_emb, defs_data, defs_matrix, top_k=defs_k)
    form_hits = rf.search_formulas(topic_text, topic_emb, forms_data, forms_matrix, top_k=forms_k)

    # Rerank the topic's own pool
    pool = chunk_hits + def_hits + form_hits
    reranked = rf.rerank_with_voyage(topic_text, pool, top_k=4)

    # Tag each result with its source topic
    for r in reranked:
        r["source_topic"] = topic_text
        r["source_focus"] = focus

    return reranked


def retrieve_per_topic(topics: list[dict], chunks_data, defs_data, forms_data,
                       chunks_matrix, defs_matrix, forms_matrix) -> tuple[list[list[dict]], float]:
    """Run retrieval for each topic in parallel. Returns (per_topic_results, ms_elapsed)."""
    t0 = time.time()

    with ThreadPoolExecutor(max_workers=min(len(topics), 6)) as executor:
        futures = [
            executor.submit(retrieve_for_topic, topic, chunks_data, defs_data, forms_data,
                            chunks_matrix, defs_matrix, forms_matrix)
            for topic in topics
        ]
        per_topic_results = [f.result() for f in futures]

    return per_topic_results, (time.time() - t0) * 1000


# -----------------------------------------------------------------------------
# Step 4: Structured Synthesis
# -----------------------------------------------------------------------------
def synthesize_advisory(query: str, topics: list[dict], per_topic_results: list[list[dict]],
                        model: str = "llama-3.3-70b-versatile") -> tuple[str, float]:
    """Synthesize advisory answer using structured brief + per-topic evidence."""
    t0 = time.time()

    # Build structured context - topic by topic
    context_parts = [f"Question: {query}\n"]
    context_parts.append("Research brief (topics to cover in your answer):")
    for i, topic in enumerate(topics, 1):
        context_parts.append(f"  {i}. [{topic['focus']}] {topic['topic']}")
    context_parts.append("")
    context_parts.append("Evidence retrieved per topic:")
    context_parts.append("=" * 60)

    for topic, results in zip(topics, per_topic_results):
        context_parts.append(f"\nTOPIC: {topic['topic']}")
        context_parts.append(f"FOCUS: {topic['focus']}")
        context_parts.append("-" * 40)
        for r in results[:4]:
            src = f"[{r['doc_title']}, {r['section_title'][:50]}, p.{r['page']}]"
            context_parts.append(f"\n{src}")
            context_parts.append(r["content"][:500])
        context_parts.append("")

    context = "\n".join(context_parts)

    system = """You are SustainIQ, an advisor to sustainability practitioners (managers, compliance officers, ESG analysts).

You've been given a user question and a research brief listing the topics to cover, with evidence per topic.

RULES:
1. Structure your answer to cover EACH topic in the brief (use clear sections or paragraphs).
2. Cite every substantive claim with [Doc Title, Section, p.X].
3. If evidence for a topic is thin or missing, say so explicitly - don't fabricate.
4. For "procedural" topics: give step-by-step guidance.
5. For "risk" topics: flag concrete risks, pitfalls, regulatory exposure.
6. For "decision" topics: present options with tradeoffs, not just one answer.
7. For "requirement" topics: state exact thresholds, dates, criteria.
8. Disambiguate related-but-distinct frameworks (e.g., SBTi vs SBTN) when both surface.
9. End with a "What to do next" paragraph if the question is actionable.
10. Keep total response under 600 words unless complexity requires more."""

    content, usage = groq_call(model, system, context, max_tokens=2500, temperature=0.2)
    return content, (time.time() - t0) * 1000, usage


# -----------------------------------------------------------------------------
# Main flow
# -----------------------------------------------------------------------------
def run_advisory(query: str, chunks_data, defs_data, forms_data,
                 chunks_matrix, defs_matrix, forms_matrix, verbose: bool = True):
    """Full advisory pipeline."""
    timings = {}

    # Step 1: Classify
    intent, t_intent = classify_intent(query)
    timings["intent_ms"] = t_intent
    if verbose:
        print(f"\n[Intent] {intent} ({t_intent:.0f}ms)")

    # If factual, use existing fast path (single retrieval + synthesis)
    if intent == "FACTUAL":
        if verbose:
            print("  Using FACTUAL fast path (existing pipeline)")
        q_emb = rf.embed_query(query)
        chunk_hits = rf.search_chunks(query, q_emb, chunks_data, chunks_matrix, top_k=15)
        def_hits = rf.search_definitions(query, q_emb, defs_data, defs_matrix, top_k=5)
        form_hits = rf.search_formulas(query, q_emb, forms_data, forms_matrix, top_k=3)
        fused = rf.rrf_fuse([chunk_hits, def_hits, form_hits])
        diverse = rf.enforce_diversity(fused, def_hits, form_hits, top_n=15)
        final = rf.rerank_with_voyage(query, diverse, top_k=8)

        t0 = time.time()
        answer, synth_info = rf.synthesize_answer(query, final)
        timings["synthesis_ms"] = synth_info.get("synthesis_ms", 0)
        return {"intent": "FACTUAL", "answer": answer, "timings": timings, "sources": final}

    # Step 2: Plan
    topics, t_plan = plan_research(query)
    timings["plan_ms"] = t_plan
    if verbose:
        print(f"\n[Plan] {len(topics)} topics ({t_plan:.0f}ms):")
        for i, t in enumerate(topics, 1):
            print(f"  {i}. [{t['focus']}] {t['topic']}")

    # Step 3: Retrieve per topic (parallel)
    per_topic_results, t_retrieve = retrieve_per_topic(
        topics, chunks_data, defs_data, forms_data,
        chunks_matrix, defs_matrix, forms_matrix
    )
    timings["retrieval_ms"] = t_retrieve
    if verbose:
        print(f"\n[Retrieval] Completed ({t_retrieve:.0f}ms for {len(topics)} topics in parallel)")
        for topic, results in zip(topics, per_topic_results):
            print(f"  {topic['topic'][:50]}:")
            for r in results[:2]:
                print(f"    -> {r['doc_title'][:40]} | {r['section_title'][:40]}")

    # Step 4: Synthesize
    answer, t_synth, usage = synthesize_advisory(query, topics, per_topic_results)
    timings["synthesis_ms"] = t_synth
    timings["tokens_in"] = usage.get("prompt_tokens", 0)
    timings["tokens_out"] = usage.get("completion_tokens", 0)

    timings["total_ms"] = sum(v for k, v in timings.items() if k.endswith("_ms"))

    # Collect all unique sources
    all_sources = []
    seen = set()
    for results in per_topic_results:
        for r in results[:2]:
            key = (r["doc_title"], r["section_title"])
            if key not in seen:
                seen.add(key)
                all_sources.append(r)

    return {
        "intent": "ADVISORY",
        "topics": topics,
        "answer": answer,
        "timings": timings,
        "sources": all_sources[:10],
    }


# ============================================================================
# PRODUCTION PIPELINE WITH REVISE LOOP
# ============================================================================

REVISE_SYSTEM_PROMPT = """You are revising a sustainability advisory answer to remove unsupported claims.

A fact-checker has identified specific claims in your draft that are NOT grounded in the retrieved sources. Your task:

1. REMOVE every unsupported claim entirely. Do NOT soften, hedge, or rephrase — REMOVE.
2. Do NOT replace unsupported specifics with new specifics. Instead, state the limitation:
   "The sources do not specify [X] for this standard; consult [standard name] directly."
3. KEEP everything else — structure, tables, grounded claims, citations.
4. If a table row or example loses its specifics, remove that row/example entirely.
5. At the end, add a brief "**Source limitations**" section listing what the retrieved sources did NOT cover.

Output: the revised answer in the same format (tables, headers, numbered lists). No meta-commentary."""


def extract_claims_for_check(answer: str) -> list[dict]:
    """Extract specific claims from answer for fact-checking."""
    system = """Extract every SPECIFIC factual claim containing numbers, percentages, named projects, named requirements, timeframes, or specific processes. Ignore general statements.
Output JSON: {"claims": [{"claim": "...", "specifics": "..."}]}"""
    try:
        content, _ = groq_call(
            "meta-llama/llama-4-scout-17b-16e-instruct",
            system,
            f"Answer:\n{answer}",
            json_mode=True, max_tokens=2000, temperature=0.1,
        )
        return json.loads(content).get("claims", [])
    except Exception:
        return []


def verify_extracted_claims(claims: list[dict], sources_text: str) -> list[dict]:
    """Verify each claim against the retrieved context."""
    if not claims:
        return []
    system = """For each claim, check if its specific detail appears in the sources.
GROUNDED: exact specific detail present.
PARTIAL: general concept present but specific not verified.
NOT_GROUNDED: specific detail not supported.
Output JSON: {"verifications": [{"claim": "...", "status": "GROUNDED|PARTIAL|NOT_GROUNDED", "evidence": "..."}]}"""
    claims_text = "\n".join([f"{i+1}. {c['claim']} (specific: {c.get('specifics','')})" for i, c in enumerate(claims)])
    prompt = f"SOURCES:\n{sources_text[:6000]}\n\nCLAIMS:\n{claims_text}"
    try:
        content, _ = groq_call(
            "meta-llama/llama-4-scout-17b-16e-instruct",
            system, prompt, json_mode=True, max_tokens=3000, temperature=0.1,
        )
        return json.loads(content).get("verifications", [])
    except Exception:
        return []


def revise_with_flags(query: str, draft: str, unsupported: list[str], partial: list[str],
                      sources_text: str) -> tuple[str, dict]:
    """Revise draft removing unsupported specifics."""
    unsupported_block = "\n".join([f"- {c}" for c in unsupported]) if unsupported else "(none)"
    partial_block = "\n".join([f"- {c}" for c in partial]) if partial else "(none)"
    user_prompt = f"""USER QUESTION: {query}

RETRIEVED SOURCES (only evidence you may rely on):
{sources_text[:6000]}

YOUR DRAFT:
{draft}

NOT GROUNDED (remove these):
{unsupported_block}

PARTIAL (keep concept, remove unverified specifics):
{partial_block}

Revise. Do not add new facts."""
    content, usage = groq_call(
        "openai/gpt-oss-120b", REVISE_SYSTEM_PROMPT, user_prompt,
        max_tokens=3000, temperature=0.2,
    )
    return content, usage


def run_production(query: str, chunks_data, defs_data, forms_data,
                   chunks_matrix, defs_matrix, forms_matrix,
                   enable_revise: bool = True) -> dict:
    """
    Full production pipeline:
      FACTUAL -> Scout fast path
      ADVISORY -> plan + retrieve + GPT-OSS-120B synth + Llama 4 Scout fact-check + GPT-OSS-120B revise
    Returns structured result with answer, sources, timings, and grounding stats.
    """
    timings = {}

    # Step 1: Classify intent
    t0 = time.time()
    intent, _ = classify_intent(query)
    timings["intent_ms"] = (time.time() - t0) * 1000

    # FACTUAL fast path
    if intent == "FACTUAL":
        q_emb = rf.embed_query(query)
        chunk_hits = rf.search_chunks(query, q_emb, chunks_data, chunks_matrix, top_k=15)
        def_hits = rf.search_definitions(query, q_emb, defs_data, defs_matrix, top_k=5)
        form_hits = rf.search_formulas(query, q_emb, forms_data, forms_matrix, top_k=3)
        fused = rf.rrf_fuse([chunk_hits, def_hits, form_hits])
        diverse = rf.enforce_diversity(fused, def_hits, form_hits, top_n=10)
        final = rf.rerank_with_voyage(query, diverse, top_k=6)

        t0 = time.time()
        answer, synth_info = rf.synthesize_answer(query, final, model="meta-llama/llama-4-scout-17b-16e-instruct")
        timings["synthesis_ms"] = synth_info.get("synthesis_ms", 0)
        timings["total_ms"] = sum(timings.values())

        return {
            "intent": "FACTUAL",
            "answer": answer,
            "sources": [{"doc_title": r["doc_title"], "section_title": r["section_title"],
                         "page": r["page"], "course": r.get("course", "")} for r in final],
            "timings": timings,
            "grounding": None,
        }

    # ADVISORY path
    t0 = time.time()
    topics, _ = plan_research(query)
    timings["plan_ms"] = (time.time() - t0) * 1000

    t0 = time.time()
    per_topic_results, _ = retrieve_per_topic(
        topics, chunks_data, defs_data, forms_data, chunks_matrix, defs_matrix, forms_matrix
    )
    timings["retrieval_ms"] = (time.time() - t0) * 1000

    # Build sources text for fact-check/revise
    sources_text = ""
    for topic, results in zip(topics, per_topic_results):
        for r in results[:4]:
            sources_text += f"\n[{r['doc_title']}, {r['section_title'][:50]}, p.{r['page']}]\n{r['content']}\n"

    # Step 3: Initial synthesis
    t0 = time.time()
    draft, _, _ = synthesize_advisory(query, topics, per_topic_results, model="openai/gpt-oss-120b")
    timings["synth_ms"] = (time.time() - t0) * 1000

    if not enable_revise:
        # Flag-only mode
        final_answer = draft
        grounding = None
    else:
        # Step 4: Fact-check
        t0 = time.time()
        claims = extract_claims_for_check(draft)
        verifications = verify_extracted_claims(claims, sources_text)
        timings["factcheck_ms"] = (time.time() - t0) * 1000

        unsupported = [v["claim"] for v in verifications if v.get("status") == "NOT_GROUNDED"]
        partial = [v["claim"] for v in verifications if v.get("status") == "PARTIAL"]
        grounded = [v["claim"] for v in verifications if v.get("status") == "GROUNDED"]

        # Step 5: Revise if there are issues
        if unsupported or partial:
            t0 = time.time()
            final_answer, _ = revise_with_flags(query, draft, unsupported, partial, sources_text)
            timings["revise_ms"] = (time.time() - t0) * 1000
        else:
            final_answer = draft
            timings["revise_ms"] = 0

        grounding = {
            "total_claims": len(verifications),
            "grounded": len(grounded),
            "partial": len(partial),
            "unsupported": len(unsupported),
            "unsupported_claims": unsupported,
            "partial_claims": partial,
        }

    # Collect unique sources
    all_sources = []
    seen = set()
    for results in per_topic_results:
        for r in results[:3]:
            key = (r["doc_title"], r["section_title"])
            if key not in seen:
                seen.add(key)
                all_sources.append({
                    "doc_title": r["doc_title"],
                    "section_title": r["section_title"],
                    "page": r["page"],
                    "course": r.get("course", ""),
                })

    timings["total_ms"] = sum(v for k, v in timings.items() if k.endswith("_ms"))

    return {
        "intent": "ADVISORY",
        "topics": topics,
        "answer": final_answer,
        "sources": all_sources[:10],
        "timings": timings,
        "grounding": grounding,
    }


def run_production_stream(query: str, chunks_data, defs_data, forms_data,
                          chunks_matrix, defs_matrix, forms_matrix,
                          enable_revise: bool = True):
    """
    Generator yielding pipeline events as dicts.
    Event types:
      {"type": "phase", "phase": "intent" | "plan" | "retrieval" | "synthesis" | "factcheck" | "revise" | "done"}
      {"type": "intent", "intent": "FACTUAL" | "ADVISORY"}
      {"type": "topics", "topics": [...]}
      {"type": "sources", "sources": [...]}
      {"type": "draft_token", "delta": "text chunk"}
      {"type": "revised", "answer": "full revised text"}
      {"type": "grounding", "stats": {...}}
      {"type": "timings", "timings": {...}}
      {"type": "error", "message": "..."}
    """
    timings = {}
    t_pipeline = time.time()

    try:
        # ---- Step 1: Intent ----
        yield {"type": "phase", "phase": "intent"}
        t0 = time.time()
        intent, _ = classify_intent(query)
        timings["intent_ms"] = (time.time() - t0) * 1000
        yield {"type": "intent", "intent": intent}

        # ---- FACTUAL fast path ----
        if intent == "FACTUAL":
            yield {"type": "phase", "phase": "retrieval"}
            t0 = time.time()
            q_emb = rf.embed_query(query)
            chunk_hits = rf.search_chunks(query, q_emb, chunks_data, chunks_matrix, top_k=15)
            def_hits = rf.search_definitions(query, q_emb, defs_data, defs_matrix, top_k=5)
            form_hits = rf.search_formulas(query, q_emb, forms_data, forms_matrix, top_k=3)
            fused = rf.rrf_fuse([chunk_hits, def_hits, form_hits])
            diverse = rf.enforce_diversity(fused, def_hits, form_hits, top_n=10)
            final = rf.rerank_with_voyage(query, diverse, top_k=6)
            timings["retrieval_ms"] = (time.time() - t0) * 1000

            sources = [{"doc_title": r["doc_title"], "section_title": r["section_title"],
                        "page": r["page"], "course": r.get("course", "")} for r in final]
            yield {"type": "sources", "sources": sources}

            yield {"type": "phase", "phase": "synthesis"}
            t0 = time.time()
            # Build context for factual synthesis
            context_parts = []
            for r in final[:6]:
                src = f"[{r['doc_title']}, {r['section_title'][:50]}, p.{r['page']}]"
                context_parts.append(f"{src}\n{r['content']}")
            context = "\n\n".join(context_parts)

            system = """You are SustainIQ. Answer the user's factual question using ONLY the provided context.
Cite every claim with [Doc Title, Section, p.X]. Be concise (2-4 paragraphs)."""
            user_prompt = f"Question: {query}\n\nContext:\n{context}\n\nProvide a sourced answer."

            collected = ""
            for delta in groq_stream("meta-llama/llama-4-scout-17b-16e-instruct",
                                     system, user_prompt, max_tokens=1500, temperature=0.2):
                collected += delta
                yield {"type": "draft_token", "delta": delta}
            timings["synthesis_ms"] = (time.time() - t0) * 1000

            # For factual queries, the draft IS final (no revise loop)
            yield {"type": "revised", "answer": collected}
            timings["total_ms"] = (time.time() - t_pipeline) * 1000
            yield {"type": "timings", "timings": timings}
            yield {"type": "phase", "phase": "done"}
            return

        # ---- ADVISORY path ----
        yield {"type": "phase", "phase": "plan"}
        t0 = time.time()
        topics, _ = plan_research(query)
        timings["plan_ms"] = (time.time() - t0) * 1000
        yield {"type": "topics", "topics": topics}

        yield {"type": "phase", "phase": "retrieval"}
        t0 = time.time()
        per_topic_results, _ = retrieve_per_topic(
            topics, chunks_data, defs_data, forms_data, chunks_matrix, defs_matrix, forms_matrix
        )
        timings["retrieval_ms"] = (time.time() - t0) * 1000

        # Build sources list (metadata + full chunk content for the source preview UI)
        all_sources = []
        seen = set()
        for results in per_topic_results:
            for r in results[:4]:
                key = (r["doc_title"], r["section_title"], str(r["page"]))
                if key not in seen:
                    seen.add(key)
                    all_sources.append({
                        "doc_title": r["doc_title"],
                        "section_title": r["section_title"],
                        "page": r["page"],
                        "course": r.get("course", ""),
                        "content": r.get("content", "")[:1500],
                        "type": r.get("type", "chunk"),
                        "vec_score": float(r.get("vec_score", 0)),
                    })
        yield {"type": "sources", "sources": all_sources[:15]}

        sources_text = ""
        for topic, results in zip(topics, per_topic_results):
            for r in results[:4]:
                sources_text += f"\n[{r['doc_title']}, {r['section_title'][:50]}, p.{r['page']}]\n{r['content']}\n"

        # Build the structured context expected by the advisory synthesizer
        context_parts = [f"Question: {query}\n", "Research brief (topics to cover):"]
        for i, topic in enumerate(topics, 1):
            context_parts.append(f"  {i}. [{topic['focus']}] {topic['topic']}")
        context_parts.append("\nEvidence retrieved per topic:\n" + "=" * 60)
        for topic, results in zip(topics, per_topic_results):
            context_parts.append(f"\nTOPIC: {topic['topic']}\nFOCUS: {topic['focus']}\n" + "-" * 40)
            for r in results[:4]:
                src = f"[{r['doc_title']}, {r['section_title'][:50]}, p.{r['page']}]"
                context_parts.append(f"\n{src}")
                context_parts.append(r["content"][:500])
        synth_context = "\n".join(context_parts)

        synth_system = """You are SustainIQ, an advisor to sustainability practitioners.

You've been given a user question, a research brief, and evidence per topic.

RULES:
1. Cover EACH topic in the brief (use ## headers).
2. Cite every substantive claim with [Doc Title, Section, p.X].
3. Use tables for comparisons.
4. For procedural topics: step-by-step. For risk: flag concrete risks. For decision: present options.
5. End with "What to do next" if actionable.
6. Keep under 600 words unless complexity requires more."""

        # ---- Step 3: Stream the draft synthesis ----
        yield {"type": "phase", "phase": "synthesis"}
        t0 = time.time()
        draft = ""
        for delta in groq_stream("openai/gpt-oss-120b", synth_system, synth_context,
                                 max_tokens=2500, temperature=0.2):
            draft += delta
            yield {"type": "draft_token", "delta": delta}
        timings["synth_ms"] = (time.time() - t0) * 1000

        if not enable_revise:
            yield {"type": "revised", "answer": draft}
            timings["total_ms"] = (time.time() - t_pipeline) * 1000
            yield {"type": "timings", "timings": timings}
            yield {"type": "phase", "phase": "done"}
            return

        # ---- Step 4: Fact-check ----
        yield {"type": "phase", "phase": "factcheck"}
        t0 = time.time()
        claims = extract_claims_for_check(draft)
        verifications = verify_extracted_claims(claims, sources_text)
        timings["factcheck_ms"] = (time.time() - t0) * 1000

        unsupported = [v["claim"] for v in verifications if v.get("status") == "NOT_GROUNDED"]
        partial = [v["claim"] for v in verifications if v.get("status") == "PARTIAL"]
        grounded = [v["claim"] for v in verifications if v.get("status") == "GROUNDED"]

        grounding_stats = {
            "total_claims": len(verifications),
            "grounded": len(grounded),
            "partial": len(partial),
            "unsupported": len(unsupported),
            "unsupported_claims": unsupported,
            "partial_claims": partial,
        }
        yield {"type": "grounding", "stats": grounding_stats}

        # ---- Step 5: Revise (if needed) ----
        if unsupported or partial:
            yield {"type": "phase", "phase": "revise"}
            t0 = time.time()
            revised, _ = revise_with_flags(query, draft, unsupported, partial, sources_text)
            timings["revise_ms"] = (time.time() - t0) * 1000
            yield {"type": "revised", "answer": revised}
        else:
            timings["revise_ms"] = 0
            yield {"type": "revised", "answer": draft}

        timings["total_ms"] = (time.time() - t_pipeline) * 1000
        yield {"type": "timings", "timings": timings}
        yield {"type": "phase", "phase": "done"}

    except Exception as e:
        import traceback
        traceback.print_exc()
        yield {"type": "error", "message": str(e)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("query", nargs="?", help="Query")
    parser.add_argument("--batch", action="store_true", help="Run test queries")
    parser.add_argument("--compare", action="store_true", help="Compare advisory vs basic")
    args = parser.parse_args()

    print("Loading indexes...")
    t0 = time.time()
    with open(rf.CHUNKS_PATH) as f: chunks_data = json.load(f)
    with open(rf.DEFINITIONS_PATH) as f: defs_data = json.load(f)
    with open(rf.FORMULAS_PATH) as f: forms_data = json.load(f)

    chunks_matrix = rf.build_embedding_matrix([s for s in chunks_data["sections"] if s.get("embedding")])
    defs_matrix = rf.build_embedding_matrix([d for d in defs_data["definitions"] if d.get("embedding")])
    forms_matrix = rf.build_embedding_matrix([f for f in forms_data["formulas"] if f.get("embedding")])
    print(f"Setup: {time.time()-t0:.1f}s\n")

    queries = []
    if args.query:
        queries = [args.query]
    elif args.batch:
        queries = [
            "What is baseline period for VM0042?",  # FACTUAL
            "How do I get started with setting a science-based target for my company?",  # ADVISORY
            "What's the difference between Scope 1, Scope 2, and Scope 3 emissions?",  # ADVISORY
            "Can I claim my product is carbon-neutral if I buy offsets?",  # ADVISORY
            "What is CBAM and when does it apply to my company's exports?",  # ADVISORY
        ]
    else:
        parser.print_help()
        return

    for q in queries:
        print("=" * 80)
        print(f"QUERY: {q}")
        print("=" * 80)

        result = run_advisory(q, chunks_data, defs_data, forms_data,
                              chunks_matrix, defs_matrix, forms_matrix)

        print(f"\n--- ANSWER ---")
        print(result["answer"])

        t = result["timings"]
        print(f"\n--- TIMING ---")
        print(f"  Intent:       {t.get('intent_ms', 0):7.0f} ms")
        if result["intent"] == "ADVISORY":
            print(f"  Plan:         {t.get('plan_ms', 0):7.0f} ms")
            print(f"  Retrieval:    {t.get('retrieval_ms', 0):7.0f} ms  (parallel, N topics)")
        print(f"  Synthesis:    {t.get('synthesis_ms', 0):7.0f} ms  ({t.get('tokens_in',0)} in -> {t.get('tokens_out',0)} out)")
        print(f"  TOTAL:        {t.get('total_ms', 0):7.0f} ms")
        print()


if __name__ == "__main__":
    main()
