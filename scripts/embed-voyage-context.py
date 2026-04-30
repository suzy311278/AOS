#!/usr/bin/env python3
"""
Voyage Context-3 Embedding Script for SustainIQ Test
=====================================================
Embeds sections from Docling-indexed documents using voyage-context-3.

voyage-context-3 embeds chunks with native context awareness - no need for
manual hierarchy prefixes. This tests whether we can skip LLM-generated
summaries and technical indexes entirely.

Usage:
  python3 scripts/embed-voyage-context.py
  python3 scripts/embed-voyage-context.py --stats  # Show stats only
"""

import argparse
import json
import os
import sys
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

INDEX_DIR = "data/page-indexes-docling-test"
OUTPUT_PATH = os.path.join(INDEX_DIR, "embeddings-voyage-context3.json")

# Voyage settings
EMBED_MODEL = "voyage-context-3"  # Context-aware embeddings
CHUNK_SIZE = 2000  # Characters per chunk (~500 tokens)
CHUNK_OVERLAP = 300

# voyage-context-3 limits (per request):
# - 32K tokens per document (inner list)
# - 120K tokens total across all inputs
# - 16K chunks total
# - 1000 inputs max
# We split docs >28K tokens into groups, then batch groups up to 100K total tokens
MAX_TOKENS_PER_DOC = 22000  # More conservative headroom under 32K limit (tokenizer is denser than 4 chars/token)
MAX_TOKENS_PER_REQUEST = 90000  # Headroom under 120K limit
CHARS_PER_TOKEN = 3  # More realistic estimate for technical text


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """
    Semantic chunking: split text respecting paragraph, sentence, and table boundaries.

    Priority order for splitting:
    1. Paragraph boundaries (\\n\\n)
    2. Sentence boundaries (. ! ?)
    3. Line boundaries (\\n) - last resort

    Tables (lines starting with |) are kept as atomic units.
    """
    if not text or len(text) <= chunk_size:
        return [text] if text else []

    # Step 1: Identify semantic units (paragraphs, tables as single units)
    units = []
    current_unit = []
    in_table = False

    for line in text.split('\n'):
        line_stripped = line.strip()
        is_table_line = line_stripped.startswith('|')

        if is_table_line and not in_table:
            # Starting a table - flush previous unit
            if current_unit:
                units.append('\n'.join(current_unit))
                current_unit = []
            in_table = True
            current_unit.append(line)
        elif not is_table_line and in_table:
            # Ending a table - flush as one unit
            units.append('\n'.join(current_unit))
            current_unit = [line] if line_stripped else []
            in_table = False
        elif not line_stripped and current_unit and not in_table:
            # Paragraph break (blank line)
            units.append('\n'.join(current_unit))
            current_unit = []
        else:
            current_unit.append(line)

    if current_unit:
        units.append('\n'.join(current_unit))

    # Filter out empty units
    units = [u for u in units if u.strip()]

    # Step 2: Group units into chunks respecting size limit
    chunks = []
    current_chunk = []
    current_len = 0

    def split_large_unit(unit: str) -> list[str]:
        """Split a single unit that exceeds chunk_size, preferring sentence boundaries."""
        if len(unit) <= chunk_size:
            return [unit]

        result = []
        start = 0
        while start < len(unit):
            end = start + chunk_size
            if end >= len(unit):
                result.append(unit[start:].strip())
                break

            # Try to find sentence boundary in last 20% of chunk
            search_start = end - int(chunk_size * 0.2)
            best_break = -1
            for sep in ['. ', '! ', '? ', '.\n', '!\n', '?\n']:
                pos = unit.rfind(sep, search_start, end)
                if pos > best_break:
                    best_break = pos + len(sep)

            # Fall back to line break
            if best_break < search_start:
                pos = unit.rfind('\n', search_start, end)
                if pos > search_start:
                    best_break = pos + 1

            # Last resort: hard break
            if best_break < search_start:
                best_break = end

            chunk = unit[start:best_break].strip()
            if chunk:
                result.append(chunk)

            # Overlap: go back a bit for continuity
            start = max(best_break - overlap, best_break - 1)

        return result

    for unit in units:
        unit_len = len(unit)

        # If a single unit is too large, split it
        if unit_len > chunk_size:
            # Flush current chunk first
            if current_chunk:
                chunks.append('\n\n'.join(current_chunk))
                current_chunk = []
                current_len = 0
            # Split the large unit
            chunks.extend(split_large_unit(unit))
            continue

        # If adding this unit would exceed size, flush and start fresh
        if current_len + unit_len > chunk_size and current_chunk:
            chunks.append('\n\n'.join(current_chunk))
            # Keep the last unit for overlap if small enough
            if len(current_chunk[-1]) < overlap:
                current_chunk = [current_chunk[-1]]
                current_len = len(current_chunk[0])
            else:
                current_chunk = []
                current_len = 0

        current_chunk.append(unit)
        current_len += unit_len + 2  # +2 for \n\n separator

    if current_chunk:
        chunks.append('\n\n'.join(current_chunk))

    # Filter tiny chunks
    chunks = [c for c in chunks if len(c.strip()) > 50]

    return chunks if chunks else [text]


def collect_sections() -> list[dict]:
    """Collect all leaf sections from Docling test indexes."""
    sections = []

    for root, dirs, files in os.walk(INDEX_DIR):
        for fname in files:
            if not fname.endswith(".json") or fname.endswith("_light.json") or fname == "catalog.json" or fname.startswith("embeddings"):
                continue

            path = os.path.join(root, fname)
            try:
                with open(path) as f:
                    tree = json.load(f)
            except:
                continue

            doc_title = tree.get("title", "Unknown")
            course = os.path.basename(root)
            doc_id = f"{course}/{fname.replace('.json', '')}"

            def walk(node: dict, parent_titles: list[str]):
                is_leaf = not node.get("children") or len(node["children"]) == 0
                text = node.get("text", "")

                if is_leaf and text.strip():
                    # Use parent_titles from node if available (from indexer), else use passed-in
                    node_parents = node.get("parent_titles", parent_titles)

                    # voyage-context-3 handles context automatically by seeing all
                    # chunks from the same document together. We just pass raw text.
                    # Chunk the text into smaller pieces
                    chunks = chunk_text(text)

                    for i, chunk in enumerate(chunks):
                        sections.append({
                            "doc_id": doc_id,
                            "doc_title": doc_title,
                            "course": course,
                            "node_id": node["node_id"],
                            "section_title": node["title"],
                            "parent_titles": node_parents,  # For metadata + BM25
                            "start_page": node.get("start_page", 1),
                            "end_page": node.get("end_page", 1),
                            "chunk_index": i,
                            "total_chunks": len(chunks),
                            "text": chunk,  # Raw chunk text - this is what we embed
                        })

                for child in node.get("children", []):
                    walk(child, parent_titles + [node["title"]])

            for child in tree.get("children", []):
                walk(child, [])

    return sections


def embed_document_chunks(doc_chunks: list[list[str]], max_retries: int = 5) -> list[list[list[float]]]:
    """
    Embed document chunks using Voyage AI voyage-context-3 contextualized embeddings.

    Args:
        doc_chunks: List of documents, where each document is a list of chunk texts.
                    e.g., [["doc1_chunk1", "doc1_chunk2"], ["doc2_chunk1", "doc2_chunk2"]]

    Returns:
        List of embeddings per document, matching the input structure.
        e.g., [[[emb1], [emb2]], [[emb3], [emb4]]]
    """
    import voyageai

    api_key = os.environ.get("VOYAGE_API_KEY")
    if not api_key:
        raise RuntimeError("VOYAGE_API_KEY not set in .env.local")

    vo = voyageai.Client(api_key=api_key)

    for attempt in range(max_retries):
        try:
            # voyage-context-3 uses contextualized_embed with nested list structure
            # Each inner list = chunks from one document, embedded with full doc context
            result = vo.contextualized_embed(
                inputs=doc_chunks,
                model=EMBED_MODEL,
                input_type="document"
            )
            # result.results is a list of ContextualizedEmbeddingsResult objects
            # Each has .embeddings (list of embeddings for that document's chunks)
            return [doc_result.embeddings for doc_result in result.results]

        except Exception as e:
            err = str(e)
            if "rate" in err.lower() or "429" in err:
                wait = 2 ** attempt  # Exponential backoff
                print(f"\n  Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            if attempt < max_retries - 1:
                print(f"\n  Error: {err[:80]}, retrying...")
                time.sleep(2)
                continue
            raise RuntimeError(f"Voyage AI error after {max_retries} retries: {err}")

    raise RuntimeError("embed_document_chunks failed after all retries")


def build_embed_prefix(section: dict, part_num: int = None, total_parts: int = None) -> str:
    """Build a document identifier prefix for embedding."""
    doc_title = section["doc_title"]
    section_title = section["section_title"]

    # Build hierarchy if available
    parent_titles = section.get("parent_titles", [])
    if parent_titles:
        hierarchy = " > ".join(parent_titles + [section_title])
    else:
        hierarchy = section_title

    # Add part indicator for split documents
    if part_num is not None and total_parts is not None and total_parts > 1:
        return f"[{doc_title} | {hierarchy} | Part {part_num}/{total_parts}]\n\n"
    else:
        return f"[{doc_title} | {hierarchy}]\n\n"


def estimate_tokens_with_prefix(sections: list[dict], part_num: int = None, total_parts: int = None) -> int:
    """Estimate total tokens including prefix overhead."""
    total = 0
    for section in sections:
        prefix = build_embed_prefix(section, part_num, total_parts)
        total += (len(prefix) + len(section["text"])) // CHARS_PER_TOKEN
    return total


def split_doc_into_groups(sections: list[dict], max_tokens: int = MAX_TOKENS_PER_DOC) -> list[list[dict]]:
    """Split a document's sections into groups that fit within the token limit."""
    if not sections:
        return []

    # First pass: estimate total tokens to determine number of parts
    total_tokens = sum((len(s["text"]) + 100) // CHARS_PER_TOKEN for s in sections)  # +100 for prefix estimate
    estimated_parts = max(1, (total_tokens + max_tokens - 1) // max_tokens)

    groups = []
    current_group = []
    current_tokens = 0

    for section in sections:
        # Include prefix in token estimate
        prefix_len = 100  # Approximate prefix length
        section_tokens = (len(section["text"]) + prefix_len) // CHARS_PER_TOKEN

        if current_tokens + section_tokens > max_tokens and current_group:
            # Start a new group
            groups.append(current_group)
            current_group = [section]
            current_tokens = section_tokens
        else:
            current_group.append(section)
            current_tokens += section_tokens

    if current_group:
        groups.append(current_group)

    return groups


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stats", action="store_true", help="Show stats only")
    args = parser.parse_args()

    print("Collecting sections from Docling test indexes...")
    sections = collect_sections()

    if not sections:
        print("No sections found. Run index-docling-zero-llm.py --batch first.")
        return

    # Group sections by document
    docs_map = {}
    for s in sections:
        doc_id = s["doc_id"]
        if doc_id not in docs_map:
            docs_map[doc_id] = []
        docs_map[doc_id].append(s)

    doc_ids = list(docs_map.keys())
    print(f"Found {len(sections)} chunks from {len(doc_ids)} documents")

    if args.stats:
        print("\nChunks per document:")
        for doc_id in sorted(doc_ids):
            chunks = len(docs_map[doc_id])
            tokens = sum(len(s["text"]) for s in docs_map[doc_id]) // CHARS_PER_TOKEN
            groups = len(split_doc_into_groups(docs_map[doc_id]))
            marker = " [SPLIT]" if groups > 1 else ""
            print(f"  {doc_id}: {chunks} chunks, ~{tokens:,} tokens, {groups} group(s){marker}")
        return

    print(f"\nEmbedding with {EMBED_MODEL} (contextualized)...")
    print(f"Limits: {MAX_TOKENS_PER_DOC:,} tokens/doc, {MAX_TOKENS_PER_REQUEST:,} tokens/request")
    print("Large documents will be split into groups.\n")

    # Split large documents into groups that fit within 32K token limit
    # Each group becomes a separate "input" to the API
    all_groups = []  # List of (doc_id, group_index, total_groups, sections_list)
    for doc_id in doc_ids:
        doc_sections = docs_map[doc_id]
        groups = split_doc_into_groups(doc_sections)
        for i, group in enumerate(groups):
            all_groups.append((doc_id, i, len(groups), group))

    split_docs = sum(1 for doc_id in doc_ids if len(split_doc_into_groups(docs_map[doc_id])) > 1)
    print(f"Split into {len(all_groups)} groups (from {len(doc_ids)} documents, {split_docs} needed splitting)")

    # Now batch groups by total token count
    all_embeddings = []  # List of (doc_id, group_idx, total_groups, embeddings_list)
    total_tokens = 0

    batch_inputs = []
    batch_meta = []  # (doc_id, group_idx, total_groups, num_chunks)
    batch_tokens = 0
    batch_num = 0

    for doc_id, group_idx, total_groups, group_sections in all_groups:
        # Build embed_text WITH prefix for each chunk
        group_texts = []
        for section in group_sections:
            prefix = build_embed_prefix(section, group_idx + 1, total_groups)
            embed_text = prefix + section["text"]
            group_texts.append(embed_text)

        group_tokens = sum(len(t) for t in group_texts) // CHARS_PER_TOKEN

        # If adding this group exceeds request limit, flush the batch
        if batch_tokens + group_tokens > MAX_TOKENS_PER_REQUEST and batch_inputs:
            batch_num += 1
            print(f"  Batch {batch_num}: {len(batch_inputs)} groups, {sum(m[3] for m in batch_meta)} chunks (~{batch_tokens:,} tokens)")

            embeddings_list = embed_document_chunks(batch_inputs)
            for i, meta in enumerate(batch_meta):
                all_embeddings.append((meta[0], meta[1], meta[2], embeddings_list[i]))

            total_tokens += batch_tokens
            batch_inputs = []
            batch_meta = []
            batch_tokens = 0
            time.sleep(0.3)  # Small delay between batches

        batch_inputs.append(group_texts)
        batch_meta.append((doc_id, group_idx, total_groups, len(group_texts)))
        batch_tokens += group_tokens

    # Flush remaining batch
    if batch_inputs:
        batch_num += 1
        print(f"  Batch {batch_num}: {len(batch_inputs)} groups, {sum(m[3] for m in batch_meta)} chunks (~{batch_tokens:,} tokens)")

        embeddings_list = embed_document_chunks(batch_inputs)
        for i, meta in enumerate(batch_meta):
            all_embeddings.append((meta[0], meta[1], meta[2], embeddings_list[i]))

        total_tokens += batch_tokens

    # Reassemble embeddings by document and group order
    # Map: doc_id -> group_idx -> (total_groups, embeddings)
    emb_map = {}
    for doc_id, group_idx, total_groups, embs in all_embeddings:
        if doc_id not in emb_map:
            emb_map[doc_id] = {}
        emb_map[doc_id][group_idx] = (total_groups, embs)

    # Build output structure
    output_sections = []
    for doc_id in doc_ids:
        doc_sections = docs_map[doc_id]
        groups = split_doc_into_groups(doc_sections)

        for group_idx, group in enumerate(groups):
            total_groups, group_embs = emb_map[doc_id][group_idx]
            for i, section in enumerate(group):
                # bm25_text includes doc title + parent hierarchy for keyword search
                parent_str = " > ".join(section.get('parent_titles', []))
                if parent_str:
                    bm25_text = f"{section['doc_title']} | {parent_str} > {section['section_title']} | {section['text']}"
                else:
                    bm25_text = f"{section['doc_title']} | {section['section_title']} | {section['text']}"

                output_sections.append({
                    "doc_id": section["doc_id"],
                    "doc_title": section["doc_title"],
                    "course": section["course"],
                    "node_id": section["node_id"],
                    "section_title": section["section_title"],
                    "parent_titles": section.get("parent_titles", []),
                    "start_page": section["start_page"],
                    "end_page": section["end_page"],
                    "chunk_index": section["chunk_index"],
                    "total_chunks": section["total_chunks"],
                    "text": section["text"],  # Clean text for display
                    "bm25_text": bm25_text,  # Includes doc title + hierarchy
                    "embedding": group_embs[i]
                })

    output = {
        "model": EMBED_MODEL,
        "dimensions": len(output_sections[0]["embedding"]) if output_sections else 0,
        "count": len(output_sections),
        "total_tokens_approx": total_tokens,
        "indexed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "sections": output_sections
    }

    # Save
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f)

    size_mb = os.path.getsize(OUTPUT_PATH) / 1024 / 1024
    print(f"\nSaved: {OUTPUT_PATH} ({size_mb:.1f} MB)")
    print(f"Total: {len(output_sections)} chunks, {output['dimensions']} dimensions")
    print(f"Approx tokens used: {total_tokens:,}")


if __name__ == "__main__":
    main()
