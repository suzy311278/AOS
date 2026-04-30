#!/usr/bin/env python3
"""
Formula Extractor for SustainIQ
================================
Extracts formulas and their variable definitions from indexed documents.

Patterns detected:
1. Equations with = and mathematical symbols
2. "Where:" blocks that define variables
3. Numbered equations (Equation 1, Eq. 3.1)
4. Formula sections in methodologies

Output: data/page-indexes-docling-test/formulas-index.json
"""

import json
import os
import re
from pathlib import Path

INDEX_DIR = "data/page-indexes-docling-test"
OUTPUT_PATH = os.path.join(INDEX_DIR, "formulas-index.json")

# Patterns for formula detection
EQUATION_LABEL_PATTERN = r'(?:Equation|Eq\.?)\s*(\d+(?:\.\d+)*)'
FORMULA_LINE_PATTERN = r'^.*[=×÷∑∏∫√].*$'
WHERE_BLOCK_START = r'^Where:?\s*$'


def extract_formulas_from_section(text: str, section_title: str, doc_info: dict, page: int) -> list[dict]:
    """Extract formulas and their variable definitions from section text."""
    formulas = []
    lines = text.split('\n')

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Check for equation label
        eq_match = re.search(EQUATION_LABEL_PATTERN, line, re.IGNORECASE)

        # Check if line looks like a formula (has = and math symbols)
        is_formula_line = bool(re.search(r'[=]', line)) and (
            bool(re.search(r'[×÷∑∏∫√±≤≥∆αβγδ]', line)) or
            bool(re.search(r'\b[A-Z]\s*[=×+\-/]', line)) or  # Single letter variables
            bool(re.search(r'_\{?[a-z,\d]+\}?', line))  # Subscripts
        )

        if is_formula_line or eq_match:
            formula_data = {
                "formula": line,
                "equation_number": eq_match.group(1) if eq_match else None,
                "variables": [],
                "source_doc": doc_info["doc_id"],
                "source_title": doc_info["doc_title"],
                "course": doc_info["course"],
                "section": section_title,
                "page": page,
                "context": ""
            }

            # Look for preceding context (1-2 lines before)
            context_lines = []
            for j in range(max(0, i-2), i):
                ctx_line = lines[j].strip()
                if ctx_line and not re.search(r'[=×÷]', ctx_line):
                    context_lines.append(ctx_line)
            formula_data["context"] = " ".join(context_lines)[-200:]

            # Look for "Where:" block after the formula
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1  # Skip blank lines

            if j < len(lines) and re.match(WHERE_BLOCK_START, lines[j].strip(), re.IGNORECASE):
                j += 1  # Move past "Where:"
                variables = []

                # Collect variable definitions until we hit a blank line or new section
                while j < len(lines):
                    var_line = lines[j].strip()
                    if not var_line:
                        # Blank line might end the where block, or might be spacing
                        if j + 1 < len(lines) and re.match(r'^[A-Za-z_∆]', lines[j+1].strip()):
                            j += 1
                            continue
                        break

                    # Check if this looks like a variable definition: "X = description" or "X: description"
                    var_match = re.match(r'^([A-Za-z_∆][A-Za-z_\d,\s]*?)\s*[=:]\s*(.+)$', var_line)
                    if var_match:
                        var_name = var_match.group(1).strip()
                        var_desc = var_match.group(2).strip()
                        variables.append({
                            "symbol": var_name,
                            "description": var_desc[:300]
                        })
                    elif var_line.startswith('|') or var_line.startswith('-'):
                        # Table format variable definitions
                        # Try to parse table rows
                        cells = [c.strip() for c in var_line.split('|') if c.strip()]
                        if len(cells) >= 2:
                            variables.append({
                                "symbol": cells[0],
                                "description": cells[1][:300]
                            })
                    else:
                        # Line doesn't look like a variable definition, might be end of block
                        # But could also be continuation - check if next line is a variable
                        if j + 1 < len(lines) and re.match(r'^[A-Za-z_∆]', lines[j+1].strip()):
                            pass  # Continue
                        else:
                            break

                    j += 1

                formula_data["variables"] = variables
                i = j  # Skip past the Where block

            # Only keep if it looks substantive
            if len(formula_data["formula"]) > 5:
                formulas.append(formula_data)

        i += 1

    return formulas


def extract_table_formulas(text: str, section_title: str, doc_info: dict, page: int) -> list[dict]:
    """Extract formulas from markdown tables (common in PCAF, GHG Protocol)."""
    formulas = []

    # Look for table rows containing formulas
    table_rows = re.findall(r'\|([^|]+)\|([^|]+)\|', text)
    for row in table_rows:
        cell1, cell2 = row[0].strip(), row[1].strip()

        # Check if either cell contains a formula
        for cell in [cell1, cell2]:
            if '=' in cell and len(cell) > 10:
                # This might be a formula
                if re.search(r'[×÷∑/\*]', cell) or re.search(r'\b[A-Z]\s*[=×]', cell):
                    other_cell = cell2 if cell == cell1 else cell1
                    formulas.append({
                        "formula": cell,
                        "equation_number": None,
                        "variables": [],
                        "source_doc": doc_info["doc_id"],
                        "source_title": doc_info["doc_title"],
                        "course": doc_info["course"],
                        "section": section_title,
                        "page": page,
                        "context": other_cell[:200]
                    })

    return formulas


def parse_variable_table(text: str) -> list[dict]:
    """Parse variables from markdown table format."""
    variables = []

    # Match table rows: | VAR | = | description |
    rows = re.findall(r'\|\s*([^|]+?)\s*\|\s*=\s*\|\s*([^|]+?)\s*\|', text)
    for var, desc in rows:
        var = var.strip()
        desc = desc.strip()
        if var and desc and len(var) < 50:  # Filter noise
            variables.append({
                "symbol": var,
                "description": desc[:300]
            })

    # Also try line-by-line format: VAR = description
    for line in text.split('\n'):
        line = line.strip()
        if line.startswith('|'):
            continue  # Skip table rows, already parsed
        match = re.match(r'^([A-Za-z_∆][A-Za-z_\d\s,()]*?)\s*=\s*(.+)$', line)
        if match:
            var = match.group(1).strip()
            desc = match.group(2).strip()
            if var and desc and len(var) < 50:
                variables.append({
                    "symbol": var,
                    "description": desc[:300]
                })

    return variables


def walk_tree_with_context(node: dict, doc_info: dict, formulas: list, prev_sibling: dict = None):
    """
    Walk tree, linking Where: sections to preceding formula sections.
    """
    text = node.get("text", "")
    section_title = node.get("title", "Unknown")
    page = node.get("start_page", 1)

    # Check if this is a "Where:" section
    if section_title.strip().lower().startswith("where"):
        # Parse variables from this section
        variables = parse_variable_table(text)

        # If we have a preceding sibling with a formula, link them
        if prev_sibling and variables:
            prev_text = prev_sibling.get("text", "")
            prev_title = prev_sibling.get("title", "")

            # Check if prev section has a formula
            if '=' in prev_text and len(prev_text) < 2000:
                # Create formula entry from prev section + these variables
                eq_match = re.search(EQUATION_LABEL_PATTERN, prev_text, re.IGNORECASE)

                formulas.append({
                    "formula": prev_text[:500],
                    "equation_number": eq_match.group(1) if eq_match else None,
                    "variables": variables,
                    "source_doc": doc_info["doc_id"],
                    "source_title": doc_info["doc_title"],
                    "course": doc_info["course"],
                    "section": prev_title,
                    "page": prev_sibling.get("start_page", page),
                    "context": f"Variables defined in: {section_title}"
                })
                return  # Don't double-process

    # Standard extraction for non-Where sections
    if text:
        section_formulas = extract_formulas_from_section(text, section_title, doc_info, page)
        formulas.extend(section_formulas)

        table_formulas = extract_table_formulas(text, section_title, doc_info, page)
        formulas.extend(table_formulas)

    # Recurse into children, tracking siblings
    children = node.get("children", [])
    for i, child in enumerate(children):
        prev = children[i-1] if i > 0 else None
        walk_tree_with_context(child, doc_info, formulas, prev)


def walk_tree(node: dict, doc_info: dict, formulas: list):
    """Entry point - delegates to context-aware walker."""
    walk_tree_with_context(node, doc_info, formulas, None)


def deduplicate_formulas(formulas: list) -> list:
    """Deduplicate formulas, keeping the one with most variable definitions."""
    seen = {}  # formula_normalized -> best formula

    for f in formulas:
        # Normalize formula for comparison
        formula_norm = re.sub(r'\s+', '', f["formula"].lower())

        if formula_norm not in seen:
            seen[formula_norm] = f
        else:
            existing = seen[formula_norm]
            # Prefer the one with more variables
            if len(f["variables"]) > len(existing["variables"]):
                seen[formula_norm] = f
            # Or prefer the one with equation number
            elif f["equation_number"] and not existing["equation_number"]:
                seen[formula_norm] = f

    return list(seen.values())


def main():
    print("Extracting formulas from Docling indexes...")

    all_formulas = []
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

            doc_formulas = []
            for child in tree.get("children", []):
                walk_tree(child, doc_info, doc_formulas)

            if doc_formulas:
                doc_count += 1
                all_formulas.extend(doc_formulas)
                print(f"  {doc_id}: {len(doc_formulas)} formulas")

    # Deduplicate
    unique_formulas = deduplicate_formulas(all_formulas)

    # Sort by source doc and equation number
    unique_formulas.sort(key=lambda f: (f["source_doc"], f["equation_number"] or "zzz"))

    # Build output
    output = {
        "count": len(unique_formulas),
        "source_documents": doc_count,
        "formulas": unique_formulas
    }

    # Save
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nExtracted {len(unique_formulas)} unique formulas from {doc_count} documents")
    print(f"Saved to: {OUTPUT_PATH}")

    # Show sample with variables
    print("\nSample formulas with variables:")
    samples = [f for f in unique_formulas if f["variables"]][:3]
    for f in samples:
        print(f"\n  [{f['source_doc']}] {f['section']}")
        print(f"  Formula: {f['formula'][:80]}")
        print(f"  Variables: {len(f['variables'])}")
        for v in f["variables"][:3]:
            print(f"    {v['symbol']} = {v['description'][:50]}...")


if __name__ == "__main__":
    main()
