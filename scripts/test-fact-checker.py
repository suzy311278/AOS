#!/usr/bin/env python3
"""
Test: Fact-Checker Pass with Llama 4 Scout
============================================
Pipeline:
1. Retrieval (existing)
2. Synthesis with GPT-OSS-120B
3. Fact-checker pass with Llama 4 Scout - verifies every specific claim against retrieved context
4. Output: cleaned answer + list of flagged/unsupported claims

This addresses the hallucination problem where GPT-OSS-120B adds plausible-sounding
specifics (numbers, project names, methodologies) that aren't in the retrieved sources.
"""

import json
import os
import re
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


FACT_CHECKER_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


def extract_claims_prompt():
    return """You are extracting verifiable claims from an answer.

Find every SPECIFIC factual claim that contains any of:
- Numbers, percentages, thresholds (e.g., "20% buffer", "100 years")
- Named projects or programs (e.g., "Kenya renewable energy project", "VM0006 methodology")
- Named requirements or standards (e.g., "Global Goals Requirements")
- Specific timeframes (e.g., "5-year archiving", "every 2 years")
- Specific processes (e.g., "financial-gap analysis")

Ignore general statements ("credits must be additional") - only extract claims with SPECIFICS.

Output JSON only:
{"claims": [
  {"claim": "exact substring from answer", "specifics": "the number/name/threshold that's claimed"},
  ...
]}"""


def verify_claims_prompt():
    return """You are verifying claims against source evidence.

For EACH claim, check if the SPECIFIC detail (number, name, threshold, or fact) appears in the provided sources.

Verification rules:
- GROUNDED: The exact specific detail appears in sources (verbatim or paraphrased)
- PARTIAL: The general concept is in sources but the specific number/name is not
- NOT_GROUNDED: The specific detail is not supported by sources

Output JSON only:
{"verifications": [
  {"claim": "the claim text", "status": "GROUNDED" | "PARTIAL" | "NOT_GROUNDED", "evidence": "brief quote from source if found, or empty"},
  ...
]}"""


def extract_claims(answer: str, model: str = FACT_CHECKER_MODEL) -> list[dict]:
    """Step 1: Extract specific claims from the answer."""
    try:
        content, _ = ra.groq_call(
            model,
            extract_claims_prompt(),
            f"Answer to extract claims from:\n\n{answer}",
            json_mode=True,
            max_tokens=2000,
            temperature=0.1,
        )
        parsed = json.loads(content)
        return parsed.get("claims", [])
    except Exception as e:
        print(f"  Claim extraction failed: {e}")
        return []


def verify_claims(claims: list[dict], sources_text: str, model: str = FACT_CHECKER_MODEL) -> list[dict]:
    """Step 2: Verify each claim against the sources."""
    if not claims:
        return []

    claims_text = "\n".join([f"{i+1}. {c['claim']} (specific: {c.get('specifics','')})" for i, c in enumerate(claims)])
    user_prompt = f"""SOURCES (retrieved context):

{sources_text[:6000]}

---

CLAIMS TO VERIFY:

{claims_text}

---

For each claim, check if the specific detail is in the sources. Output JSON as specified."""

    try:
        content, _ = ra.groq_call(
            model,
            verify_claims_prompt(),
            user_prompt,
            json_mode=True,
            max_tokens=3000,
            temperature=0.1,
        )
        parsed = json.loads(content)
        return parsed.get("verifications", [])
    except Exception as e:
        print(f"  Verification failed: {e}")
        return []


def annotate_answer(answer: str, verifications: list[dict]) -> tuple[str, list[str]]:
    """Create annotated version of answer showing grounded vs unsupported claims."""
    unsupported = []
    partial = []
    annotated = answer

    for v in verifications:
        claim = v.get("claim", "")
        status = v.get("status", "")
        if status == "NOT_GROUNDED":
            unsupported.append(claim)
        elif status == "PARTIAL":
            partial.append(claim)

    return annotated, unsupported, partial


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
    t0 = time.time()
    topics, _ = ra.plan_research(query)
    per_topic_results, _ = ra.retrieve_per_topic(
        topics, chunks_data, defs_data, forms_data, chunks_matrix, defs_matrix, forms_matrix
    )
    t_retrieve = time.time() - t0
    print(f"[Retrieval] {t_retrieve:.1f}s, {len(topics)} topics")

    # Build sources text (what the fact-checker will see)
    sources_text = ""
    for topic, results in zip(topics, per_topic_results):
        for r in results[:4]:
            sources_text += f"\n[{r['doc_title']}, {r['section_title'][:50]}, p.{r['page']}]\n{r['content']}\n"

    # Phase 2: Synthesis with GPT-OSS-120B
    print(f"\n[Synthesis] GPT-OSS-120B...")
    t0 = time.time()
    answer, _, synth_usage = ra.synthesize_advisory(query, topics, per_topic_results, model="openai/gpt-oss-120b")
    t_synth = time.time() - t0
    print(f"  {t_synth:.1f}s, {synth_usage.get('prompt_tokens',0)} in -> {synth_usage.get('completion_tokens',0)} out")

    # Phase 3: Fact-checker pass
    print(f"\n[Fact-Checker] Llama 4 Scout...")
    t0 = time.time()
    claims = extract_claims(answer)
    t_extract = time.time() - t0
    print(f"  Extracted {len(claims)} claims in {t_extract:.1f}s")

    t0 = time.time()
    verifications = verify_claims(claims, sources_text)
    t_verify = time.time() - t0
    print(f"  Verified {len(verifications)} in {t_verify:.1f}s")

    # Phase 4: Annotate
    annotated, unsupported, partial = annotate_answer(answer, verifications)

    # Output original answer
    print("\n" + "=" * 90)
    print("ORIGINAL SYNTHESIZED ANSWER (from GPT-OSS-120B)")
    print("=" * 90)
    print(answer)

    # Output fact-check verdict
    print("\n" + "=" * 90)
    print("FACT-CHECK RESULTS")
    print("=" * 90)

    grounded = [v for v in verifications if v.get("status") == "GROUNDED"]
    partial_v = [v for v in verifications if v.get("status") == "PARTIAL"]
    not_grounded = [v for v in verifications if v.get("status") == "NOT_GROUNDED"]

    print(f"\nSummary:")
    print(f"  GROUNDED:     {len(grounded)} / {len(verifications)} ({len(grounded)/max(len(verifications),1)*100:.0f}%)")
    print(f"  PARTIAL:      {len(partial_v)} / {len(verifications)} ({len(partial_v)/max(len(verifications),1)*100:.0f}%)")
    print(f"  NOT GROUNDED: {len(not_grounded)} / {len(verifications)} ({len(not_grounded)/max(len(verifications),1)*100:.0f}%)")

    print(f"\n--- GROUNDED CLAIMS ({len(grounded)}) ---")
    for v in grounded[:10]:
        print(f"  [OK] {v['claim'][:100]}")
        if v.get("evidence"):
            print(f"       Evidence: {v['evidence'][:120]}")

    print(f"\n--- PARTIAL CLAIMS ({len(partial_v)}) - concept present but specific not verified ---")
    for v in partial_v:
        print(f"  [~] {v['claim'][:100]}")

    print(f"\n--- NOT GROUNDED CLAIMS ({len(not_grounded)}) - likely hallucinated ---")
    for v in not_grounded:
        print(f"  [X] {v['claim'][:120]}")

    # Total cost estimate
    print("\n" + "=" * 90)
    print("TIMING & COST")
    print("=" * 90)
    print(f"  Retrieval:   {t_retrieve:.1f}s")
    print(f"  Synthesis:   {t_synth:.1f}s  (GPT-OSS-120B)")
    print(f"  Fact-check:  {t_extract + t_verify:.1f}s  (Llama 4 Scout)")
    print(f"  Total added: {t_extract + t_verify:.1f}s for {len(verifications)} claims verified")


if __name__ == "__main__":
    main()
