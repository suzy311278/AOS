#!/usr/bin/env python3
"""
Compare three synthesis models on the same retrieval context:
A) Llama 4 Scout 17B MoE    - cheapest + fastest + local-friendly
B) GPT-OSS-120B             - known quality baseline
C) Qwen3 32B                - reasoning-strong alternative

Same query, same retrieved chunks, different synthesizers.
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


MODELS = [
    ("Llama 4 Scout 17B MoE", "meta-llama/llama-4-scout-17b-16e-instruct", 0.0008),
    ("GPT-OSS-120B", "openai/gpt-oss-120b", 0.00128),
    ("Qwen3 32B", "qwen/qwen3-32b", 0.00161),
]


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
    print("=" * 80)

    # Plan + retrieve ONCE (shared across all three)
    topics, t_plan = ra.plan_research(query)
    print(f"PLAN ({t_plan:.0f}ms) - {len(topics)} topics:")
    for i, t in enumerate(topics, 1):
        print(f"  {i}. [{t['focus']}] {t['topic']}")

    per_topic_results, t_retrieve = ra.retrieve_per_topic(
        topics, chunks_data, defs_data, forms_data, chunks_matrix, defs_matrix, forms_matrix
    )
    print(f"\nRETRIEVAL ({t_retrieve:.0f}ms) - same context for all models\n")

    # Now synthesize with each model
    results = []
    for label, model, price_per_q in MODELS:
        print("\n" + "=" * 80)
        print(f"### {label} ({model})")
        print(f"### Estimated: ${price_per_q:.5f}/query")
        print("=" * 80)

        try:
            t0 = time.time()
            ans, _, usage = ra.synthesize_advisory(query, topics, per_topic_results, model=model)
            elapsed = time.time() - t0
            tokens_in = usage.get("prompt_tokens", 0)
            tokens_out = usage.get("completion_tokens", 0)

            print(f"Time: {elapsed:.1f}s | Tokens: {tokens_in} in -> {tokens_out} out")
            print(f"Speed: {tokens_out/elapsed:.0f} tokens/sec")
            print()
            print(ans)

            results.append({
                "model": label,
                "time_s": elapsed,
                "tokens_in": tokens_in,
                "tokens_out": tokens_out,
                "length_chars": len(ans),
                "answer": ans,
            })
        except Exception as e:
            print(f"ERROR: {e}")
            results.append({"model": label, "error": str(e)})

    # Summary
    print("\n\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"{'Model':<25} {'Time':>8} {'Tokens Out':>12} {'Chars':>8}")
    print("-" * 55)
    for r in results:
        if "error" in r:
            print(f"{r['model']:<25} ERROR")
        else:
            print(f"{r['model']:<25} {r['time_s']:>6.1f}s {r['tokens_out']:>12} {r['length_chars']:>8}")


if __name__ == "__main__":
    main()
