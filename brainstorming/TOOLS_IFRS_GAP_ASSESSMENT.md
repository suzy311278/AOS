# Tool Design: IFRS S2 Gap Assessment

## What the tool does

Input: a company identifier (name, ticker, or website) plus one or more public documents (sustainability report, annual report, dedicated ESG or TCFD report, policy PDFs). The tool parses the documents, hunts for evidence against each disclosure requirement in IFRS S2 Climate-related Disclosures, and produces a readiness report.

Output: for every IFRS S2 requirement,
- **Status**: one of `Not Applicable`, `Not Met`, `Partially Met`, `Met`
- **Evidence**: citations to specific pages and passages in the uploaded documents
- **Reason**: one-to-two sentence explanation of why that status
- **Recommendation**: concrete next action the company should take to close the gap

Plus a summary: overall readiness score, breakdown by IFRS S2 pillar (Governance, Strategy, Risk Management, Metrics and Targets), and the top five gaps ranked by regulatory materiality.

## Why this is not a pure LLM problem

A naive implementation would be: paste 300 pages into an LLM with the S2 text, ask it to fill in a table. That works poorly because:
- Context windows are limited and 300-page reports do not fit cleanly.
- The LLM will hallucinate evidence it did not actually find.
- Results are not reproducible for assurance; re-running produces variable answers.
- Cost explodes on long documents without caching.

The correct shape is a **retrieval-grounded, structured evaluation pipeline** with small-ML components in the hot path to cut LLM cost and improve consistency.

## Pre-work: digest IFRS S2 once

Before the tool ever sees a customer document, we build a **requirement manifest** for IFRS S2. This is a one-time content job, not ML.

For each of the roughly 30 disclosure requirements in S2 plus the industry-specific appendix metrics (cross-referenced to SASB by sector), the manifest captures:
- Paragraph reference (e.g. S2.29(a))
- Plain-language summary of what is being asked
- Three to five **retrieval query rephrasings** that a company would typically use when disclosing this item
- **Evidence rubric**: what a `Met` disclosure looks like, what `Partially Met` looks like, what `Not Met` means, and when `Not Applicable` is allowed
- **Keywords and phrases** that commonly appear in compliant disclosures
- **Industry applicability**: which SICS sectors a given appendix requirement applies to
- **Authoritative examples**: 3-5 passages from companies known to disclose this well, used as few-shot examples for the LLM and as positive anchors for similarity scoring

The manifest is versioned against the IFRS S2 effective text. When S2 is amended, the manifest is updated. It is the single source of truth for the assessor and is auditable.

## Pipeline per assessment

### Stage 1: document ingestion

- Parse each uploaded PDF with Docling (already in our stack). Produces structured sections, headings, tables, and page references.
- Extract: table of contents, section headings, any explicit IFRS-S2 or TCFD mapping table the company itself provided, references to policies and committee charters.
- Build a per-report vector index using Voyage context-3 embeddings, stored ephemerally (or cached per customer for re-runs). No need to persist long-term unless we offer a re-run feature later.

### Stage 2: industry scoping (deterministic, zero LLM)

Look up the company's sector. For each S2 industry-specific metric, resolve `applicable | not_applicable` from a pre-built sector-to-metric lookup table. Any requirement marked `not_applicable` is short-circuited to the `Not Applicable` output with the sector rationale. Saves us running retrieval and LLM calls on metrics that were never going to apply.

Sector lookup: company ticker or name -> SICS sector -> list of applicable S2 appendix requirements. Deterministic. About 80 sectors, 100 metrics, one crosswalk.

### Stage 3: retrieval per remaining requirement

For each applicable S2 requirement:
- Run multi-query retrieval using the manifest's rephrasings. Merge and rerank top-k passages.
- Use hybrid retrieval: semantic (Voyage embeddings) + keyword (BM25 over the manifest's keyword list).
- Top 5-10 passages per requirement are the evidence candidate pool.

### Stage 4: evidence screening (small ML, optional but high-value)

A binary classifier trained on labeled examples from our own gold set answers:
`Given this candidate passage and this requirement, is this genuinely relevant evidence, or is it topic-adjacent noise?`

Implementation: logistic regression over concatenated embeddings of (requirement_summary, passage), trained on 2k-5k labeled (requirement, passage, relevant) tuples drawn from our benchmark companies.

Effect: cuts LLM context by roughly half on long disclosures by dropping irrelevant candidates before the LLM sees them. Optional in v1, but a clear upgrade path.

### Stage 5: classification and drafting (LLM, structured output)

One LLM call per requirement with a strict JSON schema:

```json
{
  "status": "Met | Partially Met | Not Met | Not Applicable",
  "confidence": 0.0,
  "evidence": [
    { "page": 42, "section": "Risk Management", "quote": "..." }
  ],
  "reason": "...",
  "recommendation": "..."
}
```

Inputs to the prompt:
- The requirement (manifest entry)
- The evidence rubric (what Met vs Partially Met vs Not Met looks like)
- Few-shot examples from the manifest
- The retrieved candidate passages with page references

Model choice: gpt-oss-120b (current pipeline) is adequate. Temperature low (0.1-0.2) for consistency.

### Stage 6: evidence verification (reuse fact-check step)

The same pattern the ask-server already uses: a Llama-Scout call verifies that each claimed evidence quote actually appears on the claimed page. Mismatches flag the requirement for human review. This prevents hallucinated citations, which would be fatal in an assurance context.

### Stage 7: rollup and scoring

Deterministic. For each requirement, the status is already assigned. Aggregate:
- Pillar-level readiness score: weighted by number of requirements met vs total applicable
- Overall readiness score
- Gap severity: `Not Met` on a disclosure paragraph carries more weight than `Partially Met` on an industry-specific metric
- Top gaps ranked by regulatory materiality (configurable weighting)

## Cost profile per assessment

Back of envelope for a typical mid-sized company with a 150-page sustainability report:

- Document parse: one-time, negligible compute cost.
- Embedding the report: roughly 200-400 chunks × Voyage context-3. Modest, fits in free tier.
- Retrieval per requirement: local, zero cost.
- Evidence screening classifier: local, zero cost.
- LLM classification call per requirement: roughly 3k-6k input tokens + 500-1000 output tokens per requirement. 30 requirements = 100k-200k tokens.
- Fact-check pass: roughly another 50k-100k tokens.
- **Total**: 150k-300k tokens per assessment.

At our 1.2M daily token budget that is **4-8 assessments per day** per our current Groq budget. Which is fine for a premium tool, but if we want more throughput, caching the manifest few-shot examples in the system prompt and using prompt caching at the LLM layer is the next lever.

## Where small ML meaningfully replaces LLM calls

1. **Industry applicability classifier**: deterministic lookup, not even ML. Drops 20-40% of requirements as `Not Applicable` before any LLM runs.
2. **Evidence screening**: binary relevance classifier cuts LLM context roughly in half.
3. **Status prediction fast-path**: once we have a labeled corpus of, say, 50 companies each graded on all 30 requirements (1500 examples), we can train a multi-class classifier that predicts status directly from embeddings of (requirement, top-k evidence). If confidence is above a threshold we skip the LLM entirely for that requirement. The LLM still drafts the reason and recommendation, but the status label is free.
4. **Recommendation retrieval**: for any `Not Met` or `Partially Met`, retrieve the recommendation from a pre-built library of remediation templates keyed by (requirement, status). The LLM then personalizes the template using company-specific context. Reduces generation cost and keeps recommendations consistent.

Target: by v2, half or more of status decisions come from the classifier without an LLM classify call, and LLM is used only for drafting the human-facing text. LLM cost drops by roughly 40-60%.

## Labeled data strategy

1. **Build a benchmark of 20-30 reference companies** already assessed against IFRS S2 by a senior analyst. Mix of sectors, sizes, and geographies. This is the gold set. Expensive to build (estimate 8-16 hours per company initial assessment), but pays off forever as a regression suite and a training set for the small-ML components.
2. **Every customer assessment produces labeled examples** once the human reviewer signs off on the output. Closed-loop improvement.
3. **Public high-quality disclosers** (Unilever, Microsoft, Orsted, Shell, AstraZeneca) can be assessed once and become canonical `Met` examples in the manifest.

## Output format

A readiness report with:
- Cover page: company, reports ingested, assessment date, overall readiness score, pillar scores
- One page per pillar: requirements list, status chip per requirement, expandable evidence and recommendation
- Gap summary: top five gaps by materiality, suggested priorities
- Methodology appendix: manifest version, models used, confidence thresholds, what was and was not audited

The report is exportable as PDF using the same react-pdf setup we built for the ask page, with the same branding. The PDF includes clickable citations that jump back to the source document page (using the PDF.js viewer pattern we already established for the ask-page source drawer).

## Build phases

1. **v0 (2-3 weeks, zero-ML)**: manifest for full IFRS S2, industry scoping lookup, retrieval pipeline, LLM classify + draft, fact-check reuse, readiness report PDF. Usable end-to-end on real documents. Cost-heavy.
2. **v1 (1-2 weeks, add screening classifier)**: evidence relevance classifier. Cost drops.
3. **v2 (2-3 weeks, add status fast-path)**: multi-class classifier over labeled examples. LLM demoted to drafting only on high-confidence cases.
4. **v3 (ongoing)**: customer-facing revision workflow, historical tracking (year over year readiness delta), integration with disclosure templates.

## Why this generalizes

The same pipeline works for CSRD/ESRS, TCFD, TNFD, GRI, and most disclosure standards. Different manifest, same engine. The investment in the manifest structure and the small-ML components pays off across every standard we support. This is probably the single highest-leverage tool in the blueprint: it converts a week of senior-analyst work into a 10-minute assessment, and the moat is the quality of the manifests and the labeled benchmark.

## Open questions

- Do we offer ingestion from public sources (pull the annual report ourselves from an investor-relations page) or require the user to upload? Upload-only is simpler for v0.
- How do we handle multi-year assessments? Customers will want to see the delta from last year. Requires indexed historical reports.
- Materiality weighting: who owns the definition of "top gap"? Default weights need user-configurable overrides for consultants.
- Assurance-grade mode: optional stricter fact-check that requires two independent evidence passages per `Met` status, at higher cost.
- Localization: some companies disclose in non-English. Voyage context-3 is multilingual; Docling handles most layouts. Still needs testing.
