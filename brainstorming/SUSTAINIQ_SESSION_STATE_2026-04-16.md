# SustainIQ Session State — 2026-04-16

Resume-point document covering everything built, decided, and still open from the pipeline build session. A future Claude session (or you, cold) can use this as the entry point.

---

## What We Built This Session

### 1. Retrieval + Synthesis Pipeline (Python, running locally)

A multi-phase RAG pipeline orchestrated by `scripts/ask-server.py`, serving on `localhost:5100`. Holds ~600 MB of embeddings in RAM, streams SSE events over HTTP.

**Pipeline phases:**
- **Intent classifier** (Llama 3.1 8B Instant) → FACTUAL or ADVISORY
- **Planner** (GPT-OSS-120B) → 3–6 research topics for ADVISORY queries
- **Retrieval** — hybrid vector + BM25 over 3 indexes:
  - Chunks: 24,337 (voyage-context-3, 1024 dim)
  - Definitions: 1,073 (separately extracted + embedded)
  - Formulas: 449 (separately extracted + embedded, with variable tables)
  - RRF fusion across indexes, diversity enforcement, cross-encoder reranking (Voyage rerank-2.5)
  - Per-sub-query retrieval + round-robin merge for multi-framework queries
- **Synthesis** (GPT-OSS-120B, streaming) → initial draft with markdown + tables + citations
- **Fact-checker** (Llama 4 Scout 17B MoE) → extracts every specific claim, verifies each against retrieved context
- **Reviser** (GPT-OSS-120B) → removes unsupported claims, preserves structure

**Models chosen:**
- Synthesis/revise: GPT-OSS-120B (~$0.00128/query, strongest structure)
- Fact-check: Llama 4 Scout (cheap, fast, local-friendly)
- Intent: Llama 3.1 8B Instant (fast classifier)

**Cost per advisory query: ~$0.003 total. Factual ~$0.0008.**

### 2. Next.js Proxy Layer

- `POST /api/ask/stream` — SSE proxy to Python server
- `POST /api/ask` — blocking proxy + `GET /api/ask` health check
- `GET /api/pdfs/resolve?doc=...` — citation → R2 URL resolver (fuzzy title match against catalog)
- `GET /api/pdfs/[course]/[filename]` — local PDF streaming fallback

All routes forward to `process.env.ASK_SERVER_URL` (default `http://127.0.0.1:5100`, or Cloudflare tunnel in prod).

### 3. PDF Infrastructure

- **157 PDFs uploaded to Cloudflare R2** bucket `greentryst-pdfs`
- **Public URL:** `https://pub-4cc1b87074b84e1c8f4bdb7e6a646c27.r2.dev`
- **CORS configured** for `localhost:5001`, `greentryst.com`, `*.vercel.app`
- **Mozilla PDF.js viewer** installed at `public/pdfjs/web/viewer.html`, patched to:
  - Disable download, print, open-file buttons
  - Block `Cmd+S/P/O` keyboard shortcuts
  - Block right-click context menu
  - Allow cross-origin files from our R2 bucket (`ALLOWED_FILE_ORIGINS` whitelist)

### 4. Cloudflare Tunnel (Ephemeral)

- `cloudflared tunnel --url http://localhost:5100` — exposes local Python server to the internet
- Current URL: `https://trailer-prices-toe-moms.trycloudflare.com` (changes on restart)
- No authentication; intended for demo only

### 5. Test Page — `/ask-test`

Full client implementation at `src/app/ask-test/AskTestClient.tsx` (~700 lines). Features:
- Streaming SSE consumer
- Phase tracker (intent → plan → retrieval → synthesis → factcheck → revise)
- Provisional draft display (faded + amber "verifying" pill) until revised answer lands
- Citation pills (regex + `isCitationLike` filter)
  - Hover prefetch at 200ms
  - Click to open source drawer
  - Resolver cache with in-flight dedup
- PDF source drawer:
  - Right-side slide-in
  - PDF.js iframe with page + phrase search highlighting
  - Claim sentence displayed above PDF
  - Search hint badge + alternative hint chips
- Grounding stats panel (grounded / partial / unsupported counts)
- Timings panel
- Sources consulted list (clickable)

### 6. Smart Phrase Extraction for PDF Highlight

`extractDistinctivePhrase()` picks a **consecutive** 4–6 word substring from chunk text (scored by numbers, proper nouns, acronyms, technical terms). Combined with `phrase=true&highlightAll=true` on PDF.js, highlights the exact cited location in one yellow box.

---

## Documents Already Saved

| Path | Purpose |
|------|---------|
| `brainstorming/SUSTAINIQ_PIPELINE_INTEGRATION_BRIEF.md` | Complete handoff brief for porting the pipeline UI into the redesign `/ask` page. Contains full SSE contract, API reference, file list, test checklist. |
| `brainstorming/SUSTAINIQ_IMPROVEMENT_BACKLOG.md` | Prioritized backlog of all non-retrieval improvements. Covers infrastructure, security, product, UX, content ops, evaluation, commercial, and hidden risks. Ranked by impact/effort. |
| `brainstorming/SUSTAINIQ_SESSION_STATE_2026-04-16.md` | This document. Resume-point summary. |

External reference read during session (lives outside this repo):
- `/Users/knowprajjwal/autoresearch/AUTORESEARCH_APPLIED_GUIDE.md` — Karpathy-style autonomous improvement loop methodology. Applicable to every pipeline stage.

---

## Key Architectural Decisions (and Why)

### Why Python + not pure Next.js?
Three reasons:
1. **Memory persistence.** 600 MB of embeddings need to stay resident; Vercel functions are stateless.
2. **Indexing ecosystem.** Docling (PDF parsing) is Python-only; Voyage contextualized embeddings are Python-canonical.
3. **Iteration speed.** Could build alongside the existing Next.js routes without rewriting everything.
Migration path to Node-only exists (vector DB + move logic) but is ~1–2 weeks of work and not urgent.

### Why GPT-OSS-120B for synthesis (not Llama 3.3 70B)?
Groq pricing flipped our assumption: GPT-OSS-120B is actually **52% cheaper** per query than Llama 3.3 70B ($0.00128 vs $0.00266) AND produces better structured output (tables, decision matrices, specific thresholds). Llama 70B is Pareto-dominated. Llama 4 Scout is cheaper than both but noticeably weaker on structure.

### Why the revise loop (not flag-and-move-on)?
First audit showed **56% of specific claims** in initial drafts were not grounded in retrieved sources. Flagging alone leaves fabrications visible. Revise loop brings it to **0% unsupported** in final answer. Cost: ~2x synthesis, still <$0.003/query total.

### Why PDF.js (not browser-native viewer)?
Chrome's built-in PDFium viewer silently ignores `#search=` URL parameter (tested exhaustively). PDF.js reliably honors `phrase=true&highlightAll=true`. Bundle cost +400 KB, quality benefit is much larger.

### Why consecutive phrase (not distinctive tokens)?
Reconstructed distinctive-word phrases don't exist verbatim in PDF text → `phrase=true` returns 0 matches. Consecutive substrings DO exist (chunk came from PDF's text layer via Docling) → exact match, one focused highlight.

---

## Known Issues / Open Problems

### Corpus Quality (the big one we discovered)

Audit of actual retrieval for a Scope 3 query surfaced multiple issues:
1. **982 noise chunks** (4% of corpus) with section titles like `References`, `Glossary`, `CONTENTS`, `DOCUMENT HISTORY` — these compete with real content.
2. **Duplicate PDFs across courses** — SBTi Corporate Net Zero Standard indexed under BOTH `sbti` and `vcm-101`; GRI-1 Foundation under BOTH `double-materiality` and `esg-benchmarking`.
3. **Definition extraction noise** — e.g. PCAF's "Business loans and corporate bonds" matches on "What is Scope 3?" because its body text mentions all three scopes, even though the term isn't about Scope 3.
4. **Generic textbook content** (`esg-investing/2021-Chapter3`) matches broadly on every ESG topic and competes with primary sources.
5. **No source authority weighting** — GHG Protocol (canonical) treated equal to a consultant blog post.

**Proposed broad solution:** Corpus Quality Framework with 4 layers:
- Layer 1 — Auditors (12 proposed, A1–A12): scan corpus for specific issue classes
- Layer 2 — Indexing quality gates: enforce audit rules at ingestion
- Layer 3 — Retrieval telemetry: per-query metrics logged for anomaly detection
- Layer 4 — Gold set regression: curated queries run after any corpus change

Not yet built. See "Next Steps" below.

### Infrastructure Fragility

- Cloudflare tunnel URL is ephemeral — changes on restart, requires Vercel env var + redeploy
- Python server is a SPOF — if Mac sleeps, whole thing goes down
- No structured audit logging yet (stdout only)
- No auth on `/api/ask` — anyone with URL can burn Groq budget
- PDFs on R2 are publicly accessible (most are copyrighted — IFRS, Verra, etc.)

### Hallucination Risks

- Fact-checker (Llama 4 Scout) could itself hallucinate verdicts — no second-pass verification
- Prompt injection possible if a PDF contains adversarial text (retrieved → synthesizer might obey)

### Model / Prompt Non-determinism

- Same query today vs tomorrow may give subtly different answers
- No version pinning or reproducibility infrastructure

---

## Strategic Roadmap Agreed

### 90-Day Path To "Clearly Best In Class"

**Month 1 — Foundation:**
- Build audit framework (Layer 1 auditors)
- Curate gold set (100 queries from real practitioner experience + adversarial variants)
- Implement Layer 2 quality gates
- Baseline metrics
- Weekly quality review ritual starts

**Month 2 — Authority + relationships:**
- Source authority tier rubric (tier 1–3 weights in retrieval)
- Cross-framework relationship graph (SBTi ↔ GHG Protocol, CSRD ↔ IFRS S2, etc.)
- Adversarial eval pass (deliberately try to trigger dangerous misconceptions)
- First external practitioner validation

**Month 3 — Trust features:**
- Out-of-scope detection (tool says "outside my corpus" explicitly)
- Versioning infrastructure (prompt version, model version, corpus snapshot per answer)
- Confidence calibration (surface uncertainty)
- Public quality metrics dashboard

### Four Moats We're Building
1. **Curated gold set** (domain-expert work, hard to copy)
2. **Authority-weighted corpus** (explicit tiers, not blind cosine)
3. **Cross-framework graph** (encoded relationships)
4. **Public quality metrics** (demonstrable trust story)

### Working Model
- **Daily:** async unblocking on judgment calls
- **Weekly:** 2-hour quality review — 20 outputs reviewed, binary rubric + free-form observations
- **Monthly:** 3-hour strategy + roadmap session

### Intensity Curve
- Months 1–3: ~3 hrs/week commitment from domain expert
- Months 4–6: ~2 hrs/week
- Months 7–12: ~1 hr/week
- Month 13+: ~30 min/week + monthly strategy

Eventually delegatable to a trained junior analyst (target month 9–12).

---

## Infrastructure URLs / Credentials

| Thing | URL / value |
|-------|-------------|
| Python server (local) | `http://localhost:5100` |
| Cloudflare tunnel (ephemeral) | `https://trailer-prices-toe-moms.trycloudflare.com` |
| R2 PDFs public URL | `https://pub-4cc1b87074b84e1c8f4bdb7e6a646c27.r2.dev` |
| R2 bucket name (PDFs) | `greentryst-pdfs` |
| R2 bucket name (audio, existing) | `greentryst-audios` |
| R2 audio public URL | `https://pub-033ee478bfa542229216e3781c99cb96.r2.dev` |
| Groq API keys | in `.env.local` as `GROQ_API_KEYS=` (comma-separated, 6 keys) |
| Voyage API key | in `.env.local` as `VOYAGE_API_KEY=` |

Vercel env var needed to point at tunnel:
```
ASK_SERVER_URL=https://trailer-prices-toe-moms.trycloudflare.com
```

---

## File / Path Reference

### Working pipeline files
```
scripts/
├── ask-server.py                  # HTTP server with /ask, /ask/stream, /health
├── retrieval-advisor.py           # Orchestrator: run_production, run_production_stream, 
│                                  # intent, planner, synthesis, fact-check, revise
├── retrieval-fusion.py            # Core retrieval: search_chunks/defs/forms, RRF, rerank
├── embed-voyage-context.py        # Chunk embedder with semantic chunking
├── extract-definitions.py         # Definition extraction
├── extract-formulas.py            # Formula extraction (+ variable tables)
├── embed-definitions-formulas.py  # Embed defs/formulas in same vector space
├── index-docling-zero-llm.py      # Docling PDF parser with hierarchy inference
├── upload-pdfs-to-r2.sh           # R2 upload script
├── r2-cors.json                   # CORS rules applied to greentryst-pdfs bucket
├── test-end-to-end.py             # E2E test with timing breakdown
├── test-disciplined-llama.py      # Experiment: disciplined Llama vs GPT-OSS
├── test-synthesis-models.py       # Three-way synthesis model comparison
├── test-fact-checker.py           # Fact-check pass test
└── test-revise-loop.py            # Full revise-loop test
```

### Next.js files
```
src/app/
├── ask-test/
│   ├── page.tsx                        # Wrapper
│   └── AskTestClient.tsx              # FULL REFERENCE — ~700 lines
├── ask/                                # Non-redesign page (old, not updated)
│   ├── page.tsx
│   └── _components/AskClient.tsx      # Uses OLD pipeline — broken since /api/ask rewrite
├── redesign/ask/                       # TARGET for integration
│   ├── page.tsx
│   ├── _components/AskClientRedesign.tsx  # ~51 KB, needs data-layer swap
│   └── _lib/                              # Helpers directory
└── api/
    ├── ask/
    │   ├── route.ts                    # Blocking proxy + /health
    │   └── stream/route.ts             # SSE proxy
    └── pdfs/
        ├── resolve/route.ts            # doc → R2 URL resolver
        └── [course]/[filename]/route.ts  # Local PDF stream fallback
```

### Public assets
```
public/pdfjs/
├── build/                  # pdf.mjs, pdf.worker.mjs (Mozilla prebuilt)
└── web/
    ├── viewer.html         # PATCHED — download/print buttons hidden
    ├── viewer.mjs          # PATCHED — R2 origin added to ALLOWED_FILE_ORIGINS
    ├── viewer.css
    └── locale/, cmaps/, standard_fonts/, images/
```

### Indexes (Python reads from here)
```
data/page-indexes-docling-test/
├── catalog.json                         # Document metadata (title, course, pages)
├── embeddings-voyage-context3.json     # 24,337 chunk embeddings, ~600 MB
├── definitions-embeddings.json          # 1,073 definition embeddings
├── formulas-embeddings.json             # 449 formula embeddings
├── definitions-index.json               # Source-of-truth for definitions (no embeddings)
├── formulas-index.json                  # Source-of-truth for formulas
└── <course>/<file>.json                # Per-PDF structured tree (Docling output)
```

---

## Next Steps (Where We Pick Up)

### Option A — Build the Corpus Quality Framework (recommended if starting fresh)
Start with Layer 1 auditors A1, A2, A3, A8, A9 (4 hrs total). Run once. Get first Corpus Quality Report. That report drives everything else.

Specifically:
1. `scripts/audit/a1_noise.py` — scan corpus for noise section titles, report count + breakdown
2. `scripts/audit/a2_dedup.py` — SHA256 hash all chunk content, report collision groups
3. `scripts/audit/a3_size.py` — distribution analysis, flag <50 and >3K char chunks
4. `scripts/audit/a8_cross_course.py` — find PDFs in multiple course folders
5. `scripts/audit/a9_metadata.py` — catalog consistency checks
6. `scripts/audit/run_all.py` — runs all auditors, outputs unified JSON report

### Option B — Ship the redesign `/ask` integration first
Hand the `SUSTAINIQ_PIPELINE_INTEGRATION_BRIEF.md` to a Claude Code session. They port `AskTestClient.tsx` into `AskClientRedesign.tsx` respecting the redesign's visual system. Ships the working tool to real users faster, corpus quality improvements come in parallel.

### Option C — Run autoresearch on the synthesis prompt
Build the gold set (~2 hours to curate 10 queries), set up the eval harness (~2 hours), let it iterate autonomously on `synth_system` prompt. Expect ~20% quality lift in a day.

**My recommendation:** Option A first. Without a quantified picture of corpus state, every other improvement is speculative. Once A1 alone runs, we know whether removing 982 noise chunks actually helps — and we've validated the framework's approach for all downstream work.

### Immediate tactical TODOs (can be handled any time)
- Set `ASK_SERVER_URL` in Vercel when demo goes live
- Keep Mac awake during demo (System Settings → Battery → Prevent sleep)
- Monitor tunnel URL; restart creates new URL → Vercel env update needed
- Add Clerk auth to `/api/ask` before public demo (S1 from backlog)

---

## Key Insights From This Session (Don't Forget)

1. **The test worked: this pipeline produces dramatically better answers than generic RAG** — especially the revise loop which brings unsupported claims to zero. This is the moat.

2. **Corpus quality is the bottleneck, not model quality.** GPT-OSS-120B is strong enough. The question is what it's given.

3. **Authority + cross-framework awareness are the real differentiators** — not retrieval sophistication alone.

4. **The asymmetric collaboration model** (domain expert does low-volume high-judgment work; AI does high-volume pattern work) is the real working model. Document it, stick to it.

5. **Don't generalize too early.** Every attempt to make the tool "smart" by adding features (follow-up suggestions, auto-summarization, etc.) risks trading trust for flash. The North Star: provable grounding.

6. **Cost at scale is a non-issue.** ~$0.003/query. Even at 10K queries/day, $30/day. The bottleneck is NOT cost.

7. **Groq tunnel URL changes on restart.** Don't hardcode. Named tunnel with a Cloudflare domain is the right fix when you graduate from ephemeral (15 min work).

---

## Resume Prompt (To Hand To A Future Claude Session)

> Read `brainstorming/SUSTAINIQ_SESSION_STATE_2026-04-16.md` fully before starting any work. Then read `brainstorming/SUSTAINIQ_PIPELINE_INTEGRATION_BRIEF.md` and `brainstorming/SUSTAINIQ_IMPROVEMENT_BACKLOG.md` for complete context. The pipeline is working locally. We're at the point of deciding between (A) building the Corpus Quality Framework to systematically improve retrieval, (B) integrating into the redesign `/ask` page for a demo, or (C) running autoresearch on the synthesis prompt. My recommendation was A. User to confirm which path to start before any new code is written.
