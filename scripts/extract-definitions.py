#!/usr/bin/env python3
"""
Definition Extractor for SustainIQ
===================================
Extracts definitions from indexed documents to create a searchable definitions index.

Sources:
1. Explicit DEFINITIONS sections (children are term definitions)
2. Inline patterns: "'X' means...", "X refers to...", "X is defined as..."
3. Glossary sections

Output: data/page-indexes-docling-test/definitions-index.json
"""

import json
import os
import re
from pathlib import Path

INDEX_DIR = "data/page-indexes-docling-test"
OUTPUT_PATH = os.path.join(INDEX_DIR, "definitions-index.json")

# Patterns for inline definitions
DEFINITION_PATTERNS = [
    # "Term" means/refers to/is defined as...
    r'["\']([^"\']+)["\'][\s\n]+(means|refers to|is defined as|shall mean|shall refer to)[\s\n]+(.+?)(?:\.|$)',
    # Term: definition (glossary style)
    r'^([A-Z][a-zA-Z\s\-]+):\s+(.+?)(?:\n|$)',
    # (term) definition in parentheses context
    r'\(([a-zA-Z\s\-]+)\)\s+(?:means|refers to)\s+(.+?)(?:\.|$)',
]


def is_valid_term(term: str) -> bool:
    """Filter out noise that isn't a real definition term."""
    term_lower = term.lower().strip()

    # Too short or too long
    if len(term) < 2 or len(term) > 80:
        return False

    # Starts with noise words
    noise_starts = ['and', 'or', 'the', 'a ', 'an ', 'if ', 'when', 'where', 'how', 'what', 'which',
                    'ghg emission', 'carbon stock', 'this', 'that', 'these', 'it ', 'for ']
    if any(term_lower.startswith(n) for n in noise_starts):
        return False

    # Contains formula-like content
    if re.search(r'[=×÷∑∏|]', term):
        return False

    # Is all uppercase sentence (likely a heading, not a term)
    if term.isupper() and len(term.split()) > 4:
        return False

    # Looks like a sentence
    if term.endswith(':') or term.endswith('.'):
        return False

    return True


def extract_from_definitions_section(node: dict, doc_info: dict) -> list[dict]:
    """Extract definitions from a DEFINITIONS section where children are individual terms."""
    definitions = []

    for child in node.get("children", []):
        term = child.get("title", "").strip()
        definition_text = child.get("text", "").strip()

        if term and definition_text:
            # Clean up the term (remove numbering if present)
            term_clean = re.sub(r'^\d+\.\d*\s*', '', term).strip()

            # Validate the term
            if not is_valid_term(term_clean):
                continue

            definitions.append({
                "term": term_clean,
                "definition": definition_text[:500],
                "source_doc": doc_info["doc_id"],
                "source_title": doc_info["doc_title"],
                "course": doc_info["course"],
                "section": node.get("title", "Definitions"),
                "page": child.get("start_page", 1),
                "extraction_method": "definitions_section"
            })

    return definitions


def extract_inline_definitions(text: str, doc_info: dict, section_title: str, page: int) -> list[dict]:
    """Extract inline definitions from text using regex patterns."""
    definitions = []

    for pattern in DEFINITION_PATTERNS:
        matches = re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE)
        for match in matches:
            groups = match.groups()
            if len(groups) >= 2:
                term = groups[0].strip()
                # Definition is either group 2 (for 3-group patterns) or group 1
                definition = groups[-1].strip() if len(groups) > 2 else groups[1].strip()

                # Validate the term
                if not is_valid_term(term):
                    continue

                # Filter short definitions
                if len(definition) < 15:
                    continue

                definitions.append({
                    "term": term,
                    "definition": definition[:500],  # Cap length
                    "source_doc": doc_info["doc_id"],
                    "source_title": doc_info["doc_title"],
                    "course": doc_info["course"],
                    "section": section_title,
                    "page": page,
                    "extraction_method": "inline_pattern"
                })

    return definitions


def walk_tree(node: dict, doc_info: dict, definitions: list):
    """Recursively walk the document tree extracting definitions."""
    title = node.get("title", "").upper()

    # Check if this is a definitions section
    if any(kw in title for kw in ["DEFINITION", "GLOSSARY", "TERMINOLOGY", "KEY TERMS"]):
        if node.get("children"):
            # Children are likely individual definitions
            defs = extract_from_definitions_section(node, doc_info)
            definitions.extend(defs)
            return  # Don't recurse further

    # Extract inline definitions from text
    text = node.get("text", "")
    if text:
        inline_defs = extract_inline_definitions(
            text, doc_info,
            node.get("title", "Unknown"),
            node.get("start_page", 1)
        )
        definitions.extend(inline_defs)

    # Recurse into children
    for child in node.get("children", []):
        walk_tree(child, doc_info, definitions)


def deduplicate_definitions(definitions: list) -> list:
    """Deduplicate definitions, preferring definitions_section over inline."""
    seen = {}  # term_lower -> best definition

    for d in definitions:
        term_lower = d["term"].lower()

        if term_lower not in seen:
            seen[term_lower] = d
        else:
            # Prefer definitions_section extraction
            existing = seen[term_lower]
            if d["extraction_method"] == "definitions_section" and existing["extraction_method"] != "definitions_section":
                seen[term_lower] = d
            # Prefer longer definitions
            elif len(d["definition"]) > len(existing["definition"]) * 1.5:
                seen[term_lower] = d

    return list(seen.values())


def main():
    print("Extracting definitions from Docling indexes...")

    all_definitions = []
    doc_count = 0

    for root, dirs, files in os.walk(INDEX_DIR):
        for fname in files:
            if not fname.endswith(".json"):
                continue
            if fname.endswith("_light.json") or fname == "catalog.json" or fname.startswith("embeddings") or fname.startswith("definitions") or fname.startswith("formulas"):
                continue

            path = os.path.join(root, fname)
            try:
                with open(path) as f:
                    tree = json.load(f)
            except:
                continue

            course = os.path.basename(root)
            doc_id = f"{course}/{fname.replace('.json', '')}"

            doc_info = {
                "doc_id": doc_id,
                "doc_title": tree.get("title", "Unknown"),
                "course": course
            }

            doc_definitions = []
            for child in tree.get("children", []):
                walk_tree(child, doc_info, doc_definitions)

            if doc_definitions:
                doc_count += 1
                all_definitions.extend(doc_definitions)
                print(f"  {doc_id}: {len(doc_definitions)} definitions")

    # Deduplicate
    unique_definitions = deduplicate_definitions(all_definitions)

    # Sort by term
    unique_definitions.sort(key=lambda d: d["term"].lower())

    # Build output
    output = {
        "count": len(unique_definitions),
        "source_documents": doc_count,
        "definitions": unique_definitions
    }

    # Save
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nExtracted {len(unique_definitions)} unique definitions from {doc_count} documents")
    print(f"Saved to: {OUTPUT_PATH}")

    # Show sample
    print("\nSample definitions:")
    for d in unique_definitions[:5]:
        print(f"  {d['term']}: {d['definition'][:80]}...")


if __name__ == "__main__":
    main()
