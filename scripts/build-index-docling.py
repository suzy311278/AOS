#!/usr/bin/env python3
"""
Docling-based PDF indexer for SustainIQ
=========================================
Uses IBM Docling to parse PDFs with proper table preservation, formula
extraction as LaTeX, and ML-based layout detection. Outputs tree JSONs
in the same format as build-page-index.py (compatible with embed-sections.py
and hybrid-search.ts) but into a SEPARATE directory so existing indexes
are untouched and results can be compared side by side.

Pipeline:
  1. Docling parses PDF -> DoclingDocument (headings, text, tables, formulas)
  2. Walk iterate_items() -> collect flat heading list with page numbers
  3. Single Groq LLM call -> infer heading hierarchy levels
  4. Build section tree by nesting headings
  5. For each leaf section -> collect text+tables+formulas from items, call
     Groq to generate 2-3 sentence summary + technical_index (compact terms)
  6. Save full tree + lightweight tree (no text) in data/page-indexes-docling/
  7. Update data/page-indexes-docling/catalog.json

Output directory is DELIBERATELY separate from data/page-indexes/ so we can
compare retrieval quality between pymupdf-based and Docling-based indexing.

Usage:
  python3 scripts/build-index-docling.py <pdf_path>
  python3 scripts/build-index-docling.py --batch --limit 10
  python3 scripts/build-index-docling.py --catalog          # rebuild catalog only
"""

import argparse
import glob
import json
import os
import re
import sys
import time
from typing import Any

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

# Output directories (SEPARATE from existing data/page-indexes/)
OUTPUT_DIR = "data/page-indexes-docling"
CATALOG_PATH = os.path.join(OUTPUT_DIR, "catalog.json")

# Summarizer backend. "groq" = fast but shallow, "claude_cli" = Claude Sonnet via
# CLI (much richer summaries; uses Claude Code subscription auth with minimal
# flags that strip the default system prompt overhead to ~4.5k tokens/call).
SUMMARIZER = os.environ.get("DOCLING_SUMMARIZER", "groq")

# Counters for token/cost tracking across a run
_claude_stats = {"calls": 0, "tokens": 0, "cost": 0.0, "time": 0.0, "errors": 0}


# ---------------------------------------------------------------------------
# Groq LLM wrapper (Llama 3.3 70B, key rotation)
# ---------------------------------------------------------------------------

_groq_key_index = 0


def get_groq_keys() -> list[str]:
    keys_str = os.environ.get("GROQ_API_KEYS") or os.environ.get("GROQ_API_KEY", "")
    keys = [k.strip() for k in keys_str.split(",") if k.strip()]
    return keys


def call_groq(prompt: str, max_tokens: int = 500, max_retries: int = 8) -> str:
    """Call Groq Llama 3.3 70B with a simple prompt. Rotates across keys on 429."""
    global _groq_key_index
    import requests

    keys = get_groq_keys()
    if not keys:
        raise RuntimeError("No GROQ_API_KEY(S) set in .env.local")

    for attempt in range(max_retries):
        api_key = keys[_groq_key_index % len(keys)]
        _groq_key_index += 1

        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0,
                    "max_tokens": max_tokens,
                },
                timeout=45,
            )

            if resp.status_code == 429:
                wait = min(60, 10 * (attempt + 1))
                print(f"    Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue

            if resp.status_code != 200:
                print(f"    Groq error {resp.status_code}: {resp.text[:200]}")
                if attempt < max_retries - 1:
                    time.sleep(3)
                    continue
                raise RuntimeError(f"Groq failed: {resp.status_code}")

            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

        except requests.exceptions.RequestException as e:
            print(f"    Network error: {e}")
            if attempt < max_retries - 1:
                time.sleep(3)
                continue
            raise

    raise RuntimeError("Groq: all retries exhausted")


def call_claude_cli(prompt: str, max_retries: int = 3) -> str:
    """Call Claude Sonnet 4.6 via the CLI with minimal-overhead flags.

    Flags used (stripping Claude Code's default ~32k system prompt down to ~4.5k):
      --tools ""                         disable built-in tools
      --disable-slash-commands           skip all skills
      --setting-sources ""               skip user/project/local CLAUDE.md + agents
      --system-prompt "..."              override default system prompt

    Returns the raw text result from Claude. Tracks tokens/cost in _claude_stats.
    """
    import subprocess

    system_prompt = "You are a document analysis assistant. Return only the requested JSON output. No preamble, no explanation."

    cmd = [
        "claude", "-p",
        "--model", "claude-sonnet-4-6",
        "--output-format", "json",
        "--tools", "",
        "--disable-slash-commands",
        "--setting-sources", "",
        "--system-prompt", system_prompt,
    ]

    for attempt in range(max_retries):
        try:
            t = time.time()
            result = subprocess.run(
                cmd, input=prompt, capture_output=True, text=True, timeout=180,
            )
            elapsed = time.time() - t

            if result.returncode != 0:
                err_detail = (result.stderr or result.stdout or "")[:300]
                if attempt < max_retries - 1:
                    wait = 5 * (attempt + 1)
                    print(f"    claude CLI exit {result.returncode}: {err_detail[:100]} (waiting {wait}s)")
                    time.sleep(wait)
                    continue
                _claude_stats["errors"] += 1
                raise RuntimeError(f"claude CLI failed (exit {result.returncode}): {err_detail}")

            try:
                response = json.loads(result.stdout)
            except json.JSONDecodeError:
                if attempt < max_retries - 1:
                    time.sleep(2)
                    continue
                _claude_stats["errors"] += 1
                raise RuntimeError(f"claude CLI returned non-JSON: {result.stdout[:200]}")

            if response.get("is_error"):
                err_text = response.get('result','')[:200]
                if attempt < max_retries - 1:
                    wait = 10 * (attempt + 1)
                    print(f"    claude is_error: {err_text[:100]} (waiting {wait}s)")
                    time.sleep(wait)
                    continue
                _claude_stats["errors"] += 1
                raise RuntimeError(f"claude error: {err_text}")

            # Track usage
            usage = response.get("usage", {})
            total_toks = (
                usage.get("input_tokens", 0)
                + usage.get("cache_creation_input_tokens", 0)
                + usage.get("cache_read_input_tokens", 0)
                + usage.get("output_tokens", 0)
            )
            _claude_stats["calls"] += 1
            _claude_stats["tokens"] += total_toks
            _claude_stats["cost"] += response.get("total_cost_usd", 0)
            _claude_stats["time"] += elapsed

            return response.get("result", "")

        except subprocess.TimeoutExpired:
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            _claude_stats["errors"] += 1
            raise

    raise RuntimeError("claude CLI: all retries exhausted")


def extract_json(text: str) -> Any:
    """Extract JSON object/array from LLM response (handles code fences)."""
    # Strip code fences
    text = re.sub(r"^```(?:json)?\s*", "", text.strip())
    text = re.sub(r"\s*```$", "", text.strip())

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Find first { or [ and matching close
    for start_char, end_char in [("{", "}"), ("[", "]")]:
        start = text.find(start_char)
        if start == -1:
            continue
        depth = 0
        for i in range(start, len(text)):
            if text[i] == start_char:
                depth += 1
            elif text[i] == end_char:
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(text[start : i + 1])
                    except json.JSONDecodeError:
                        break

    raise ValueError(f"Could not extract JSON from: {text[:200]}")


# ---------------------------------------------------------------------------
# Docling parsing
# ---------------------------------------------------------------------------

def parse_pdf_with_docling(pdf_path: str) -> dict:
    """
    Parse a PDF with Docling and return a structured representation:
      {
        "total_pages": int,
        "headings": [{"idx": int, "title": str, "page": int}, ...],
        "items": [{"type": "heading"|"text"|"table"|"formula", "page": int, "content": str, "heading_idx": int or None}, ...]
      }
    """
    from docling.document_converter import DocumentConverter

    print(f"  Parsing with Docling...")
    t = time.time()
    converter = DocumentConverter()
    result = converter.convert(pdf_path)
    doc = result.document
    elapsed = time.time() - t
    print(f"  Docling parse: {elapsed:.1f}s")

    # Get page count from doc
    total_pages = len(doc.pages) if hasattr(doc, "pages") and doc.pages else 0

    headings: list[dict] = []
    items: list[dict] = []
    current_heading_idx: int | None = None

    for item, _level in doc.iterate_items():
        item_type = type(item).__name__
        prov = getattr(item, "prov", None)
        page = 1
        if prov:
            try:
                page = prov[0].page_no
            except Exception:
                pass

        if page > total_pages:
            total_pages = page

        if item_type == "SectionHeaderItem":
            title = (getattr(item, "text", "") or "").strip()
            if not title:
                continue
            current_heading_idx = len(headings)
            headings.append({"idx": current_heading_idx, "title": title, "page": page})
            items.append({
                "type": "heading",
                "page": page,
                "content": title,
                "heading_idx": current_heading_idx,
            })

        elif item_type == "TableItem":
            # Export table as markdown for readability
            try:
                table_md = item.export_to_markdown(doc=doc)
            except Exception:
                try:
                    table_md = item.export_to_markdown()
                except Exception:
                    table_md = ""
            if table_md:
                items.append({
                    "type": "table",
                    "page": page,
                    "content": table_md,
                    "heading_idx": current_heading_idx,
                })

        elif item_type in ("PictureItem",):
            # Skip images (they have no useful text for retrieval)
            continue

        else:
            # Catch-all for TextItem, ListItem, FormulaItem, CodeItem, KeyValueItem,
            # and any other Docling item type that carries textual content.
            # This is the KEY fix: previously we only handled TextItem and missed
            # ListItem entirely, which can dominate FAQ/regulatory documents.
            text = (getattr(item, "text", "") or "").strip()
            if text:
                # Mark list items with a bullet for readability
                prefix = "- " if item_type == "ListItem" else ""
                items.append({
                    "type": item_type.replace("Item", "").lower(),
                    "page": page,
                    "content": prefix + text,
                    "heading_idx": current_heading_idx,
                })

    # Post-processing: detect "label headings" — heading text that repeats 3+
    # times is likely a formatted label ("Address:", "Website:", "Contact point")
    # not a real structural heading. Demote these back to text items.
    from collections import Counter
    heading_counts = Counter(h["title"] for h in headings)
    label_headings = {title for title, count in heading_counts.items() if count >= 3}

    if label_headings:
        print(f"  Demoting {len(label_headings)} repeated label-headings: {list(label_headings)[:5]}")
        clean_headings: list[dict] = []
        clean_items: list[dict] = []
        # Rebuild heading index mapping: old_idx -> new_idx (or None if demoted)
        old_to_new: dict[int, int | None] = {}
        current_valid_heading: int | None = None

        for h in headings:
            if h["title"] in label_headings:
                old_to_new[h["idx"]] = None  # demoted
            else:
                new_idx = len(clean_headings)
                old_to_new[h["idx"]] = new_idx
                clean_headings.append({**h, "idx": new_idx})
                current_valid_heading = new_idx

        # Remap items: demoted headings become text, all items point to nearest valid heading
        current_valid = None
        for item in items:
            if item["type"] == "heading":
                old_idx = item["heading_idx"]
                new_idx = old_to_new.get(old_idx)
                if new_idx is not None:
                    current_valid = new_idx
                    clean_items.append({**item, "heading_idx": new_idx})
                else:
                    # Demote to text
                    clean_items.append({
                        "type": "text",
                        "page": item["page"],
                        "content": item["content"],
                        "heading_idx": current_valid,
                    })
            else:
                # Remap heading_idx to nearest valid heading
                old_idx = item.get("heading_idx")
                if old_idx is not None:
                    new_idx = old_to_new.get(old_idx)
                    if new_idx is not None:
                        current_valid = new_idx
                clean_items.append({**item, "heading_idx": current_valid})

        headings = clean_headings
        items = clean_items

    return {
        "total_pages": total_pages,
        "headings": headings,
        "items": items,
    }


# ---------------------------------------------------------------------------
# Hierarchy inference (single LLM call)
# ---------------------------------------------------------------------------

def _parse_level_array(text: str) -> list[int] | None:
    """Salvage a JSON-ish integer array from text, tolerant of truncation."""
    # Find the opening bracket
    start = text.find("[")
    if start == -1:
        return None
    # Extract numbers one by one until we run out
    nums: list[int] = []
    # Simple regex-based scan: find all integers after the [
    import re
    for m in re.finditer(r"\d+", text[start:]):
        try:
            n = int(m.group())
            if 1 <= n <= 10:  # sanity: real levels are 1-10
                nums.append(n)
        except ValueError:
            pass
    return nums if nums else None


def _infer_levels_chunk(chunk: list[dict], prior_context: list[tuple[str, int]] | None = None) -> list[int]:
    """Infer levels for a chunk of up to ~40 headings. Optionally given prior
    heading→level pairs as anchoring context so the LLM stays consistent."""
    lines = [f"{i + 1}. {h['title']}" for i, h in enumerate(chunk)]
    listing = "\n".join(lines)

    context_block = ""
    if prior_context:
        ctx_lines = [f"  - '{t}' -> level {lvl}" for t, lvl in prior_context[-8:]]
        context_block = "For consistency with the preceding section of the document, here are the levels already assigned to the last few headings:\n" + "\n".join(ctx_lines) + "\n\n"

    prompt = f"""You are analyzing the heading structure of a technical or regulatory document.
Below is a list of headings in document order. Assign each a nesting level.

Rules:
- Document titles and main numbered parts (e.g. "1 INTRODUCTION", "Part I", "Chapter 1") are level 1.
- Subsections (e.g. "1.1", "1.2", "Article 5", "Section 2.3") are level 2.
- Sub-subsections (e.g. "1.1.1", "8.2.4") are level 3.
- Deeper nesting (e.g. "8.2.4.1") gets level 4.
- Use the numbering/visual pattern you observe in this document.

{context_block}Headings to classify ({len(chunk)} total):
{listing}

Return ONLY a JSON array of exactly {len(chunk)} integers. Do not repeat or extend beyond {len(chunk)} values.
Example for 5 headings: [1, 2, 2, 1, 2]

JSON:"""

    # Dynamic max_tokens: ~10 tokens per level entry + buffer
    max_tokens = max(500, len(chunk) * 12 + 100)
    response = call_groq(prompt, max_tokens=max_tokens)

    # Try strict JSON parse first
    try:
        parsed = extract_json(response)
        if isinstance(parsed, list) and all(isinstance(x, int) for x in parsed):
            levels = parsed
        else:
            raise ValueError("not int list")
    except Exception:
        # Salvage mode: regex-scan integers from the response
        salvaged = _parse_level_array(response)
        if not salvaged:
            raise RuntimeError("Could not parse hierarchy response")
        levels = salvaged

    # Trim or pad to chunk size
    if len(levels) >= len(chunk):
        levels = levels[: len(chunk)]
    else:
        # Pad missing with level 2 (moderate guess)
        levels = levels + [2] * (len(chunk) - len(levels))

    return [max(1, min(10, int(l))) for l in levels]


def infer_heading_levels(headings: list[dict]) -> list[int]:
    """
    Infer heading levels (1, 2, 3, ...) from a flat list.
    For large lists (>40 headings) this batches the inference to avoid LLM
    repetition/truncation failures.
    """
    if not headings:
        return []

    CHUNK = 40
    all_levels: list[int] = []
    prior_context: list[tuple[str, int]] = []

    try:
        for start in range(0, len(headings), CHUNK):
            chunk = headings[start : start + CHUNK]
            chunk_levels = _infer_levels_chunk(chunk, prior_context=prior_context)
            all_levels.extend(chunk_levels)
            # Build anchor context for the next chunk from the last few entries
            prior_context = [
                (headings[start + i]["title"][:60], chunk_levels[i])
                for i in range(len(chunk))
            ]
        return all_levels
    except Exception as e:
        print(f"    Hierarchy inference failed: {e}. Falling back to numbering heuristic.")
        # Heuristic fallback: count dots in numbered headings
        import re
        levels: list[int] = []
        for h in headings:
            title = h["title"]
            # Look for leading numbering like "1", "1.2", "1.2.3", "8.2.4.1"
            m = re.match(r"^\s*(\d+(?:\.\d+)*)", title)
            if m:
                dots = m.group(1).count(".")
                levels.append(dots + 1)  # "1" → 1, "1.2" → 2, "1.2.3" → 3
                continue
            # "Article 5", "Chapter 2", "Section 2.3"
            m2 = re.match(r"^\s*(Article|Chapter|Section|Part)\s+(\d+)", title, re.IGNORECASE)
            if m2:
                levels.append(2 if m2.group(1).lower() in ("article", "section") else 1)
                continue
            levels.append(1)
        return levels


# ---------------------------------------------------------------------------
# Section tree construction
# ---------------------------------------------------------------------------

def build_section_tree(parsed: dict, levels: list[int]) -> list[dict]:
    """
    Convert flat heading list + levels into a nested section tree.
    Each section gets: title, level, start_page, end_page, heading_idx, children.
    """
    headings = parsed["headings"]
    total_pages = parsed["total_pages"]

    if not headings:
        return []

    # Flat sections with computed end_page (= page of next heading - 1, or total_pages)
    flat: list[dict] = []
    for i, h in enumerate(headings):
        start_page = h["page"]
        end_page = total_pages
        for j in range(i + 1, len(headings)):
            if levels[j] <= levels[i]:
                end_page = max(start_page, headings[j]["page"] - 1)
                break
            # For end page, we want to include ALL descendant content,
            # so actually we want the page BEFORE the next SAME-OR-HIGHER heading.
        # But also: the trailing headings need end_page = total_pages
        flat.append({
            "title": h["title"],
            "level": levels[i],
            "start_page": start_page,
            "end_page": end_page,
            "heading_idx": h["idx"],
            "children": [],
        })

    # Nest based on levels
    def nest(start_idx: int, parent_level: int) -> tuple[list[dict], int]:
        result = []
        i = start_idx
        while i < len(flat):
            cur = flat[i]
            if cur["level"] <= parent_level:
                break
            # Look ahead for children
            children, next_i = nest(i + 1, cur["level"])
            cur["children"] = children
            result.append(cur)
            i = next_i
        return result, i

    roots, _ = nest(0, 0)
    return roots


# ---------------------------------------------------------------------------
# Section text extraction from Docling items
# ---------------------------------------------------------------------------

def extract_section_text(section: dict, parsed: dict) -> str:
    """
    Walk Docling items and concatenate all content that belongs to this section.
    A section "owns" items whose page is within [start_page, end_page] AND whose
    heading_idx is this section's heading_idx or a descendant heading_idx.

    For leaf sections (no children), we want the section's own content.
    For non-leaf sections, each child carries its own content.

    This function returns only the direct content of the section, not descendants.
    """
    items = parsed["items"]
    heading_idx = section["heading_idx"]

    # Find items whose heading_idx is this exact heading (direct content)
    parts: list[str] = []
    for item in items:
        if item["type"] == "heading":
            continue
        if item["heading_idx"] == heading_idx:
            parts.append(item["content"])

    return "\n".join(parts).strip()


def extract_full_section_text(section: dict, parsed: dict) -> str:
    """
    For leaf sections that have no children, we need their direct text.
    For sections with children, we collect only the section's direct content
    (text between the heading and the first child heading).
    """
    return extract_section_text(section, parsed)


# ---------------------------------------------------------------------------
# Summarize sections (Groq)
# ---------------------------------------------------------------------------

def summarize_leaf(title: str, text: str, start_page: int, end_page: int) -> dict:
    """Generate {summary, technical_index} for a leaf section."""
    truncated = text[:6000] if len(text) > 6000 else text

    prompt = f"""Analyze this section from a technical/regulatory document and produce two outputs.

Section: {title}
Pages: {start_page}-{end_page}

Text:
{truncated}

Return a JSON object with exactly these two fields:
{{
  "summary": "2-3 sentence summary of what this section covers. Be precise and technical.",
  "technical_index": "A compact list of: equation numbers, table numbers, specific parameter names, threshold values, key terms, and methodologies mentioned. Format as a comma-separated list. Max 250 characters."
}}

Return ONLY the JSON, no explanation."""

    try:
        if SUMMARIZER == "claude_cli":
            response = call_claude_cli(prompt)
        else:
            response = call_groq(prompt, max_tokens=500)
        parsed = extract_json(response)
        return {
            "summary": (parsed.get("summary") or "").strip(),
            "technical_index": (parsed.get("technical_index") or "").strip(),
        }
    except Exception as e:
        print(f"    Summarize failed for '{title}': {e}")
        return {"summary": "", "technical_index": ""}


def build_tree_with_summaries(parsed: dict, tree_sections: list[dict]) -> list[dict]:
    """Recursively walk section tree, extract text + summarize each node."""
    result: list[dict] = []

    def walk(section: dict, depth: int = 0) -> dict:
        text = extract_full_section_text(section, parsed)
        is_leaf = not section["children"]

        node_id = f"s{section['start_page']}_{section['end_page']}_{section['heading_idx']}"
        indent = "  " * depth
        print(f"{indent}[{section['level']}] {section['title'][:60]} (pp. {section['start_page']}-{section['end_page']}, {len(text)} chars)")

        summary = ""
        technical_index = ""

        # Summarize both leaves (for retrieval) and non-leaves if they have direct text
        if text and len(text) > 200:
            s = summarize_leaf(section["title"], text, section["start_page"], section["end_page"])
            summary = s["summary"]
            technical_index = s["technical_index"]

        children = [walk(c, depth + 1) for c in section["children"]]

        # Prune empty children: remove leaves that have no text AND no children.
        # These are typically running page headers (e.g., "IFRS S2 ACCOMPANYING
        # GUIDANCE" repeated on every page) that Docling detects as SectionHeaders.
        children = [
            c for c in children
            if c.get("text") or c.get("children")
        ]

        return {
            "node_id": node_id,
            "title": section["title"],
            "level": section["level"],
            "start_page": section["start_page"],
            "end_page": section["end_page"],
            "summary": summary,
            "technical_index": technical_index,
            "text": text,
            "children": children,
        }

    for s in tree_sections:
        result.append(walk(s))

    # Top-level prune: remove root-level empty nodes too
    result = [r for r in result if r.get("text") or r.get("children")]

    return result


# ---------------------------------------------------------------------------
# Document metadata (title + description)
# ---------------------------------------------------------------------------

def get_document_metadata(parsed: dict, fallback_title: str) -> dict:
    """Use first-page text to ask Groq for a document title + one-sentence description."""
    # Gather text from page 1
    first_page = []
    for item in parsed["items"][:40]:
        if item["type"] in ("heading", "text") and item["page"] == 1:
            first_page.append(item["content"])
    text = "\n".join(first_page)[:3000]

    if not text:
        return {"title": fallback_title, "description": ""}

    prompt = f"""From this document's first page, extract:
1. The full document title
2. A one-sentence description (max 200 chars) of what this document covers

First page text:
{text}

Return JSON: {{"title": "...", "description": "..."}}"""

    try:
        response = call_groq(prompt, max_tokens=300)
        data = extract_json(response)
        return {
            "title": (data.get("title") or fallback_title).strip(),
            "description": (data.get("description") or "").strip(),
        }
    except Exception as e:
        print(f"  Metadata extraction failed: {e}")
        return {"title": fallback_title, "description": ""}


# ---------------------------------------------------------------------------
# Lightweight tree (no text, for routing)
# ---------------------------------------------------------------------------

def create_lightweight_tree(tree: dict) -> dict:
    light = {
        "title": tree.get("title", ""),
        "description": tree.get("description", ""),
        "total_pages": tree.get("total_pages", 0),
        "children": [],
    }

    def strip_node(node: dict) -> dict:
        result = {
            "node_id": node["node_id"],
            "title": node["title"],
            "level": node["level"],
            "start_page": node["start_page"],
            "end_page": node["end_page"],
            "summary": node["summary"],
            "children": [strip_node(c) for c in node.get("children", [])],
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

def load_catalog() -> dict:
    if os.path.exists(CATALOG_PATH):
        with open(CATALOG_PATH) as f:
            return json.load(f)
    return {"documents": []}


def save_catalog(catalog: dict) -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(CATALOG_PATH, "w") as f:
        json.dump(catalog, f, indent=2)


def collect_titles(node: dict) -> list[str]:
    titles = [node["title"]]
    for c in node.get("children", []):
        titles.extend(collect_titles(c))
    return titles


def generate_topics(title: str, description: str, tree: dict) -> list[str]:
    """Ask Groq for 5-10 topic tags derived from the tree."""
    all_titles = []
    for child in tree.get("children", []):
        all_titles.extend(collect_titles(child))

    titles_text = "\n".join(f"- {t}" for t in all_titles[:50])

    prompt = f"""Generate 5-10 topic tags for a document catalog entry.

Document: {title}
Description: {description}
Section titles:
{titles_text}

Return JSON: {{"topics": ["topic1", "topic2", ...]}}
Topics should be lowercase, 1-3 words each, useful for query routing."""

    try:
        response = call_groq(prompt, max_tokens=300)
        data = extract_json(response)
        return [t.strip().lower() for t in data.get("topics", []) if t.strip()][:10]
    except Exception:
        return []


def update_catalog(doc_id: str, rel_file: str, title: str, description: str,
                   total_pages: int, course: str, topics: list[str]) -> None:
    catalog = load_catalog()
    catalog["documents"] = [d for d in catalog["documents"] if d.get("id") != doc_id]
    catalog["documents"].append({
        "id": doc_id,
        "file": rel_file,
        "title": title,
        "description": description,
        "course": course,
        "total_pages": total_pages,
        "topics": topics,
    })
    catalog["documents"].sort(key=lambda d: d["id"])
    save_catalog(catalog)


# ---------------------------------------------------------------------------
# Main indexer
# ---------------------------------------------------------------------------

def index_pdf(pdf_path: str) -> str | None:
    """Index a single PDF. Returns output path or None on failure."""
    basename = os.path.splitext(os.path.basename(pdf_path))[0]

    # Derive course from path: src/content/<course>/sources/<file>.pdf
    parts = pdf_path.replace("\\", "/").split("/")
    course = "unknown"
    if "content" in parts:
        ci = parts.index("content")
        if ci + 1 < len(parts):
            course = parts[ci + 1]

    out_dir = os.path.join(OUTPUT_DIR, course)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{basename}.json")
    light_path = os.path.join(out_dir, f"{basename}_light.json")

    print(f"\n{'='*70}")
    print(f"Indexing: {pdf_path}")
    print(f"Output:   {out_path}")
    print(f"{'='*70}")

    # Step 1: Parse with Docling
    try:
        parsed = parse_pdf_with_docling(pdf_path)
    except Exception as e:
        print(f"  Docling parse failed: {e}")
        return None

    print(f"  Extracted: {len(parsed['headings'])} headings, {len(parsed['items'])} items, {parsed['total_pages']} pages")

    if not parsed["headings"]:
        print(f"  No headings detected. Skipping.")
        return None

    # Step 2: Infer hierarchy
    print(f"  Inferring heading hierarchy...")
    levels = infer_heading_levels(parsed["headings"])

    # Step 3: Build section tree
    tree_sections = build_section_tree(parsed, levels)
    print(f"  Built {len(tree_sections)} root sections")

    # Step 4: Get document metadata
    print(f"  Extracting document metadata...")
    meta = get_document_metadata(parsed, fallback_title=basename)

    # Step 5: Build tree with summaries
    print(f"  Summarizing sections...")
    tree_children = build_tree_with_summaries(parsed, tree_sections)

    tree = {
        "title": meta["title"],
        "description": meta["description"],
        "total_pages": parsed["total_pages"],
        "children": tree_children,
    }

    # Step 6: Save full tree + lightweight tree
    with open(out_path, "w") as f:
        json.dump(tree, f, indent=2)
    print(f"  Saved full tree: {out_path}")

    light = create_lightweight_tree(tree)
    with open(light_path, "w") as f:
        json.dump(light, f, indent=2)
    print(f"  Saved light tree: {light_path}")

    # Step 7: Update catalog
    topics = generate_topics(meta["title"], meta["description"], tree)
    doc_id = f"{course}/{basename}"
    rel_file = f"{course}/{basename}.json"
    update_catalog(doc_id, rel_file, meta["title"], meta["description"],
                   parsed["total_pages"], course, topics)
    print(f"  Updated catalog: {doc_id}")

    # Report Claude stats if we used the CLI backend
    if SUMMARIZER == "claude_cli" and _claude_stats["calls"] > 0:
        s = _claude_stats
        avg_toks = s["tokens"] // s["calls"]
        avg_cost = s["cost"] / s["calls"]
        avg_time = s["time"] / s["calls"]
        print(f"\n  Claude CLI stats (this run):")
        print(f"    Calls:    {s['calls']}")
        print(f"    Tokens:   {s['tokens']:,} total, {avg_toks:,} avg/call")
        print(f"    Cost:     ${s['cost']:.4f} total, ${avg_cost:.4f} avg/call")
        print(f"    Time:     {s['time']:.1f}s total, {avg_time:.1f}s avg/call")
        print(f"    Errors:   {s['errors']}")

    return out_path


def is_valid_pdf(path: str) -> bool:
    """Check if a file is actually a PDF by reading the magic bytes (%PDF-)."""
    try:
        with open(path, "rb") as f:
            header = f.read(5)
        return header == b"%PDF-"
    except Exception:
        return False


def find_all_source_pdfs() -> list[str]:
    all_pdfs = sorted(glob.glob("src/content/*/sources/*.pdf"), key=os.path.getsize)
    valid = []
    invalid = []
    for p in all_pdfs:
        if is_valid_pdf(p):
            valid.append(p)
        else:
            invalid.append(p)
    if invalid:
        print(f"Skipping {len(invalid)} invalid (non-PDF) files:")
        for p in invalid[:10]:
            print(f"  - {os.path.basename(p)}")
        if len(invalid) > 10:
            print(f"  ... and {len(invalid) - 10} more")
        print()
    return valid


def batch_index(limit: int | None = None, skip_existing: bool = True):
    pdfs = find_all_source_pdfs()

    if skip_existing:
        remaining = []
        for p in pdfs:
            basename = os.path.splitext(os.path.basename(p))[0]
            parts = p.replace("\\", "/").split("/")
            course = "unknown"
            if "content" in parts:
                ci = parts.index("content")
                if ci + 1 < len(parts):
                    course = parts[ci + 1]
            out_path = os.path.join(OUTPUT_DIR, course, f"{basename}.json")
            if not os.path.exists(out_path):
                remaining.append(p)
        skipped = len(pdfs) - len(remaining)
        if skipped:
            print(f"Skipping {skipped} already-indexed PDFs")
        pdfs = remaining

    if limit:
        pdfs = pdfs[:limit]

    print(f"Found {len(pdfs)} PDFs to index\n")

    success = 0
    failed = 0
    for i, pdf in enumerate(pdfs):
        print(f"\n[{i+1}/{len(pdfs)}] {os.path.basename(pdf)}")
        try:
            result = index_pdf(pdf)
            if result:
                success += 1
            else:
                failed += 1
        except Exception as e:
            print(f"  FAILED: {e}")
            failed += 1

    print(f"\n{'='*70}")
    print(f"Batch complete: {success} success, {failed} failed")
    print(f"{'='*70}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", nargs="?", help="PDF path to index")
    parser.add_argument("--batch", action="store_true", help="Index all source PDFs")
    parser.add_argument("--limit", type=int, default=None, help="Limit batch to N PDFs")
    args = parser.parse_args()

    if args.batch:
        batch_index(limit=args.limit)
    elif args.pdf:
        index_pdf(args.pdf)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
