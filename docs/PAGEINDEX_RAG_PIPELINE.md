# PageIndex RAG Pipeline

## Overview

The Sustainability Academy includes an AI-powered knowledge search feature at `/ask` that lets users ask natural language questions about sustainability standards, carbon markets, ESG frameworks, and related topics. Answers are grounded in source documents (PDFs) with page-level citations.

The system uses **PageIndex**, a vectorless, reasoning-based retrieval approach. Instead of embedding documents into vector space (traditional RAG), PageIndex builds hierarchical tree indexes that mirror each document's natural structure. At query time, an LLM reasons over these trees to find relevant sections, then synthesizes an answer from the retrieved page text.

This approach was chosen over vector RAG because the source material consists of regulatory and technical documents (Verra methodologies, GHG Protocol, SBTi standards, EU regulations) where:

- Documents have deep hierarchical structure (chapters, sections, subsections)
- Cross-referencing between sections is common
- Precise terminology matters (similar words mean very different things)
- Tables, formulas, and thresholds lose meaning when chunked into arbitrary fragments

## Architecture

```
INDEXING (one-time per PDF, runs locally)
=========================================

  Source PDFs (src/content/*/sources/*.pdf)
       |
       v
  scripts/build-page-index.py
  - Extracts text page-by-page (pymupdf)
  - Detects TOC structure (Claude Sonnet 4.6 via CLI)
  - Splits large sections into subsections
  - Generates summaries per section
       |
       v
  data/page-indexes/
  - <course>/<pdf>.json         (full tree with page text, for retrieval)
  - <course>/<pdf>_light.json   (tree structure + summaries only, for navigation)
  - catalog.json                (master index mapping documents to topics)


QUERY TIME (per user question)
=========================================

  User question
       |
       v
  /api/ask (Next.js API route)
       |
       |-- Step 1: Route to relevant documents
       |   (keyword matching against catalog topics, no LLM call)
       |
       |-- Step 2: Pick relevant sections
       |   (Groq Llama 3.3 70B picks from numbered section list)
       |   Input: ~2K tokens. Output: comma-separated numbers.
       |
       |-- Step 3: Load page text for selected sections
       |   (read from full tree JSON, cap at 6K chars per section)
       |
       |-- Step 4: Synthesize answer (streaming)
       |   (Groq Llama 3.3 70B with ~4K tokens context)
       |
       v
  Streamed answer with page-level citations + source references
```

## File Structure

```
LearningPlatform/
  scripts/
    build-page-index.py          # Indexing pipeline (Python)
  data/
    page-indexes/
      catalog.json               # Master document catalog
      batch-log.txt              # Log from batch indexing runs
      <course-id>/
        <pdf-name>.json          # Full tree index (with page text)
        <pdf-name>_light.json    # Light tree index (navigation only)
  src/
    lib/
      groq-keys.ts               # Groq API key rotation manager
    app/
      api/ask/
        route.ts                 # Query API endpoint
      ask/
        page.tsx                 # Page component (metadata)
        _components/
          AskClient.tsx          # Chat UI with streaming + citations
  .pageindex-lib/                # Cloned PageIndex repo (reference only)
```

## Indexing Pipeline

### How It Works

The indexing script (`scripts/build-page-index.py`) processes each PDF through four steps:

**Step 1: Extract PDF text.** Uses pymupdf to extract text from every page. Each page becomes `{page: number, text: string, tokens_approx: number}`.

**Step 2: Detect table of contents.** Sends the first 20 pages to Claude Sonnet 4.6 (via the `claude` CLI) and asks it to find and extract the TOC as a nested JSON structure. The prompt requires all levels of nesting (sections, subsections, sub-subsections up to 4 levels deep). If no TOC is found, the script falls back to generating structure from content.

**Step 2b: Split large sections.** After TOC detection, any leaf node spanning more than 10 pages gets a second Claude call that scans the page text for sub-headings and creates child nodes. This ensures no single retrievable section is too large. The threshold is set by `MAX_PAGES_PER_LEAF = 10`.

**Step 3: Build tree with summaries.** For each section node, the script:
- Assigns end pages based on the next section's start page
- Extracts the full text for that page range
- Sends the text to Claude to generate a 2-3 sentence summary
- Stores everything in a tree structure with `node_id`, `title`, `level`, `start_page`, `end_page`, `summary`, `text`, and `children`

**Step 4: Save outputs.** Two files per PDF:
- Full tree JSON (includes page text for retrieval, typically 200-800 KB)
- Light tree JSON (structure + summaries only, no text, typically 10-50 KB)
- Updates `catalog.json` with document metadata and auto-generated topic keywords

### Running the Indexer

```bash
# Index a single PDF
python3 scripts/build-page-index.py src/content/vm0042/sources/VM0042v2.2.pdf

# Index a single PDF with custom output path
python3 scripts/build-page-index.py src/content/vm0042/sources/VM0042v2.2.pdf --output custom/path.json

# Batch index all unindexed PDFs (skips already-indexed ones)
python3 scripts/build-page-index.py --batch

# Rebuild catalog.json from existing index files
python3 scripts/build-page-index.py --catalog
```

### Skip List

The batch indexer skips certain PDFs defined at the top of the `batch_index` section:
- **Course skip:** `esg-investing` (all PDFs in this course are skipped)
- **File skip:** `Illustrative Disclosure.pdf` (KPMG PDF in IFRS S2)

To modify, edit `SKIP_COURSES` and `SKIP_FILES` in `build-page-index.py`.

### Dependencies

Python 3.10+, installed via pip:
- `pymupdf` (PDF text extraction)
- `litellm` (LLM abstraction, installed with PageIndex but not used directly)
- `PyPDF2`, `python-dotenv`, `pyyaml`

The script calls the `claude` CLI (Claude Code) with `--model claude-sonnet-4-6` for all LLM operations. No Anthropic API key needed since it uses the CLI's authentication.

### Performance

- A 16-page PDF takes ~2-3 minutes (1 TOC call + 5-10 summary calls + 1 topics call)
- A 167-page PDF with deep nesting takes ~8-12 minutes
- The batch run for 144 PDFs takes several hours
- Each Claude CLI call takes 10-40 seconds depending on input size

### Tree Index Format

```json
{
  "title": "VM0042: Improved Agricultural Land Management",
  "description": "A VCS methodology covering...",
  "total_pages": 167,
  "children": [
    {
      "node_id": "s5_5",
      "title": "SUMMARY DESCRIPTION",
      "level": 1,
      "start_page": 5,
      "end_page": 5,
      "summary": "VM0042 v2.2 is an agricultural land management...",
      "text": "Full page text here... (only in full tree, not light)",
      "children": []
    },
    {
      "node_id": "s19_85",
      "title": "QUANTIFICATION OF REDUCTIONS AND REMOVALS",
      "level": 1,
      "start_page": 19,
      "end_page": 85,
      "summary": "...",
      "text": "...",
      "children": [
        {
          "node_id": "s42_46",
          "title": "8.2.9 Nitrous Oxide Emissions from Nitrogen Fertilizers",
          "level": 3,
          "start_page": 42,
          "end_page": 46,
          "summary": "...",
          "text": "...",
          "children": []
        }
      ]
    }
  ]
}
```

Node IDs follow the pattern `s{start_page}_{end_page}`.

### Catalog Format

```json
{
  "documents": [
    {
      "id": "vm0042/VM0042v2.2",
      "file": "vm0042/VM0042v2.2.json",
      "title": "VM0042: Improved Agricultural Land Management",
      "description": "A VCS methodology...",
      "course": "vm0042",
      "total_pages": 167,
      "topics": ["VM0042", "agricultural land management", "soil organic carbon", ...]
    }
  ]
}
```

## Query Endpoint

### API Route: POST /api/ask

**Request:**
```json
{ "query": "What is the equation for N2O from nitrogen fertilizers?" }
```

**Response:** Server-Sent Events (SSE) stream with three event types:
```
data: {"type":"text","content":"The equation..."}     // Streamed answer tokens
data: {"type":"sources","sources":[...]}               // Source references (sent at end)
data: [DONE]                                           // Stream complete
data: {"type":"error","content":"Error message"}       // On failure
```

### Query Flow Detail

**Step 1: Route to documents (no LLM call).** Keyword matching scores each document in the catalog against the query. Topics, title words, and description words contribute to the score. Top 3 scoring documents are selected. This is instant and costs zero tokens.

**Step 2: Pick sections (1 Groq call, ~100 output tokens).** The system builds a numbered list of all leaf sections across the selected documents. Only leaf nodes (sections without children) get numbers, because these are the retrievable units with specific page text. Parent nodes are listed for context but cannot be selected.

The LLM sees something like:
```
Document: VM0042: Improved Agricultural Land Management
  SUMMARY DESCRIPTION (pp. 5-5)
    [1] SUMMARY DESCRIPTION (pp. 5-5) VM0042 v2.2 is an agricultural...
  QUANTIFICATION OF REDUCTIONS AND REMOVALS (pp. 19-85)
    Summary (pp. 19-23)
      [5] Summary (pp. 19-23) Section 8.1 describes the framework...
    Baseline Emissions (pp. 24-46)
      [6] 8.2 Baseline Emissions (pp. 24-28) Section 8.2 covers two...
      [7] 8.2.1.2 Sampling Design (pp. 29-31) ...
      ...
      [14] 8.2.9 Nitrous Oxide Emissions (pp. 42-46) ...
```

The LLM replies with just numbers: `14, 18, 5`

Parsing is trivial: `text.match(/\d+/g)`. No JSON parsing, no title matching. This is the key design decision that makes the system robust across any number of documents.

**Step 3: Load page text.** For each selected section number, the system loads the corresponding node's full text from the full tree JSON. Text is capped at 6,000 characters (~1.5K tokens) per section to control total token usage.

**Step 4: Synthesize answer (1 Groq call, streaming).** The retrieved page text is assembled into a context block with document name, section title, and page range headers. The system prompt instructs the LLM to:
- Answer based only on the provided context
- Write naturally and conversationally
- Cite using exact document names with page numbers
- Be honest when the context doesn't cover the question

Total context sent to synthesis is capped at 16,000 characters (~4K tokens).

### Token Budget Per Query

| Step | Input tokens | Output tokens | Total |
|------|-------------|---------------|-------|
| Route (keyword) | 0 | 0 | 0 |
| Section picking | ~1,500-2,500 | ~50-100 | ~2,500 |
| Synthesis | ~3,000-5,000 | ~500-2,000 | ~6,000 |
| **Total** | | | **~6,000-8,500** |

### Groq API Key Rotation

The system supports multiple Groq API keys for handling rate limits. Configuration is in `.env.local`:

```
GROQ_API_KEYS=gsk_key1,gsk_key2,gsk_key3
```

The rotation manager (`src/lib/groq-keys.ts`) tracks two dimensions per key:
- **Daily token usage:** Each key has a 70,000 token/day budget. Once exceeded, the key is skipped.
- **RPM cooldown:** When a key returns a 429 (rate limited), it enters a 65-second cooldown period.

The Groq SDK is configured with `maxRetries: 0` to prevent its internal retry logic from hanging. Instead, our code catches the 429 error, marks the key as cooling down, and immediately tries the next available key. With 6 keys, the system can rotate through all of them before failing.

### Error Handling

- **All keys rate-limited:** Returns HTTP 429 with a user-friendly message
- **No documents indexed:** Returns HTTP 503
- **No relevant content found:** Returns HTTP 404
- **Stream interruption:** Sends an error SSE event so the frontend can display it
- **Network/timeout errors:** Treated the same as rate limits (key rotation)

## Frontend

### Chat UI (`/ask`)

The frontend is a single-page chat interface at `/ask` with:

- **Empty state:** Search icon, description, and 4 suggested questions
- **User messages:** Green bubbles aligned right
- **Assistant messages:** White cards with green AI avatar, containing:
  - Formatted answer text (headings, bullets, numbered lists, bold)
  - Inline citations rendered as amber pills with document icon
  - Loading animation (bouncing dots + "Searching documents...")
  - Error state (red bordered box)
- **Source references:** Listed below each answer as clickable cards showing document name, section title, and page range. Currently link to the course page (`/courses/{courseId}`)
- **Input:** Textarea with Enter-to-submit, green send button

### Response Formatting

The frontend parses the streamed text and renders:
- `## Heading` and `### Heading` as styled section headers
- `- bullet` items as green-dotted lists
- `1. numbered` items as lists with green circular badges
- `**bold text**` as semibold
- `(Document Name, p. XX)` citations as amber styled pills

## Production Deployment Considerations

### Current State (Development)

The `/api/ask` endpoint runs as a Next.js serverless function. For local development this works well. For production on Vercel free tier, the 10-second function timeout may be too tight for the 2-call LLM chain.

### Recommended Production Setup

1. **Cloudflare Worker** for the query endpoint: Zero cold starts, no timeout on streaming, free tier covers 100K requests/day. The Next.js app proxies `/api/ask` to the Worker via a Vercel rewrite.

2. **Cloudflare KV** for tree index storage: Load light tree JSONs from KV instead of filesystem. Near-instant reads from edge.

3. **Rate limiting per user:** Use Clerk user ID to enforce per-user query limits. Track in Turso.

### Cost at Scale

- **Indexing (one-time):** Uses Claude Code CLI, covered by existing subscription
- **Per query:** ~6-8K Groq tokens = approximately $0.005 per query
- **Groq free tier:** 14,400 requests/day. With 2 calls per query, supports ~7,200 queries/day
- **Storage:** Tree index JSONs are small (total ~50-100 MB for all documents), no vector database needed

## Monitoring and Debugging

### Batch Indexing Progress

```bash
# Check how many PDFs have been indexed
grep "^Done!" data/page-indexes/batch-log.txt | wc -l

# Check for errors during batch indexing
grep "ERROR" data/page-indexes/batch-log.txt

# See what's currently being processed
tail -20 data/page-indexes/batch-log.txt

# Count documents in catalog
python3 -c "import json; d=json.load(open('data/page-indexes/catalog.json')); print(len(d['documents']), 'documents indexed')"
```

### Query Debugging

The Groq key rotation manager logs key switches to the console. To inspect key usage:

```typescript
import { getUsageStats } from "@/lib/groq-keys";
console.log(getUsageStats());
// [{ key: "gsk_H7Y3...", tokens: 12450, remaining: 57550, coolingDown: false, date: "2026-03-25" }]
```

## Adding New Documents

When new source PDFs are added to any course's `sources/` directory:

```bash
# Index just the new PDF
python3 scripts/build-page-index.py src/content/<course>/sources/<new-file>.pdf

# Or re-run batch to pick up all unindexed PDFs
python3 scripts/build-page-index.py --batch
```

The dev server (or production deployment) picks up new index files on the next query automatically. No restart needed since the catalog and tree files are read from disk on each request.

## Key Design Decisions

1. **Numbered section list over JSON node IDs.** The LLM returns `3, 7, 12` instead of `{"results": [{"doc_title": "...", "node_ids": ["s42_46"]}]}`. Parsing numbers from text is effectively unbreakable. JSON title matching was fragile and failed intermittently.

2. **Only leaf nodes are selectable.** Parent nodes appear in the list for context but don't get numbers. This prevents the LLM from selecting a 37K-token mega-section when specific 2K-token subsections exist.

3. **Keyword routing before LLM.** Step 1 uses zero tokens. With 90+ documents, sending all tree structures to the LLM would be too expensive. Keyword scoring narrows to 3 documents first.

4. **Two separate Groq calls instead of one.** Splitting navigation and synthesis means each call has a small, focused prompt. Combined, they use fewer tokens than a single large prompt, and the section-picking call needs only ~100 output tokens.

5. **Claude CLI for indexing, Groq for querying.** Indexing is one-time and benefits from Claude's superior document understanding. Querying needs speed (Groq does ~300 tokens/sec) and low cost.

## Evolution: Hybrid Retrieval (v2)

The initial design used two Groq LLM calls per query (section picking + synthesis). After Gemini CLI audit and iterative testing, the retrieval was redesigned to use hybrid vector + keyword search, eliminating one Groq call entirely.

### What Changed

**Indexing now generates "technical indexes"** alongside summaries. Each leaf section gets a compact metadata string listing equation numbers, table numbers, parameter names, threshold values, and key terms. Example:
```
"Eq 15, Eqs 16-25, N2O_soilbsl, GWPN2O, EFNdirect, FSN, FON, direct/indirect N2O, 44/28 molar ratio"
```

**A new embedding pipeline** (`scripts/embed-sections.py`) pre-computes 768-dim vectors for all leaf sections using Cloudflare Workers AI (`bge-base-en-v1.5`, free tier). Embedding text includes parent-child hierarchy for context:
```
"VM0042 > Quantification > Baseline Emissions > 8.2.4 Liming. Eq 8-9, EFLimestone=0.12, EFDolomite=0.13, 44/12 ratio"
```

**Query-time retrieval** (`src/lib/hybrid-search.ts`) combines:
1. **Vector search:** Embed query via Cloudflare, cosine similarity against all section embeddings
2. **Keyword search:** BM25-style term matching on technical indexes, with heavy boost for exact equation/table number patterns
3. **Reciprocal Rank Fusion:** Merge both ranked lists into a single score

### Revised Pipeline

```
Per query:
  Cloudflare embed query      →  0 Groq tokens, ~170ms
  Cosine + keyword match      →  0 Groq tokens, ~3ms
  Groq: synthesize answer     →  ~5K tokens, ~1.5s streaming
  Total: ~5K tokens, 1 Groq call, ~1.7s to first token
```

### Why This Is Better

| Metric | v1 (LLM routing) | v2 (Hybrid) |
|--------|------------------|-------------|
| Groq calls per query | 2 | 1 |
| Tokens per query | ~11K | ~5K |
| Rate limit pressure | High | Half |
| Retrieval accuracy | Good (LLM reasoning) | Good (vector + keyword + technical indexes) |
| Equation/table lookup | Poor | Strong (keyword boost) |

### Running the Embedding Pipeline

```bash
# After batch indexing completes (or after adding new PDFs):
python3 scripts/embed-sections.py

# This takes ~10 seconds for ~500 sections
# Output: data/page-indexes/section-embeddings.json
# The API route auto-detects this file and uses hybrid search
```

### Cloudflare Workers AI Setup

The embedding pipeline uses your existing Cloudflare account (same one used for R2 audio hosting). No additional setup needed. The OAuth token is read from `~/.wrangler/config/default.toml` (set up by `wrangler login`).

- Account ID: `3f9c15f554c0aa209451c1769627716f`
- Model: `@cf/baai/bge-base-en-v1.5` (768 dimensions)
- Free tier: 10,000 neurons/day (~500-1000 queries/day)

## Current Status (2026-03-25)

### What is built and working

- **Indexing pipeline** with technical indexes (the key quality improvement identified during Gemini audit)
- **Hybrid search:** Cloudflare BGE vector search + BM25 keyword matching on technical indexes, merged via Reciprocal Rank Fusion
- **SustainIQ branded frontend** with streaming, formatted answers (headings, bullets, numbered lists, inline citation pills), source reference cards
- **11 of 144 PDFs indexed** (batch v3 stopped due to Claude CLI rate limiting), 410 leaf sections embedded
- **1 Groq call per query** (down from 2), ~5K tokens per query (down from ~11K)
- **Equation/table number keyword boost** for exact lookups (e.g., "Equation 33" directly matches "Eq 33" in technical indexes)
- **Excluded sections filter** to prevent REFERENCES and DOCUMENT HISTORY from appearing in results

### Batch indexing progress

| Batch | PDFs completed | Status |
|-------|---------------|--------|
| v1 (summaries only) | 17 | Superseded by v2 |
| v2 (with technical indexes) | 4 | Failed (Claude CLI rate limit) |
| v3 (with technical indexes) | 11 | Stopped manually (rate limit) |
| Remaining | 133 | Pending |

### Quality audit results

Gemini CLI was used to audit the pipeline. Top 3 findings:

1. **Keyword routing is semantically blind** (Pain Point 1): "leased vehicle emissions" should route to Scope 3 but keyword matching picks Scope 1-2. Fixed by hybrid vector + keyword search. Tested: LLM routing picks correctly (Scope 3), embeddings alone fail, hybrid works.

2. **Truncated summaries kill section picking** (Pain Point 2): 100-char summary truncation made sections look identical. Fixed by generating structured technical indexes per section with equation numbers, parameters, tables. This was rated 8/10 impact.

3. **6000-char cap misses deep content** (Pain Point 3): 44-page sections only show first 7% of content. Partially fixed by auto-splitting large nodes. Remaining issue: tabular content without clear sub-headings.

### Embedding approach evaluation

Tested multiple approaches for document/section routing:

| Approach | Accuracy | Tokens | Rate limit impact |
|----------|----------|--------|-------------------|
| Keyword matching | Poor on cross-domain | 0 | None |
| Pure embedding (document level) | Failed on domain logic ("leased vehicles" -> wrong doc) | 0 | None |
| Pure embedding (section level with technical indexes) | 10/12 correct | 0 | None |
| LLM routing (Groq, 22 docs) | 5/5 correct | 640 | Moderate |
| Hybrid embedding + LLM rerank | Correct, 260 tokens | 260 | Minimal |
| **Hybrid vector + BM25 keyword (implemented)** | **10/12 correct, equation boost fixes 1 more** | **0** | **None** |

Gemini recommended the hybrid vector + BM25 approach as production-ready. Key insight: technical indexes are the "secret sauce" that bridges general embeddings and domain-specific precision.

### Response quality observations (from user testing)

1. **"Explain Equation 33"** - System failed to find it. Root cause: the Leakage section (pp. 50-53) containing Eq 33 wasn't ranked high enough. Fix implemented: equation number keyword boost pattern matching `Eq X`, `Eqs X-Y` ranges in technical indexes.

2. **"Where does the uncertainty come from?"** - System pulled correct content (Appendix 6) but also irrelevant content (REFERENCES section, Climate Science report about decision-making). Two issues: (a) REFERENCES section filtered out now. (b) Cross-document drift when follow-up questions lose conversation context.

## Open Questions

1. **Conversation context for follow-up queries.** When a user asks "Where does the uncertainty come from?" after discussing VM0042, the system should understand the implicit context. Approach: extract document/section references (VM0042, Scope 3, etc.) from recent chat history and append to the search query to bias retrieval. This is NOT about filtering documents out (a broader question should search broadly), it is about enriching the query with conversational context so embeddings naturally gravitate toward the right sections. Implementation started in the API route (extracting regex patterns from history) but not completed or tested.

2. **Parallel batch indexing across CLI providers.** Claude CLI rate limits are the bottleneck (133 PDFs remaining). Three CLI providers available:
   - Claude CLI (`claude -p --model claude-sonnet-4-6`): current indexer, rate limited
   - Gemini CLI (`gemini -p`): uses Gemini model, different rate limits
   - Codex CLI (`codex exec`): uses GPT-5, different rate limits
   Plan: split remaining PDFs across 3 providers, run in parallel for ~3x throughput. Requires quality comparison test first (same PDF indexed by all 3, compare TOC detection and technical index quality).

3. **Large tabular sections that resist splitting.** "Data and Parameters Monitored" (44 pages) in VM0042 contains parameter tables without clear section headings. The `split_large_nodes` function couldn't find sub-headings to split on. Options: (a) table-aware splitting that detects parameter name changes, (b) chunk by fixed page count (e.g., every 8 pages), (c) accept it and rely on keyword matching to find specific parameters within the 6000-char window.

4. **Embedding refresh automation.** After batch indexing finishes, `python3 scripts/embed-sections.py` must be re-run manually to update `section-embeddings.json`. Options: (a) add as post-step in `build-page-index.py --batch`, (b) add to the npm build pipeline, (c) auto-detect stale embeddings in the API route and warn.

5. **Production deployment.** Current setup is local dev on Vercel free tier (10s function timeout). Options:
   - Cloudflare Worker for query endpoint: zero cold starts, no streaming timeout, free tier 100K req/day. Next.js app proxies to it.
   - Vercel Pro ($20/mo): 60s timeout, simpler (keep everything in one place)
   - Hybrid: Vercel serves the app, Cloudflare Worker handles `/api/ask`

6. **Formula rendering.** PDF-extracted mathematical formulas appear as garbled Unicode (subscripts, Greek letters rendered as raw codepoints). Options: (a) instruct the synthesis LLM to rewrite formulas in plain ASCII notation, (b) add LaTeX/KaTeX rendering in the frontend, (c) accept current quality for now.

7. **Full accuracy validation after all PDFs indexed.** The 10/12 test was on VM0042 only. Need to test cross-document queries once all 90+ documents are indexed, especially:
   - Queries spanning multiple standards ("Compare SBTi and IFRS S2 Scope 3 requirements")
   - Queries using informal language ("How do I report my company's pollution?")
   - Queries about EU regulations (multilingual content extracted from EU PDFs may have quality issues)
