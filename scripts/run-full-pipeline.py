#!/usr/bin/env python3
"""
Full Indexing Pipeline Runner
==============================
Runs the complete indexing pipeline on all PDFs:

1. Index all missing PDFs with Docling + hierarchy inference
2. Re-embed all chunks with semantic chunking + voyage-context-3
3. Extract definitions and formulas
4. Embed definitions and formulas

Usage:
  python3 scripts/run-full-pipeline.py               # Run full pipeline
  python3 scripts/run-full-pipeline.py --skip-index  # Skip PDF indexing
  python3 scripts/run-full-pipeline.py --only-missing # Only process new PDFs
"""

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

INDEX_DIR = "data/page-indexes-docling-test"
CATALOG_PATH = os.path.join(INDEX_DIR, "catalog.json")


def get_all_pdfs():
    """Get all PDFs from src/content/*/sources/."""
    pdfs = []
    for root, dirs, files in os.walk("src/content"):
        if "/sources" in root:
            for f in files:
                if f.endswith(".pdf"):
                    pdfs.append(os.path.join(root, f))
    return pdfs


def get_indexed_pdfs():
    """Get PDFs already indexed (from catalog)."""
    if not os.path.exists(CATALOG_PATH):
        return set()
    with open(CATALOG_PATH) as f:
        catalog = json.load(f)
    return {doc["file"].split("/")[-1].replace(".json", ".pdf") for doc in catalog["documents"]}


def index_pdfs(pdfs: list, label: str = "PDFs"):
    """Run Docling indexer on a list of PDFs."""
    print(f"\n{'='*70}")
    print(f"PHASE 1: Indexing {len(pdfs)} {label}")
    print(f"{'='*70}")

    successes = 0
    failures = 0
    start_time = time.time()

    for i, pdf_path in enumerate(pdfs, 1):
        elapsed = time.time() - start_time
        print(f"\n[{i}/{len(pdfs)}] ({elapsed:.0f}s elapsed) {pdf_path}")

        try:
            result = subprocess.run(
                ["python3", "scripts/index-docling-zero-llm.py", pdf_path],
                capture_output=True,
                text=True,
                timeout=600  # 10 min max per PDF
            )
            if result.returncode == 0:
                successes += 1
                # Parse output for summary
                for line in result.stdout.split("\n"):
                    if "Built tree:" in line or "SUCCESS:" in line or "FAILURE" in line:
                        print(f"  {line.strip()}")
            else:
                failures += 1
                print(f"  FAILED: {result.stderr[-500:]}")
        except subprocess.TimeoutExpired:
            failures += 1
            print(f"  TIMEOUT after 10 min")
        except Exception as e:
            failures += 1
            print(f"  ERROR: {e}")

    elapsed = time.time() - start_time
    print(f"\n{label} indexing complete: {successes} success, {failures} failed ({elapsed:.0f}s)")
    return successes, failures


def run_script(script: str, description: str, timeout: int = 1800):
    """Run a pipeline script."""
    print(f"\n{'='*70}")
    print(f"{description}")
    print(f"{'='*70}")

    start_time = time.time()
    try:
        result = subprocess.run(
            ["python3", f"scripts/{script}"],
            capture_output=False,
            text=True,
            timeout=timeout
        )
        elapsed = time.time() - start_time
        if result.returncode == 0:
            print(f"\n{description} - SUCCESS ({elapsed:.0f}s)")
            return True
        else:
            print(f"\n{description} - FAILED with exit {result.returncode}")
            return False
    except subprocess.TimeoutExpired:
        print(f"\n{description} - TIMEOUT after {timeout}s")
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-index", action="store_true", help="Skip PDF indexing")
    parser.add_argument("--only-missing", action="store_true", help="Only index missing PDFs")
    parser.add_argument("--skip-reindex", action="store_true", help="Skip re-indexing existing")
    args = parser.parse_args()

    pipeline_start = time.time()

    # Phase 1: Index PDFs
    if not args.skip_index:
        all_pdfs = get_all_pdfs()
        indexed = get_indexed_pdfs()

        missing_pdfs = [p for p in all_pdfs if os.path.basename(p) not in indexed]
        existing_pdfs = [p for p in all_pdfs if os.path.basename(p) in indexed]

        print(f"Found {len(all_pdfs)} PDFs total: {len(existing_pdfs)} indexed, {len(missing_pdfs)} missing")

        if missing_pdfs:
            index_pdfs(missing_pdfs, label="missing PDFs")

        if not args.only_missing and not args.skip_reindex:
            # Re-index existing PDFs to get hierarchy inference
            print(f"\nRe-indexing {len(existing_pdfs)} existing PDFs with hierarchy inference...")
            index_pdfs(existing_pdfs, label="existing PDFs (for hierarchy)")

    # Phase 2: Re-embed all chunks with semantic chunking
    run_script(
        "embed-voyage-context.py",
        "PHASE 2: Embedding all chunks with semantic chunking + voyage-context-3",
        timeout=3600
    )

    # Phase 3: Extract definitions
    run_script(
        "extract-definitions.py",
        "PHASE 3a: Extracting definitions",
        timeout=600
    )

    # Phase 4: Extract formulas
    run_script(
        "extract-formulas.py",
        "PHASE 3b: Extracting formulas",
        timeout=600
    )

    # Phase 5: Embed definitions + formulas
    run_script(
        "embed-definitions-formulas.py",
        "PHASE 4: Embedding definitions and formulas",
        timeout=1800
    )

    total_elapsed = time.time() - pipeline_start
    print(f"\n{'='*70}")
    print(f"FULL PIPELINE COMPLETE in {total_elapsed/60:.1f} minutes")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()
