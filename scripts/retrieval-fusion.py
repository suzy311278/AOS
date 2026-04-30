#!/usr/bin/env python3
"""
Multi-Index Retrieval with RRF Fusion
======================================
Searches three indexes in parallel and merges with Reciprocal Rank Fusion:
1. Chunks (4,498 items) - general context
2. Definitions (242 items) - atomic term lookups
3. Formulas (213 items) - equations with variables

All three use voyage-context-3 embeddings (same vector space).

Usage:
  python3 scripts/retrieval-fusion.py "query"
  python3 scripts/retrieval-fusion.py --batch
"""

import argparse
import json
import math
import os
import re
import sys
import time
from typing import Optional

import numpy as np

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

INDEX_DIR = "data/page-indexes-docling-test"
CHUNKS_PATH = os.path.join(INDEX_DIR, "embeddings-voyage-context3.json")
DEFINITIONS_PATH = os.path.join(INDEX_DIR, "definitions-embeddings.json")
FORMULAS_PATH = os.path.join(INDEX_DIR, "formulas-embeddings.json")


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors (legacy, single-pair)."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def build_embedding_matrix(items: list[dict], emb_key: str = "embedding") -> np.ndarray:
    """Pre-build a normalized numpy matrix from a list of items with embeddings."""
    embeddings = np.array([item[emb_key] for item in items if item.get(emb_key)], dtype=np.float32)
    # Normalize rows to unit length - then cosine sim becomes a simple dot product
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms[norms == 0] = 1.0  # Avoid division by zero
    return embeddings / norms


def vectorized_cosine_topk(query_emb: list[float], matrix: np.ndarray, top_k: int = 20) -> tuple:
    """Compute cosine similarity for all items and return top-k indices + scores."""
    q = np.array(query_emb, dtype=np.float32)
    q_norm = np.linalg.norm(q)
    if q_norm > 0:
        q = q / q_norm

    # Matrix is pre-normalized, so dot product = cosine similarity
    scores = matrix @ q

    # Get top-k via argpartition (faster than full sort)
    if top_k >= len(scores):
        top_indices = np.argsort(-scores)
    else:
        partitioned = np.argpartition(-scores, top_k)[:top_k]
        top_indices = partitioned[np.argsort(-scores[partitioned])]

    return top_indices, scores[top_indices]


def bm25_score(query: str, text: str) -> float:
    """Simple BM25-ish keyword score."""
    query_terms = set(re.findall(r'\w+', query.lower()))
    text_lower = text.lower()
    score = 0.0
    for term in query_terms:
        if term in text_lower:
            count = text_lower.count(term)
            score += min(count, 5) * (1.0 + len(term) / 10)
    return score


# Known sustainability frameworks/standards for pattern-based decomposition
KNOWN_FRAMEWORKS = [
    "SBTi", "GHG Protocol", "GHG Scope 3", "Scope 3", "PCAF", "TCFD", "IFRS S2",
    "ISSB", "CSRD", "ESRS", "EFRAG", "CBAM", "EU ETS", "EU Taxonomy", "SFDR",
    "VCS", "Verra", "Gold Standard", "VCMI", "ICVCM", "VM0042", "VM0044",
    "TNFD", "LEAP", "GRI", "SASB", "CDP", "IFC Performance Standards",
    "OECD Due Diligence", "UN Guiding Principles", "BRSR", "ILO",
    "EUDR", "Oxford Principles", "PCAF Insurance", "Kunming-Montreal",
]


def decompose_query_patterns(query: str) -> list[str]:
    """
    Pattern-based query decomposition - no LLM required.

    Detects:
    1. Multiple frameworks mentioned: "SBTi, PCAF, and GHG Protocol"
    2. Comparative connectors: "vs", "versus", "compared to", "between X and Y"
    3. Explicit comparisons: "compare X and Y", "differences between X and Y"
    """
    # Find all mentioned frameworks (case-insensitive)
    mentioned = []
    query_lower = query.lower()
    for fw in KNOWN_FRAMEWORKS:
        # Use word boundaries for matching
        pattern = r'\b' + re.escape(fw.lower()) + r'\b'
        if re.search(pattern, query_lower):
            mentioned.append(fw)

    # Deduplicate while preserving order
    seen = set()
    unique_fw = []
    for fw in mentioned:
        fw_key = fw.lower().replace(" ", "")
        if fw_key not in seen:
            # Skip if it's a subset of something already found (e.g., "Scope 3" when "GHG Scope 3" is there)
            skip = False
            for existing in unique_fw:
                if fw.lower() in existing.lower() and fw.lower() != existing.lower():
                    skip = True
                    break
            if not skip:
                seen.add(fw_key)
                unique_fw.append(fw)

    # If 2+ frameworks mentioned AND query has comparison signals, decompose
    comparison_signals = ["vs", "versus", "compare", "compared", "difference",
                          "differences", "between", ", and ", ", or ", "how do "]
    has_comparison = any(sig in query_lower for sig in comparison_signals)

    if len(unique_fw) >= 2 and has_comparison:
        # Build a sub-query per framework by substituting the query template
        sub_queries = []
        for fw in unique_fw:
            # Try to build a natural sub-query
            # Remove other framework mentions from the query, keep the one framework
            sub_query = query
            for other_fw in unique_fw:
                if other_fw != fw:
                    # Remove with surrounding punctuation/connectors
                    patterns_to_remove = [
                        rf',\s*{re.escape(other_fw)}\s*,?',  # ", OtherFW,"
                        rf'\s+and\s+{re.escape(other_fw)}\b',  # " and OtherFW"
                        rf'\s+or\s+{re.escape(other_fw)}\b',   # " or OtherFW"
                        rf'{re.escape(other_fw)}\s*,\s*',      # "OtherFW, "
                        rf'{re.escape(other_fw)}\s+and\s+',    # "OtherFW and "
                        rf'{re.escape(other_fw)}\s+vs\.?\s+',  # "OtherFW vs "
                        rf'\s+vs\.?\s+{re.escape(other_fw)}\b',# " vs OtherFW"
                    ]
                    for p in patterns_to_remove:
                        sub_query = re.sub(p, ' ', sub_query, flags=re.IGNORECASE)
            # Clean up double spaces and commas
            sub_query = re.sub(r'\s+,', ',', sub_query)
            sub_query = re.sub(r',\s*,', ',', sub_query)
            sub_query = re.sub(r'\s+', ' ', sub_query).strip()
            sub_queries.append(sub_query)

        return sub_queries

    # No decomposition needed
    return [query]


def decompose_query(query: str) -> list[str]:
    """
    Decompose a complex query into sub-queries.
    Tries LLM first (Groq), falls back to pattern-based decomposition.
    """
    import json as _json
    import urllib.request
    import urllib.error

    # Try Groq LLM first
    api_keys = [k.strip() for k in os.environ.get("GROQ_API_KEYS", "").split(",") if k.strip()]

    system_prompt = """You are a query decomposer for a sustainability knowledge retrieval system.

Given a user query, decide if it needs decomposition:
- If the query compares/contrasts MULTIPLE frameworks or concepts (e.g., "SBTi vs PCAF", "compare CBAM and EU ETS"), decompose into one sub-query per framework/concept.
- If the query asks about ONE thing, return it as-is.
- Sub-queries should be self-contained and specific.
- Keep original terminology and proper nouns.

Respond with JSON only: {"sub_queries": ["query1", "query2", ...]}

Examples:

User: "How do SBTi, GHG Protocol Scope 3, and PCAF handle financed emissions for a bank?"
Response: {"sub_queries": ["How does SBTi handle financed emissions for a bank?", "How does GHG Protocol Scope 3 handle financed emissions for a bank?", "How does PCAF handle financed emissions for a bank?"]}

User: "What is the baseline period for VM0042?"
Response: {"sub_queries": ["What is the baseline period for VM0042?"]}

User: "Compare additionality requirements between VCS and Gold Standard"
Response: {"sub_queries": ["What are the additionality requirements in VCS?", "What are the additionality requirements in Gold Standard?"]}

User: "How do I calculate scope 3 emissions?"
Response: {"sub_queries": ["How do I calculate scope 3 emissions?"]}"""

    for api_key in api_keys:

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            "temperature": 0.1,
            "max_tokens": 500,
            "response_format": {"type": "json_object"}
        }

        try:
            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=_json.dumps(payload).encode(),
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                }
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                result = _json.loads(resp.read().decode())

            content = result["choices"][0]["message"]["content"]
            parsed = _json.loads(content)
            sub_queries = parsed.get("sub_queries", [query])
            return sub_queries[:5] if sub_queries else [query]

        except urllib.error.HTTPError as e:
            if e.code == 401 or e.code == 403:
                continue  # Try next key
            break
        except Exception:
            break

    # Fallback to pattern-based decomposition
    return decompose_query_patterns(query)


def synthesize_answer(query: str, retrieved: list[dict], model: str = "llama-3.3-70b-versatile") -> tuple[str, dict]:
    """
    Synthesize an answer from retrieved context using Groq.
    Returns (answer, timing_info).
    """
    import json as _json
    import urllib.request
    import urllib.error

    api_keys = [k.strip() for k in os.environ.get("GROQ_API_KEYS", "").split(",") if k.strip()]
    if not api_keys:
        return "No Groq API key available for synthesis", {"synthesis_ms": 0}

    # Build context from retrieved items, grouped by type
    context_parts = []
    definitions = [r for r in retrieved if r["type"] == "definition"]
    formulas = [r for r in retrieved if r["type"] == "formula"]
    chunks = [r for r in retrieved if r["type"] == "chunk"]

    if definitions:
        context_parts.append("=== DEFINITIONS ===")
        for d in definitions[:3]:
            context_parts.append(f"[{d['doc_title']}, p.{d['page']}]")
            context_parts.append(d["content"])
            context_parts.append("")

    if formulas:
        context_parts.append("=== FORMULAS ===")
        for f in formulas[:3]:
            context_parts.append(f"[{f['doc_title']}, {f['section_title']}, p.{f['page']}]")
            context_parts.append(f["content"])
            context_parts.append("")

    if chunks:
        context_parts.append("=== EXCERPTS ===")
        for c in chunks[:6]:
            context_parts.append(f"[{c['doc_title']}, {c['section_title']}, p.{c['page']}]")
            context_parts.append(c["content"])
            context_parts.append("")

    context = "\n".join(context_parts)

    system_prompt = """You are SustainIQ, a sustainability expert answering practitioner questions.

RULES:
1. Answer ONLY from the provided context. Never invent facts.
2. Cite every claim with the source in brackets: [Doc Title, Section, p.X]
3. If the context doesn't cover the question, say "The provided sources don't cover this directly" and explain what's missing.
4. Keep answers concise (2-4 paragraphs max) unless the question requires more depth.
5. For calculations, show the formula and variables from the provided context.
6. Use professional, clear language suitable for sustainability practitioners."""

    user_prompt = f"""Question: {query}

Context from indexed sustainability documents:

{context}

Provide a sourced answer following the rules above."""

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 1500,
    }

    t0 = time.time()
    for api_key in api_keys:
        try:
            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=_json.dumps(payload).encode(),
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                }
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = _json.loads(resp.read().decode())

            answer = result["choices"][0]["message"]["content"]
            usage = result.get("usage", {})
            t_elapsed = time.time() - t0

            return answer, {
                "synthesis_ms": t_elapsed * 1000,
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "model": model,
            }

        except urllib.error.HTTPError as e:
            if e.code in (401, 403, 429):
                continue
            return f"Synthesis failed: HTTP {e.code}", {"synthesis_ms": (time.time() - t0) * 1000}
        except Exception as e:
            return f"Synthesis failed: {e}", {"synthesis_ms": (time.time() - t0) * 1000}

    return "All Groq keys failed", {"synthesis_ms": (time.time() - t0) * 1000}


def embed_query(query: str) -> Optional[list[float]]:
    """Embed query using voyage-context-3."""
    import voyageai

    api_key = os.environ.get("VOYAGE_API_KEY")
    if not api_key:
        raise RuntimeError("VOYAGE_API_KEY not set")

    vo = voyageai.Client(api_key=api_key)
    result = vo.contextualized_embed(
        inputs=[[query]],
        model="voyage-context-3",
        input_type="query"
    )
    return result.results[0].embeddings[0]


def search_chunks(query: str, query_emb: list[float], chunks_data: dict,
                  chunks_matrix: np.ndarray = None, top_k: int = 20) -> list[dict]:
    """Search chunk embeddings with vectorized cosine similarity."""
    sections = [s for s in chunks_data["sections"] if s.get("embedding")]

    if chunks_matrix is None:
        chunks_matrix = build_embedding_matrix(sections)

    # Over-fetch for BM25 re-ranking (catches items strong on keywords).
    # For small indexes (<500 items), score everything. For large, fetch 10x top_k.
    fetch_k = len(sections) if len(sections) < 500 else min(top_k * 10, len(sections))
    top_indices, top_scores = vectorized_cosine_topk(query_emb, chunks_matrix, fetch_k)

    results = []
    for idx, vec_score in zip(top_indices, top_scores):
        s = sections[idx]
        kw_score = bm25_score(query, s.get("bm25_text", s.get("text", "")))
        combined = float(vec_score) + (kw_score / 100)

        results.append({
            "type": "chunk",
            "vec_score": float(vec_score),
            "kw_score": kw_score,
            "combined_score": combined,
            "doc_title": s.get("doc_title", ""),
            "section_title": s.get("section_title", ""),
            "parent_titles": s.get("parent_titles", []),
            "course": s.get("course", ""),
            "page": f"{s.get('start_page', 0)}-{s.get('end_page', 0)}",
            "content": s.get("text", "")[:300],
        })

    results.sort(key=lambda x: x["combined_score"], reverse=True)
    return results[:top_k]


def search_definitions(query: str, query_emb: list[float], defs_data: dict,
                       defs_matrix: np.ndarray = None, top_k: int = 5) -> list[dict]:
    """Search definition embeddings with vectorized cosine similarity."""
    definitions = [d for d in defs_data["definitions"] if d.get("embedding")]

    if defs_matrix is None:
        defs_matrix = build_embedding_matrix(definitions)

    fetch_k = len(definitions) if len(definitions) < 500 else min(top_k * 10, len(definitions))
    top_indices, top_scores = vectorized_cosine_topk(query_emb, defs_matrix, fetch_k)

    results = []
    for idx, vec_score in zip(top_indices, top_scores):
        d = definitions[idx]
        kw_score = bm25_score(query, f"{d['term']} {d['definition']}")
        combined = float(vec_score) + (kw_score / 100)

        results.append({
            "type": "definition",
            "vec_score": float(vec_score),
            "kw_score": kw_score,
            "combined_score": combined,
            "doc_title": d.get("source_title", ""),
            "section_title": f"Definition: {d['term']}",
            "course": d.get("course", ""),
            "page": str(d.get("page", 0)),
            "content": f"{d['term']}: {d['definition'][:250]}",
            "term": d["term"],
        })

    results.sort(key=lambda x: x["combined_score"], reverse=True)
    return results[:top_k]


def search_formulas(query: str, query_emb: list[float], forms_data: dict,
                    forms_matrix: np.ndarray = None, top_k: int = 3) -> list[dict]:
    """Search formula embeddings with vectorized cosine similarity."""
    formulas = [f for f in forms_data["formulas"] if f.get("embedding")]

    if forms_matrix is None:
        forms_matrix = build_embedding_matrix(formulas)

    fetch_k = len(formulas) if len(formulas) < 500 else min(top_k * 10, len(formulas))
    top_indices, top_scores = vectorized_cosine_topk(query_emb, forms_matrix, fetch_k)

    results = []
    for idx, vec_score in zip(top_indices, top_scores):
        f = formulas[idx]
        var_text = " ".join([f"{v['symbol']} {v['description']}" for v in f.get("variables", [])])
        kw_text = f"{f.get('context', '')} {f.get('section', '')} {var_text}"
        kw_score = bm25_score(query, kw_text)
        combined = float(vec_score) + (kw_score / 100)

        # Build preview with formula + variables
        var_preview = ""
        if f.get("variables"):
            var_lines = [f"  {v['symbol']} = {v['description'][:50]}" for v in f["variables"][:3]]
            var_preview = "\n" + "\n".join(var_lines)

        results.append({
            "type": "formula",
            "vec_score": float(vec_score),
            "kw_score": kw_score,
            "combined_score": combined,
            "doc_title": f.get("source_title", ""),
            "section_title": f.get("section", ""),
            "course": f.get("course", ""),
            "page": str(f.get("page", 0)),
            "content": f"{f['formula'][:150]}{var_preview}",
            "variables": f.get("variables", []),
        })

    results.sort(key=lambda x: x["combined_score"], reverse=True)
    return results[:top_k]


def rerank_with_voyage(query: str, candidates: list[dict], top_k: int = 8) -> list[dict]:
    """
    Rerank candidates using Voyage AI's cross-encoder reranker (rerank-2.5).
    Cross-encoders see query + document together and score their relevance -
    much more accurate than bi-encoder cosine similarity.
    """
    if not candidates:
        return []

    import voyageai
    api_key = os.environ.get("VOYAGE_API_KEY")
    if not api_key:
        print("  VOYAGE_API_KEY not set, skipping rerank")
        return candidates[:top_k]

    vo = voyageai.Client(api_key=api_key)

    # Build document texts for reranking
    # Include type context so reranker understands what each is
    docs = []
    for c in candidates:
        if c["type"] == "definition":
            doc_text = f"Definition - {c['content']}"
        elif c["type"] == "formula":
            doc_text = f"Formula from {c['section_title']} - {c['content']}"
        else:
            doc_text = f"Excerpt from {c['section_title']} - {c['content']}"
        docs.append(doc_text[:2000])  # Cap length

    try:
        result = vo.rerank(
            query=query,
            documents=docs,
            model="rerank-2.5",
            top_k=min(top_k, len(docs))
        )

        # Build reranked list
        reranked = []
        for r in result.results:
            idx = r.index
            item = dict(candidates[idx])
            item["rerank_score"] = r.relevance_score
            reranked.append(item)

        return reranked
    except Exception as e:
        print(f"  Rerank failed: {e}, using RRF order")
        return candidates[:top_k]


def rrf_fuse(ranked_lists: list[list[dict]], k: int = 60) -> list[dict]:
    """
    Reciprocal Rank Fusion.
    For each item, score = sum(1 / (k + rank_in_list)) across all lists it appears in.
    """
    # Each item is uniquely identified by type + doc_title + section_title
    def item_key(item):
        return (item["type"], item.get("doc_title", ""), item.get("section_title", ""),
                item.get("page", ""), item["content"][:50])

    scores = {}
    items = {}

    for ranked_list in ranked_lists:
        for rank, item in enumerate(ranked_list, start=1):
            key = item_key(item)
            rrf_score = 1.0 / (k + rank)
            if key in scores:
                scores[key] += rrf_score
            else:
                scores[key] = rrf_score
                items[key] = item

    # Attach RRF score and sort
    fused = []
    for key, item in items.items():
        item_copy = dict(item)
        item_copy["rrf_score"] = scores[key]
        fused.append(item_copy)

    fused.sort(key=lambda x: x["rrf_score"], reverse=True)
    return fused


def enforce_diversity(fused: list[dict], def_hits: list[dict], form_hits: list[dict],
                      top_n: int = 10, threshold: float = 0.4) -> list[dict]:
    """Ensure at least one definition and one formula in results if their vec_score > threshold."""
    final = fused[:top_n]
    types_present = {item["type"] for item in final}

    # Add top definition if not present and meets threshold
    if "definition" not in types_present and def_hits:
        if def_hits[0]["vec_score"] > threshold:
            final.append({**def_hits[0], "rrf_score": 0.0, "injected": True})

    # Add top formula if not present and meets threshold
    if "formula" not in types_present and form_hits:
        if form_hits[0]["vec_score"] > threshold:
            final.append({**form_hits[0], "rrf_score": 0.0, "injected": True})

    return final


def print_results(results: list[dict], title: str = "FUSED RESULTS"):
    """Pretty-print fused results grouped by type."""
    print(f"\n{'='*70}")
    print(f"{title}")
    print(f"{'='*70}")

    type_emoji = {"chunk": "[CHUNK]", "definition": "[DEF]", "formula": "[FORMULA]"}

    for i, r in enumerate(results, 1):
        marker = type_emoji.get(r["type"], "[?]")
        injected = " (diversity-injected)" if r.get("injected") else ""
        rrf = r.get("rrf_score", 0)
        rerank = r.get("rerank_score")
        rerank_str = f"  rerank={rerank:.3f}" if rerank is not None else ""
        print(f"\n[{i}] {marker}{injected}  RRF={rrf:.4f}{rerank_str}")
        print(f"    {r['doc_title'][:60]}")
        print(f"    Section: {r['section_title'][:60]}")
        print(f"    Page: {r['page']} | Course: {r['course']}")
        print(f"    Scores: vec={r['vec_score']:.3f}, kw={r['kw_score']:.1f}")
        # Show content preview
        content_lines = r["content"].split("\n")
        for line in content_lines[:4]:
            print(f"    | {line[:150]}")


def run_query(query: str, chunks_data: dict, defs_data: dict, forms_data: dict,
              chunks_matrix: np.ndarray = None, defs_matrix: np.ndarray = None,
              forms_matrix: np.ndarray = None, verbose: bool = True,
              decompose: bool = True):
    """Run a query through the fusion pipeline with optional decomposition."""
    print(f"\n{'#'*70}")
    print(f"QUERY: {query}")
    print(f"{'#'*70}")

    # Decompose query if enabled
    sub_queries = [query]
    if decompose:
        print("\nChecking if query needs decomposition (Groq Llama)...")
        sub_queries = decompose_query(query)
        if len(sub_queries) > 1:
            print(f"  Decomposed into {len(sub_queries)} sub-queries:")
            for i, sq in enumerate(sub_queries, 1):
                print(f"    {i}. {sq}")
        else:
            print("  Single query, no decomposition needed")

    # For each sub-query, retrieve separately
    all_chunk_hits = []
    all_def_hits = []
    all_form_hits = []

    for sq in sub_queries:
        sq_emb = embed_query(sq)
        per_k = 10 if len(sub_queries) > 1 else 20
        all_chunk_hits.append(search_chunks(sq, sq_emb, chunks_data, chunks_matrix, top_k=per_k))
        all_def_hits.append(search_definitions(sq, sq_emb, defs_data, defs_matrix, top_k=3))
        all_form_hits.append(search_formulas(sq, sq_emb, forms_data, forms_matrix, top_k=2))

    # GUARANTEED per-sub-query contribution: take top N from each sub-query first
    # This ensures each sub-query's best hits make it into the final pool,
    # preventing one sub-query's dominant framework from crowding out others.
    guaranteed_pool = []
    if len(sub_queries) > 1:
        per_sq_guaranteed = max(2, 8 // len(sub_queries))  # ~2-4 per sub-query
        for chunk_hits in all_chunk_hits:
            guaranteed_pool.extend(chunk_hits[:per_sq_guaranteed])
        for def_hits in all_def_hits:
            guaranteed_pool.extend(def_hits[:1])
        for form_hits in all_form_hits:
            guaranteed_pool.extend(form_hits[:1])

    # RRF fusion on ALL results (includes the guaranteed pool plus any overlap-boosted items)
    fused = rrf_fuse(all_chunk_hits + all_def_hits + all_form_hits)

    # Merge guaranteed items with fused, deduplicating
    def item_key(item):
        return (item["type"], item.get("doc_title", ""), item.get("section_title", ""),
                item.get("page", ""), item["content"][:50])

    seen_keys = set()
    merged = []
    # First add guaranteed items (preserves per-sub-query diversity)
    for item in guaranteed_pool:
        k = item_key(item)
        if k not in seen_keys:
            seen_keys.add(k)
            item_copy = dict(item)
            item_copy["from_guaranteed"] = True
            merged.append(item_copy)
    # Then fill remaining with fused results
    for item in fused:
        k = item_key(item)
        if k not in seen_keys:
            seen_keys.add(k)
            merged.append(item)

    # For diversity enforcement
    flat_def_hits = sorted([d for hits in all_def_hits for d in hits],
                           key=lambda x: x["vec_score"], reverse=True)[:5]
    flat_form_hits = sorted([f for hits in all_form_hits for f in hits],
                            key=lambda x: x["vec_score"], reverse=True)[:3]

    # Cross-encoder rerank
    print("\nReranking with voyage rerank-2.5...")

    if len(sub_queries) > 1:
        # Per-sub-query rerank + round-robin merge to preserve diversity
        per_sq_top = max(2, 8 // len(sub_queries))  # 2-4 items per sub-query
        reranked_per_sq = []
        for sq, chunk_hits, def_hits, form_hits in zip(sub_queries, all_chunk_hits, all_def_hits, all_form_hits):
            # Build pool for this sub-query (its top chunks + defs + formulas)
            sq_pool = chunk_hits[:8] + def_hits[:3] + form_hits[:2]
            sq_reranked = rerank_with_voyage(sq, sq_pool, top_k=per_sq_top)
            reranked_per_sq.append(sq_reranked)

        # Round-robin merge: take [0] from each, then [1] from each, etc.
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
        # Single query: standard flow
        diverse = enforce_diversity(merged, flat_def_hits, flat_form_hits, top_n=15)
        final = rerank_with_voyage(query, diverse, top_k=8)

    # Print final results
    print_results(final, "DECOMPOSED + RRF + DIVERSITY + RERANKED")

    return final


def main():
    parser = argparse.ArgumentParser(description="Multi-index RRF fusion retrieval")
    parser.add_argument("query", nargs="?", help="Query to test")
    parser.add_argument("--batch", action="store_true", help="Run test queries")
    parser.add_argument("--quiet", action="store_true", help="Hide per-index details")

    args = parser.parse_args()

    # Load all three indexes
    print("Loading indexes...")
    t0 = time.time()
    with open(CHUNKS_PATH) as f:
        chunks_data = json.load(f)
    print(f"  Chunks: {chunks_data['count']}")

    with open(DEFINITIONS_PATH) as f:
        defs_data = json.load(f)
    print(f"  Definitions: {defs_data['count']}")

    with open(FORMULAS_PATH) as f:
        forms_data = json.load(f)
    print(f"  Formulas: {forms_data['count']}")
    print(f"  Loaded in {time.time()-t0:.1f}s")

    # Pre-build normalized matrices once (reusable across queries)
    print("Building normalized embedding matrices...")
    t0 = time.time()
    chunks_matrix = build_embedding_matrix([s for s in chunks_data["sections"] if s.get("embedding")])
    defs_matrix = build_embedding_matrix([d for d in defs_data["definitions"] if d.get("embedding")])
    forms_matrix = build_embedding_matrix([f for f in forms_data["formulas"] if f.get("embedding")])
    print(f"  Matrices built in {time.time()-t0:.1f}s")
    print(f"  Chunks matrix: {chunks_matrix.shape}")
    print(f"  Defs matrix:   {defs_matrix.shape}")
    print(f"  Forms matrix:  {forms_matrix.shape}")

    if args.batch:
        test_queries = [
            "What is the baseline period for VM0042?",
            "How do I figure out emissions from the lime I put on my fields?",
            "What is the impact of baseline period on additionality?",
            "Can I get carbon credits for farmers who already switched to no-till?",
            "How do I calculate EF_limestone?",
        ]
        for q in test_queries:
            run_query(q, chunks_data, defs_data, forms_data,
                      chunks_matrix, defs_matrix, forms_matrix,
                      verbose=not args.quiet)
            time.sleep(0.5)
    elif args.query:
        run_query(args.query, chunks_data, defs_data, forms_data,
                  chunks_matrix, defs_matrix, forms_matrix,
                  verbose=not args.quiet)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
