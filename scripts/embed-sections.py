#!/usr/bin/env python3
"""
Embed all leaf sections using Cloudflare Workers AI (bge-base-en-v1.5).
Stores embeddings in data/page-indexes/section-embeddings.json

Uses parent-child hierarchy in embedding text for better context:
  "VM0042 > Quantification > Baseline Emissions > 8.2.4 Liming. Eq 8-9, EFLimestone=0.12..."

Usage:
  python3 scripts/embed-sections.py
"""

import json
import os
import re
import requests
import time

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
from collections import Counter

INDEX_DIR = "data/page-indexes"
OUTPUT_PATH = os.path.join(INDEX_DIR, "section-embeddings.json")
BATCH_SIZE = 10  # Keep small to stay under 10K TPM per call
EMBED_MODEL = "voyage-4-lite"  # 1024 dims, free tier

# Common English stop words to filter from term extraction
STOP_WORDS = {
    "the", "and", "for", "that", "this", "with", "from", "are", "was", "were",
    "been", "have", "has", "had", "will", "would", "could", "should", "shall",
    "may", "can", "not", "but", "its", "their", "they", "which", "when", "where",
    "how", "what", "who", "all", "each", "any", "such", "than", "into", "also",
    "more", "other", "been", "between", "about", "under", "over", "after", "before",
    "through", "these", "those", "being", "does", "did", "must", "including",
    "based", "related", "relevant", "ensure", "provide", "include", "use", "used",
    "using", "accordance", "pursuant", "article", "section", "page", "paragraph",
    "shall", "means", "respect", "regard", "order", "case", "where", "upon",
    "whether", "upon", "within", "without", "thereof", "herein", "above", "below",
}


def extract_distinctive_terms(text: str, max_terms: int = 60) -> list[str]:
    """Extract top distinctive terms from section text using word frequency."""
    words = re.findall(r'\b[a-zA-Z][a-zA-Z0-9_-]{2,}\b', text.lower())
    words = [w for w in words if w not in STOP_WORDS and len(w) > 2]
    freq = Counter(words)
    # Return most frequent terms (these are distinctive for this section)
    return [term for term, _ in freq.most_common(max_terms)]


def chunk_text(text: str, chunk_size: int = 1600, overlap: int = 300) -> list[str]:
    """Split text into overlapping chunks of ~chunk_size characters (~400 tokens).

    Tries to break at sentence boundaries for cleaner chunks.
    """
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size

        # Try to break at a sentence boundary (period + space/newline)
        if end < len(text):
            # Look for sentence boundary in last 20% of chunk
            search_start = end - int(chunk_size * 0.2)
            best_break = -1
            for sep in ['. ', '.\n', '\n\n']:
                pos = text.rfind(sep, search_start, end)
                if pos > best_break:
                    best_break = pos + len(sep)
            if best_break > search_start:
                end = best_break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # Move forward by chunk_size minus overlap
        start = end - overlap
        if start >= len(text):
            break

    return chunks


def embed_batch(texts: list[str], max_retries: int = 3) -> list[list[float]]:
    """Embed a batch of texts using Voyage AI. Retries on transient errors."""
    import voyageai
    api_key = os.environ.get("VOYAGE_API_KEY")
    if not api_key:
        raise RuntimeError("VOYAGE_API_KEY not set in .env.local")

    vo = voyageai.Client(api_key=api_key)

    for attempt in range(max_retries):
        try:
            result = vo.embed(texts, model=EMBED_MODEL, input_type="document")
            return result.embeddings
        except Exception as e:
            err = str(e)
            if "rate" in err.lower() or "429" in err:
                wait = 10 * (attempt + 1)
                print(f"\n  Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            if attempt < max_retries - 1:
                print(f"\n  Error: {err[:80]}, retrying...")
                time.sleep(2)
                continue
            raise RuntimeError(f"Voyage AI error after {max_retries} retries: {err}")
    raise RuntimeError("embed_batch failed after all retries")


def collect_chunks() -> list[dict]:
    """Walk all tree indexes and produce chunks from leaf section text.

    Each leaf section's full text is split into ~400-token overlapping chunks.
    Each chunk gets:
    - Embedding text: hierarchy prefix + actual chunk content (uses full 512-token BGE window)
    - BM25 text: the raw chunk content for keyword search
    - Metadata: node_id, section info, chunk_index (for collapsing back to sections)

    Small sections (< 1600 chars) produce a single chunk with enriched embedding text
    (hierarchy + technical_index + summary + terms, same as Phase 1).
    """
    chunks = []

    for root, dirs, files in os.walk(INDEX_DIR):
        for fname in files:
            if not fname.endswith("_light.json"):
                continue

            light_path = os.path.join(root, fname)
            with open(light_path) as f:
                light_tree = json.load(f)

            doc_title = light_tree.get("title", "Unknown")
            course = os.path.basename(root)

            # Load full tree to get section text
            full_json = fname.replace("_light.json", ".json")
            full_path = os.path.join(root, full_json)
            full_tree = None
            if os.path.exists(full_path):
                with open(full_path) as f:
                    full_tree = json.load(f)

            # Build a node_id -> text lookup from full tree
            text_map: dict[str, str] = {}
            if full_tree:
                def index_text(node: dict):
                    if node.get("text"):
                        text_map[node["node_id"]] = node["text"]
                    for child in node.get("children", []):
                        index_text(child)
                for child in full_tree.get("children", []):
                    index_text(child)

            def walk(node: dict, parent_chain: list[str]):
                is_leaf = not node.get("children") or len(node["children"]) == 0

                if is_leaf:
                    hierarchy = " > ".join([doc_title] + parent_chain + [node["title"]])
                    ti = node.get("technical_index", "")
                    summary = node.get("summary", "")
                    full_text = text_map.get(node["node_id"], "")

                    # Shared metadata for all chunks from this section
                    meta = {
                        "node_id": node["node_id"],
                        "doc_title": doc_title,
                        "course": course,
                        "section_title": node["title"],
                        "start_page": node["start_page"],
                        "end_page": node["end_page"],
                        "technical_index": ti,
                        "full_tree_path": full_path,
                    }

                    if not full_text or len(full_text) < 1600:
                        # Small section: single chunk with enriched embedding (Phase 1 style)
                        embed_parts = [hierarchy]
                        if ti:
                            embed_parts.append(ti)
                        if summary:
                            embed_parts.append(summary[:300])
                        if full_text:
                            terms = extract_distinctive_terms(full_text, max_terms=60)
                            if terms:
                                embed_parts.append("Key terms: " + ", ".join(terms))
                        embed_text = ". ".join(embed_parts)[:1800]

                        chunks.append({
                            **meta,
                            "chunk_index": 0,
                            "total_chunks": 1,
                            "embed_text": embed_text,
                            "bm25_text": (full_text or f"{ti} {summary}")[:10000],
                        })
                    else:
                        # Large section: split into chunks from actual text
                        text_chunks = chunk_text(full_text, chunk_size=1600, overlap=300)

                        # Hierarchy prefix (~200 chars) prepended to each chunk's embedding
                        # This ensures every chunk carries document/section context
                        hierarchy_prefix = hierarchy[:200]

                        for ci, chunk_content in enumerate(text_chunks):
                            # Embedding: hierarchy prefix + chunk content
                            # Target ~1600 chars total (~400 tokens)
                            available = 1800 - len(hierarchy_prefix) - 2
                            embed_text = f"{hierarchy_prefix}. {chunk_content[:available]}"

                            chunks.append({
                                **meta,
                                "chunk_index": ci,
                                "total_chunks": len(text_chunks),
                                "embed_text": embed_text,
                                "bm25_text": chunk_content[:5000],
                            })

                else:
                    for child in node["children"]:
                        walk(child, parent_chain + [node["title"]])

            for child in light_tree.get("children", []):
                walk(child, [])

    return chunks


def main():
    print("Collecting chunks from all indexed documents...")
    chunks = collect_chunks()
    unique_sections = len(set(c["node_id"] for c in chunks))
    unique_courses = len(set(c["course"] for c in chunks))
    print(f"Found {len(chunks)} chunks from {unique_sections} sections across {unique_courses} courses")

    if not chunks:
        print("No chunks found. Run the indexer first.")
        return

    # Show stats
    multi_chunk = [c for c in chunks if c["total_chunks"] > 1]
    print(f"  Single-chunk sections: {unique_sections - len(set(c['node_id'] for c in multi_chunk))}")
    print(f"  Multi-chunk sections: {len(set(c['node_id'] for c in multi_chunk))}")

    print("\nSample embedding texts:")
    for c in chunks[:3]:
        print(f"  [{c['node_id']}#{c['chunk_index']}] {c['embed_text'][:120]}...")
    print()

    # Embed in batches via Voyage AI
    all_embeddings = []
    total_batches = (len(chunks) + BATCH_SIZE - 1) // BATCH_SIZE

    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i:i + BATCH_SIZE]
        batch_texts = [c["embed_text"] for c in batch]
        batch_num = i // BATCH_SIZE + 1

        print(f"Embedding batch {batch_num}/{total_batches} ({len(batch)} chunks)...", end=" ", flush=True)
        t = time.time()
        vectors = embed_batch(batch_texts)
        elapsed = time.time() - t
        print(f"{elapsed:.1f}s")

        all_embeddings.extend(vectors)

        # 25s delay between batches (Voyage free tier: 3 RPM, 10K TPM)
        if batch_num < total_batches:
            time.sleep(25)

    # Save: chunk metadata + embeddings
    output = {
        "model": "bge-base-en-v1.5",
        "dimensions": 768,
        "count": len(chunks),
        "chunk_level": True,  # Flag so hybrid-search.ts knows to collapse by section
        "sections": [],  # Keep field name for backward compat with hybrid-search.ts
    }

    for i, chunk in enumerate(chunks):
        output["sections"].append({
            "node_id": chunk["node_id"],
            "doc_title": chunk["doc_title"],
            "course": chunk["course"],
            "section_title": chunk["section_title"],
            "start_page": chunk["start_page"],
            "end_page": chunk["end_page"],
            "technical_index": chunk["technical_index"],
            "embed_text": chunk["embed_text"],
            "bm25_text": chunk["bm25_text"],
            "chunk_index": chunk["chunk_index"],
            "total_chunks": chunk["total_chunks"],
            "full_tree_path": chunk["full_tree_path"],
            "embedding": all_embeddings[i],
        })

    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f)

    size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"\nSaved {len(chunks)} chunk embeddings to {OUTPUT_PATH} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
