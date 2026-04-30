# SustainIQ Docling Migration — Progress & Decisions Log

## Current state (as of this session)

A parallel, higher-quality indexing pipeline has been built alongside the existing pymupdf-based pipeline. Outputs land in `data/page-indexes-docling/` so nothing in the existing `data/page-indexes/` is disturbed. Both sets of indexes can be compared side by side.

**25 PDFs re-indexed with Docling so far** across 12 course folders, spanning small regulatory clarifications (2 pages) to flagship methodologies (209-page PCAF Part A).

## Decisions made

### 1. Parser: Docling replaces pymupdf for extraction
pymupdf-based indexing had structural failures — 107 reversed page ranges across ~50 PDFs, silent content loss on table-heavy docs, and no formula/table preservation. Docling (IBM) uses ML layout detection, preserves tables as markdown, and respects reading order.

**Why:** On IFRS S2 Illustrative Guidance, pymupdf captured 2,350 characters across 13 leaves with 10 of them having reversed page ranges. Docling captured 80,835 characters across 40 leaves with zero reversals. Quantitative proof that Docling is a significant step up.

**Side effect:** Docling output goes to `data/page-indexes-docling/` (a new directory). The old `data/page-indexes/` remains untouched and still powers live retrieval via `section-embeddings.json` until re-embedding happens.

### 2. Hierarchy inference: single-LLM-call approach, batched
Docling detects all headings as level 1. A single Groq call was added to infer nesting levels (1, 2, 3, 4...) from a flat heading list.

**Problem found:** On documents with >100 headings (VM0042, GHG Protocol, PCAF Part A), the LLM hallucinated repetition ("3, 3, 3, 3, 3...") until it hit max_tokens, producing truncated JSON the parser couldn't handle. The silent fallback put everything at level 1.

**Fix applied:**
- Batch inference into chunks of 40 headings at a time
- Pass the last 8 `(heading, level)` pairs from the previous chunk as anchoring context so levels stay consistent across boundaries
- Added a regex salvage parser that pulls integers from malformed/truncated responses
- Added a numbering-pattern heuristic fallback (`"8.2.4"` → level 3, `"Article 5"` → level 2) if the LLM completely fails

### 3. Summarization: Claude CLI with minimal flags
Groq Llama 3.3 70B was the initial summarizer. It was fast (free) but produced noticeably shallower summaries and technical indexes compared to what Claude Sonnet produced in the original pymupdf pipeline.

**Quality gap measured on `electricityemissions.pdf`:**

| | Groq | Claude Sonnet 4.6 |
|---|---|---|
| Leaves summarized | 24/29 | 24/29 |
| Avg summary length | 328 chars | 450 chars |
| Avg tech_index length | 76 chars | 207 chars |
| Total searchable terms in tech_index | 133 | 270 (+103%) |

Claude catches specific identifiers that Groq misses (`"EPA 430-R-23-002"`, `"CBECS"`, `"direct-line connection"`, `"baseload, intermediate, peaking units"`, etc.) — exactly the kind of terms that match keyword queries at retrieval time.

**Claude CLI token optimization finding:**

The default `claude -p` call consumes ~33,000 tokens per invocation because Claude Code's session setup (tool definitions, CLAUDE.md auto-discovery, agents, skills) is re-sent on every call.

Tested flag combinations:

| Flags | Tokens/call | Cost/call |
|---|---|---|
| Default `claude -p` | 33,120 | $0.085 |
| `+ --tools ""` | 31,902 | $0.12 |
| `+ --disable-slash-commands` | 33,124 | $0.013 (cache hit) |
| `+ --system-prompt minimal` | 26,141 | $0.10 |
| All of the above combined | 25,249 | $0.011 |
| **`+ --setting-sources ""`** | **4,491** | **$0.005** |

The `--setting-sources ""` flag cuts 86.5% of the overhead by preventing Claude CLI from loading user, project, and local settings (CLAUDE.md, custom agents, user skills). Those are useful for interactive coding but pure overhead for one-shot summarization.

**Final summarizer command:**
```bash
claude -p \
  --model claude-sonnet-4-6 \
  --output-format json \
  --tools "" \
  --disable-slash-commands \
  --setting-sources "" \
  --system-prompt "You are a document analysis assistant. Return only the requested JSON output. No preamble, no explanation."
```

**Verified on electricityemissions.pdf (19 pages, 29 leaves):**
- 30 Claude calls, 0 errors
- 121,417 tokens total, 4,047 avg per call
- $0.51 total, $0.017 avg per call
- 180s total (~6s/call)

**Extrapolated to full 120-PDF corpus (~2,400 leaves):** ~$41 one-time indexing cost with dramatically richer summaries and technical indexes.

**Note:** The first run had 13/30 failures due to short 2–3 second retries after transient errors. Fixed by scaling retry waits to 10–60 seconds. Second run: 0 errors.

### 4. Retrieval reranker: Voyage AI `rerank-2`
Before Docling was on the table, a cross-encoder reranker was added to the retrieval path at `src/lib/reranker.ts`. Hybrid search now retrieves top 25 candidates and Voyage `rerank-2` narrows to top 5. Uses the same `VOYAGE_API_KEY` as embeddings — no new key needed.

**Why Voyage over Jina/Cohere:** The `VOYAGE_API_KEY` was already configured. Provider switching is a 10-line change if another provider performs better later.

### 5. Embedding provider: Voyage AI `voyage-4-lite`
The earlier migration from Cloudflare Workers AI BGE-base to Voyage `voyage-4-lite` stands. The endpoint is `https://ai.mongodb.com/v1/embeddings` (Voyage is now part of MongoDB, the old `api.voyageai.com` rejects new keys). Free tier: 3 RPM, 10K TPM.

## Artifacts produced

| Path | Contents |
|---|---|
| `scripts/build-index-docling.py` | New Docling-based indexer. Supports `DOCLING_SUMMARIZER=groq` (default) or `DOCLING_SUMMARIZER=claude_cli`. Outputs tree JSONs matching the existing format. |
| `scripts/embed-sections.py` | Unchanged from before — reads tree JSONs from any directory and writes embeddings. Currently points at `data/page-indexes/`. |
| `src/lib/reranker.ts` | Voyage AI rerank-2 wrapper with graceful fallback to RRF order when no key is set. |
| `src/lib/hybrid-search.ts` | Modified to retrieve top 25, rerank to top 5. |
| `data/page-indexes-docling/` | 25 Docling-indexed PDFs (parallel to `data/page-indexes/`). |
| `brainstorming/SUSTAINIQ_QUALITY_ROADMAP.md` | Overall quality strategy (prior session). |

## Quality deltas measured so far (25 PDFs)

| Metric | pymupdf (old) | Docling (new) | Δ |
|---|---|---|---|
| Total nodes | 458 | 1,508 | 3.3x |
| Total leaves | 395 | 1,385 | 3.5x |
| Unique leaf text | ~2.1M chars | ~2.9M chars | +38% |
| Reversed page ranges (broken) | 107 | 0 | -100% |
| Markdown tables preserved | 0 | 184 | ∞ |

## Known open issues

1. **Empty-leaf pollution:** Docling treats running page headers (e.g., `"IFRS S2 CLIMATE-RELATED DISCLOSURES"` repeated on every page) as section headings, producing leaves with no content. Count across 25 PDFs: ~118 empty leaves. Fix: prune leaves that have no text AND no children before writing the tree.

2. **Label-heading fragmentation:** Documents with formatted labels like `"Address:"`, `"Website:"`, `"Contact point:"` get those labels detected as repeated headings, fragmenting real content. Affected 1 of 25 PDFs (EC-CBAM-NCA-List). Fix: detect any heading text that repeats 3+ times in a document, treat it as a label, merge its content into the preceding real heading.

3. **Summary richness gap with Groq:** Resolved — switching to Claude CLI with minimal flags closes the gap. Groq remains as a fallback for speed.

4. **Docling summarization coverage:** The initial electricityemissions run with Claude had 13 silent failures. Fixed by extending retry waits. Verified with a second run: 0 errors.

5. **Rate limiting during big-batch indexing:** Running multiple 200+ section documents back-to-back can saturate Groq TPM caps. The new batched hierarchy inference is more tolerant but still needs a cooldown between docs.

## What has NOT been done yet

- **Re-indexing all 25 Docling PDFs with Claude CLI summarizer.** Only `electricityemissions.pdf` has been processed end-to-end with Claude. The other 24 still have Groq-generated summaries and technical indexes.
- **Re-embedding the Docling trees.** `section-embeddings.json` still points at the old `data/page-indexes/` pymupdf trees. The Docling indexes are not yet searchable via `/ask`.
- **Testing retrieval quality on the Docling trees.** This is the next logical step and what the user is now asking about.
- **Empty-leaf prune.** Known fix, not yet applied.
- **Label-heading merge.** Known fix, not yet applied.
- **Scaling Docling indexing to the remaining ~95 PDFs.** Only the first 25 have been processed.

## Next actions (in priority order)

1. Re-embed the Docling indexes (either as a separate `section-embeddings-docling.json` or by switching the main index pointer) so retrieval can actually hit Docling content.
2. Run side-by-side retrieval tests: same query against old index vs Docling index, compare top-5 results.
3. Re-summarize the 24 existing Docling PDFs with Claude CLI.
4. Apply the two known tree fixes (empty-leaf prune, label-heading merge) and re-run.
5. Scale indexing to the remaining ~95 PDFs.
