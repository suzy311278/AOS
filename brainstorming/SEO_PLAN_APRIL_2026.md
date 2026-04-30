# SEO Plan - April 2026

**Date:** 2026-04-14
**Source:** Google Search Console audit via `mcp__gsc__*` tools
**Property:** `sc-domain:greentryst.com`
**Window:** Last 3 months (2026-01-14 to 2026-04-13)

## State of SEO

| Metric | Last 28d / 3mo | Notes |
|---|---|---|
| Clicks | 0 | Zero click-throughs |
| Impressions | 818 | All impressions within last 28 days |
| Avg CTR | 0.0% | |
| Avg Position | 16.2 | Page 2 of Google |
| Indexed pages | 735 submitted, all verified indexed via `index_inspect` | Sitemap reports `indexed: 0` incorrectly |
| Top device | Desktop 97% (pos 15), Mobile 3% (pos 44) | |
| Top countries | Canada, Brazil, Belgium, Switzerland, China | No dominant market |

### Technical checks (all PASS)
- Homepage canonical is correct in live HTML (`https://greentryst.com`). Earlier Google crawl from 2026-04-09 showed a stale Vercel URL; Google's cache will refresh on next crawl.
- BreadcrumbList JSON-LD on lesson pages has valid `item` fields.
- FAQPage JSON-LD has valid `name` + `acceptedAnswer.text` on each Question.
- Sitemap healthy: 735 URLs, 0 errors, 0 warnings.

### Core diagnosis
Site is crawled and indexed. Pages rank on page 2 with zero CTR. The problem is **topical authority and content depth, not technical SEO**. No single query crosses 50 impressions, so "quick wins" detection returns nothing. Strategy: consolidate topical clusters with dedicated guide pages to push top-10-ranking queries onto page 1 and build authority.

## Query clusters (opportunity ranking)

### Tier 1 - Ship this week (already positions 6-17, consolidate with hub pages)

**1. EU CBAM Definitive Regime - 29 impressions, positions 6-17**
- "cbam certificates surrendered 2026" - 11 imp, pos 17
- "eu cbam surrender certificates annually" - 8 imp, pos 7
- "eu cbam annual declaration deadline definitive regime" - 2 imp, pos 9
- "eu cbam surrender certificates" - 2 imp, pos 8
- "eu cbam transitional phase dates october 2023 to december 2025" - 2 imp, pos 7.5
- "eu cbam purchase and surrender certificates" - 1 imp, pos 6
- "eu cbam registry integration with customs systems" - 1 imp, pos 7
- "cbam definitive regime start date" / "january 2026" - pos 10
- "cbam registry" / "registration" / "login" / "yearly cbam declarations" - pos 29-50

**2. EUDR Compliance - 16 impressions, positions 6-39**
- "eudr timeline" - 4 imp, pos 35
- "eudr risk assessment" - 3 imp, pos 39
- "eudr deforestation cutoff date" - 2 imp, pos 6.5
- "eu deforestation regulation penalties 4% annual eu turnover" - 2 imp, pos 12
- "eudr compliance plot-level geolocation data collection" - 2 imp, pos 17
- "how to collect geolocation data for eudr" - 1 imp, pos 16
- "national agricultural traceability system eudr" - 1 imp, pos 18

**3. Verra VM0044 Biochar - 15 impressions, positions 8-30**
- "verra biochar methodology vm0044" - 10 imp, pos 21
- "vm0044" - 2 imp, pos 8.5
- "vm0042" - 2 imp, pos 30

### Tier 2 - Ship within 2 weeks (high demand, weak rankings)

**4. SFDR + PAI - 25 impressions, positions 14-91**
- "sfdr pai reporting" (6 imp), "pai indicators" (4), "sfdr pai" (4), "pai sfdr" (4)
- "sfdr regulation explained" - pos 18; "sfdr eu regulation" - pos 14
- Plus: principal adverse impact, sfdr classification, sfdr meaning, adverse impacts

**5. SBTi + Science-based targets - 24 impressions, positions 53-131**
- "sbti certification" - 8 imp, pos 89
- "science based carbon reduction target" - 3 imp
- "science based target setting" / "meaning" / "definition" - multiple
- "sbti training / services / test / target" - multiple

**6. IFRS S2 / ISSB disclosures - 10 impressions**
- "ifrs s2" - 3 imp, pos 63
- "issb climate risk disclosures" - 2 imp, pos 29
- "ifrs foundation climate risk disclosures" - 2 imp, pos 47
- "ifrs s2 climate-related disclosures physical risks transition risks acute chronic" - pos 12

### Tier 3 - Queue for Week 3+

**7. CDP Scoring - 6 impressions**
- "cdp scoring methodology" - 3 imp, pos 32
- "cdp benchmarking" - 2 imp, pos 17
- "cdp methodology" - 1 imp, pos 60

**8. Reporting framework comparison - 7 impressions**
- "sasb vs tcfd" - 4 imp, pos 66
- "gri vs sasb vs cdp sustainability reporting standards comparison" - 2 imp, pos 88
- "corporate sustainability reporting framework comparison gri sasb tcfd" - 1 imp, pos 64

**9. Scope 3 deep dives - 8 impressions**
- "downstream leased assets" - 4 imp, pos 25 (strong)
- "scope 3 category 13" - 1 imp, pos 16
- "scope 3 accounting" - 3 imp, pos 59

**10. BRSR (India market) - 2 impressions**
- "brsr report format" - 1 imp, pos 91
- "the annual business responsibility report" - 1 imp, pos 77

### Tier 4 - Backlog / evergreen

- Double materiality ("gri double materiality", pos 61)
- ICVCM / CCP labelled credits (pos 30-42)
- Climate science fundamentals (earth energy balance, climate feedbacks, co2 lifetime, carbon dioxide methane nitrous oxide) - lessons exist, need internal linking from a foundational climate guide
- PCAF scores (pos 50)
- ITMO (pos 28)

## Content pipeline

| # | URL | Target imp | Effort | Priority | Owner | Status |
|---|---|---|---|---|---|---|
| 1 | `/guides/cbam-2026-definitive-regime` | 29 | 1 day | P0 | | Not started |
| 2 | `/guides/eudr-compliance-2026` | 16 | 1 day | P0 | | Not started |
| 3 | `/guides/vm0044-biochar-methodology` | 15 | 0.5 day | P0 | | Not started |
| 4 | `/guides/sfdr-pai-reporting-explained` | 25 | 1 day | P1 | | Not started |
| 5 | `/guides/sbti-target-setting` | 24 | 1 day | P1 | | Not started |
| 6 | `/guides/ifrs-s2-climate-disclosures` | 10 | 1 day | P1 | | Not started |
| 7 | `/guides/cdp-scoring-methodology` | 6 | 0.5 day | P2 | | Not started |
| 8 | `/guides/reporting-frameworks-compared` | 7 | 1 day | P2 | | Not started |
| 9 | `/guides/scope-3-downstream-leased-assets` | 5 | 0.5 day | P2 | | Not started |

Total: 9 guides, approximately 7.5 dev-days of writing.

## Guide content spec (applies to every new guide)

Each guide must include:
1. H1 matching the most-impressed query in the cluster verbatim where possible
2. TL;DR callout at the top (3-4 bullets, answers the user's question in under 30 seconds)
3. Full compliance timeline / framework breakdown with dates, figures, penalties
4. FAQ section with H2/H3 headings matching the exact query strings from GSC data (for FAQPage rich results eligibility)
5. Internal links to every related lesson (CBAM lessons, EUDR lessons, etc.)
6. External authoritative sources cited (EU regulations, IPCC, IFRS Foundation)
7. Meta title: 50-60 chars, includes primary query
8. Meta description: 140-155 chars, includes secondary keyword
9. JSON-LD: `Article` + `FAQPage` + `BreadcrumbList`
10. Reading time shown above content
11. Last updated date shown (Google prefers fresh content for regulatory topics)

## Non-content actions

- Request re-indexing in GSC for top 15 URLs to flush stale Rich Results cache
- Confirm Vercel deployment is serving the corrected canonical (homepage already verified live)
- Split sitemap by content type: `sitemap-courses.xml`, `sitemap-lessons.xml`, `sitemap-guides.xml`
- Add `JobPosting` structured data to `/jobs` rows for Google Jobs eligibility
- Give each glossary term its own indexable URL (currently fragments on `/glossary#term-{slug}`); high long-tail surface area
- Run PageSpeed Insights on mobile (pos 44 vs desktop pos 15 suggests mobile rendering issue)
- Backlink push: sustainability directories, LinkedIn longform, guest posts on climate / ESG blogs

## Success metrics (end of April review)

- Tier 1 queries: at least 3 queries at position less than or equal to 5
- First clicks recorded (target: 10+ clicks / month by end of April)
- At least 4 of 9 guides shipped and indexed
- Mobile avg position improves from 44 to under 25

## GSC access

- MCP server: `gsc` (configured in `~/.claude.json`, project-local)
- Credentials: `/Users/knowprajjwal/.claude/sustainabilityprojects-f04745b6b223.json`
- Service account email added to Search Console with `siteRestrictedUser` permission
- Site URL: `sc-domain:greentryst.com`
