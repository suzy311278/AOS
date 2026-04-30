# Greentryst Emission Factors — Product Spec

**Status:** Draft v1
**Owner:** Prajjwal
**Last updated:** 2026-04-14
**Target ship:** v1 in 3 weeks, public v1.1 in 6 weeks

## One-liner

**The free, citation-first emission factor reference for sustainability practitioners.** Every factor sourced, dated, linked to its primary document, and easy to find. Fast enough to use during a 4pm deadline. Trustworthy enough to survive a limited-assurance audit.

## Positioning

Climatiq sells emission factors through an API to developers building enterprise tools.
DEFRA, EPA, IPCC, CEA, and IEA publish PDFs that are authoritative but painful to search.

Greentryst Emission Factors sits between these two. Free. Web-first. For humans, not developers. Every factor carries its source, vintage, methodology, and a one-click citation. Accurate to the point of becoming the default reference a practitioner reaches for before Climatiq, before DEFRA's 200-page Excel, before asking a colleague.

## Primary user and jobs to be done

**Primary user:** sustainability analyst, ESG consultant, CSR lead, sustainability manager, finance team member preparing climate disclosures. English-speaking. Works under deadline. Not a software developer.

**Jobs to be done:**
1. "I need the emission factor for X activity in Y country, with a source I can cite."
2. "I need to confirm the vintage of a factor I already used so I can defend my inventory to an auditor."
3. "I need to compare factors across sources (DEFRA vs EPA vs IPCC) for the same activity."
4. "I need to copy a factor into Excel with the citation attached."
5. "I need to understand what methodology behind a factor means (operating margin vs combined margin, etc.)."

The product has to do all five without forcing the user to learn the interface.

## Data sources (v1 launch scope)

| Source | Coverage | Priority | Factor count estimate |
|---|---|---|---|
| DEFRA UK Conversion Factors 2024 | Electricity, fuels, travel, freight, waste, water, refrigerants | P0 | ~280 |
| IPCC AR6 / 2019 Refinement | Global warming potentials, stationary combustion, agriculture, LULUCF | P0 | ~120 |
| India CEA CO2 Baseline Database 2024 | Indian regional grid emission factors (NEWNE, ER, NER, SR, WR) | P0 | ~30 |
| US EPA Emission Factors Hub 2025 | US electricity subregions (eGRID), mobile sources, stationary combustion | P0 | ~160 |
| India MoRTH Road Transport Factors (latest) | India-specific vehicle emission factors | P0 | ~50 |
| US EEIO (supply chain) 2024 | Sector-level Scope 3 spend-based factors | P0 | ~400 |

**v1 seed total:** approximately 1,040 factors across six primary sources.

**v1.1 additions (within 3 months):**
- IEA electricity factors (country grids worldwide)
- EU ETS benchmarks
- UK BEIS business travel updates
- Indian BIS/BEE stationary combustion
- Ademe (France)
- GLEC freight methodology factors

Beyond v1.1, the ingestion pipeline should be source-agnostic — adding a new source should be a configuration change plus data entry, not code.

## Data schema

Each emission factor row carries the following fields:

```
{
  id:                      UUID (stable across vintages)
  activity:                string (e.g. "Electricity consumption, grid")
  activity_slug:           string (URL-safe)
  category:                enum (fuels, electricity, transport, refrigerants, waste, agriculture, construction, sector_spend)
  sub_category:            string
  scope:                   enum (1, 2, 3, none)
  scope_3_category:        integer (1-15, nullable)
  value:                   decimal
  unit_numerator:          string (e.g. "kgCO2e")
  unit_denominator:        string (e.g. "kWh", "km", "USD")
  unit_display:            string (pre-formatted, e.g. "0.207 kgCO2e/kWh")
  region:                  ISO 3166-1 alpha-3 country code, or custom region slug (e.g. "IND-NEWNE")
  region_display:          string (e.g. "India — Northern, Eastern, Western & NE grid (NEWNE)")
  methodology:             enum (location_based, market_based, operating_margin, combined_margin, etc.)
  gwp_horizon:             integer (100, 20)
  gwp_assessment:          enum (AR4, AR5, AR6)
  vintage_year:            integer (year data represents)
  published_year:          integer (year source document was published)
  source_id:               UUID (foreign key to sources table)
  source_citation:         string (auto-generated short citation)
  source_page_ref:         string (e.g. "Table 3.4, p. 47")
  source_url:              string (direct link to primary PDF or page)
  uncertainty_low:         decimal (nullable)
  uncertainty_high:        decimal (nullable)
  uncertainty_unit:        enum (percent, absolute)
  ghg_protocol_clause:     string (e.g. "Scope 2 Guidance, §6.3")
  notes:                   markdown string (methodology caveats, applicability)
  tags:                    string[] (free-text for search)
  superseded_by:           UUID (nullable, points to newer version)
  last_verified_date:      date (when a human last checked the source still matched)
}
```

Sources table:

```
{
  id:                      UUID
  name:                    string (e.g. "DEFRA UK Conversion Factors 2024")
  publisher:               string (e.g. "UK Department for Environment, Food & Rural Affairs")
  publisher_short:         string (e.g. "DEFRA")
  country:                 ISO 3166-1 alpha-3
  document_type:           enum (government, intergovernmental, industry_standard, peer_reviewed)
  license:                 string (e.g. "Open Government Licence v3.0")
  attribution_required:    boolean
  source_url:              string (canonical URL of the document)
  source_pdf_url:          string (direct PDF link where possible)
  vintage_year:            integer
  published_date:          date
  description:             markdown string (what this source covers and its methodology notes)
  usage_note:              markdown string (when to use this vs an alternative)
}
```

Every factor must resolve to a source. No orphan factors.

## Core UX principles

1. **A novice must find the right factor in under 30 seconds.** If they can't, the UI has failed.
2. **Every number has a source visible next to it.** No hover-to-reveal. Source is first-class.
3. **One-click copy, with citation attached.** Never just the number — always the number plus its citation in one paste.
4. **The interface reads in English first.** Labels are plain language. Scope terminology appears with inline tooltips explaining it. Methodology jargon (location-based, operating margin) is explained everywhere it appears.
5. **Speed over features.** Search results under 100ms. Page load under 1 second. No JavaScript bloat.
6. **Mobile usable.** Practitioners search on phones during meetings. The mobile table view is a real design problem, not an afterthought.
7. **No sign-up required to search or copy factors.** Zero friction. Sign-up only gates bulk export, saved searches, API access, and team features.

## Core UI surfaces

### Surface 1: Home / search page

Single search box, centred, no clutter. Hero copy: "Every emission factor. Sourced. Dated. Free." Below the search box: 6 quick-start chips ("Electricity by country", "Business travel", "Road transport India", "Scope 3 spend", "Refrigerants", "Freight"). Below chips: small trust row with the 6 source logos.

### Surface 2: Search results

Table view. Columns: Activity | Region | Value | Unit | Source | Vintage | Scope. Sticky header. Virtual scroll for large result sets. Each row expandable to reveal full metadata without leaving the page. Left sidebar: faceted filters (Source, Region, Scope, Vintage year, Category, Methodology). Top-right: "Copy all with citation" for bulk use.

### Surface 3: Single factor page

Every factor has its own public URL: `/emission-factors/{slug}` — e.g. `/emission-factors/defra-2024-electricity-uk-grid`. This is the SEO surface.

On the page:
- The value, large, front and centre
- Full activity and region description
- Source card: publisher logo, document title, direct PDF link, page reference
- Citation block: formatted in APA, Harvard, and inline formats, with copy buttons
- Methodology explainer (when relevant): 2-3 short paragraphs explaining what the methodology assumes, in plain English
- Related factors: "Also used with", "Alternative sources for the same activity", "Historical versions"
- Last verified date: a stamp showing when a Greentryst editor last checked this factor still matches its source
- Notes section: any known caveats or applicability rules

### Surface 4: Source page

Every source has its own page: `/emission-factors/sources/defra-2024`. Lists every factor drawn from that source, links to the primary document, and explains when to use this source vs an alternative. These pages are also SEO targets.

### Surface 5: Compare

User picks 2 to 4 factors for the same activity from different sources and compares them side by side. Shows value, methodology, vintage, and a plain-English explanation of why they differ. Useful for practitioners deciding which factor to adopt.

### Surface 6: Signed-in dashboard (light)

A signed-in user sees saved factors, recently viewed, search history, and a "cite list" (collect factors for a specific report, then export the cite list as a formatted bibliography). This is the thread that connects the free tool to the paid workspace later.

## Citation system

Every factor displays a citation in three standard formats, one click to copy each:

**Inline:**
`(DEFRA, 2024)`

**APA:**
`UK Department for Environment, Food & Rural Affairs (DEFRA). (2024). UK Government GHG Conversion Factors for Company Reporting 2024. Table 3.4. Retrieved from https://www.gov.uk/government/publications/...`

**Harvard:**
`DEFRA (2024) UK Government GHG Conversion Factors for Company Reporting 2024. UK Department for Environment, Food & Rural Affairs. Available at: https://...`

**Copy-as-value:**
`0.207 kgCO2e/kWh (DEFRA 2024, UK grid electricity, Table 3.4) — via Greentryst`

That last variant is the practitioner's default. It carries the number, the units, the source, and a soft attribution back to Greentryst without being obnoxious.

## Accuracy and trust system

This is the product's moat. Everything here is non-optional.

1. **Dual-source verification on ingestion.** Every factor ingested is cross-checked by a human editor against the primary source before it goes live. A second editor verifies. The pair of verifier initials is visible on the factor page.
2. **Vintage never drifts.** DEFRA 2024 remains as "DEFRA 2024" forever. When DEFRA 2025 releases, DEFRA 2024 does not update. Practitioners restating prior-year inventories need the old factor to stay stable.
3. **Supersession is visible.** When a newer version exists, the older factor page shows a banner linking to the newer one, but the page itself remains accessible at the same URL.
4. **Annual re-verification.** Every factor is re-checked against its source annually. The "last verified" date is displayed and must be less than 13 months old for a factor to be highlighted as current.
5. **Changelog per factor.** Any correction (typo, unit fix, methodology clarification) is logged on the factor page with a timestamp and editor note. Never silently edited.
6. **Issue reporting.** Every factor page has a "report an issue" button that emails the data team. Responses within 5 business days. Public acknowledgement on the factor page if a correction results.
7. **License compliance.** Every source's attribution requirements are honoured on every factor page. Open Government Licence, Creative Commons, etc.

## Anti-scraping strategy

The tension: we need Google to crawl and index factor pages for SEO, but we do not want Climatiq or a competitor to scrape the entire database and clone it.

Approach: allow crawlers, discourage bulk automation.

1. **HTML-first rendering for single factor pages and search-friendly surfaces.** Google sees everything.
2. **Search results table renders client-side with virtualized rows.** A crawler sees the page but not the full dataset.
3. **Rate limiting at the edge.** Cloudflare rule: more than 60 page loads per minute from a single IP triggers a challenge. More than 300 per minute triggers a block.
4. **No public API in v1.** API access is behind authentication and behind a terms-of-use agreement. Unauthenticated bulk access is simply not offered.
5. **Canary factors.** Plant 3 to 5 synthetic factors with values slightly wrong (e.g. off by the 4th decimal). Monitor the web quarterly for anyone reproducing those canaries elsewhere. That is evidence of scraping for legal action.
6. **Attribution as terms-of-use.** The site's terms explicitly permit personal and educational use with attribution. Commercial bulk use requires a license. This does not stop scraping technically, but it creates legal teeth.
7. **Copy-button quirks.** The copy-as-value format includes "via Greentryst" by default. Users can toggle this off for plain number copy, but the default carries attribution. Anyone scraping the rendered page will accidentally propagate Greentryst citations throughout their output, which is good marketing and good forensic tracing.

Acceptable trade-off: a determined scraper can still get the data. A casual scraper cannot. The goal is to make scraping more effort than licensing a proper data API from Climatiq.

## SEO strategy

Every factor page, every source page, every activity category page is a crawlable, indexable URL with structured data.

Each factor page emits JSON-LD:

```
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "UK Grid Electricity Emission Factor (DEFRA 2024)",
  "description": "...",
  "creator": { "@type": "Organization", "name": "DEFRA" },
  "distribution": { "contentUrl": "...pdf link..." },
  "temporalCoverage": "2024",
  "spatialCoverage": "United Kingdom",
  "variableMeasured": "CO2 equivalent per kWh",
  "isAccessibleForFree": true,
  "license": "..."
}
```

Target keyword patterns per page: `{activity} emission factor {region} {year}`, e.g. "uk grid electricity emission factor 2024 defra."

Internal linking:
- Every factor page links to at least 3 related factors
- Every factor page links to the matching guide explaining how to use it
- Every lesson in the existing course library that references an emission factor links to the specific factor page

Sitemap split: `sitemap-emission-factors.xml` lists every factor and source URL. Submitted separately in Search Console.

## Tech stack

- Frontend: Next.js 14 App Router (already the stack). Static generation for factor and source pages. Client-side search over a preloaded JSON index for speed.
- Search: MiniSearch or Fuse.js in-browser on a compact search index (~500KB for v1). No server call for typical queries. Advanced filters fall back to server query.
- Data storage: Turso (already the stack) for factor and source records. SQLite mirror in the repo for static generation at build time.
- Edge rate limiting: Cloudflare (already in front of Vercel).
- Search index rebuild: triggered on content push via GitHub Action.

No new services. All within current infrastructure.

## Data ingestion pipeline

Purely offline, CLI-driven. Not automated in v1.

1. Editor downloads source (DEFRA PDF, EPA CSV, IPCC Excel).
2. Editor runs `scripts/ingest-source.ts <source-slug>` which opens a structured entry template.
3. Editor extracts each factor row: activity, region, value, units, methodology, page reference.
4. Script validates units and cross-checks against existing factors for the same activity.
5. Second editor reviews each extracted row in a diff UI.
6. Approved batch merges to the main branch. Build regenerates factor pages and search index.

This is tedious by design. Accuracy requires human eyes. The tedium bounds the maintenance cost to ~10 days per year for a 1,000-factor library.

## Success metrics (first 90 days post-launch)

| Metric | Target |
|---|---|
| Unique visitors to emission-factors.greentryst.com per month | 2,000 by day 60, 10,000 by day 90 |
| Average session depth (factors viewed per session) | 3+ |
| Copy-button click rate | 20% of sessions |
| "Cite this" button click rate | 5% of sessions |
| Organic search queries indexed and ranking top 20 | 100+ by day 90 |
| Backlinks from external domains | 20+ by day 90 |
| Newsletter mentions | 5+ by day 90 |
| Inbound emails referencing the product | 10+ by day 90 |

Failure signal: after 90 days of active distribution, if unique monthly visitors remain below 1,000, the accuracy-first positioning is not landing and the broader thesis is wrong. Pivot.

## Launch plan

### Week 1 (data seed and spine)
- Build schema, factor page template, source page template
- Ingest DEFRA 2024 (~280 factors) with full verification
- Ingest IPCC AR6 GWPs and key factors (~60 factors)
- Deploy to staging

### Week 2 (remaining sources + UX polish)
- Ingest India CEA, US EPA Hub, India MoRTH, US EEIO seed
- Build search, filter, compare surfaces
- Wire citation system, anti-scraping rate limits
- Internal QA: 20-person verification sweep on top 50 factors

### Week 3 (production launch + SEO)
- Deploy to production at `greentryst.com/emission-factors`
- Submit split sitemap to Search Console
- Request indexing on top 50 factor pages
- Distribution: LinkedIn post, HN, 3 newsletter outreach, 5 Reddit communities, 10 personal emails to sustainability contacts

### Weeks 4-6 (iteration + expansion)
- Monitor search logs, identify missing factors practitioners searched for
- Add 3-5 additional sources based on real demand (likely IEA, BEIS, Ademe)
- Ship v1.1 with compare feature and saved factors for signed-in users

## Non-goals (v1)

- No API access in v1. Add in v2 behind auth and attribution.
- No user-generated factors. Database is editorial.
- No machine-learning factor estimates. Only published, cited values.
- No calculator that uses these factors. That is a separate product.
- No spend-based estimates for countries we lack data for. No hallucinated values.
- No paid tier within this product. Monetization happens later, via the workspace product.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Maintenance burden grows faster than expected | Cap ingestion at 1,500 factors for year one. Prioritize what real search data shows is wanted. |
| A competitor (Climatiq, new entrant) matches the free positioning | The moat is the citation-first UX and the SEO backlog. Being first by 6 months is enough. |
| Data accuracy error leaks and damages reputation | Dual verification, changelog, issue button. A visible correction process is better than a pretended perfect record. |
| Scraping by a well-resourced competitor | Terms of use + canaries + legal response. Accept that technical prevention is imperfect. |
| SEO does not rank in 90 days | Distribution channels (LinkedIn, newsletters, Reddit) carry traffic while SEO compounds. |
| The accuracy thesis is wrong | Metrics at day 90 tell us. Pivot rather than throw more money at it. |

## What the product is NOT

It is not another carbon calculator. There are 50 of those. It is not an API for developers. That is Climatiq. It is not a workspace. That is the future paid product. It is not an aggregator that blindly republishes every source it can find. It is an editorial product. Factors are curated, verified, and displayed with care.

It is a reference that practitioners keep open in a tab.

## Open questions to resolve before Week 1

1. Domain structure: `greentryst.com/emission-factors` vs a subdomain. Recommendation: path, not subdomain, to inherit domain authority.
2. Attribution requirement for copied factors: soft (default-on) or hard (enforced)? Recommendation: soft, with a visible toggle. Do not friction the core user flow.
3. Source ingestion format: direct from PDF via OCR pipeline, or manual entry for v1? Recommendation: manual for v1. The time cost is real but the accuracy risk of OCR on government PDFs is larger.
4. License model for the database: CC BY-NC 4.0? Open Database License? Fully proprietary with permitted personal use? Recommendation: draft terms that permit personal, educational, and internal corporate use with attribution. Require a license for commercial redistribution or bulk extraction.
5. How many of the 470 existing lessons should be refactored to cross-link to factor pages in the launch sprint? Recommendation: zero in Week 1. Add internal links in Weeks 4-6 once factor pages are stable.

## Decision log

This spec is a living document. All subsequent material decisions get appended here with date, rationale, and impact on scope.
