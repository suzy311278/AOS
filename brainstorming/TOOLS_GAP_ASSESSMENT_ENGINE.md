# Gap Assessment Engine

One engine, many manifests. This document describes the architecture that powers every gap-assessment tool (IFRS S1/S2, ESRS, BRSR, TCFD, TNFD, GRI, CDP prep, and any future standard). It also lists, concretely, what you as the domain owner need to prepare versus what engineering builds.

## What the engine is

A structured pipeline that takes a company's public or private documents and produces, for each disclosure requirement in a chosen standard, a readiness status (`Not Applicable`, `Not Met`, `Partially Met`, `Met`), the evidence that justifies it with page-level citations, a one-to-two sentence reason, and an actionable recommendation.

The engine is **standard-agnostic**. Swapping from IFRS S2 to ESRS is a matter of loading a different manifest. The retrieval, classification, verification, scoring, and export code are shared.

## Logical architecture

```
         ┌─────────────────────────────────┐
         │     MANIFEST REGISTRY            │
         │  (one record per requirement)    │
         └──────────────┬──────────────────┘
                        │
   customer docs ──► ┌──────────────────┐    ┌───────────────────────┐
   (PDFs)            │ 1. INGEST        │ ──►│  PER-DOC VECTOR INDEX │
                     │ Docling + Voyage │    │   (ephemeral/cache)   │
                     └──────────────────┘    └──────────┬────────────┘
                                                        │
                     ┌─────────────────┐                │
   sector profile ──►│ 2. APPLICABILITY│ ──► filter ────┘
                     │ RESOLVER        │       ▲
                     │ (deterministic) │       │
                     └─────────────────┘       │
                                               ▼
                     ┌──────────────────────────────────┐
                     │ 3. RETRIEVAL SERVICE (per req)   │
                     │ multi-query + hybrid rerank      │
                     └──────────────┬───────────────────┘
                                    ▼
                     ┌──────────────────────────────────┐
                     │ 4. EVIDENCE SCREENER (small ML)  │  [optional v1]
                     │  relevant vs topic-adjacent      │
                     └──────────────┬───────────────────┘
                                    ▼
                     ┌──────────────────────────────────┐
                     │ 5. CLASSIFY + DRAFT (LLM, JSON)  │
                     │  manifest + evidence → status +  │
                     │  reason + recommendation         │
                     └──────────────┬───────────────────┘
                                    ▼
                     ┌──────────────────────────────────┐
                     │ 6. EVIDENCE VERIFIER (LLM)       │
                     │  do claimed quotes exist?        │
                     └──────────────┬───────────────────┘
                                    ▼
                     ┌──────────────────────────────────┐
                     │ 7. SCORING + ROLLUP              │
                     │  per-pillar, overall, gaps-rank  │
                     └──────────────┬───────────────────┘
                                    ▼
                     ┌──────────────────────────────────┐
                     │ 8. OUTPUT BUILDER                │
                     │  JSON + branded PDF w/ citations │
                     └──────────────┬───────────────────┘
                                    ▼
                     ┌──────────────────────────────────┐
                     │ 9. REVIEW UI + FEEDBACK LOOP     │
                     │  human overrides → labels        │
                     └──────────────────────────────────┘
```

## Component-by-component

### 1. Manifest Registry

A versioned database of disclosure requirements. One manifest per standard (IFRS S2, ESRS E1, BRSR Principle 6, etc.), each composed of many requirement records.

**Storage options**: start as YAML files in the repo (`src/content/gap-manifests/ifrs-s2.yaml`). Promote to a database when we have tens of manifests and live editing.

**Versioning is mandatory.** Every manifest has a semver version and an effective-date window. When a standard amends, we add a new version; assessments record which version they used so results are reproducible years later.

### 2. Applicability Resolver

Given a company's sector (SICS, NAICS, or ICB) and size (for CSRD thresholds), return the subset of requirements that apply. Pure deterministic lookup against tables embedded in each manifest's metadata. Pruning here typically drops 15-40% of the requirements before any compute runs. This is cheap and massively improves cost and clarity.

### 3. Document Ingestion and Indexing

- **Parse**: Docling is already in the stack; it produces structured sections with page references and table layouts.
- **Chunk**: paragraph-level with section headings as context prefix. Keep chunk size around 512-1024 tokens for Voyage context-3.
- **Embed**: Voyage context-3, same embedding model as SustainIQ. This reuses infrastructure and means the gap assessor speaks the same vector space as the ask-server.
- **Index**: an ephemeral FAISS / hnswlib index per assessment, cached by document hash. Re-assessing a report uses the same cache.

### 4. Retrieval Service

Per requirement, run `K` rephrasings (from the manifest) as parallel queries. Use hybrid retrieval: Voyage semantic + BM25 keyword over the manifest's keyword list. Merge, dedupe by span, rerank with the existing Voyage reranker, return top-N passages. Typical N = 6-10.

### 5. Evidence Screener (optional ML layer)

Binary classifier: `(requirement_summary, passage) → relevant | noise`. Trained on gold-set labels. Effect: drops topic-adjacent noise before the LLM sees it, cutting LLM context in half on long disclosures. Optional for v1, recommended by v2.

### 6. Classification and Drafting

Single LLM call per requirement with a strict JSON schema. Inputs to the prompt:
- Requirement manifest entry
- Evidence rubric (Met / Partially Met / Not Met / Not Applicable criteria)
- Three to five few-shot anchor examples from the manifest
- Top-N retrieved passages (page-referenced)
- Company sector and scale context

Model: `openai/gpt-oss-120b` on Groq works. Temperature 0.1 for consistency. Output is structured JSON — the prompt enforces schema, and we validate on receipt.

### 7. Evidence Verifier

Reuses the fact-check pass already running in `scripts/retrieval-advisor.py`. For each claimed evidence quote in the classifier's output, verify that the exact (or near-exact) text appears on the claimed page of the source document. Unverified citations demote the requirement to "needs human review" and never enter the automated rollup.

### 8. Scoring and Rollup

Pure deterministic math. Per requirement, status is known. Aggregate:
- Per-pillar score: weighted count of Met (1.0) + Partially Met (0.5) / total applicable
- Overall readiness: weighted average across pillars (weights in manifest metadata)
- Top gaps: ranked by `materiality_weight * gap_severity` where severity is `Not Met > Partially Met > Not Applicable`

### 9. Output Builder

Structured JSON assessment object, plus a branded PDF using the same react-pdf setup built for the ask page. Citations in the PDF are clickable links to the PDF.js viewer URL with page-jump and phrase-highlight, identical to the ask-page pattern.

### 10. Review UI and Feedback Loop

A reviewer interface where an analyst can override any status, edit reason and recommendation, add missed evidence, and dismiss false positives. Every override becomes a labeled training example for the evidence screener and, eventually, a status fast-path classifier.

## Data contracts

### 10.1 Manifest requirement schema

```yaml
id: S2.29.a                         # unique within manifest
standard: IFRS-S2
standard_version: 2023-06
pillar: Metrics and Targets
paragraph_reference: S2.29(a)       # exact citation in the standard

title: "Scope 1, 2 and 3 GHG emissions disclosure"
ask_summary: |
  Disclose absolute gross Scope 1, Scope 2 and Scope 3 greenhouse gas
  emissions, measured in accordance with the GHG Protocol Corporate
  Standard, separated by constituent gas.

rephrasings:                        # retrieval queries
  - "Scope 1 greenhouse gas emissions disclosure"
  - "Scope 2 location-based and market-based emissions"
  - "Scope 3 emissions by category"
  - "absolute gross GHG emissions"
  - "emissions by constituent gas CO2 CH4 N2O"

keywords:                           # BM25 keyword set
  - "Scope 1"
  - "Scope 2"
  - "Scope 3"
  - "tCO2e"
  - "GHG Protocol"
  - "location-based"
  - "market-based"

evidence_rubric:
  met: |
    Company discloses absolute Scope 1, Scope 2 (location + market based),
    and Scope 3 emissions for the reporting year, with units in tCO2e.
    Scope 3 disclosure covers at least the categories identified as
    material by the company.
  partially_met: |
    Company discloses Scope 1 and Scope 2, but Scope 3 is missing,
    incomplete, or not broken down by category; OR market-based Scope 2
    is disclosed without location-based complement.
  not_met: |
    Absolute GHG emissions are not disclosed, or disclosed only
    qualitatively with no quantitative figures.
  not_applicable: |
    Not applicable cases for this requirement are rare; flag for review
    if proposed.

industry_applicability:
  scope: all_industries             # or list of SICS sector codes
  exclusions: []

few_shot_anchors:
  - company: "Microsoft FY23 Environmental Sustainability Report"
    status: met
    quote: "Scope 1: 144,960 tCO2e; Scope 2 (market-based): 10,000 tCO2e..."
    page: 27
  - company: "Acme Industries 2023 Annual Report"
    status: partially_met
    quote: "We have made progress on our carbon footprint, disclosing Scope 1 and Scope 2..."
    page: 44
  - company: "Generic Manufacturing 2023"
    status: not_met
    quote: "We are committed to reducing our environmental impact."
    page: 19

recommendations:                    # templates for when status != Met
  not_met: |
    Publish a Scope 1 + 2 + 3 inventory using the GHG Protocol Corporate
    Standard. Engage a consultant if activity data is not yet collected.
  partially_met: |
    Extend disclosure to cover Scope 3 by category; add location-based
    Scope 2 alongside market-based for dual reporting.

materiality_weight: 1.0             # for top-gap ranking
author: "analyst@greentryst"
last_reviewed: 2026-04-10
```

### 10.2 Classifier output schema (JSON, returned per requirement)

```json
{
  "requirement_id": "S2.29.a",
  "status": "Partially Met",
  "confidence": 0.82,
  "evidence": [
    {
      "doc": "acme_sustainability_2023.pdf",
      "page": 18,
      "section": "Climate Performance",
      "quote": "In FY23, our Scope 1 emissions were 42,100 tCO2e and our Scope 2 location-based emissions were 127,800 tCO2e."
    }
  ],
  "reason": "Scope 1 and Scope 2 location-based are disclosed with figures. Scope 3 emissions are mentioned qualitatively but no category breakdown is provided.",
  "recommendation": "Extend disclosure to include absolute Scope 3 emissions by category using GHG Protocol Scope 3 Standard methodology, and add market-based Scope 2 for dual reporting."
}
```

### 10.3 Assessment output schema (JSON, top level)

```json
{
  "assessment_id": "asmt_2026_04_14_acme",
  "company": { "name": "Acme Industries", "ticker": "ACME", "sector_sics": "IR-30-10" },
  "standard": { "name": "IFRS-S2", "version": "2023-06", "manifest_version": "v1.2.0" },
  "inputs": [{ "doc": "acme_sustainability_2023.pdf", "pages": 82 }],
  "summary": {
    "overall_score": 0.68,
    "pillar_scores": { "Governance": 0.75, "Strategy": 0.60, "Risk Management": 0.80, "Metrics and Targets": 0.55 },
    "counts": { "met": 12, "partially_met": 9, "not_met": 5, "not_applicable": 4, "review": 2 },
    "top_gaps": ["S2.29.a", "S2.22.c", "S2.33.a"]
  },
  "requirements": [ /* array of classifier outputs per requirement */ ]
}
```

## Per-assessment flow (end to end)

1. User uploads documents and selects the standard (e.g. IFRS S2).
2. Engine loads the chosen manifest at its latest version and records that version in the assessment metadata.
3. Ingestion parses, chunks, embeds, and indexes. If a cached index exists for these documents, skip.
4. Applicability resolver filters requirements by sector and size. Non-applicable requirements are short-circuited to `Not Applicable` with sector rationale.
5. For each remaining requirement, retrieval returns top-N passages. Screener (if enabled) drops irrelevant passages.
6. Classifier generates a structured JSON output per requirement.
7. Evidence verifier confirms each claimed quote exists on the claimed page. Unverified items route to review.
8. Scorer rolls up per-pillar and overall.
9. Output builder emits JSON + branded PDF.
10. Reviewer UI surfaces low-confidence and flagged items for human sign-off.

## What you need to prepare (domain owner checklist)

The engineering is a one-time build. What you, as the sustainability domain owner, need to prepare is the content that makes the engine useful. Below is the practical checklist, separated into what's required to ship v0 of a new manifest and what can be added later.

### Required to ship v0 of a manifest

1. **Structured standard text.** Every requirement broken out with its paragraph reference, exact wording, and pillar. For IFRS S2, that's roughly 30 paragraph-level requirements plus the industry-specific appendix metrics. Source: the published standard PDF itself; one-pass structured extraction, then analyst review.

2. **Ask summaries in plain language.** A one-to-two sentence plain-English summary of what each requirement is asking for. Skilled-analyst work, not the raw standard text.

3. **Evidence rubrics per requirement** covering the four status classes. The most important single asset. Met, Partially Met, Not Met, and when Not Applicable is permitted. Specificity here directly determines classifier accuracy.

4. **Retrieval rephrasings** per requirement. Three to five alternative phrasings of what a company would typically use when disclosing this item. Sourced by scanning a few well-disclosed reports. Ten minutes per requirement.

5. **Keyword list** per requirement. A dozen terms and phrases that commonly appear in compliant disclosures. Boosts hybrid retrieval.

6. **Industry applicability table**. For the standard as a whole, a table mapping each requirement to sector applicability. Most cross-industry requirements apply everywhere, but industry-specific disclosures (like the S2 appendix metrics) apply only to certain SICS sectors.

7. **Materiality weights** per requirement. Simple 0.5 / 1.0 / 2.0 for ranking top gaps. Defaults to 1.0 if you don't want to tune per requirement.

8. **Recommendation templates** for Not Met and Partially Met. One canonical remediation paragraph per requirement x status. The LLM later personalises the template with company-specific context; having a canonical draft avoids generic filler.

9. **Few-shot anchor examples**. Three to five public disclosures per requirement, one per status class where possible, with a pulled quote and page reference. Grounds the classifier and gives auditors concrete benchmarks. Draw from known high-quality disclosers (Microsoft, Unilever, Orsted) for Met anchors and less-mature disclosers for the rest.

### Required before production

10. **Gold-set benchmark**. Pick 15-25 companies across sectors, geographies, and disclosure quality. Have a senior analyst grade each against every requirement for your chosen standard. This is the regression suite for the engine and the training data for any classifiers. Budget 8-16 hours per company.

11. **Quality thresholds**. Confidence gates for auto-accept vs. review-queue vs. hold. Default 0.85 / 0.60 / below. You can tune with gold-set experience.

12. **Reviewer workflow policy**. Who signs off per engagement, how overrides are captured, whether customers see draft-status findings or only reviewed ones. This is a policy decision, not content.

### Nice-to-have, can be added after v0

13. **Annotated common pitfalls**. Short notes per requirement about the typical ways companies get this wrong (too-vague language, boilerplate, wrong scope boundary, missing time horizon). Improves recommendations.

14. **Cross-standard mappings**. Where the same disclosure appears in multiple frameworks (e.g. TCFD Governance a ↔ IFRS S2 Governance a), a reference link lets the engine say "you already disclose this for TCFD, here's what's missing for S2."

15. **Historical assessments**. Once you do enough engagements, the library of anonymised gold-set-grade assessments becomes a moat. Version-controlled and annotated, it trains every future classifier.

16. **Benchmark reports**. Sector-level rollups of anonymised assessment data; useful for customers to see where they stand relative to peers.

## What engineering builds (one-time, then reused)

- Manifest schema + versioning + loader
- Document ingestion + per-doc cache
- Retrieval service (multi-query hybrid, rerank)
- LLM call orchestration with structured output validation
- Evidence verifier (reusing existing fact-check step)
- Scoring engine
- Branded PDF exporter with clickable citations
- Review UI (sign-off, override, dismiss, add-evidence actions)
- Labeled-data capture pipeline (reviewer overrides become training rows)
- Quality dashboards (accuracy on gold set, cost per assessment, latency, review queue size)
- Multi-tenant storage of assessments with retention policy
- Export to XBRL for standards that require machine-readable filings (ESRS, ISSB)

## Phased build plan

| Phase | What ships | Effort | What you need ready |
|---|---|---|---|
| v0 Content | Manifest for one standard (IFRS S2 first) | 4-6 weeks of analyst work | Structured standard text, rubrics, rephrasings, keywords, applicability table, materiality weights, recommendation templates, few-shot anchors |
| v0 Engine | End-to-end pipeline excluding screener and fast-path classifier | 4 weeks eng | v0 Content |
| v0 Release | Customer-facing tool for IFRS S2 | — | Above + gold set of 15-25 companies |
| v1 Quality | Evidence screener classifier | 2 weeks eng + label work | Gold-set labels |
| v1 Expansion | Manifests for ESRS + BRSR | 8-10 weeks content | Same content artefacts per standard |
| v2 Speed | Status fast-path classifier (replaces many LLM calls) | 2-3 weeks eng + label volume | 2000+ labeled examples per standard |
| v2 Scale | XBRL tagging for ESRS + ISSB | 4-6 weeks eng | XBRL taxonomy downloads + mapping |
| v3 Intelligence | Cross-standard content index, multi-standard assessment in one run | 3-4 weeks eng | Cross-standard mappings table |
| v3 Moat | Historical assessments library, sector benchmarks | Continuous | Engagement volume |

## Quality, cost, and latency targets

- **Accuracy on gold set**: 85%+ top-1 status accuracy at v0, 92%+ by v2 after cleanlab-style cleaning passes on labeled history.
- **Evidence verification rate**: 95%+ of claimed quotes verified on the claimed page. Unverified drops to review.
- **Cost per assessment**: 150k-300k Groq tokens at v0, cut to 80k-150k at v2 with screener + fast-path.
- **Wall-clock latency**: under 5 minutes end-to-end for a 200-page report at v0, under 2 minutes at v2.
- **Review queue size**: below 15% of requirements should need human review once screener is live.

## Why this generalises

The manifest schema is the only thing that varies between standards. A BRSR Principle 6 manifest looks structurally identical to an ESRS E1 manifest or an IFRS S2 manifest. The applicability resolver handles sector and size filtering uniformly. Retrieval, classification, verification, scoring, and export never change. Meaning every new standard we support is, from an engineering perspective, roughly zero weeks of work, plus the content investment above.

The investment in the manifest framework compounds across every gap-assessment tool in the catalogue. It is the single highest-leverage primitive we can build.

## Open decisions

1. **Manifest storage**: YAML-in-repo from day one, or a database from the start? YAML is easier to version-control and code-review; a DB is needed once manifests are edited live by analysts.
2. **Multi-lingual disclosures**: do we assume English documents in v0, or support localised filings immediately? Voyage context-3 is multilingual; Docling handles most layouts.
3. **Live customer-edited manifests**: do customers ever edit the manifest (custom interpretation of a requirement)? If yes, the data model needs branching. Start with no; add if demanded.
4. **Anonymised benchmark sharing**: do we pool anonymised assessments to build sector benchmarks across customers? Consent model matters.
5. **Assurance-grade mode**: a stricter mode requiring two independent evidence passages for any `Met` status. Opt-in per engagement.
6. **Structured extraction from customer data rooms**: do we go beyond PDFs and pull structured data from ERP / carbon platforms during ingestion, or stay PDF-only for v0? PDF-only is simpler.
7. **Multi-year assessments**: year-over-year readiness delta needs historical assessments persisted and joined. Design the data model now to support it even if not shipped in v0.

## Summary

The engine is three things wrapped in a pipeline:
1. A **manifest schema** that makes disclosure requirements machine-readable.
2. A **retrieval-grounded LLM classifier** with an evidence verifier that makes the outputs citation-auditable.
3. A **review loop** that captures human judgment and turns it into labels.

What you prepare is the content: structured standard text, evidence rubrics, rephrasings, keywords, applicability tables, anchors, recommendation templates, and a gold-set benchmark. The rest is software and compounds across every standard we ever assess.
