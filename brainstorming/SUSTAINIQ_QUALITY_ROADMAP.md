# SustainIQ Quality Roadmap: Path to Expert-Level Responses

**Date:** April 2026
**Current state:** 8/10 average response quality
**Target:** Human expert level (9.5/10)

## Current Architecture

```
PDF Sources (145 total, ~120 indexed)
    ↓
Indexing: pymupdf text extraction → LLM-based TOC detection → LLM section splitting → LLM summarization (15-40 LLM calls per PDF)
    ↓
Embedding: Chunk-level (11,604 chunks) → Voyage AI voyage-4-lite (1024 dims)
    ↓
Retrieval: Hybrid search (vector cosine + BM25 full-text) → RRF fusion → Top 4 results
    ↓
Synthesis: Groq Llama 3.3 70B (streaming, 6-key rotation)
    ↓
Frontend: SustainIQ chat UI with source cards, lesson links, citation pills
```

## The Three Gaps

### Gap 1: Retrieval Precision (~80% → 95%)

**Problem:** The right chunk isn't always in the top 4 results. Vector similarity and BM25 are fast but shallow. They score each chunk independently without understanding whether it actually answers the question.

**Example failure:** Query "How do I calculate mortgage financed emissions?" retrieves IFRS S2 disclosure sections (which mention "financed emissions" frequently) instead of PCAF calculation methodology (which has the actual formula but uses different vocabulary like "attribution factor", "outstanding amount", "loan-to-value").

**Solution: Cross-encoder reranker**

Add a reranking step between retrieval and synthesis. Instead of returning the top 4 from hybrid search, return the top 20-25 candidates, then pass each one through a cross-encoder model alongside the query. The cross-encoder reads the query AND the chunk together and scores how well the chunk actually answers the question.

Implementation:
- New file: `src/lib/reranker.ts`
- Modify `src/lib/hybrid-search.ts`: change initial retrieval to top 25, add reranker call, return top 5
- Provider options:
  - Cohere Rerank API (free tier: 1000 calls/month)
  - Jina Reranker API (free tier: 1M tokens/month)
  - Voyage AI rerank-2.5-lite (already have API key, 3 RPM free)
- Latency: adds ~200ms per query
- No changes to indexing, embeddings, or frontend

**Impact:** Highest impact per effort. Fixes the "retrieved the wrong thing" problem which is the binding constraint on answer quality.

### Gap 2: Synthesis Depth (good student → senior consultant)

**Problem:** Llama 3.3 70B on Groq produces accurate but surface-level answers. It summarizes what's in the retrieved context but doesn't:
- Spot tensions or contradictions between two regulatory provisions
- Infer practical implications ("this means in practice you should...")
- Distinguish between what the standard technically says vs what practitioners actually do
- Know when a technically correct answer is practically irrelevant

**Example:** When asked about CBAM obligations, the model lists requirements accurately but doesn't mention that most importers under 50 tonnes are exempt, or that the transitional period has different rules than the definitive period, or that actual installation values are almost always lower than defaults.

**Solution: Upgrade synthesis model**

Option A: Route complex queries to Claude Sonnet API (~$0.01/query, best quality)
Option B: Run Gemma 4 27B MoE locally (free, 256K context, ~40 tok/s on M-series Mac)
Option C: Keep Groq but switch to a stronger model when available

Implementation:
- Modify `src/app/api/ask/route.ts`: add model routing logic
- Simple queries (single-source lookups) stay on Groq Llama 70B (fast, free)
- Complex queries (multi-framework, comparative, advisory) route to stronger model
- Query complexity detection: count of frameworks mentioned, presence of "compare", "difference", "should I", "how does X affect Y"

**Impact:** Moves answers from "accurate summary" to "expert advice with practical insight."

### Gap 3: Reasoning Architecture (single-pass → multi-step)

**Problem:** The current pipeline does one retrieval pass and one synthesis call. A human expert thinks iteratively: "The user asked about X, but they also need to know about Y. Let me check Z because it contradicts what I found in X."

**Example:** Query "How does CSRD affect Indian companies doing BRSR?" requires:
1. Understanding CSRD scope (which non-EU companies are covered)
2. Understanding BRSR requirements (India's ESG reporting framework)
3. Comparing the two frameworks (where they align, where they diverge)
4. Practical guidance (what an Indian company should do)

The current system retrieves 4 chunks, gets partial information, and synthesizes an incomplete answer. A multi-step system would decompose this into sub-queries, retrieve for each, and synthesize across all results.

**Solution: Query decomposition + agentic retrieval**

Query decomposition:
- Before retrieval, detect if the query is complex (multi-framework, comparative, scenario-based)
- If complex, break into 2-3 sub-queries using a fast LLM call
- Retrieve for each sub-query separately
- Merge and deduplicate results
- Synthesize across all retrieved chunks

Agentic retrieval (Phase 2):
- After initial synthesis draft, the model identifies what's missing
- Triggers a second retrieval pass for the missing information
- Re-synthesizes with the expanded context

Implementation:
- Modify `src/app/api/ask/route.ts`: add query decomposition before retrieval
- New function: `decomposeQuery(query)` → returns array of sub-queries
- Run `hybridSearch()` for each sub-query, merge results
- For agentic retrieval: after synthesis, parse the response for "I don't have information about..." and trigger follow-up retrieval

**Impact:** Gets the last mile from "good AI answer" to "feels like talking to a consultant."

## Parsing Upgrade: Docling Migration

**Independent of the three gaps above.** Improves the floor (fewer bad extractions) rather than the ceiling.

**Current:** pymupdf extracts raw text, loses table structure, garbles formulas, requires 15-40 LLM calls per PDF for structure detection.

**Target:** Docling (IBM, open source) extracts structured text with tables preserved, formulas as LaTeX, headings detected by ML models. Zero LLM calls for parsing.

**Hierarchy challenge:** Docling detects headings but doesn't determine nesting levels (all headings are Level 1). Solution: single Groq LLM call per document to infer hierarchy from the flat heading list. Tested and works across numbered headings (8.2.4), named headings (Article 1), and styled headings (SPM 1.3).

**Implementation:**
- New script: `scripts/build-index-docling.py`
- Docling parses PDF → extracts headings, text, tables, formulas
- 1 Groq call per PDF → infers heading hierarchy
- HybridChunker → produces section-aware chunks
- Re-embed with Voyage AI
- Existing tree indexes kept as fallback

**Timeline:** 2-3 days to build and re-index all PDFs

## Embedding Provider: Voyage AI

**Completed:** Migrated from Cloudflare Workers AI (BGE-base-en-v1.5, 768 dims, 10K neuron daily limit) to Voyage AI (voyage-4-lite, 1024 dims, no daily limit).

**Free tier limits:** 3 RPM, 10K TPM. Sufficient for query-time (1 call per query). Batch embedding requires 25s delay between batches (~8 hours for full re-embed of 11K chunks).

**Endpoint:** `https://ai.mongodb.com/v1/embeddings` (Voyage AI is now part of MongoDB)

## Evaluation: How to Measure Progress

**Critical missing piece.** Without a benchmark, we're optimizing blind.

Build a test suite of 50 expert-verified questions across categories:
- Simple lookups (10): "What is the baseline period for VM0042?"
- Cross-framework (10): "How does IFRS S2 relate to SFDR?"
- Practical scenarios (10): "I import steel from China, what are my CBAM obligations?"
- Edge cases (10): "Can REDD+ credits be used for CORSIA compliance?"
- Multi-step reasoning (10): "How does the Kunming-Montreal framework affect corporate climate reporting under IFRS S2?"

For each question, a domain expert writes the ideal answer including:
- Key facts that must be present
- Sources that should be cited
- Common mistakes to avoid

Score each SustainIQ response on: factual accuracy, source precision, practical usefulness, citation quality.

Run the full suite after each change to measure impact.

## Priority Order

| Priority | Change | Effort | Impact | Dependencies |
|----------|--------|--------|--------|--------------|
| 1 | Voyage AI embedding migration | Done | Removes Cloudflare daily limit | None |
| 2 | Cross-encoder reranker | 1 day | Retrieval 80% → 95% | None |
| 3 | Evaluation suite (50 QA pairs) | 2-3 days | Enables measurement | None |
| 4 | Stronger synthesis model | 1 day | Depth improvement | None |
| 5 | Query decomposition | 2-3 days | Multi-step reasoning | Reranker helps |
| 6 | Docling migration | 2-3 days | Better parsing, no LLM indexing costs | None |
| 7 | Agentic retrieval | 3-5 days | Last mile quality | Query decomposition |
| 8 | Complete PDF indexing (remaining ~25) | Ongoing | Coverage | None |

Items 1-4 deliver 80% of the quality improvement. Items 5-8 deliver the remaining 20%.

## What This Achieves

A user asking "My company imports aluminum from India and reports under IFRS S2. How should we handle CBAM in our climate disclosures?" gets:

"For aluminum imports from India, CBAM applies default emission values of X.XX tCO2e per tonne (COMMISSION IMPLEMENTING REGULATION (EU) 2025/2621, p. 430). However, if your Indian supplier can provide verified installation-level data, you should use actual values instead, as they're typically 20-30% lower than defaults.

For your IFRS S2 disclosures, CBAM costs should be reflected in your transition plan as a material climate-related risk (IFRS S2, para 16(a)). The financial impact flows through your cost of goods sold and should be quantified in your scenario analysis under both current policy and enhanced policy scenarios.

Note that CBAM's definitive period (from 2026) requires purchasing CBAM certificates, which creates a direct link between your Scope 3 upstream emissions and your financial exposure. This should be disclosed under 'climate-related risks to financial position' (IFRS S2, para 14(a))."

Every claim cited. Cross-framework connections drawn. Practical advice included. The trust principle holds.
