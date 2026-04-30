#!/usr/bin/env python3
"""
Retrieval Test Harness for SustainIQ
=====================================
Compares retrieval quality between:
- OLD: pymupdf + BGE embeddings (data/page-indexes/section-embeddings.json)
- NEW: Docling + voyage-context-3 (data/page-indexes-docling-test/embeddings-voyage-context3.json)

Usage:
  python3 scripts/retrieval-test.py "What is the baseline period for VM0042?"
  python3 scripts/retrieval-test.py --batch  # Run predefined test queries
  python3 scripts/retrieval-test.py --interactive  # Interactive mode
"""

import argparse
import json
import os
import sys
import time
import math
import re
from typing import Optional

# Load .env.local
_env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
if os.path.exists(_env_path):
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _key, _val = _line.split("=", 1)
                if _key not in os.environ:
                    os.environ[_key] = _val

# Paths
OLD_EMBEDDINGS = "data/page-indexes/section-embeddings.json"
NEW_EMBEDDINGS = "data/page-indexes-docling-test/embeddings-voyage-context3.json"

# Test queries covering different types
TEST_QUERIES = [
    # Simple lookups
    ("What is the baseline period for VM0042?", "vm0042"),
    ("What are Scope 3 categories?", "ghg-scope-3"),
    ("What is the SBTi 1.5°C pathway?", "sbti"),

    # Technical/equation lookups
    ("How do I calculate N2O emissions from fertilizers?", "vm0042"),
    ("What is the formula for financed emissions?", "financed-emissions"),

    # Cross-framework
    ("How does IFRS S2 relate to TCFD?", "ifrs-s2"),
    ("What are the CBAM reporting requirements?", "eu-cbam"),

    # Practical scenarios
    ("How do I report Scope 3 purchased goods emissions?", "ghg-scope-3"),
    ("What is double materiality assessment?", "double-materiality"),
]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def bm25_score(query: str, text: str) -> float:
    """Simple BM25-ish keyword score."""
    query_terms = set(re.findall(r'\w+', query.lower()))
    text_lower = text.lower()

    score = 0.0
    for term in query_terms:
        if term in text_lower:
            # Count occurrences, cap contribution
            count = text_lower.count(term)
            score += min(count, 5) * (1.0 + len(term) / 10)  # Longer terms worth more

    return score


def embed_query_cloudflare(query: str) -> Optional[list[float]]:
    """Embed query using Cloudflare Workers AI (BGE model) via wrangler OAuth."""
    import subprocess

    # Get OAuth token from wrangler config (simple parse, no toml dependency)
    wrangler_config = os.path.expanduser("~/.wrangler/config/default.toml")
    if not os.path.exists(wrangler_config):
        print("  Wrangler not configured. Run 'wrangler login' first.")
        return None

    try:
        oauth_token = None
        with open(wrangler_config) as f:
            for line in f:
                if line.strip().startswith("oauth_token"):
                    # Parse: oauth_token = "..."
                    parts = line.split("=", 1)
                    if len(parts) == 2:
                        oauth_token = parts[1].strip().strip('"').strip("'")
                        break
        if not oauth_token:
            print("  No OAuth token in wrangler config.")
            return None
    except Exception as e:
        print(f"  Failed to read wrangler config: {e}")
        return None

    account_id = "3f9c15f554c0aa209451c1769627716f"
    payload = json.dumps({"text": [query]})

    try:
        result = subprocess.run(
            [
                "curl", "-s",
                f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/baai/bge-base-en-v1.5",
                "-H", f"Authorization: Bearer {oauth_token}",
                "-H", "Content-Type: application/json",
                "-d", payload
            ],
            capture_output=True,
            text=True,
            timeout=30
        )

        response = json.loads(result.stdout)
        if response.get("success") and response.get("result", {}).get("data"):
            return response["result"]["data"][0]
        else:
            print(f"  Cloudflare error: {response.get('errors', 'unknown')}")
            return None

    except Exception as e:
        print(f"  Cloudflare embedding failed: {e}")
        return None


def embed_query_voyage(query: str) -> Optional[list[float]]:
    """Embed query using Voyage AI voyage-context-3."""
    import voyageai

    api_key = os.environ.get("VOYAGE_API_KEY")
    if not api_key:
        print("  VOYAGE_API_KEY not set")
        return None

    try:
        vo = voyageai.Client(api_key=api_key)
        # For queries, use contextualized_embed with single-element inner lists
        # This makes it context-agnostic (like standard embedding)
        result = vo.contextualized_embed(
            inputs=[[query]],
            model="voyage-context-3",
            input_type="query"
        )
        return result.results[0].embeddings[0]

    except Exception as e:
        print(f"  Voyage embedding failed: {e}")
        return None


def search_pipeline(
    query: str,
    sections: list[dict],
    query_embedding: list[float],
    top_k: int = 5,
    use_hybrid: bool = True
) -> list[dict]:
    """Search sections using vector similarity + optional BM25."""
    results = []

    for section in sections:
        emb = section.get("embedding", [])
        if not emb:
            continue

        # Vector similarity
        vec_score = cosine_similarity(query_embedding, emb)

        # BM25 keyword score
        bm25_text = section.get("bm25_text", section.get("text", ""))
        kw_score = bm25_score(query, bm25_text) if use_hybrid else 0

        # Combined score (RRF-style)
        combined = vec_score + (kw_score / 100)  # Normalize keyword contribution

        results.append({
            "doc_title": section.get("doc_title", ""),
            "section_title": section.get("section_title", ""),
            "course": section.get("course", ""),
            "start_page": section.get("start_page", 0),
            "end_page": section.get("end_page", 0),
            "text_preview": section.get("text", "")[:200],
            "vec_score": vec_score,
            "kw_score": kw_score,
            "combined_score": combined,
        })

    # Sort by combined score
    results.sort(key=lambda x: x["combined_score"], reverse=True)
    return results[:top_k]


def print_results(results: list[dict], pipeline_name: str):
    """Pretty print search results."""
    print(f"\n{'='*60}")
    print(f"{pipeline_name} - Top {len(results)} Results")
    print(f"{'='*60}")

    for i, r in enumerate(results, 1):
        print(f"\n[{i}] {r['doc_title'][:50]}")
        print(f"    Section: {r['section_title'][:60]}")
        print(f"    Pages: {r['start_page']}-{r['end_page']} | Course: {r['course']}")
        print(f"    Scores: vec={r['vec_score']:.4f}, kw={r['kw_score']:.1f}, combined={r['combined_score']:.4f}")
        print(f"    Preview: {r['text_preview'][:150]}...")


def run_comparison(query: str, old_data: dict, new_data: dict, top_k: int = 5):
    """Run query through both pipelines and compare."""
    print(f"\n{'#'*70}")
    print(f"QUERY: {query}")
    print(f"{'#'*70}")

    # Embed query for OLD pipeline (BGE)
    print("\nEmbedding query for OLD pipeline (Cloudflare BGE)...")
    old_query_emb = embed_query_cloudflare(query)

    # Embed query for NEW pipeline (Voyage)
    print("Embedding query for NEW pipeline (Voyage context-3)...")
    new_query_emb = embed_query_voyage(query)

    # Search OLD pipeline
    if old_query_emb:
        old_results = search_pipeline(query, old_data["sections"], old_query_emb, top_k)
        print_results(old_results, "OLD PIPELINE (pymupdf + BGE)")
    else:
        print("\n[OLD PIPELINE] Query embedding failed - skipping")
        old_results = []

    # Search NEW pipeline
    if new_query_emb:
        new_results = search_pipeline(query, new_data["sections"], new_query_emb, top_k)
        print_results(new_results, "NEW PIPELINE (Docling + voyage-context-3)")
    else:
        print("\n[NEW PIPELINE] Query embedding failed - skipping")
        new_results = []

    # Compare
    if old_results and new_results:
        print(f"\n{'='*60}")
        print("COMPARISON")
        print(f"{'='*60}")

        old_docs = set(r["doc_title"] for r in old_results)
        new_docs = set(r["doc_title"] for r in new_results)

        overlap = old_docs & new_docs
        only_old = old_docs - new_docs
        only_new = new_docs - old_docs

        print(f"Documents in both: {len(overlap)}")
        if overlap:
            for d in list(overlap)[:3]:
                print(f"  - {d[:50]}")

        if only_old:
            print(f"Only in OLD: {len(only_old)}")
            for d in list(only_old)[:3]:
                print(f"  - {d[:50]}")

        if only_new:
            print(f"Only in NEW: {len(only_new)}")
            for d in list(only_new)[:3]:
                print(f"  - {d[:50]}")

    return old_results, new_results


def main():
    parser = argparse.ArgumentParser(description="Retrieval Test Harness")
    parser.add_argument("query", nargs="?", help="Query to test")
    parser.add_argument("--batch", action="store_true", help="Run all test queries")
    parser.add_argument("--interactive", action="store_true", help="Interactive mode")
    parser.add_argument("--top-k", type=int, default=5, help="Number of results to return")
    parser.add_argument("--new-only", action="store_true", help="Only test new pipeline")

    args = parser.parse_args()

    # Load embeddings
    print("Loading embeddings...")

    if not args.new_only:
        if os.path.exists(OLD_EMBEDDINGS):
            with open(OLD_EMBEDDINGS) as f:
                old_data = json.load(f)
            print(f"  OLD: {old_data['count']} sections, {old_data.get('model', 'unknown')} model")
        else:
            print(f"  OLD: Not found at {OLD_EMBEDDINGS}")
            old_data = {"sections": []}
    else:
        old_data = {"sections": []}

    if os.path.exists(NEW_EMBEDDINGS):
        with open(NEW_EMBEDDINGS) as f:
            new_data = json.load(f)
        print(f"  NEW: {new_data['count']} sections, {new_data['model']} model")
    else:
        print(f"  NEW: Not found at {NEW_EMBEDDINGS}")
        return

    if args.batch:
        # Run all test queries
        print(f"\nRunning {len(TEST_QUERIES)} test queries...")
        for query, expected_course in TEST_QUERIES:
            run_comparison(query, old_data, new_data, args.top_k)
            print("\n" + "-"*70)
            time.sleep(0.5)  # Rate limit courtesy

    elif args.interactive:
        # Interactive mode
        print("\nInteractive mode. Type 'quit' to exit.")
        while True:
            query = input("\nQuery: ").strip()
            if query.lower() in ("quit", "exit", "q"):
                break
            if query:
                run_comparison(query, old_data, new_data, args.top_k)

    elif args.query:
        # Single query
        run_comparison(args.query, old_data, new_data, args.top_k)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
