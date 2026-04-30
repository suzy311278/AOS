#!/usr/bin/env python3
"""
Zero-LLM Docling PDF Indexer for SustainIQ
===========================================
Uses IBM Docling for PDF parsing with ML-based layout detection.
NO LLM calls - relies entirely on Docling's structure detection.

Output: Tree indexes with raw text only (no summaries, no technical_index).
The hypothesis: voyage-context-3 embeddings + reranking can replace LLM-generated metadata.

Usage:
  python3 scripts/index-docling-zero-llm.py <pdf_path>
  python3 scripts/index-docling-zero-llm.py --batch    # Index the 15 test PDFs
  python3 scripts/index-docling-zero-llm.py --catalog  # Rebuild catalog only
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

# Output directory (separate from production)
OUTPUT_DIR = "data/page-indexes-docling-test"
CATALOG_PATH = os.path.join(OUTPUT_DIR, "catalog.json")

# The 15 test PDFs
TEST_PDFS = [
    "src/content/vm0042/sources/VM0042v2.2.pdf",
    "src/content/ghg-scope-3/sources/Scope3_Calculation_Guidance_0[1].pdf",
    "src/content/sbti/sources/SBTi-Corporate-Manual-v2.1.pdf",
    "src/content/ifrs-s2/sources/issb-2025-a-ifrs-s2-climate-related-disclosures-2.pdf",
    "src/content/eu-cbam/sources/CBAM-Implementing-Regulation-2023-1773.pdf",
    "src/content/human-rights-dd/sources/OECD-Due-Diligence-Guidance-2018.pdf",
    "src/content/financed-emissions/sources/PCAF-PartA-2025-V3-15012026.pdf",
    "src/content/circular-economy/sources/EU_WFD_Consolidated_2018.pdf",
    "src/content/double-materiality/sources/EFRAG-IG1-Materiality-Assessment.pdf",
    "src/content/vcm-101/sources/Verra-VCS-Standard-v4.7.pdf",
    "src/content/tnfd-biodiversity/sources/ENCORE-Biodiversity-Module-Guide.pdf",
    "src/content/esg-benchmarking/sources/GRI-2-General-Disclosures-2021.pdf",
    "src/content/ifc-performance-standards/sources/2012-ifc-performance-standards-en.pdf",
    "src/content/eu-sfdr/sources/EC_COM_2025_841_SFDR2_Proposal.pdf",
    "src/content/vcm-101/sources/ICVCM-CCP-Part4-Assessment-Framework.pdf",
]


def get_course_from_path(pdf_path: str) -> str:
    """Extract course ID from PDF path."""
    parts = Path(pdf_path).parts
    for i, p in enumerate(parts):
        if p == "content" and i + 1 < len(parts):
            return parts[i + 1]
    return "unknown"


def get_doc_id(pdf_path: str) -> str:
    """Generate document ID from path."""
    course = get_course_from_path(pdf_path)
    name = Path(pdf_path).stem
    return f"{course}/{name}"


def parse_with_docling(pdf_path: str) -> dict:
    """Parse PDF with Docling, extract structure and text."""
    from docling.document_converter import DocumentConverter, PdfFormatOption
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import PdfPipelineOptions

    print(f"  Parsing with Docling...")
    start = time.time()

    # Disable OCR to avoid matplotlib dependency issues
    pipeline_options = PdfPipelineOptions(do_ocr=False)

    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )

    result = converter.convert(pdf_path)
    doc = result.document

    elapsed = time.time() - start
    print(f"  Docling parsing complete ({elapsed:.1f}s)")

    return doc


def build_tree_from_docling(doc, pdf_path: str) -> dict:
    """Build section tree from Docling document.

    Uses same item type detection as the working build-index-docling.py script.
    """
    print(f"  Building section tree...")

    # Get document title
    title = Path(pdf_path).stem.replace("-", " ").replace("_", " ")

    # Get page count
    total_pages = len(doc.pages) if hasattr(doc, "pages") and doc.pages else 0

    # Collect sections based on SectionHeaderItem (same as working script)
    sections = []
    current_section = None
    current_text = []
    current_page = 1

    for item, level in doc.iterate_items():
        item_type = type(item).__name__

        # Get page number (same method as working script)
        page = 1
        prov = getattr(item, "prov", None)
        if prov:
            try:
                page = prov[0].page_no
            except Exception:
                pass

        if page > total_pages:
            total_pages = page

        # Check if this is a section header
        if item_type == "SectionHeaderItem":
            text = (getattr(item, "text", "") or "").strip()
            if not text:
                continue

            # Save previous section
            if current_section and current_text:
                current_section["text"] = "\n\n".join(current_text)
                current_section["end_page"] = current_page
                sections.append(current_section)

            # Start new section
            current_section = {
                "node_id": f"s{page}_{len(sections)}",
                "title": text[:200],
                "level": level + 1,
                "start_page": page,
                "end_page": page,
                "text": "",
                "children": []
            }
            current_text = []
            current_page = page

        elif item_type == "TableItem":
            # Export table as markdown
            try:
                table_md = item.export_to_markdown(doc=doc)
            except Exception:
                try:
                    table_md = item.export_to_markdown()
                except Exception:
                    table_md = ""
            if table_md:
                current_text.append(table_md)
                current_page = page

        elif item_type != "PictureItem":
            # Text, List, Formula, etc.
            text = (getattr(item, "text", "") or "").strip()
            if text:
                prefix = "- " if item_type == "ListItem" else ""
                current_text.append(prefix + text)
                current_page = page

    # Save last section
    if current_section and current_text:
        current_section["text"] = "\n\n".join(current_text)
        current_section["end_page"] = current_page
        sections.append(current_section)

    # If no sections found, create one from all text
    if not sections:
        print(f"  No headings detected, creating single section...")
        all_text = []
        for item, level in doc.iterate_items():
            item_type = type(item).__name__
            if item_type == "TableItem":
                try:
                    table_md = item.export_to_markdown(doc=doc)
                    if table_md:
                        all_text.append(table_md)
                except:
                    pass
            elif item_type != "PictureItem":
                text = (getattr(item, "text", "") or "").strip()
                if text:
                    all_text.append(text)

        if all_text:
            sections = [{
                "node_id": "s1_0",
                "title": title,
                "level": 1,
                "start_page": 1,
                "end_page": total_pages or 1,
                "text": "\n\n".join(all_text),
                "children": []
            }]

    # Infer hierarchy level from section numbering patterns
    def infer_level_from_title(title: str) -> int:
        """
        Infer hierarchy level from section title numbering:
        - "APPENDIX 1", "1 INTRODUCTION" → level 2 (top-level section)
        - "1.1 Overview", "8.2 Baseline" → level 3
        - "8.2.1 Soil Carbon", "3.1.2 Details" → level 4
        - Definitions, single words under a section → level 3
        """
        import re
        title = title.strip()

        # APPENDIX X → level 2
        if re.match(r'^APPENDIX\s+\d', title, re.IGNORECASE):
            return 2

        # Numbered sections: count dots to determine depth
        # "8.2.1" has 2 dots → level 4
        # "8.2" has 1 dot → level 3
        # "8" has 0 dots → level 2
        num_match = re.match(r'^(\d+(?:\.\d+)*)\s', title)
        if num_match:
            num_part = num_match.group(1)
            dot_count = num_part.count('.')
            return 2 + dot_count

        # All-caps titles without numbers are typically major sections
        if title.isupper() and len(title) > 3:
            return 2

        # Default to level 3 for other items (definitions, subsections)
        return 3

    # Re-calculate levels based on numbering patterns
    all_same_level = len(set(s["level"] for s in sections)) == 1
    if all_same_level and sections:
        print(f"  Docling levels are flat, inferring from numbering...")
        for section in sections:
            section["level"] = infer_level_from_title(section["title"])

    # Build nested tree from flat sections based on level
    def nest_sections(flat_sections):
        if not flat_sections:
            return []

        root_children = []
        stack = [(1, root_children, "ROOT")]  # (level, children list, title)

        for section in flat_sections:
            level = section["level"]

            # Track parent titles for context
            parent_titles = []

            # Pop stack until we find parent level
            while stack and stack[-1][0] >= level:
                stack.pop()

            if not stack:
                stack = [(1, root_children, "ROOT")]

            # Collect parent titles from stack
            parent_titles = [s[2] for s in stack[1:] if s[2] != "ROOT"]
            section["parent_titles"] = parent_titles

            # Add to current parent's children
            parent_children = stack[-1][1]
            parent_children.append(section)

            # Push this section as potential parent
            stack.append((level, section["children"], section["title"]))

        return root_children

    children = nest_sections(sections)

    # Final page count
    if not total_pages and sections:
        total_pages = max(s.get("end_page", 1) for s in sections)

    tree = {
        "title": title,
        "description": f"Indexed from {Path(pdf_path).name}",
        "total_pages": total_pages or 1,
        "children": children
    }

    # Count leaf sections
    def count_leaves(node):
        if not node.get("children"):
            return 1
        return sum(count_leaves(c) for c in node["children"])

    leaf_count = sum(count_leaves(c) for c in children) if children else 0
    print(f"  Built tree: {len(children)} top-level, {leaf_count} leaf sections")

    return tree


def save_index(tree: dict, pdf_path: str) -> tuple[str, str]:
    """Save full and light tree indexes."""
    course = get_course_from_path(pdf_path)
    name = Path(pdf_path).stem

    course_dir = os.path.join(OUTPUT_DIR, course)
    os.makedirs(course_dir, exist_ok=True)

    full_path = os.path.join(course_dir, f"{name}.json")
    light_path = os.path.join(course_dir, f"{name}_light.json")

    # Save full tree
    with open(full_path, "w") as f:
        json.dump(tree, f, indent=2)

    # Create light tree (no text)
    def strip_text(node):
        result = {k: v for k, v in node.items() if k != "text"}
        if "children" in result:
            result["children"] = [strip_text(c) for c in result["children"]]
        return result

    light_tree = {
        "title": tree["title"],
        "description": tree["description"],
        "total_pages": tree["total_pages"],
        "children": [strip_text(c) for c in tree["children"]]
    }

    with open(light_path, "w") as f:
        json.dump(light_tree, f, indent=2)

    full_size = os.path.getsize(full_path) / 1024
    light_size = os.path.getsize(light_path) / 1024
    print(f"  Saved: {full_path} ({full_size:.1f} KB)")
    print(f"  Saved: {light_path} ({light_size:.1f} KB)")

    return full_path, light_path


def update_catalog(pdf_path: str, tree: dict):
    """Update the catalog with this document."""
    doc_id = get_doc_id(pdf_path)
    course = get_course_from_path(pdf_path)
    name = Path(pdf_path).stem

    # Load or create catalog
    if os.path.exists(CATALOG_PATH):
        with open(CATALOG_PATH) as f:
            catalog = json.load(f)
    else:
        catalog = {"documents": []}

    # Remove existing entry for this doc
    catalog["documents"] = [d for d in catalog["documents"] if d["id"] != doc_id]

    # Add new entry
    catalog["documents"].append({
        "id": doc_id,
        "file": f"{course}/{name}.json",
        "title": tree["title"],
        "description": tree["description"],
        "course": course,
        "total_pages": tree["total_pages"],
        "topics": []  # No LLM-generated topics
    })

    with open(CATALOG_PATH, "w") as f:
        json.dump(catalog, f, indent=2)

    print(f"  Catalog updated: {len(catalog['documents'])} documents")


def index_pdf(pdf_path: str) -> bool:
    """Index a single PDF with zero LLM calls."""
    print(f"\n{'='*60}")
    print(f"Indexing: {pdf_path}")
    print(f"{'='*60}")

    if not os.path.exists(pdf_path):
        print(f"  ERROR: File not found")
        return False

    try:
        # Parse with Docling
        doc = parse_with_docling(pdf_path)

        # Build tree
        tree = build_tree_from_docling(doc, pdf_path)

        # Check if we got any content
        if not tree["children"]:
            print(f"  WARNING: No sections extracted")
            return False

        # Save indexes
        save_index(tree, pdf_path)

        # Update catalog
        update_catalog(pdf_path, tree)

        print(f"  SUCCESS: Indexed {tree['total_pages']} pages")
        return True

    except Exception as e:
        print(f"  ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


def batch_index():
    """Index all 15 test PDFs."""
    print(f"Batch indexing {len(TEST_PDFS)} PDFs (zero LLM)...")
    print(f"Output: {OUTPUT_DIR}")

    success = 0
    failed = 0

    for i, pdf_path in enumerate(TEST_PDFS, 1):
        print(f"\n[{i}/{len(TEST_PDFS)}] {pdf_path}")
        if index_pdf(pdf_path):
            success += 1
        else:
            failed += 1

    print(f"\n{'='*60}")
    print(f"BATCH COMPLETE: {success} success, {failed} failed")
    print(f"{'='*60}")


def rebuild_catalog():
    """Rebuild catalog from existing index files."""
    print("Rebuilding catalog...")

    catalog = {"documents": []}

    for root, dirs, files in os.walk(OUTPUT_DIR):
        for fname in files:
            if fname.endswith(".json") and not fname.endswith("_light.json") and fname != "catalog.json":
                path = os.path.join(root, fname)
                try:
                    with open(path) as f:
                        tree = json.load(f)

                    course = os.path.basename(root)
                    name = fname.replace(".json", "")
                    doc_id = f"{course}/{name}"

                    catalog["documents"].append({
                        "id": doc_id,
                        "file": f"{course}/{fname}",
                        "title": tree.get("title", name),
                        "description": tree.get("description", ""),
                        "course": course,
                        "total_pages": tree.get("total_pages", 0),
                        "topics": []
                    })
                except Exception as e:
                    print(f"  Error reading {path}: {e}")

    with open(CATALOG_PATH, "w") as f:
        json.dump(catalog, f, indent=2)

    print(f"Catalog rebuilt: {len(catalog['documents'])} documents")


def main():
    parser = argparse.ArgumentParser(description="Zero-LLM Docling PDF Indexer")
    parser.add_argument("pdf_path", nargs="?", help="Path to PDF file")
    parser.add_argument("--batch", action="store_true", help="Index all 15 test PDFs")
    parser.add_argument("--catalog", action="store_true", help="Rebuild catalog only")

    args = parser.parse_args()

    if args.catalog:
        rebuild_catalog()
    elif args.batch:
        batch_index()
    elif args.pdf_path:
        index_pdf(args.pdf_path)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
