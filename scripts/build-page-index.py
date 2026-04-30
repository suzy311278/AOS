#!/usr/bin/env python3
"""
PageIndex Builder for Sustainability Academy
=============================================
Extracts PDF text page-by-page, then uses Claude Code CLI to build
a hierarchical tree index following the PageIndex methodology.

Usage:
  python3 scripts/build-page-index.py <pdf_path> [--output <output_path>]
  python3 scripts/build-page-index.py --batch                # Index all source PDFs
  python3 scripts/build-page-index.py --catalog              # Rebuild catalog.json only

Examples:
  python3 scripts/build-page-index.py src/content/vm0042/sources/VM0042v2.2.pdf
  python3 scripts/build-page-index.py src/content/vm0042/sources/VM0042v2.2.pdf --output data/page-indexes/vm0042/VM0042v2.2.json
"""

import argparse
import json
import os
import subprocess
import sys
import re
import time
import pymupdf
import requests as http_requests  # for OpenRouter API calls

# Load .env.local for API keys
_env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
if os.path.exists(_env_path):
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _key, _val = _line.split("=", 1)
                if _key not in os.environ:
                    os.environ[_key] = _val


# ---------------------------------------------------------------------------
# PDF text extraction
# ---------------------------------------------------------------------------

def extract_pages(pdf_path: str) -> list[dict]:
    """Extract text from each page of a PDF. Returns list of {page, text, tokens_approx}."""
    doc = pymupdf.open(pdf_path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text("text")
        pages.append({
            "page": i + 1,
            "text": text.strip(),
            "tokens_approx": len(text.split()) * 1.3  # rough token estimate
        })
    doc.close()
    return pages


# ---------------------------------------------------------------------------
# Multi-provider LLM CLI wrapper
# ---------------------------------------------------------------------------
# Supports: claude (Sonnet 4.6), gemini, codex (GPT-5)
# Set via --provider flag or INDEXER_PROVIDER env var

PROVIDER = os.environ.get("INDEXER_PROVIDER", "claude")


def call_llm(prompt: str, max_retries: int = 5) -> str:
    """Call the configured LLM CLI with a prompt and return the text response."""
    for attempt in range(max_retries):
        try:
            if PROVIDER == "claude":
                result = subprocess.run(
                    ["claude", "-p", "--model", "claude-sonnet-4-6", "--output-format", "json"],
                    input=prompt,
                    capture_output=True,
                    text=True,
                    timeout=300,
                )
                if result.returncode != 0:
                    print(f"  [attempt {attempt+1}] claude error: {result.stderr[:200]}")
                    continue
                response = json.loads(result.stdout)
                if response.get("is_error"):
                    print(f"  [attempt {attempt+1}] claude error: {response.get('result', '')[:200]}")
                    continue
                return response.get("result", "")

            elif PROVIDER == "gemini":
                GEMINI_NOISE = [
                    "Loaded", "Registering", "Server", "Scheduling", "Executing", "MCP",
                    "Error executing", "YOLO", "Attempt", "backoff", "GaxiosError",
                    "retrying", "Retrying", "mode is enabled", "tool calls will be",
                    "notification handlers", "tool updates", "context refresh",
                ]
                result = subprocess.run(
                    ["gemini", "-m", "gemini-3.1-pro-preview", "--yolo",
                     "-p", "Process this request and return ONLY the requested output format.",
                     "-o", "text"],
                    input=prompt,
                    capture_output=True,
                    text=True,
                    timeout=600,  # 10 min - Gemini retries 429s with backoff
                )
                # Filter noise from stdout (Gemini mixes stderr into stdout)
                all_output = result.stdout + "\n" + result.stderr
                lines = all_output.split("\n")
                clean = [l for l in lines if l.strip() and not any(skip in l for skip in GEMINI_NOISE)]
                clean_text = "\n".join(clean).strip()

                if result.returncode != 0 and not clean_text:
                    print(f"  [attempt {attempt+1}] gemini failed (exit {result.returncode})")
                    continue
                if clean_text:
                    return clean_text
                print(f"  [attempt {attempt+1}] gemini returned empty output")
                continue

            elif PROVIDER == "openrouter":
                # Key rotation: cycle through comma-separated keys
                keys_str = os.environ.get("OPENROUTER_API_KEYS") or os.environ.get("OPENROUTER_API_KEY", "")
                if not keys_str:
                    raise ValueError("OPENROUTER_API_KEYS not set in .env.local")
                keys = [k.strip() for k in keys_str.split(",") if k.strip()]
                if not hasattr(call_llm, "_or_call_count"):
                    call_llm._or_call_count = 0
                api_key = keys[call_llm._or_call_count % len(keys)]
                call_llm._or_call_count += 1

                model = os.environ.get("OPENROUTER_MODEL", "qwen/qwen3.6-plus:free")
                resp = http_requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": "You are a document analysis assistant. Return ONLY the requested output format (JSON or text). No explanations, no thinking, no preamble."},
                            {"role": "user", "content": prompt}
                        ],
                        "max_tokens": 8000,
                        "temperature": 0,
                    },
                    timeout=180,
                )
                if resp.status_code == 429:
                    wait = 20 * (attempt + 1)
                    print(f"  [attempt {attempt+1}] openrouter rate limited (key {call_llm._or_call_count % len(keys) + 1}/{len(keys)}), waiting {wait}s...")
                    time.sleep(wait)
                    continue
                if resp.status_code != 200:
                    print(f"  [attempt {attempt+1}] openrouter error {resp.status_code}: {resp.text[:200]}")
                    time.sleep(5)
                    continue
                data = resp.json()
                text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if not text:
                    print(f"  [attempt {attempt+1}] openrouter returned empty response")
                    time.sleep(5)
                    continue
                # Strip thinking tags if Qwen includes them
                if "<think>" in text:
                    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
                return text.strip()

            elif PROVIDER == "codex":
                # Codex needs prompt in a temp file for long inputs
                prompt_file = "/tmp/codex-prompt.txt"
                with open(prompt_file, "w") as pf:
                    pf.write(prompt)
                result = subprocess.run(
                    ["codex", "exec", f"Read /tmp/codex-prompt.txt and follow the instructions in it. Return ONLY what is requested, no extra text."],
                    capture_output=True,
                    text=True,
                    timeout=300,
                )
                if result.returncode != 0:
                    print(f"  [attempt {attempt+1}] codex error: {result.stderr[:200]}")
                    continue
                return result.stdout.strip()

            else:
                raise ValueError(f"Unknown provider: {PROVIDER}")

        except subprocess.TimeoutExpired:
            print(f"  [attempt {attempt+1}] {PROVIDER} CLI timed out")
        except http_requests.exceptions.Timeout:
            print(f"  [attempt {attempt+1}] {PROVIDER} API timed out")
        except json.JSONDecodeError:
            print(f"  [attempt {attempt+1}] failed to parse {PROVIDER} output")

    raise RuntimeError(f"{PROVIDER} CLI failed after {max_retries} attempts")


# Backward compatibility alias
call_claude = call_llm


def extract_json_from_response(text: str) -> dict | list:
    """Extract JSON from a Claude response that may contain markdown fences."""
    # Try direct parse first
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code fence
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Try finding first { or [ and matching to last } or ]
    for start_char, end_char in [('{', '}'), ('[', ']')]:
        start = text.find(start_char)
        end = text.rfind(end_char)
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                continue

    raise ValueError(f"Could not extract JSON from response: {text[:300]}...")


# ---------------------------------------------------------------------------
# Step 1: Detect and extract TOC structure
# ---------------------------------------------------------------------------

def detect_toc(pages: list[dict], check_pages: int = 0) -> dict | None:
    # Default: scan first 10 pages for CLI providers, first 30 for API providers (larger context)
    if check_pages == 0:
        check_pages = 30 if PROVIDER == "openrouter" else 10
    """Ask Claude to detect if there's a table of contents in the first N pages."""
    first_pages_text = ""
    for p in pages[:check_pages]:
        first_pages_text += f"\n--- PAGE {p['page']} ---\n{p['text']}\n"

    prompt = f"""You are analyzing a PDF document to extract its structure.

Below is the text from the first {min(check_pages, len(pages))} pages. Your task is to find the document's section structure.

Look for EITHER:
1. An explicit Table of Contents (TOC) page listing sections with page numbers, OR
2. Section headings visible in the body text (e.g. "SPM 1. Observed Changes", "Chapter 3: Methods", "1.1 Introduction"). These are often numbered, bold, or clearly formatted as headings.

If you find either, extract the structure as JSON. If the document has no discernible sections at all, return {{"has_toc": false}}.

{first_pages_text}

Return this exact format:
{{
  "has_toc": true,
  "toc_pages": [3, 4],
  "sections": [
    {{
      "title": "Section Title",
      "page": 5,
      "level": 1,
      "children": [
        {{
          "title": "Subsection Title",
          "page": 6,
          "level": 2,
          "children": [
            {{
              "title": "Sub-subsection Title",
              "page": 7,
              "level": 3,
              "children": []
            }}
          ]
        }}
      ]
    }}
  ]
}}

Rules:
- "page" is the PDF page number printed in the document (not the array index)
- "level" is the nesting depth (1 = top-level section, 2 = subsection, 3 = sub-subsection, etc.)
- Nest children inside their parent sections
- CRITICAL: Include ALL levels of sections and subsections listed in the TOC, including numbered subsections like 8.1, 8.2, 8.2.1, 8.2.1.1, etc.
- Do NOT skip any subsections. Every line in the TOC that has a page number must be included.
- Capture up to 4 levels of nesting if present in the TOC.

Return ONLY the JSON, no explanation."""

    response = call_claude(prompt)
    return extract_json_from_response(response)


# ---------------------------------------------------------------------------
# Step 1b: Split large leaf nodes by detecting sub-headings in content
# ---------------------------------------------------------------------------

MAX_PAGES_PER_LEAF = 10


def assign_end_pages(sections: list[dict], parent_end: int) -> None:
    """Assign end pages to sections based on the next section's start page."""
    for i, section in enumerate(sections):
        # Ensure page is set (default to parent_end if missing)
        if section.get("page") is None:
            section["page"] = parent_end
        if i + 1 < len(sections):
            next_page = sections[i + 1].get("page") or parent_end
            section["end_page"] = next_page - 1
        else:
            section["end_page"] = parent_end
        if section.get("children"):
            assign_end_pages(section["children"], section["end_page"])


def split_large_nodes(toc: dict, pages: list[dict]) -> dict:
    """For any leaf node spanning >MAX_PAGES_PER_LEAF pages, ask Claude to find sub-sections."""

    # First assign end pages so we know page spans
    total_pages = len(pages)
    assign_end_pages(toc.get("sections", []), total_pages)

    def get_page_range_text(start_page: int, end_page: int) -> str:
        texts = []
        for p in pages:
            if start_page <= p["page"] <= end_page:
                texts.append(f"--- PAGE {p['page']} ---\n{p['text'][:800]}")
        return "\n".join(texts)

    def split_if_large(section: dict, depth: int = 0) -> dict:
        # First, recurse into existing children
        if section.get("children"):
            section["children"] = [split_if_large(c, depth + 1) for c in section["children"]]
            return section

        # Leaf node: check if it's too large
        page_span = section.get("end_page", section["page"]) - section["page"] + 1
        if page_span <= MAX_PAGES_PER_LEAF:
            return section

        start = section["page"]
        end = section.get("end_page", start + page_span - 1)
        prefix = "  " * depth
        print(f"{prefix}  Splitting large node: {section['title']} ({page_span} pages, pp. {start}-{end})")

        chunk_text = get_page_range_text(start, end)
        # Truncate if massive
        if len(chunk_text) > 15000:
            chunk_text = chunk_text[:15000] + "\n[truncated]"

        prompt = f"""This is a section from a technical document that spans pages {start} to {end}.
Identify all sub-section headings within this text. Look for numbered headings (like 8.2.1, 8.2.1.1) or bold/capitalized headings that indicate a new subsection.

{chunk_text}

Return a JSON array of sub-sections found:
[
  {{"title": "Subsection Name", "page": <page_number>, "level": {section.get('level', 1) + 1}}}
]

Rules:
- Only include actual section/subsection headings, not paragraph text
- Each entry must have the page number where the subsection starts
- If no clear sub-sections are found, return an empty array []
- Return ONLY JSON, no explanation"""

        try:
            response = call_claude(prompt)
            subsections = extract_json_from_response(response)
            if isinstance(subsections, list) and len(subsections) > 1:
                # Add children to this section
                for sub in subsections:
                    sub.setdefault("children", [])
                section["children"] = subsections
                print(f"{prefix}    Found {len(subsections)} sub-sections")
                return section
        except (ValueError, RuntimeError) as e:
            print(f"{prefix}    Split failed: {e}")

        return section

    sections = toc.get("sections", [])
    toc["sections"] = [split_if_large(s) for s in sections]
    return toc


# ---------------------------------------------------------------------------
# Step 2: Build tree with summaries and text
# ---------------------------------------------------------------------------

def build_tree_with_content(toc: dict, pages: list[dict]) -> dict:
    """Given a TOC structure and pages, build the full tree index with summaries and text."""

    def get_page_range_text(start_page: int, end_page: int) -> str:
        """Get concatenated text for a page range."""
        texts = []
        for p in pages:
            if start_page <= p["page"] <= end_page:
                texts.append(p["text"])
        return "\n".join(texts)

    # Re-run assign_end_pages in case split added new children
    total_pages = len(pages)
    sections = toc.get("sections", [])
    assign_end_pages(sections, total_pages)

    # Now generate summaries + technical indexes for each node using Claude
    def summarize_section(section: dict, depth: int = 0) -> dict:
        start = section["page"]
        end = section["end_page"]
        text = get_page_range_text(start, end)

        # Truncate text if too long (keep first 8000 chars for summary)
        truncated = text[:8000] if len(text) > 8000 else text

        prefix = "  " * depth
        print(f"{prefix}Indexing: {section['title']} (pp. {start}-{end})")

        # Single prompt that generates both summary and technical index
        prompt = f"""Analyze this section from a technical/regulatory document and produce two outputs.

Section: {section['title']}
Pages: {start}-{end}

Text:
{truncated}

Return a JSON object with exactly these two fields:
{{
  "summary": "2-3 sentence summary of what this section covers. Be precise and technical.",
  "technical_index": "A compact list of: equation numbers, table numbers, specific parameter names, threshold values, key terms, and methodologies mentioned. Format as a comma-separated list. Max 250 characters."
}}

Examples of good technical_index values:
- "Equations 16-25, EF_Ndirect, FSN, FON, Frac_GASF, Frac_LEACH, direct/indirect N2O, synthetic vs organic fertilizer, 44/28 molar ratio"
- "Table 7, similarity criteria, topography, soil texture, SOC%, climate zone, 250km radius, stratified random sampling"
- "Monte Carlo simulation, 10000 iterations, 90% confidence, combined sample+model error, RMSE, bias correction"

Return ONLY the JSON, no explanation."""

        response = call_claude(prompt)
        try:
            parsed = extract_json_from_response(response)
            summary = parsed.get("summary", "").strip()
            tech_index = parsed.get("technical_index", "").strip()
        except (ValueError, AttributeError):
            # Fallback: treat entire response as summary
            summary = response.strip()
            tech_index = ""

        node = {
            "node_id": f"s{start}_{end}",
            "title": section["title"],
            "level": section.get("level", 1),
            "start_page": start,
            "end_page": end,
            "summary": summary,
            "technical_index": tech_index,
            "text": text,
            "children": []
        }

        for child in section.get("children", []):
            node["children"].append(summarize_section(child, depth + 1))

        return node

    tree = {
        "title": "",
        "description": "",
        "total_pages": total_pages,
        "children": []
    }

    # Get document title and description from first page
    first_page_text = pages[0]["text"] if pages else ""
    title_prompt = f"""From this document's first page, extract:
1. The document title
2. A one-sentence description of what this document covers

First page text:
{first_page_text}

Return as JSON: {{"title": "...", "description": "..."}}"""

    title_info = extract_json_from_response(call_claude(title_prompt))
    tree["title"] = title_info.get("title", "Unknown Document")
    tree["description"] = title_info.get("description", "")

    print(f"\nDocument: {tree['title']}")
    print(f"Pages: {total_pages}")
    print(f"Sections: {len(sections)}\n")

    for section in sections:
        tree["children"].append(summarize_section(section))

    return tree


# ---------------------------------------------------------------------------
# Step 2c: Fast path for table-heavy PDFs (no LLM needed)
# ---------------------------------------------------------------------------

# Threshold: if >80% of pages contain table headers, treat as lookup table
TABLE_MARKERS = ["CN Code", "Default Value", "Category", "Subcategory",
                 "Product Code", "HS Code", "Emission Factor"]


def detect_table_heavy(pages: list[dict], preamble_pages: int = 10) -> bool:
    """Check if a PDF is mostly repetitive tables (e.g. country-by-country data)."""
    if len(pages) < 50:
        return False
    sample_pages = pages[preamble_pages:min(len(pages), preamble_pages + 50)]
    table_count = sum(
        1 for p in sample_pages
        if any(marker in p["text"][:500] for marker in TABLE_MARKERS)
    )
    ratio = table_count / len(sample_pages) if sample_pages else 0
    return ratio > 0.7


def build_tree_table_heavy(pages: list[dict]) -> dict:
    """Build tree by detecting repeating group headers (e.g. country names).

    No LLM calls needed. Scans pages for header transitions and groups them.
    """
    # Detect preamble end (first page with table markers)
    preamble_end = 0
    for i, p in enumerate(pages):
        if any(marker in p["text"][:500] for marker in TABLE_MARKERS):
            preamble_end = i
            break

    # Collect group headers by scanning first non-marker line of each page
    groups: list[dict] = []  # {title, start_page, end_page, pages_text}
    current_group = None

    for p in pages[preamble_end:]:
        lines = p["text"].strip().split("\n")
        first_line = lines[0].strip() if lines else ""

        # A group header is a short standalone line that isn't a table column header
        is_header = (
            first_line
            and len(first_line) < 50
            and not any(marker in first_line for marker in TABLE_MARKERS)
            and not first_line[0].isdigit()
            and first_line not in ("Product", "Description", "Underlying")
        )

        if is_header and (not current_group or first_line != current_group["title"]):
            # New group
            if current_group:
                current_group["end_page"] = p["page"] - 1
                groups.append(current_group)
            current_group = {
                "title": first_line,
                "start_page": p["page"],
                "end_page": p["page"],
                "text": p["text"],
            }
        elif current_group:
            current_group["end_page"] = p["page"]
            current_group["text"] += "\n" + p["text"]

    if current_group:
        current_group["end_page"] = pages[-1]["page"]
        groups.append(current_group)

    print(f"  Detected {len(groups)} groups (table-heavy fast path, 0 LLM calls)")

    # Build preamble section
    preamble_text = "\n".join(p["text"] for p in pages[:preamble_end]) if preamble_end > 0 else ""

    # Build tree
    children = []
    if preamble_text:
        children.append({
            "node_id": f"s1_{preamble_end}",
            "title": "Preamble and Legal Basis",
            "level": 1,
            "start_page": 1,
            "end_page": preamble_end,
            "summary": "Legal basis, definitions, and methodology for calculating default values.",
            "technical_index": "",
            "text": preamble_text[:8000],
            "children": [],
        })

    for g in groups:
        # Build a technical index from the table content
        # Extract unique product codes/descriptions from the text
        products = set()
        for line in g["text"].split("\n"):
            parts = line.strip().split()
            # Look for CN codes (4-8 digit numbers)
            for part in parts:
                if re.match(r"^\d{4,8}$", part):
                    products.add(part)

        tech_index = f"CBAM default emission values for {g['title']}."
        if products:
            sample = sorted(products)[:10]
            tech_index += f" CN codes: {', '.join(sample)}"
            if len(products) > 10:
                tech_index += f" (+{len(products)-10} more)"

        children.append({
            "node_id": f"s{g['start_page']}_{g['end_page']}",
            "title": g["title"],
            "level": 1,
            "start_page": g["start_page"],
            "end_page": g["end_page"],
            "summary": f"CBAM default values for direct, indirect, and total embedded emissions for products from {g['title']}.",
            "technical_index": tech_index,
            "text": g["text"][:8000],  # Cap text per group
            "children": [],
        })

    # Get title from first page
    first_page_text = pages[0]["text"][:500] if pages else ""
    title_lines = [l.strip() for l in first_page_text.split("\n") if l.strip()]
    title = " ".join(title_lines[:2])[:200] if title_lines else "Unknown Document"

    return {
        "title": title,
        "description": f"Default emission values organized by country/region ({len(groups)} groups, {len(pages)} pages).",
        "total_pages": len(pages),
        "children": children,
    }


# ---------------------------------------------------------------------------
# Step 3: Build tree without TOC (fallback: generate structure from content)
# ---------------------------------------------------------------------------

def build_tree_without_toc(pages: list[dict]) -> dict:
    """When no TOC is found, ask Claude to generate a structure from the content."""
    # Combine page texts in groups of ~10 pages for analysis
    max_pages = len(pages)
    chunk_size = 10
    all_sections = []

    for start_idx in range(0, max_pages, chunk_size):
        chunk = pages[start_idx:start_idx + chunk_size]
        chunk_text = ""
        for p in chunk:
            chunk_text += f"\n--- PAGE {p['page']} ---\n{p['text'][:1500]}\n"

        prompt = f"""Analyze these pages from a technical PDF document and identify the main sections/headings that start on these pages.

{chunk_text}

Return a JSON array of sections found:
[
  {{"title": "Section Name", "page": <page_number>, "level": <1_or_2>}}
]

Only include actual section headers/titles, not paragraph text. Return ONLY JSON."""

        response = call_claude(prompt)
        try:
            sections = extract_json_from_response(response)
            if isinstance(sections, list):
                all_sections.extend(sections)
        except ValueError:
            continue

    # Build a pseudo-TOC and proceed
    toc = {"has_toc": True, "sections": nest_flat_sections(all_sections)}
    return build_tree_with_content(toc, pages)


def nest_flat_sections(sections: list[dict]) -> list[dict]:
    """Convert a flat list of sections with levels into a nested structure."""
    if not sections:
        return []

    root_sections = []
    stack = []

    for section in sections:
        section.setdefault("children", [])
        level = section.get("level", 1)

        while stack and stack[-1].get("level", 1) >= level:
            stack.pop()

        if stack:
            stack[-1]["children"].append(section)
        else:
            root_sections.append(section)

        stack.append(section)

    return root_sections


# ---------------------------------------------------------------------------
# Lightweight tree (strip text for the query-time index)
# ---------------------------------------------------------------------------

def create_lightweight_tree(tree: dict) -> dict:
    """Create a version of the tree without full text (for query-time navigation)."""
    light = {
        "title": tree.get("title", ""),
        "description": tree.get("description", ""),
        "total_pages": tree.get("total_pages", 0),
        "children": []
    }

    def strip_node(node: dict) -> dict:
        result = {
            "node_id": node["node_id"],
            "title": node["title"],
            "level": node["level"],
            "start_page": node["start_page"],
            "end_page": node["end_page"],
            "summary": node["summary"],
            "children": [strip_node(c) for c in node.get("children", [])]
        }
        if node.get("technical_index"):
            result["technical_index"] = node["technical_index"]
        return result

    for child in tree.get("children", []):
        light["children"].append(strip_node(child))

    return light


# ---------------------------------------------------------------------------
# Catalog management
# ---------------------------------------------------------------------------

CATALOG_PATH = "data/page-indexes/catalog.json"


def load_catalog() -> dict:
    if os.path.exists(CATALOG_PATH):
        with open(CATALOG_PATH, "r") as f:
            return json.load(f)
    return {"documents": []}


def save_catalog(catalog: dict) -> None:
    os.makedirs(os.path.dirname(CATALOG_PATH), exist_ok=True)
    with open(CATALOG_PATH, "w") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)


def update_catalog(doc_id: str, index_path: str, title: str, description: str,
                   course_id: str, total_pages: int, topics: list[str]) -> None:
    """Add or update a document entry in the catalog."""
    catalog = load_catalog()
    docs = catalog["documents"]

    # Remove existing entry if present
    docs = [d for d in docs if d["id"] != doc_id]

    docs.append({
        "id": doc_id,
        "file": index_path,
        "title": title,
        "description": description,
        "course": course_id,
        "total_pages": total_pages,
        "topics": topics
    })

    catalog["documents"] = docs
    save_catalog(catalog)


def generate_topics(title: str, description: str, tree: dict) -> list[str]:
    """Ask Claude to generate topic keywords for this document."""
    section_titles = []

    def collect_titles(node):
        section_titles.append(node.get("title", ""))
        for child in node.get("children", []):
            collect_titles(child)

    for child in tree.get("children", []):
        collect_titles(child)

    prompt = f"""Given this document info, generate 5-10 topic keywords for search routing.
These keywords help a search system decide whether this document is relevant to a user's query.

Document: {title}
Description: {description}
Sections: {', '.join(section_titles[:30])}

Return ONLY a JSON array of keyword strings, e.g. ["keyword1", "keyword2", ...]"""

    response = call_claude(prompt)
    try:
        topics = extract_json_from_response(response)
        if isinstance(topics, list):
            return [str(t) for t in topics]
    except ValueError:
        pass
    return []


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def index_pdf(pdf_path: str, output_path: str | None = None) -> str:
    """Full indexing pipeline for a single PDF. Returns the output path."""
    pdf_path = os.path.abspath(pdf_path)
    if not os.path.isfile(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]

    # Determine course ID from path
    course_id = "unknown"
    parts = pdf_path.replace("\\", "/").split("/")
    if "content" in parts and "sources" in parts:
        content_idx = parts.index("content")
        if content_idx + 1 < len(parts):
            course_id = parts[content_idx + 1]

    # Default output path
    if not output_path:
        output_dir = f"data/page-indexes/{course_id}"
        output_path = f"{output_dir}/{pdf_name}.json"

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    print(f"{'='*60}")
    print(f"Indexing: {os.path.basename(pdf_path)}")
    print(f"Course:  {course_id}")
    print(f"Output:  {output_path}")
    print(f"{'='*60}")

    # Step 1: Extract pages
    print("\n[1/4] Extracting PDF text...")
    pages = extract_pages(pdf_path)
    print(f"  Extracted {len(pages)} pages")

    # Step 2: Detect TOC
    print("\n[2/4] Detecting table of contents...")
    toc = detect_toc(pages)

    if toc and toc.get("has_toc"):
        section_count = len(toc.get("sections", []))
        print(f"  Found TOC with {section_count} top-level sections")

        # Split any large leaf nodes into sub-sections
        print("\n[2b/4] Splitting large sections into sub-sections...")
        toc = split_large_nodes(toc, pages)
    else:
        print("  No TOC found, checking if table-heavy...")

    # Step 3: Build tree
    print("\n[3/4] Building tree index with summaries...")
    if toc and toc.get("has_toc"):
        tree = build_tree_with_content(toc, pages)
    elif detect_table_heavy(pages):
        print("  Table-heavy PDF detected, using fast path...")
        tree = build_tree_table_heavy(pages)
    else:
        print("  Using LLM to generate structure from content...")
        tree = build_tree_without_toc(pages)

    # Step 4: Save outputs
    print("\n[4/4] Saving index files...")

    # Save full tree (with text, for retrieval)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(tree, f, indent=2, ensure_ascii=False)
    full_size = os.path.getsize(output_path)
    print(f"  Full index: {output_path} ({full_size / 1024:.1f} KB)")

    # Save lightweight tree (without text, for navigation)
    light_path = output_path.replace(".json", "_light.json")
    light_tree = create_lightweight_tree(tree)
    with open(light_path, "w", encoding="utf-8") as f:
        json.dump(light_tree, f, indent=2, ensure_ascii=False)
    light_size = os.path.getsize(light_path)
    print(f"  Light index: {light_path} ({light_size / 1024:.1f} KB)")

    # Generate topics and update catalog
    print("\n  Generating topics for catalog...")
    topics = generate_topics(tree["title"], tree["description"], tree)
    rel_path = os.path.relpath(output_path, "data/page-indexes")
    update_catalog(
        doc_id=f"{course_id}/{pdf_name}",
        index_path=rel_path,
        title=tree["title"],
        description=tree["description"],
        course_id=course_id,
        total_pages=tree["total_pages"],
        topics=topics
    )
    print(f"  Catalog updated with {len(topics)} topics")

    print(f"\nDone! Indexed {len(pages)} pages into {len(tree.get('children', []))} sections.")
    return output_path


# ---------------------------------------------------------------------------
# Batch mode
# ---------------------------------------------------------------------------

SKIP_COURSES = {"esg-investing"}
SKIP_FILES = {"Illustrative Disclosure.pdf"}


def find_all_source_pdfs() -> list[tuple[str, str]]:
    """Find all source PDFs in src/content/*/sources/. Returns [(pdf_path, course_id)]."""
    content_dir = "src/content"
    results = []
    for course_id in sorted(os.listdir(content_dir)):
        if course_id in SKIP_COURSES:
            continue
        sources_dir = os.path.join(content_dir, course_id, "sources")
        if not os.path.isdir(sources_dir):
            continue
        for fname in sorted(os.listdir(sources_dir)):
            if fname.lower().endswith(".pdf") and fname not in SKIP_FILES:
                results.append((os.path.join(sources_dir, fname), course_id))
    return results


def batch_index(batch_slice: str | None = None, throttle_minutes: int = 0):
    """Index all source PDFs that haven't been indexed yet.

    batch_slice: '0/3' means take items where index % 3 == 0 (for parallel runs)
    throttle_minutes: wait N minutes between each PDF (0 = no wait)
    """
    pdfs = find_all_source_pdfs()
    catalog = load_catalog()
    indexed_ids = {d["id"] for d in catalog.get("documents", [])}

    to_index = []
    for pdf_path, course_id in pdfs:
        pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]
        doc_id = f"{course_id}/{pdf_name}"
        if doc_id not in indexed_ids:
            file_size = os.path.getsize(pdf_path)
            to_index.append((pdf_path, course_id, doc_id, file_size))

    # Apply slice for parallel batching
    if batch_slice:
        parts = batch_slice.split("/")
        slice_idx, slice_total = int(parts[0]), int(parts[1])
        to_index = [item for i, item in enumerate(to_index) if i % slice_total == slice_idx]
        print(f"Batch slice {slice_idx}/{slice_total}: {len(to_index)} PDFs assigned to this worker")

    # Sort by file size ascending (smallest first)
    to_index.sort(key=lambda x: x[3])

    print(f"Found {len(pdfs)} total PDFs, {len(to_index)} to index (provider: {PROVIDER}).")
    if throttle_minutes > 0:
        total_hours = (len(to_index) * throttle_minutes) / 60
        print(f"Throttle: {throttle_minutes}min between PDFs (~{total_hours:.1f}h total)")
    print()

    if not to_index:
        print("All PDFs already indexed!")
        return

    for i, (pdf_path, course_id, doc_id, file_size) in enumerate(to_index):
        size_mb = file_size / (1024 * 1024)
        print(f"\n[{i+1}/{len(to_index)}] {doc_id} ({size_mb:.1f} MB)")
        try:
            index_pdf(pdf_path)
            print(f"Done! {doc_id}")
        except Exception as e:
            print(f"  ERROR: {e}")

        # Throttle between PDFs (skip after last one)
        if throttle_minutes > 0 and i < len(to_index) - 1:
            wait_until = time.strftime("%H:%M", time.localtime(time.time() + throttle_minutes * 60))
            print(f"  Waiting {throttle_minutes}min (next at {wait_until})...")
            time.sleep(throttle_minutes * 60)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build PageIndex tree indexes for PDFs")
    parser.add_argument("pdf_path", nargs="?", help="Path to a PDF file to index")
    parser.add_argument("--output", "-o", help="Output path for the index JSON")
    parser.add_argument("--batch", action="store_true", help="Index all unindexed source PDFs")
    parser.add_argument("--catalog", action="store_true", help="Rebuild catalog.json from existing indexes")
    parser.add_argument("--provider", choices=["claude", "gemini", "codex", "openrouter"], default="claude",
                       help="LLM provider to use (default: claude)")
    parser.add_argument("--batch-slice", help="Slice for parallel batching: '0/3' = first third, '1/3' = second third, '2/3' = last third")
    parser.add_argument("--throttle", type=int, default=0,
                       help="Minutes to wait between each PDF (e.g. 30)")

    args = parser.parse_args()

    # This assignment updates the module-level PROVIDER variable
    PROVIDER = args.provider

    if args.batch:
        batch_index(args.batch_slice, throttle_minutes=args.throttle)
    elif args.catalog:
        # Rebuild catalog from existing index files
        catalog = {"documents": []}
        index_dir = "data/page-indexes"
        if os.path.isdir(index_dir):
            for root, dirs, files in os.walk(index_dir):
                for f in files:
                    if f.endswith(".json") and not f.endswith("_light.json") and f != "catalog.json":
                        path = os.path.join(root, f)
                        with open(path) as fh:
                            tree = json.load(fh)
                        rel = os.path.relpath(path, index_dir)
                        course = rel.split("/")[0] if "/" in rel else "unknown"
                        print(f"  Adding {rel}")
                        topics = generate_topics(tree.get("title", ""), tree.get("description", ""), tree)
                        catalog["documents"].append({
                            "id": f"{course}/{os.path.splitext(f)[0]}",
                            "file": rel,
                            "title": tree.get("title", f),
                            "description": tree.get("description", ""),
                            "course": course,
                            "total_pages": tree.get("total_pages", 0),
                            "topics": topics
                        })
        save_catalog(catalog)
        print(f"\nCatalog rebuilt with {len(catalog['documents'])} documents")
    elif args.pdf_path:
        index_pdf(args.pdf_path, args.output)
    else:
        parser.print_help()
