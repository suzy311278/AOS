# SustainIQ Pipeline Integration Brief (Redesign `/ask` Page)

## What You're Integrating

A working AI retrieval pipeline is currently running at the test page `/ask-test`. Your job is to bring the same functionality into the existing redesign page at `/redesign/ask` while preserving its existing visual design, layout, components, and animations. This is a **data-layer integration**, not a UI rewrite.

---

## System Architecture

```
Browser
  │
  ▼
Next.js app (src/app/redesign/ask/...)
  │   POST /api/ask/stream   (SSE)
  │   GET  /api/pdfs/resolve?doc=...
  │   GET  /api/ask          (health check)
  ▼
Next.js API routes (thin proxies)
  │
  │ (forwards to process.env.ASK_SERVER_URL)
  │    - in dev:  http://127.0.0.1:5100
  │    - in prod: https://trailer-prices-toe-moms.trycloudflare.com
  ▼
Cloudflare Tunnel (quick-tunnel, ephemeral)
  │
  ▼
Local Python server (scripts/ask-server.py) on port 5100
  │ - holds ~600 MB of voyage-context-3 embeddings in RAM
  │ - orchestrates: intent → plan → retrieve → synth → factcheck → revise
  │ - calls Groq (GPT-OSS-120B for synth/revise, Llama-4-Scout for factcheck,
  │   Llama-3.1-8B-instant for intent) and Voyage AI (embed + rerank)
  │ - streams SSE events back

PDFs are served separately from Cloudflare R2:
  https://pub-4cc1b87074b84e1c8f4bdb7e6a646c27.r2.dev/<course>/<filename>.pdf
```

Three things must be running for the pipeline to be reachable:
1. Python server on laptop: `python3 scripts/ask-server.py`
2. Cloudflare Tunnel on laptop: `cloudflared tunnel --url http://localhost:5100`
3. Mac kept awake

In local dev (`npm run dev`), Next.js talks to `http://127.0.0.1:5100` directly — tunnel not required. The tunnel is only needed when Next.js is deployed to Vercel and must reach the laptop from the internet.

---

## Scope — Files You Will Modify

All within the redesign's `/ask` subtree:

```
src/app/redesign/ask/
├── page.tsx                                  ← server component wrapper; update metadata only
├── _components/
│   └── AskClientRedesign.tsx                 ← ~51 KB; data-layer swap happens here
└── _lib/                                     ← add shared helpers here (SSE parser, citation utils, phase constants)
```

- **`page.tsx`** — existing wrapper. You may update `metadata` if copy has changed; otherwise leave alone.
- **`_components/AskClientRedesign.tsx`** — existing client built against the **old** pipeline (custom SSE format `{type: "text", content: "..."}`). Replace its fetch and state logic with the new pipeline. **Preserve all visual styling, components, and animations already in this file.**
- **`_lib/`** — co-located helpers directory. Read what's already there and reuse utilities that fit. Add new helpers here when extracting logic from the reference: SSE event parser, citation regex + parser, phase labels, distinctive-phrase extractor, etc.

That's your full scope. Two TypeScript files plus optional helpers in `_lib/`.

---

## Files You Must NOT Modify

| Path | Why |
|------|-----|
| `scripts/*.py` | Python pipeline is finalized. |
| `src/app/api/ask/**` | SSE proxy contracts are stable. |
| `src/app/api/pdfs/**` | PDF resolver and streaming contracts are stable. |
| `public/pdfjs/**` | Mozilla PDF.js viewer, patched to disable downloads/print. |
| `src/app/ask-test/**` | Canonical working reference; keep intact for regression testing. |
| `data/page-indexes-docling-test/**` | Indexes loaded by Python. |
| `src/content/**/sources/**.pdf` | Source PDFs (also uploaded to R2). |

---

## Files To Read (Priority Order)

1. **`src/app/ask-test/AskTestClient.tsx`** — THE reference. ~700 lines. Every behavior you need is implemented here. Read end-to-end before touching the redesign file.
2. **`src/app/ask-test/page.tsx`** — trivial wrapper, just shows the route shape.
3. **`src/app/redesign/ask/page.tsx`** — existing wrapper.
4. **`src/app/redesign/ask/_components/AskClientRedesign.tsx`** — the target. Read fully to understand the existing layout, state flow, component structure, and design tokens in use.
5. **`src/app/redesign/ask/_lib/*`** — any helpers already defined.
6. **`src/app/api/ask/stream/route.ts`** — SSE proxy (contract reference).
7. **`src/app/api/ask/route.ts`** — blocking proxy + `GET /api/ask` health check.
8. **`src/app/api/pdfs/resolve/route.ts`** — citation → R2 URL resolver.
9. **`src/app/api/pdfs/[course]/[filename]/route.ts`** — local PDF streaming fallback.
10. **`public/pdfjs/web/viewer.html`** — read-only; viewer is patched to disable download, print, open-file, and `Cmd+S/P/O` shortcuts.

---

## API Contracts

### `POST /api/ask/stream`

Request:
```json
{ "query": "user question here", "enable_revise": true }
```

Response: Server-Sent Events (`Content-Type: text/event-stream`). Each line is `data: <JSON>\n\n`. The stream ends with `data: [DONE]\n\n` and closes.

Event types, in typical emission order:

| Event | Payload | Emitted |
|-------|---------|---------|
| `{"type":"phase","phase":"intent"}` | — | Intent classification starting |
| `{"type":"intent","intent":"FACTUAL"\|"ADVISORY"}` | — | Intent decided |
| `{"type":"phase","phase":"plan"}` | — | ADVISORY only: planner starting |
| `{"type":"topics","topics":[...]}` | 3–6 topics | ADVISORY only: plan output |
| `{"type":"phase","phase":"retrieval"}` | — | Retrieval starting |
| `{"type":"sources","sources":[...]}` | array | Retrieval complete (before any draft tokens) |
| `{"type":"phase","phase":"synthesis"}` | — | Synthesis starting |
| `{"type":"draft_token","delta":"…"}` | string fragment | **Streamed, many events** during draft generation |
| `{"type":"phase","phase":"factcheck"}` | — | ADVISORY only: fact-check starting |
| `{"type":"grounding","stats":{...}}` | see schema | ADVISORY only: fact-check complete |
| `{"type":"phase","phase":"revise"}` | — | ADVISORY only: revise starting (only if unsupported/partial claims exist) |
| `{"type":"revised","answer":"…"}` | full markdown string | Final answer (replaces the streamed draft) |
| `{"type":"timings","timings":{...}}` | see schema | Pipeline timing breakdown |
| `{"type":"phase","phase":"done"}` | — | Pipeline complete |
| `{"type":"error","message":"…"}` | string | Pipeline errored (display to user) |

#### Topic schema
```ts
{
  topic: string;
  focus: "procedural" | "decision" | "definition" | "risk" | "example" | "requirement";
}
```

#### Source object schema
```ts
{
  doc_title: string;        // "VM0042v2.2"
  section_title: string;    // "8.2.4 Carbon Dioxide Emissions from Liming"
  page: string;             // "39" or "14-15"
  course: string;           // "vm0042"
  content?: string;         // chunk text, first ~1500 chars - needed for search-highlight seeding
  type?: "chunk" | "definition" | "formula";
  vec_score?: number;       // 0..1 cosine similarity
}
```

#### Grounding stats schema
```ts
{
  total_claims: number;
  grounded: number;
  partial: number;
  unsupported: number;
  unsupported_claims: string[];  // specific claim texts stripped by the revise step
  partial_claims: string[];
}
```

#### Timings schema
```ts
{
  intent_ms?: number;
  plan_ms?: number;
  retrieval_ms?: number;
  synth_ms?: number;         // advisory
  synthesis_ms?: number;     // factual fast path
  factcheck_ms?: number;
  revise_ms?: number;
  total_ms: number;
}
```

### `GET /api/ask`

Health check. Returns `{status:"ok", chunks, definitions, formulas}` when the Python server is reachable, 503 otherwise. Use this to show server status in the UI.

### `GET /api/pdfs/resolve?doc=<doc_title>&page=<page>`

Takes a citation's doc title and page number. The resolver normalises titles (case, whitespace, punctuation) so the LLM's citation format doesn't have to match the catalog verbatim.

Response:
```ts
// success
{
  available: true;
  url: string;            // R2 public URL - use this in the PDF viewer iframe
  fallback_url: string;   // local /api/pdfs/... route (rarely needed)
  page: number;           // parsed first page number
  doc_title: string;
  course: string;
  total_pages: number;
}
// failure
{
  available: false;
  reason: "no_catalog_match" | "pdf_not_found_on_disk" | "fetch_error";
}
```

### `GET /api/pdfs/[course]/[filename]`

Streams a PDF from local disk (fallback when R2 is unavailable). HTTP range requests supported. Normally unused because resolver returns R2 URLs first.

---

## PDF Viewer URL Format

The resolver returns an R2 URL like:
```
https://pub-4cc1b87074b84e1c8f4bdb7e6a646c27.r2.dev/vm0042/VM0042v2.2.pdf
```

To load it in the patched PDF.js viewer with page jump + search highlight, construct:
```
/pdfjs/web/viewer.html?file=<URL_ENCODED_R2_URL>#page=<N>&search=<URL_ENCODED_PHRASE>&phrase=true&highlightAll=true
```

Rules learned the hard way:
- **`phrase=true` requires verbatim match.** Use a **consecutive substring** of the chunk text (it was extracted from the PDF's text layer by Docling, so a consecutive snippet will match).
- **Word-by-word search** (`phrase` omitted) highlights every occurrence of every word - noisy and unusable. Don't.
- **`highlightAll=true`** is required - without it, matches aren't visible.
- The patched viewer lives at `/pdfjs/web/viewer.html` (Next.js serves `public/pdfjs/`). Already deployed.
- The viewer has had download/print/open buttons removed and `Cmd+S/P/O` shortcuts blocked. Don't re-enable.

---

## Environment Variables

### Local dev (`.env.local`)
No changes needed for the ask pipeline. `ASK_SERVER_URL` defaults to `http://127.0.0.1:5100`.

### Vercel deployment (project env settings)
Add exactly one variable:
```
ASK_SERVER_URL=https://trailer-prices-toe-moms.trycloudflare.com
```

**Caveat:** this is a Cloudflare "quick tunnel" URL. It changes every time `cloudflared` restarts. When the developer restarts the tunnel, they update the Vercel env var and redeploy. Don't hard-code this URL anywhere in client or server code - always read from `process.env.ASK_SERVER_URL`.

No env var needed for PDFs - the R2 public URL is in the resolver route's source (`src/app/api/pdfs/resolve/route.ts`), overridable via `PDF_R2_BASE_URL`.

---

## Dependencies

Confirm these are present in `package.json`:

```json
{
  "react-markdown": "...",
  "remark-gfm": "...",
  "pdfjs-dist": "4.10.38"
}
```

If missing:
```bash
npm install react-markdown remark-gfm pdfjs-dist@4.10.38
```

Note: `pdfjs-dist` is installed but we do **not** import from it at runtime. The viewer assets in `public/pdfjs/` are from Mozilla's prebuilt distribution download, not from the npm package. The npm install is mostly for TypeScript types if needed.

---

## State You Must Track In The Client

| State | Type | Purpose |
|-------|------|---------|
| `query` | `string` | Input value |
| `phase` | `"idle" \| "intent" \| "plan" \| "retrieval" \| "synthesis" \| "factcheck" \| "revise" \| "done"` | Drives the phase tracker UI and enables/disables the submit button |
| `intent` | `"FACTUAL" \| "ADVISORY" \| null` | Shown as a badge; also gates ADVISORY-only UI |
| `topics` | `Topic[] \| null` | Research plan for ADVISORY queries |
| `sources` | `Source[]` | Retrieved chunks, with `content` needed for citation-click search hints |
| `draft` | `string` | Accumulates `draft_token` deltas |
| `revised` | `string \| null` | Final revised answer. Show `revised ?? draft`. |
| `grounding` | `GroundingStats \| null` | Fact-check stats + flagged claims |
| `timings` | `Timings \| null` | Per-phase durations |
| `activeCitation` | `CitationParts \| null` | Which citation the user clicked; opens the drawer |
| Resolver cache | `useRef<Map<string, ResolveResult>>` | Cache `/api/pdfs/resolve` responses keyed by lowercased doc title |
| In-flight cache | `useRef<Map<string, Promise<ResolveResult>>>` | Dedup concurrent resolver calls (important for hover prefetch) |

---

## Behaviors To Implement

1. **Submit query** → `fetch("/api/ask/stream", { method: "POST", body: JSON.stringify({ query, enable_revise: true }) })`. Consume response body as a `ReadableStream`, parse SSE events line by line, update state.

2. **Show provisional draft** while `revised === null` - the answer text area should visibly signal "not yet verified." When `revised` arrives, replace `draft` with `revised` and update the indicator to "verified."

3. **Citation pills** - parse the streaming answer text for bracketed citations using the regex + `isCitationLike()` filter from the reference. Render each match as a clickable + hoverable button. Apply this to every markdown component that contains text: `p`, `li`, `td`, `strong`, `em`, `blockquote`, `h1/h2/h3`.

4. **Hover prefetch (200 ms delay)** - on pill `onMouseEnter`, start a 200 ms timer; on fire, call the resolver and also range-fetch the first 1 KB of the PDF to warm browser cache. Cancel the timer on `onMouseLeave`.

5. **Click prefetch** - immediately call the resolver (cache-aware) and set `activeCitation` to open the drawer.

6. **Source drawer** - right-side panel (or wherever the redesign's information density pattern places supplementary panels). Shows: claim sentence (via `findSentenceForCitation(revised ?? draft, citation.raw)`), search-hint badge (from `extractDistinctivePhrase`), PDF.js iframe, and footer with "Other search hints" chips for fallbacks. Closes on Esc, backdrop click, or explicit close action.

7. **Grounding panel** - if `grounding.unsupported_claims.length > 0`, display the list of flagged claims (these have already been stripped from the revised answer, but users should know what was removed).

8. **Timings panel** - optional but present in the reference; collapsible.

9. **Error state** - if an `error` event arrives or the fetch fails, show the message clearly and reset the phase to `"idle"` so the user can retry.

10. **Health check badge** - on mount, call `fetch("/api/ask")`. If it returns `{status:"ok"}`, show a subtle "server ready" indicator; if 503, show "server unavailable" with the hint from the response.

---

## Helpers To Extract Into `_lib/`

Based on the reference, these are natural candidates for `_lib/` so they can be unit-tested and reused:

- `_lib/citations.ts` - `CITATION_RE`, `isCitationLike`, `parseCitation`, `renderWithCitations`, `findSentenceForCitation`
- `_lib/highlight.ts` - `extractDistinctivePhrase`, `buildHighlightFallbacks`, `STOPWORDS`
- `_lib/sse.ts` - generic SSE line parser that yields typed events
- `_lib/pipeline-types.ts` - TypeScript interfaces for all SSE event payloads (`Topic`, `Source`, `GroundingStats`, `Timings`, `ResolveResult`, etc.)
- `_lib/resolver-cache.ts` - the `Map`-based resolver cache + in-flight dedup logic

The reference has all of this inline in one ~700-line file. You can either keep it inline or extract into `_lib/`; either is valid. Extracting is cleaner for a 51 KB client.

---

## Testing Checklist

After integrating, verify on the redesign `/ask` page:

| Test | Expected |
|------|----------|
| Load page with Python server running | Health indicator shows "ready"; chunks/defs/formulas counts visible if applicable |
| Load page with Python server stopped | Health indicator shows "unavailable" or similar; submit button disabled |
| Submit `What is baseline period for VM0042?` | Intent → FACTUAL. Answer streams token-by-token. Total ~3-5 s on warm server. |
| Submit `How do I know if a carbon offset is credible?` | Intent → ADVISORY. Plan topics appear. Draft streams in "provisional" state. After a pause, revised version replaces it with "verified" state. Grounding stats visible. |
| Hover a citation pill for 200 ms without clicking | Network tab shows `/api/pdfs/resolve` + the R2 PDF range request. |
| Click a citation pill | Drawer opens, PDF.js loads, page jumps, yellow highlight on the distinctive phrase. |
| Click same pill again | Drawer opens instantly (cache hit, no network). |
| Press Esc with drawer open | Drawer closes. |
| Inside drawer PDF, try `Cmd+S` / `Cmd+P` | Nothing happens (already blocked in the viewer). |
| Answer contains a markdown table | Renders correctly (via `remark-gfm`). |
| Answer contains citation inside an `<em>` or `<blockquote>` | Pill still renders (citation detection runs in all text components). |
| Stop Python server mid-stream | Error message surfaces; UI recovers to idle. |

---

## Gotchas

1. **First query after server start is slow (~10 s)** - Voyage embedding cold start. Subsequent queries are fast. Don't misdiagnose as a bug.
2. **SSE parsing must handle partial chunks.** Maintain a string buffer, split on `\n`, pop the incomplete trailing line back into the buffer on the next iteration.
3. **Citation rendering must apply to many markdown components.** The reference applies `renderWithCitations` to `p`, `li`, `td`, `strong`, `em`, `blockquote`, and all heading levels. Miss any and citations in that position won't become pills.
4. **`phase === "idle" || "done"`** means the user can submit a new query. Anything else = pipeline running = disable submit.
5. **Sources arrive BEFORE the first `draft_token` event.** Store them immediately; the click-to-source feature depends on having them ready.
6. **Claim-sentence extraction uses the answer text.** `findSentenceForCitation(revised ?? draft, citation.raw)`. Works incrementally during streaming too.
7. **`phrase=true` in the PDF.js URL requires a verbatim consecutive substring of the chunk text.** The `extractDistinctivePhrase` in the reference picks exactly this. Do not pass reconstructed/concatenated distinctive-word phrases - they won't exist in the PDF text layer and will fail to highlight.
8. **The R2 URL and the tunnel URL in env are real.** Don't mock them. They work.
9. **If `_lib/` already has helpers with the same names, reconcile before duplicating.** Read `_lib/` fully first.
10. **Do not delete or edit `src/app/ask-test/*`.** It's the regression reference.

---

## One-Paragraph Summary

> You are integrating a working streaming RAG pipeline (draft → factcheck → revise, with PDF source preview) into the existing redesign page at `src/app/redesign/ask/page.tsx` + `src/app/redesign/ask/_components/AskClientRedesign.tsx` + `src/app/redesign/ask/_lib/`. The Python backend, API routes, PDF.js viewer, PDFs on R2, and Cloudflare tunnel are all configured and finalized - do not modify them. Your scope is exactly the redesign page wrapper, its client component, and its `_lib/` helpers directory. Read `src/app/ask-test/AskTestClient.tsx` as your reference - it implements every behavior the redesign page needs. The SSE contract is documented above (types: `phase`, `intent`, `topics`, `sources`, `draft_token`, `grounding`, `revised`, `timings`, `done`, `error`). The PDF preview works by resolving citations to R2 URLs via `/api/pdfs/resolve` and loading them in the patched PDF.js viewer at `/pdfjs/web/viewer.html` with `phrase=true&highlightAll=true`. **Preserve the redesign's existing visual layout, components, animations, and design tokens; swap only the fetch and state logic and splice in the new features using the redesign's existing visual system.**
