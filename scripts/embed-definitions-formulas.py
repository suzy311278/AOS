#!/usr/bin/env python3
"""
Embed Definitions and Formulas for Semantic Search
====================================================
Creates separate embedding indexes for definitions and formulas that can be
searched alongside chunk embeddings and merged via RRF.

Output:
  - definitions-embeddings.json (embedded definitions)
  - formulas-embeddings.json (embedded formulas with variable context)
"""

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
DEFINITIONS_PATH = os.path.join(INDEX_DIR, "definitions-index.json")
FORMULAS_PATH = os.path.join(INDEX_DIR, "formulas-index.json")
DEFINITIONS_EMB_PATH = os.path.join(INDEX_DIR, "definitions-embeddings.json")
FORMULAS_EMB_PATH = os.path.join(INDEX_DIR, "formulas-embeddings.json")

EMBED_MODEL = "voyage-context-3"  # Same model as chunks for comparable embeddings


def embed_batch(texts: list[str], input_type: str = "document") -> list[list[float]]:
    """
    Embed texts using Voyage AI voyage-context-3.
    Each text becomes its own single-element "document" for contextualized embedding.
    This keeps embeddings in the same vector space as chunk embeddings.
    """
    import voyageai

    api_key = os.environ.get("VOYAGE_API_KEY")
    if not api_key:
        raise RuntimeError("VOYAGE_API_KEY not set")

    vo = voyageai.Client(api_key=api_key)

    all_embeddings = []
    batch_size = 50  # Conservative batch size for context-3

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]

        # Each text is its own "document" with a single chunk
        # This is how voyage-context-3 works - nested lists
        inputs = [[text] for text in batch]

        result = vo.contextualized_embed(
            inputs=inputs,
            model=EMBED_MODEL,
            input_type=input_type
        )

        # Extract the single embedding from each document result
        for doc_result in result.results:
            all_embeddings.append(doc_result.embeddings[0])

        if i + batch_size < len(texts):
            time.sleep(0.3)  # Rate limit courtesy

        print(f"    Embedded {min(i + batch_size, len(texts))}/{len(texts)}")

    return all_embeddings


def embed_definitions():
    """Embed definitions with rich context for semantic search."""
    print("Loading definitions...")
    with open(DEFINITIONS_PATH) as f:
        data = json.load(f)

    definitions = data["definitions"]
    print(f"  Found {len(definitions)} definitions")

    # Build embed texts with rich context
    embed_texts = []
    for d in definitions:
        # Include term prominently + definition + source context
        embed_text = (
            f"Definition of '{d['term']}': {d['definition']} "
            f"(Source: {d['source_title']}, {d['section']})"
        )
        embed_texts.append(embed_text[:2000])  # Cap length

    print(f"Embedding {len(embed_texts)} definitions with {EMBED_MODEL}...")
    embeddings = embed_batch(embed_texts, input_type="document")

    # Build output with embeddings
    output_definitions = []
    for i, d in enumerate(definitions):
        output_definitions.append({
            "term": d["term"],
            "definition": d["definition"],
            "source_doc": d["source_doc"],
            "source_title": d["source_title"],
            "course": d["course"],
            "section": d["section"],
            "page": d["page"],
            "embed_text": embed_texts[i][:200] + "...",  # Preview only
            "embedding": embeddings[i]
        })

    output = {
        "model": EMBED_MODEL,
        "dimensions": len(embeddings[0]) if embeddings else 0,
        "count": len(output_definitions),
        "indexed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "definitions": output_definitions
    }

    with open(DEFINITIONS_EMB_PATH, "w") as f:
        json.dump(output, f)

    size_mb = os.path.getsize(DEFINITIONS_EMB_PATH) / 1024 / 1024
    print(f"Saved: {DEFINITIONS_EMB_PATH} ({size_mb:.1f} MB)")
    print(f"  {len(output_definitions)} definitions, {output['dimensions']} dimensions")


def embed_formulas():
    """Embed formulas with variable context for semantic search."""
    print("\nLoading formulas...")
    with open(FORMULAS_PATH) as f:
        data = json.load(f)

    formulas = data["formulas"]
    print(f"  Found {len(formulas)} formulas")

    # Build embed texts with rich context including variables
    embed_texts = []
    for f in formulas:
        # Build variable descriptions
        var_parts = []
        for v in f.get("variables", []):
            var_parts.append(f"{v['symbol']} means {v['description']}")
        var_text = ". ".join(var_parts) if var_parts else ""

        # Include context, formula, and variables
        context = f.get("context", "")
        section = f.get("section", "")

        embed_text = (
            f"Formula from {f['source_title']}, section '{section}'. "
            f"{context} "
            f"Equation: {f['formula'][:300]} "
            f"Variables: {var_text}"
        ).strip()

        embed_texts.append(embed_text[:2000])  # Cap length

    print(f"Embedding {len(embed_texts)} formulas with {EMBED_MODEL}...")
    embeddings = embed_batch(embed_texts, input_type="document")

    # Build output with embeddings
    output_formulas = []
    for i, f in enumerate(formulas):
        output_formulas.append({
            "formula": f["formula"][:500],
            "equation_number": f.get("equation_number"),
            "variables": f.get("variables", []),
            "source_doc": f["source_doc"],
            "source_title": f["source_title"],
            "course": f["course"],
            "section": f["section"],
            "page": f["page"],
            "context": f.get("context", ""),
            "embed_text": embed_texts[i][:200] + "...",  # Preview only
            "embedding": embeddings[i]
        })

    output = {
        "model": EMBED_MODEL,
        "dimensions": len(embeddings[0]) if embeddings else 0,
        "count": len(output_formulas),
        "indexed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "formulas": output_formulas
    }

    with open(FORMULAS_EMB_PATH, "w") as f:
        json.dump(output, f)

    size_mb = os.path.getsize(FORMULAS_EMB_PATH) / 1024 / 1024
    print(f"Saved: {FORMULAS_EMB_PATH} ({size_mb:.1f} MB)")
    print(f"  {len(output_formulas)} formulas, {output['dimensions']} dimensions")


def main():
    print("=" * 60)
    print("Embedding Definitions and Formulas for Semantic Search")
    print("=" * 60)

    if not os.path.exists(DEFINITIONS_PATH):
        print(f"Error: {DEFINITIONS_PATH} not found. Run extract-definitions.py first.")
        return

    if not os.path.exists(FORMULAS_PATH):
        print(f"Error: {FORMULAS_PATH} not found. Run extract-formulas.py first.")
        return

    embed_definitions()
    embed_formulas()

    print("\nDone! Definitions and formulas are now searchable via semantic embeddings.")


if __name__ == "__main__":
    main()
