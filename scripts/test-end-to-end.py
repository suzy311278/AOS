#!/usr/bin/env python3
"""
End-to-End Pipeline Test
========================
Runs practitioner queries through the full pipeline and times each phase:
1. Query decomposition (Groq Llama 8B)
2. Retrieval (embed + search 3 indexes + RRF + diversity)
3. Cross-encoder reranking (Voyage rerank-2.5)
4. Synthesis (Groq Llama 70B)

Outputs the final answer + timing breakdown.
"""

import json
import os
import sys
import time

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


def run_e2e(query: str, chunks_data, defs_data, forms_data,
            chunks_matrix, defs_matrix, forms_matrix):
    """Run full pipeline and return answer + timing."""
    timings = {}

    # Phase 1: Decomposition
    t0 = time.time()
    sub_queries = rf.decompose_query(query)
    timings["decomposition_ms"] = (time.time() - t0) * 1000
    timings["num_sub_queries"] = len(sub_queries)

    # Phase 2: Retrieval (embed + search per sub-query)
    t0 = time.time()
    all_chunk_hits, all_def_hits, all_form_hits = [], [], []
    for sq in sub_queries:
        sq_emb = rf.embed_query(sq)
        per_k = 10 if len(sub_queries) > 1 else 20
        all_chunk_hits.append(rf.search_chunks(sq, sq_emb, chunks_data, chunks_matrix, top_k=per_k))
        all_def_hits.append(rf.search_definitions(sq, sq_emb, defs_data, defs_matrix, top_k=3))
        all_form_hits.append(rf.search_formulas(sq, sq_emb, forms_data, forms_matrix, top_k=2))
    timings["retrieval_ms"] = (time.time() - t0) * 1000

    # Phase 3: Rerank
    t0 = time.time()
    if len(sub_queries) > 1:
        per_sq_top = max(2, 8 // len(sub_queries))
        reranked_per_sq = []
        for sq, chunk_hits, def_hits, form_hits in zip(sub_queries, all_chunk_hits, all_def_hits, all_form_hits):
            sq_pool = chunk_hits[:8] + def_hits[:3] + form_hits[:2]
            sq_reranked = rf.rerank_with_voyage(sq, sq_pool, top_k=per_sq_top)
            reranked_per_sq.append(sq_reranked)

        final = []
        seen = set()
        max_len = max(len(r) for r in reranked_per_sq) if reranked_per_sq else 0
        for i in range(max_len):
            for sq_results in reranked_per_sq:
                if i < len(sq_results):
                    item = sq_results[i]
                    k = (item["type"], item.get("doc_title", ""), item.get("section_title", ""),
                         item.get("page", ""), item["content"][:50])
                    if k not in seen:
                        seen.add(k)
                        final.append(item)
                        if len(final) >= 8:
                            break
            if len(final) >= 8:
                break
    else:
        fused = rf.rrf_fuse(all_chunk_hits + all_def_hits + all_form_hits)
        flat_def_hits = sorted([d for hits in all_def_hits for d in hits],
                               key=lambda x: x["vec_score"], reverse=True)[:5]
        flat_form_hits = sorted([f for hits in all_form_hits for f in hits],
                                key=lambda x: x["vec_score"], reverse=True)[:3]
        diverse = rf.enforce_diversity(fused, flat_def_hits, flat_form_hits, top_n=15)
        final = rf.rerank_with_voyage(query, diverse, top_k=8)
    timings["rerank_ms"] = (time.time() - t0) * 1000

    # Phase 4: Synthesis
    t0 = time.time()
    answer, synth_info = rf.synthesize_answer(query, final)
    timings["synthesis_ms"] = synth_info.get("synthesis_ms", 0)
    timings["tokens_in"] = synth_info.get("prompt_tokens", 0)
    timings["tokens_out"] = synth_info.get("completion_tokens", 0)

    timings["total_ms"] = sum([
        timings["decomposition_ms"],
        timings["retrieval_ms"],
        timings["rerank_ms"],
        timings["synthesis_ms"],
    ])

    return {
        "query": query,
        "sub_queries": sub_queries,
        "retrieved_sources": [f"{r['doc_title']} - {r['section_title'][:40]}" for r in final[:5]],
        "answer": answer,
        "timings": timings,
    }


def main():
    # Load everything once
    print("Loading indexes + building matrices...")
    t0 = time.time()

    with open(rf.CHUNKS_PATH) as f: chunks_data = json.load(f)
    with open(rf.DEFINITIONS_PATH) as f: defs_data = json.load(f)
    with open(rf.FORMULAS_PATH) as f: forms_data = json.load(f)

    chunks_matrix = rf.build_embedding_matrix([s for s in chunks_data["sections"] if s.get("embedding")])
    defs_matrix = rf.build_embedding_matrix([d for d in defs_data["definitions"] if d.get("embedding")])
    forms_matrix = rf.build_embedding_matrix([f for f in forms_data["formulas"] if f.get("embedding")])

    print(f"Setup done in {time.time()-t0:.1f}s\n")

    # Practitioner queries - what real users would ask
    queries = [
        "What is CBAM and when does it apply to my company's exports?",
        "How do I get started with setting a science-based target for my company?",
        "What's the difference between Scope 1, Scope 2, and Scope 3 emissions?",
        "Can I claim my product is carbon-neutral if I buy offsets?",
    ]

    for q in queries:
        print("=" * 80)
        print(f"QUERY: {q}")
        print("=" * 80)

        result = run_e2e(q, chunks_data, defs_data, forms_data,
                         chunks_matrix, defs_matrix, forms_matrix)

        # Sub-queries
        if len(result["sub_queries"]) > 1:
            print(f"\nDecomposed into {len(result['sub_queries'])} sub-queries:")
            for i, sq in enumerate(result["sub_queries"], 1):
                print(f"  {i}. {sq}")

        # Sources used
        print(f"\nTop retrieved sources:")
        for i, src in enumerate(result["retrieved_sources"], 1):
            print(f"  [{i}] {src}")

        # Answer
        print(f"\n--- ANSWER ---")
        print(result["answer"])

        # Timing
        t = result["timings"]
        print(f"\n--- TIMING ---")
        print(f"  Decomposition:  {t['decomposition_ms']:7.0f} ms  ({t['num_sub_queries']} sub-query/ies)")
        print(f"  Retrieval:      {t['retrieval_ms']:7.0f} ms  (embed + search 3 indexes)")
        print(f"  Rerank:         {t['rerank_ms']:7.0f} ms  (cross-encoder)")
        print(f"  Synthesis:      {t['synthesis_ms']:7.0f} ms  ({t.get('tokens_in',0)} in → {t.get('tokens_out',0)} out)")
        print(f"  TOTAL:          {t['total_ms']:7.0f} ms")
        print()


if __name__ == "__main__":
    main()
