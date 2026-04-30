#!/usr/bin/env python3
"""
Revise Loop: synthesize -> fact-check -> revise -> (optional re-check)

Pipeline:
1. Synthesis: GPT-OSS-120B drafts answer
2. Fact-check: Llama 4 Scout flags unsupported claims
3. Revise: GPT-OSS-120B rewrites removing/correcting flagged claims
4. Re-check: Llama 4 Scout verifies the revision is cleaner

Shows all stages so we can compare original vs revised.
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
spec2 = importlib.util.spec_from_file_location("fc", "scripts/test-fact-checker.py")
fc = importlib.util.module_from_spec(spec2)
spec2.loader.exec_module(fc)


REVISE_SYSTEM_PROMPT = """You are revising a sustainability advisory answer to remove unsupported claims.

A fact-checker has identified specific claims in your draft that are NOT grounded in the retrieved sources. Your task:

1. REMOVE every unsupported claim entirely. Do NOT soften, hedge, or rephrase - REMOVE.
2. Do NOT replace unsupported specifics with new specifics. Instead, state the limitation:
   "The sources do not specify [X] for this standard; consult [standard name] directly for this detail."
3. KEEP everything else - the structure, tables, grounded claims, citations.
4. If a whole table row or example loses its specifics, remove that row/example entirely rather than keeping vague filler.
5. At the end, add a brief "**Source limitations**" section listing what the retrieved sources did NOT cover for this question.

Output: the revised answer in the same format (tables, headers, numbered lists). No meta-commentary."""


def revise_answer(query: str, draft: str, unsupported_claims: list[str], partial_claims: list[str],
                  sources_text: str, topics: list[dict], model: str = "openai/gpt-oss-120b") -> tuple[str, dict, dict]:
    """Send the draft + fact-check flags back to the synthesizer for revision."""
    t0 = time.time()

    unsupported_block = "\n".join([f"- {c}" for c in unsupported_claims]) if unsupported_claims else "(none)"
    partial_block = "\n".join([f"- {c}" for c in partial_claims]) if partial_claims else "(none)"

    user_prompt = f"""USER QUESTION: {query}

RETRIEVED SOURCES (the only evidence you may rely on):

{sources_text[:6000]}

YOUR PREVIOUS DRAFT:

{draft}

CLAIMS FLAGGED AS NOT GROUNDED (remove these):

{unsupported_block}

CLAIMS FLAGGED AS PARTIAL (keep the general concept, remove unverified specifics):

{partial_block}

Now produce the REVISED answer following the rules. Do not add new facts; only remove/restructure around what's grounded."""

    content, usage = ra.groq_call(model, REVISE_SYSTEM_PROMPT, user_prompt, max_tokens=2500, temperature=0.2)
    elapsed = time.time() - t0
    return content, {"time_s": elapsed, "tokens_in": usage.get("prompt_tokens", 0), "tokens_out": usage.get("completion_tokens", 0)}, usage


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

    query = "How do I know if a carbon offset I am about to buy is actually credible?"
    print(f"QUERY: {query}\n")

    # Phase 1: Plan + Retrieve
    topics, _ = ra.plan_research(query)
    per_topic_results, _ = ra.retrieve_per_topic(
        topics, chunks_data, defs_data, forms_data, chunks_matrix, defs_matrix, forms_matrix
    )
    sources_text = ""
    for topic, results in zip(topics, per_topic_results):
        for r in results[:4]:
            sources_text += f"\n[{r['doc_title']}, {r['section_title'][:50]}, p.{r['page']}]\n{r['content']}\n"

    # Phase 2: Initial synthesis
    print("[Phase 1/4] Initial synthesis (GPT-OSS-120B)...")
    t0 = time.time()
    draft, _, synth_usage = ra.synthesize_advisory(query, topics, per_topic_results, model="openai/gpt-oss-120b")
    t_synth = time.time() - t0
    print(f"  {t_synth:.1f}s, {synth_usage.get('completion_tokens',0)} tokens out")

    # Phase 3: Fact-check
    print("\n[Phase 2/4] Fact-check (Llama 4 Scout)...")
    t0 = time.time()
    claims = fc.extract_claims(draft)
    verifications = fc.verify_claims(claims, sources_text)
    t_fact = time.time() - t0
    unsupported = [v["claim"] for v in verifications if v.get("status") == "NOT_GROUNDED"]
    partial = [v["claim"] for v in verifications if v.get("status") == "PARTIAL"]
    grounded = [v["claim"] for v in verifications if v.get("status") == "GROUNDED"]
    print(f"  {t_fact:.1f}s: {len(grounded)} grounded, {len(partial)} partial, {len(unsupported)} unsupported")

    # Phase 4: Revise
    print("\n[Phase 3/4] Revise (GPT-OSS-120B)...")
    revised, revise_timing, revise_usage = revise_answer(
        query, draft, unsupported, partial, sources_text, topics
    )
    print(f"  {revise_timing['time_s']:.1f}s, {revise_usage.get('completion_tokens',0)} tokens out")

    # Phase 5: Re-check the revision
    print("\n[Phase 4/4] Re-check revision (Llama 4 Scout)...")
    t0 = time.time()
    re_claims = fc.extract_claims(revised)
    re_verifications = fc.verify_claims(re_claims, sources_text)
    t_recheck = time.time() - t0
    re_unsupported = [v["claim"] for v in re_verifications if v.get("status") == "NOT_GROUNDED"]
    re_partial = [v["claim"] for v in re_verifications if v.get("status") == "PARTIAL"]
    re_grounded = [v["claim"] for v in re_verifications if v.get("status") == "GROUNDED"]
    print(f"  {t_recheck:.1f}s: {len(re_grounded)} grounded, {len(re_partial)} partial, {len(re_unsupported)} unsupported")

    # --- OUTPUT COMPARISON ---
    print("\n" + "=" * 90)
    print("ORIGINAL DRAFT (before revision)")
    print("=" * 90)
    print(draft)

    print("\n" + "=" * 90)
    print("REVISED ANSWER (after fact-check + revise)")
    print("=" * 90)
    print(revised)

    # --- SCORECARD ---
    print("\n" + "=" * 90)
    print("SCORECARD: Original vs Revised")
    print("=" * 90)

    total_orig = len(verifications)
    total_rev = len(re_verifications)

    print(f"\n{'Metric':<30} {'Original':>12} {'Revised':>12}  {'Change'}")
    print("-" * 72)
    pct_grounded_orig = len(grounded) * 100 / max(total_orig, 1)
    pct_grounded_rev = len(re_grounded) * 100 / max(total_rev, 1)
    pct_ungrounded_orig = len(unsupported) * 100 / max(total_orig, 1)
    pct_ungrounded_rev = len(re_unsupported) * 100 / max(total_rev, 1)

    print(f"{'Claims with specifics':<30} {total_orig:>12} {total_rev:>12}  {total_rev - total_orig:+d}")
    print(f"{'Grounded claims':<30} {len(grounded):>12} {len(re_grounded):>12}  {len(re_grounded) - len(grounded):+d}")
    print(f"{'Unsupported claims':<30} {len(unsupported):>12} {len(re_unsupported):>12}  {len(re_unsupported) - len(unsupported):+d}")
    print(f"{'Grounded %':<30} {pct_grounded_orig:>11.0f}% {pct_grounded_rev:>11.0f}%  {pct_grounded_rev - pct_grounded_orig:+.0f}pp")
    print(f"{'Unsupported %':<30} {pct_ungrounded_orig:>11.0f}% {pct_ungrounded_rev:>11.0f}%  {pct_ungrounded_rev - pct_ungrounded_orig:+.0f}pp")

    # Which specific claims survived revision
    print(f"\nClaims that REMAIN unsupported in revision ({len(re_unsupported)}):")
    for c in re_unsupported:
        print(f"  [X] {c[:110]}")

    # --- TIMING & COST ---
    print("\n" + "=" * 90)
    print("TIMING & COST (revise loop)")
    print("=" * 90)
    total_time = t_synth + t_fact + revise_timing['time_s'] + t_recheck
    print(f"  Initial synthesis:  {t_synth:.1f}s   (GPT-OSS-120B)")
    print(f"  Fact-check:          {t_fact:.1f}s   (Llama 4 Scout)")
    print(f"  Revise:             {revise_timing['time_s']:.1f}s   (GPT-OSS-120B)")
    print(f"  Re-check:            {t_recheck:.1f}s   (Llama 4 Scout)")
    print(f"  Total synthesis:    {total_time:.1f}s")
    print(f"\nEstimated cost:")
    print(f"  GPT-OSS-120B x2: ~$0.0025")
    print(f"  Llama 4 Scout x2: ~$0.0002")
    print(f"  Total: ~$0.003/query (still well under $0.01)")


if __name__ == "__main__":
    main()
