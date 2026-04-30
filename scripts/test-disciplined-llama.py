#!/usr/bin/env python3
"""
Experiment: Can disciplined prompting get Llama 70B to match GPT-OSS-120B quality?

Tests 3 synthesis approaches on the same query+retrieval:
A) Baseline Llama 70B (current advisor prompt)
B) Disciplined Llama 70B: strong output contract + few-shot example + reflection pass
C) GPT-OSS-120B (target quality baseline)

Outputs all 3 for comparison.
"""

import json
import os
import sys
import time

_env = os.path.join(os.path.dirname(__file__), "..", ".env.local")
with open(_env) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ[k] = v

import importlib.util
spec = importlib.util.spec_from_file_location("ra", "scripts/retrieval-advisor.py")
ra = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ra)


# -----------------------------------------------------------------------------
# A) Baseline Llama 70B (existing advisor)
# -----------------------------------------------------------------------------
def synth_baseline_llama(query, topics, per_topic_results):
    return ra.synthesize_advisory(query, topics, per_topic_results, model="llama-3.3-70b-versatile")


# -----------------------------------------------------------------------------
# B) Disciplined Llama 70B: contract + few-shot + reflection
# -----------------------------------------------------------------------------

FEW_SHOT_EXAMPLE = """
EXAMPLE OF A HIGH-QUALITY ANSWER (follow this structure):

Question: How do I know if a carbon offset is credible?

**1. Core credibility criteria**

| Pillar | What to look for | Evidence |
|--------|------------------|----------|
| Additionality | Passes validated additionality test | [ICVCM CCP, Additionality, p.31-34] |
| Permanence | ≥100yr forestry, ≥30yr avoided emissions | [IFRS S2 BoC, p.59] |
| Verifiability | Independent third-party MRV | [ICVCM Part3, p.6-8] |

**2. Step-by-step verification checklist**

1. Identify the standard (Gold Standard, VCS, CAR)
2. Validate project's registration number on registry
3. Confirm validation + verification dates from accredited VVB [Gold Standard, p.5]
4. Check Monitoring Plan [Gold Standard Claims, p.7-8]
5. Cross-check ICVCM "no double-counting" rules [ICVCM Part3, p.19-21]

**3. Decision framework**

Score each provider 1-5 on these axes, weighted:
- Credibility: 40%
- Cost: 30%
- Co-benefits: 20%
- Geographic fit: 10%

**What the sources don't cover**
- Leakage assessment methodology (project-specific, not in retrieved chunks)
- Legal ownership transfer clause (need procurement team input)

**What to do next**
1. Pull registration number and verification reports
2. Run 8-step checklist; halt if any fails
3. Apply 40/30/20/10 scoring to ≥3 providers
4. Document trail for audit
"""

DISCIPLINED_SYSTEM_PROMPT = f"""You are SustainIQ, an advisor to sustainability practitioners (managers, compliance officers, ESG analysts).

OUTPUT CONTRACT — your answer MUST follow these rules:

1. USE TABLES for any comparison of 2+ options, criteria, or frameworks. Never write prose paragraphs when a table is clearer.
2. EXTRACT EXPLICIT NUMBERS — every threshold, percentage, year count, or limit mentioned in the sources must appear as a specific number in your answer.
3. APPLY USER'S NUMBERS — if the user provides their own numbers (e.g., "my coverage is at 60%"), calculate the gap and apply it back in your analysis ("60% → gap is 30% → X is the priority").
4. SEQUENCE ACTIONS — if the question has a timeframe, organize actions by quarter/phase/step. Otherwise use a numbered action list.
5. FLAG GAPS HONESTLY — include a "What the sources don't cover" section. List what's missing from the retrieved evidence. Never fabricate to fill gaps.
6. CITE EVERYTHING — every substantive claim gets [Doc Title, Section, p.X].
7. NO FLUFF — no throat-clearing, no "I hope this helps", no repetition of the question.

STRUCTURE TEMPLATE:
- Section per research topic (use ## headers)
- Table or numbered list within each section
- "What the sources don't cover" section near the end
- "What to do next" action plan as the last section

{FEW_SHOT_EXAMPLE}

Now answer the user's question following this structure and rules EXACTLY."""


CRITIC_SYSTEM_PROMPT = """You are a critic reviewing an answer written by another AI.

Check the draft against this quality rubric:
1. Does it use TABLES for comparisons? (not just bullet lists)
2. Does it extract EXPLICIT NUMBERS (thresholds, percentages, year counts) from sources?
3. Does it APPLY USER'S NUMBERS back (if user provided any)?
4. Is there a "What the sources don't cover" section flagging gaps?
5. Is there a sequenced "What to do next" action plan?
6. Are all claims cited with [Doc, Section, p.X]?
7. Is there any fabrication not grounded in the provided sources?

Output JSON only:
{
  "missing": ["specific issues, concrete"],
  "fabrications": ["claims not grounded in sources"],
  "revision_needed": true/false
}

Be strict. If tables are missing where comparisons exist, flag it. If the user's numbers weren't applied, flag it. If gaps weren't acknowledged, flag it."""


def synth_disciplined_llama(query, topics, per_topic_results):
    """Three-pass: draft → critique → revise."""
    timings = {}
    model = "llama-3.3-70b-versatile"

    # Build context (same as baseline)
    context_parts = [f"Question: {query}\n"]
    context_parts.append("Research brief (topics to cover):")
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
    context = "\n".join(context_parts)

    # PASS 1: Draft with disciplined prompt
    t0 = time.time()
    draft, usage_1 = ra.groq_call(model, DISCIPLINED_SYSTEM_PROMPT, context, max_tokens=2500, temperature=0.2)
    timings["draft_ms"] = (time.time() - t0) * 1000

    # PASS 2: Critic
    t0 = time.time()
    critic_input = f"""USER QUESTION: {query}

AVAILABLE SOURCES (summarized):
{chr(10).join(f"- {r['doc_title']}, {r['section_title'][:40]}" for hits in per_topic_results for r in hits[:3])}

DRAFT ANSWER TO REVIEW:
{draft}"""
    critique_raw, usage_2 = ra.groq_call(model, CRITIC_SYSTEM_PROMPT, critic_input, json_mode=True, max_tokens=800, temperature=0.1)
    try:
        critique = json.loads(critique_raw)
    except Exception:
        critique = {"missing": [], "fabrications": [], "revision_needed": False}
    timings["critic_ms"] = (time.time() - t0) * 1000

    # PASS 3: Revise if needed
    if critique.get("revision_needed") and (critique.get("missing") or critique.get("fabrications")):
        t0 = time.time()
        revise_prompt = f"""Revise the draft answer to address these issues:

MISSING:
{chr(10).join(f'- {m}' for m in critique.get('missing', []))}

FABRICATIONS TO REMOVE:
{chr(10).join(f'- {f}' for f in critique.get('fabrications', []))}

ORIGINAL CONTEXT:
{context}

DRAFT:
{draft}

Produce the REVISED answer only. Keep what's good; fix the issues above."""
        revised, usage_3 = ra.groq_call(model, DISCIPLINED_SYSTEM_PROMPT, revise_prompt, max_tokens=2500, temperature=0.2)
        timings["revise_ms"] = (time.time() - t0) * 1000
        final_answer = revised
        total_tokens = (usage_1.get("prompt_tokens", 0) + usage_2.get("prompt_tokens", 0) + usage_3.get("prompt_tokens", 0),
                        usage_1.get("completion_tokens", 0) + usage_2.get("completion_tokens", 0) + usage_3.get("completion_tokens", 0))
    else:
        final_answer = draft
        total_tokens = (usage_1.get("prompt_tokens", 0) + usage_2.get("prompt_tokens", 0),
                        usage_1.get("completion_tokens", 0) + usage_2.get("completion_tokens", 0))
        timings["revise_ms"] = 0

    timings["total_ms"] = sum(timings.values())

    return final_answer, timings, critique, total_tokens


# -----------------------------------------------------------------------------
# C) GPT-OSS-120B baseline
# -----------------------------------------------------------------------------
def synth_gpt_oss(query, topics, per_topic_results):
    return ra.synthesize_advisory(query, topics, per_topic_results, model="openai/gpt-oss-120b")


# -----------------------------------------------------------------------------
# Main comparison
# -----------------------------------------------------------------------------
def main():
    print("Loading indexes...")
    t0 = time.time()
    with open(ra.rf.CHUNKS_PATH) as f: chunks_data = json.load(f)
    with open(ra.rf.DEFINITIONS_PATH) as f: defs_data = json.load(f)
    with open(ra.rf.FORMULAS_PATH) as f: forms_data = json.load(f)
    chunks_matrix = ra.rf.build_embedding_matrix([s for s in chunks_data["sections"] if s.get("embedding")])
    defs_matrix = ra.rf.build_embedding_matrix([d for d in defs_data["definitions"] if d.get("embedding")])
    forms_matrix = ra.rf.build_embedding_matrix([f for f in forms_data["formulas"] if f.get("embedding")])
    print(f"Setup: {time.time()-t0:.1f}s\n")

    query = "How do I decide between using VCS and Gold Standard for a reforestation project?"

    # Plan + retrieve once
    print(f"QUERY: {query}\n")
    topics, _ = ra.plan_research(query)
    print(f"Topics ({len(topics)}):")
    for i, t in enumerate(topics, 1):
        print(f"  {i}. [{t['focus']}] {t['topic']}")

    per_topic_results, t_retrieve = ra.retrieve_per_topic(
        topics, chunks_data, defs_data, forms_data, chunks_matrix, defs_matrix, forms_matrix
    )
    print(f"\nRetrieval: {t_retrieve:.0f}ms\n")

    # A) Baseline Llama 70B
    print("=" * 80)
    print("A) BASELINE LLAMA 70B")
    print("=" * 80)
    t0 = time.time()
    ans_a, t_a, usage_a = synth_baseline_llama(query, topics, per_topic_results)
    print(f"Time: {(time.time()-t0):.1f}s | Tokens: {usage_a.get('prompt_tokens',0)} in -> {usage_a.get('completion_tokens',0)} out\n")
    print(ans_a)

    # B) Disciplined Llama 70B
    print("\n" + "=" * 80)
    print("B) DISCIPLINED LLAMA 70B (contract + few-shot + reflection)")
    print("=" * 80)
    t0 = time.time()
    ans_b, timings_b, critique_b, tokens_b = synth_disciplined_llama(query, topics, per_topic_results)
    print(f"Time: {(time.time()-t0):.1f}s | Tokens: {tokens_b[0]} in -> {tokens_b[1]} out")
    print(f"  Draft: {timings_b['draft_ms']:.0f}ms | Critic: {timings_b['critic_ms']:.0f}ms | Revise: {timings_b['revise_ms']:.0f}ms")
    print(f"  Critique found: {len(critique_b.get('missing',[]))} missing items, {len(critique_b.get('fabrications',[]))} fabrications")
    print(f"  Revision needed: {critique_b.get('revision_needed', False)}")
    if critique_b.get('missing'):
        print(f"  Missing: {critique_b['missing']}")
    print()
    print(ans_b)

    # C) GPT-OSS-120B
    print("\n" + "=" * 80)
    print("C) GPT-OSS-120B (target quality)")
    print("=" * 80)
    t0 = time.time()
    ans_c, t_c, usage_c = synth_gpt_oss(query, topics, per_topic_results)
    print(f"Time: {(time.time()-t0):.1f}s | Tokens: {usage_c.get('prompt_tokens',0)} in -> {usage_c.get('completion_tokens',0)} out\n")
    print(ans_c)


if __name__ == "__main__":
    main()
