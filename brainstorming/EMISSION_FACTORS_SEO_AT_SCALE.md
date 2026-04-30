# SEO Guidance — Emission Factors Database at 200K Scale

**Context:** The Emission Factors Database is being scoped at ~200,000 factors across all sources, countries, sectors, vintages, and methodologies. This changes the SEO problem fundamentally. A 1,000-factor editorial site is a content site. A 200,000-factor site is a **programmatic SEO product**. Different risks, different architecture, different rewards.

**Companion to:** `EMISSION_FACTORS_PRODUCT_SPEC.md`
**Target ceiling:** 200,000 factor pages + 5,000 hub/category pages + 500 editorial pages
**Last updated:** 2026-04-16

## The core SEO challenge of 200K pages

Google hates three things at programmatic scale:
1. **Thin content** — pages that exist only for the keyword, not the user
2. **Duplicate content** — near-identical pages produced by a template
3. **Low-quality doorway pages** — pages that funnel to the same destination

All three will trigger automatic quality suppression. Sites that handle this well (Zillow, Airbnb location pages, GitHub repo pages, Stack Overflow question pages) share one discipline: **every page has unique value beyond the template**. Every page that does not has to be `noindex`.

Your product has a natural advantage because every factor has a genuinely different number, source, vintage, and context. The SEO work is to surface that uniqueness cleanly.

## Site architecture at scale

### URL hierarchy (critical)

Do not flatten 200K URLs under `/emission-factors/{id}`. That tells Google nothing about structure. Hierarchy is how crawl budget is allocated and how internal link equity flows.

```
/emission-factors                                               (root hub)
/emission-factors/sources/defra                                 (source hub)
/emission-factors/sources/defra/2024                            (vintage hub)
/emission-factors/categories/electricity                        (category hub)
/emission-factors/categories/electricity/grid                   (sub-category hub)
/emission-factors/regions/gb                                    (country hub)
/emission-factors/regions/in-newne                              (sub-region hub)
/emission-factors/scope-2/market-based                          (methodology hub)
/emission-factors/electricity-grid-uk-2024-defra                (individual factor - canonical leaf)
```

Every individual factor has exactly one canonical leaf URL. Everything else is a hub page. Leaf URL slugs follow the pattern: `{activity}-{sub-region}-{vintage}-{source}`.

### Tier the 200K pages by quality

Not every factor deserves equal SEO investment. Assign a quality tier on ingestion:

| Tier | Count | Treatment | Index? |
|---|---|---|---|
| Gold — top practitioner factors, high search volume | ~500 | Hand-crafted explainer, related factors, worked example, FAQ | Yes, priority in sitemap |
| Silver — common factors across major sources and countries | ~5,000 | Templated with rich metadata, methodology note, 2-3 related factors | Yes |
| Bronze — long-tail factors | ~50,000 | Templated with basic metadata only | Yes, low priority |
| Archive — superseded vintages and rarely-queried factors | ~145,000 | Templated, minimal, canonical points to current version where applicable | **Noindex** |

Only ~55,000 URLs end up in Google's index. The other ~145K remain accessible to users on direct link but do not compete for search ranking. This is the same pattern Zillow uses for closed listings.

### Hub pages are your ranking engine

Leaf pages will rank for long-tail queries ("uk grid electricity emission factor 2024 defra"). But the **volume** and **authority** come from hub pages ranking for high-volume queries:

- `/emission-factors/electricity` targets "electricity emission factors"
- `/emission-factors/sources/defra` targets "defra emission factors"
- `/emission-factors/regions/in` targets "india emission factors"
- `/emission-factors/scope-2` targets "scope 2 emission factors"

Each hub page must be a real page with curated content — explainer text, top factors in that category, related categories, FAQ. Not just a filtered table. These are the pages that earn backlinks and feed ranking juice down to leaf pages.

Budget ~80 hub pages at launch, growing to ~500 by month six.

## Crawl budget management

Google will not crawl 200K pages quickly on a new-ish domain. Current Greentryst trust signal is low. Expect Googlebot to crawl 500 to 5,000 pages per day initially, growing with domain authority. At 2,000 pages/day, full coverage of 200K pages takes **100 days**.

### Split sitemaps

One sitemap per cluster, indexed from a parent sitemap:

```
/sitemap.xml                                    (sitemap index)
/sitemap-emission-factors-root.xml              (root + hubs, ~500 URLs)
/sitemap-emission-factors-defra.xml             (all DEFRA factors, ~10K URLs)
/sitemap-emission-factors-ipcc.xml
/sitemap-emission-factors-epa.xml
/sitemap-emission-factors-iea.xml               (country electricity factors, large)
/sitemap-emission-factors-eeio.xml              (spend-based factors by sector)
/sitemap-emission-factors-india.xml             (India CEA, MoRTH, etc.)
/sitemap-emission-factors-archive.xml           (superseded factors, noindex but linked)
```

Sitemaps under 50,000 URLs each. Prioritize in `<priority>` tag: hubs at 1.0, gold factors at 0.9, silver at 0.7, bronze at 0.5. Use `<lastmod>` truthfully — changing it without real change is a spam signal.

### Prioritize crawl with internal links, not just sitemaps

Sitemaps tell Google URLs exist. Internal links tell Google which URLs matter. Every factor page should link to:
- Its source hub
- Its category hub
- Its region hub
- 3 to 5 related factors (same activity different source, or same source different region)
- The matching guide or lesson (`/guides/what-are-emission-factors` or `/courses/ghg-scope-1-2/...`)

This creates a dense internal graph. Google treats heavily-interlinked pages as higher priority.

### Server response speed

200K statically generated pages is fine for Vercel, but the build will take 30+ minutes. Incremental Static Regeneration (ISR) with a long stale-while-revalidate window is the right pattern. Edge caching via Vercel Edge Network handles Googlebot load without origin stress.

Factor page render target: **TTFB under 200ms, LCP under 1.5s**. This is checked in Core Web Vitals and affects rankings.

## Avoiding thin content and duplicate content penalties

At 200K pages, this is the biggest risk. Three rules.

### Rule 1 — every page must have real unique content

A factor page is not just the number. Template each page as:

```
[Unique H1: Activity — Region — Vintage — Source]
[One-sentence summary, factor-specific: "The UK grid electricity emission factor for 2024
is 0.207 kgCO2e/kWh, published by DEFRA in the Greenhouse Gas Conversion Factors for
Company Reporting 2024."]
[Large number display]
[Structured metadata table]
[Methodology note — written per category, shared across similar factors but not duplicated
verbatim across regions/vintages]
[Usage guidance — when to pick this factor vs alternatives]
[Related factors — 3 to 5 links with one-line context each]
[Citation block in 3 formats]
[FAQ — 3 to 5 questions, factor-specific where possible]
[Source card — publisher, license, link to primary PDF]
[Last verified date]
```

The methodology note and FAQ are templated per category (not per factor), so all "electricity grid" factors share a methodology explainer. That is acceptable — it is not duplicate content in Google's sense because the surrounding numbers, regions, and vintages differ.

What is NOT acceptable: 200,000 pages that differ only in a number. Google catches that within 30 days.

### Rule 2 — canonicalize aggressively

Every factor exists at exactly one canonical URL. Any other access path (filtered search result, sort variant, query-string parameter) sets `<link rel="canonical">` to the leaf URL.

Handle vintage supersession explicitly:
- DEFRA 2023 factor URL: `/emission-factors/electricity-grid-uk-2023-defra`, canonical to itself, kept indexable with a banner pointing to 2024
- DEFRA 2024 factor URL: `/emission-factors/electricity-grid-uk-2024-defra`, canonical to itself
- If user queries without specifying a year, redirect `/emission-factors/electricity-grid-uk-defra` (canonical unversioned) to the current year's factor

Never use the same URL for different data. Never use different URLs for the same data without a canonical pointing to one.

### Rule 3 — noindex the archive tier

Factors superseded by two or more vintages, factors from deprecated sources, and factors with zero internal links or external demand should carry `<meta name="robots" content="noindex,follow">`. They remain accessible via direct link (so old citations don't break) but don't compete for search positioning.

`follow` matters — you want Google to still crawl through them for internal link discovery. Just not index them.

## Schema.org at scale

Every factor page emits three JSON-LD blocks:

```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "UK Grid Electricity Emission Factor (DEFRA 2024)",
  "description": "Greenhouse gas emission factor for electricity consumed from the UK national grid, 2024 vintage, published by DEFRA.",
  "identifier": "greentryst:ef:electricity-grid-uk-2024-defra",
  "url": "https://greentryst.com/emission-factors/electricity-grid-uk-2024-defra",
  "license": "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
  "creator": {
    "@type": "Organization",
    "name": "UK Department for Environment, Food & Rural Affairs"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Greentryst"
  },
  "variableMeasured": [{
    "@type": "PropertyValue",
    "name": "CO2e emission factor",
    "value": 0.207,
    "unitCode": "kgCO2e/kWh"
  }],
  "temporalCoverage": "2024",
  "spatialCoverage": {
    "@type": "Place",
    "name": "United Kingdom"
  },
  "isAccessibleForFree": true
}
```

Plus `BreadcrumbList` for the hierarchy, plus `FAQPage` if the page has a FAQ section. JSON-LD rich results eligibility is a real CTR lift on SERPs that display them.

## Programmatic SEO content templates

The templating approach. For each category (electricity, fuels, refrigerants, transport, waste, sector_spend, agriculture, etc.), write one master template. Variable substitution fills in factor-specific values.

Example template for "electricity grid" category:

```
TITLE: {Region} Grid Electricity Emission Factor {Year} ({Source}) | Greentryst
META: The {Year} emission factor for grid electricity in {Region} is {Value} {Unit},
published by {Source}. Scope 2, {Methodology}. Includes citation and related factors.

H1: {Region} Grid Electricity Emission Factor ({Year}, {Source})

SUMMARY: The grid electricity emission factor for {Region} in {Year}, as published by
{Source}, is {Value} {Unit}. This factor applies to Scope 2 emissions reporting using
the {location_based|market_based} methodology.

[FACTOR DISPLAY]

WHEN TO USE: Use this factor when calculating Scope 2 emissions from purchased electricity
consumed in {Region} during {Year}. For corporate inventories reporting on a different vintage,
see {link to other vintages}. For organisations with renewable energy procurement, consider
the market-based method using supplier-specific residual mix factors — see our guide on
{location vs market}.

METHODOLOGY NOTE: {Category-level methodology paragraph, shared across all electricity factors
in this region/vintage — but written once per category and cached}.

RELATED FACTORS:
- {Same region, prior year}: {link}
- {Neighboring region, same year}: {link}
- {Same region, market-based variant if available}: {link}

FAQ:
- What methodology does {Source} use for {Region} {Year}?
- How does this factor compare to {alternative source}?
- When should I use location-based vs market-based for {Region}?
```

Templates must vary by category. The "electricity" template cannot be used for "refrigerants" or "business travel." Writing 20 category templates is a week of editorial work done once.

## The titles and meta descriptions problem at scale

200K titles and 200K meta descriptions will be template-generated. They must still feel natural. Rules:

1. **Titles under 60 characters.** Template to: `{Activity} — {Region} — {Year} {Source} | Greentryst`. Example: "Grid Electricity — UK — 2024 DEFRA | Greentryst"
2. **Meta descriptions under 155 characters.** Template: `{Activity} emission factor for {Region} in {Year}, published by {Source}. {Value} {Unit}. Full citation and related factors.`
3. **H1 separate from title.** H1 can be more detailed: "UK Grid Electricity Emission Factor (2024, DEFRA)".
4. **Never leave placeholder text.** Templates that render `{Source}` literally when the source field is null will destroy SEO overnight. Ingestion validation must block publication of any factor with missing template variables.

## Competition with Climatiq and DEFRA

Climatiq sells API access. Their website is docs-first, not SEO-first. They do not rank well for long-tail emission factor queries today. Check SERP for "uk grid electricity emission factor 2024" — DEFRA's PDF ranks first, then sustainability consultancy blog posts, then aggregators. Climatiq is rarely in the top 10.

That is the gap. A well-built programmatic SEO site with 200K pages, clean URL structure, rich JSON-LD, and genuine content on each page can own the long-tail emission factor SERP within 6 to 12 months.

DEFRA PDFs will always rank, because they are the primary source. Your goal is not to outrank DEFRA — it is to rank alongside DEFRA on queries where DEFRA's PDF is impractical for a practitioner. "What is the DEFRA 2024 emission factor for air freight short-haul?" is a query where a clean web page beats a 200-page PDF every time.

## Progressive launch strategy

Do not submit 200K pages on launch day. Google's automatic spam detection flags sudden mass publication.

**Week 1:** ship ~2,000 gold + silver pages. Seed from DEFRA 2024, IPCC AR6, India CEA 2024, EPA Hub 2025. Submit initial sitemaps.

**Weeks 2–4:** add ~5,000 pages per week. Monitor Search Console for indexing rate. If indexing stalls or drops, pause ingestion and investigate quality signals.

**Month 2–3:** add ~15,000 pages per week if indexing keeps up. Prioritize high-volume categories first.

**Month 4–6:** complete the full 200K ingestion. Continue monitoring.

**Signal to watch in GSC:** the "Indexed" count in Pages report. If indexed grows with submitted, you are healthy. If submitted grows but indexed plateaus, Google is rejecting pages and you have a quality problem. Pause, diagnose, fix.

## Core Web Vitals at scale

Every factor page must hit:
- **Largest Contentful Paint (LCP):** under 1.5s
- **First Input Delay (FID) / Interaction to Next Paint (INP):** under 200ms
- **Cumulative Layout Shift (CLS):** under 0.1

Static generation with Next.js handles LCP. Minimize JavaScript on factor pages — the search and filter UI belongs on the search surface, not every factor page. Factor pages should be static HTML with zero client-side JS beyond copy buttons and analytics.

Test 500 randomly sampled pages in PageSpeed Insights before launch. Fix outliers.

## Accessibility and international SEO

Every factor page renders in English initially. When multi-language support ships (v2), use `hreflang` tags:

```
<link rel="alternate" hreflang="en" href="https://greentryst.com/emission-factors/..." />
<link rel="alternate" hreflang="hi" href="https://greentryst.com/hi/emission-factors/..." />
```

Hindi translation is strategic given your audience mix. Spanish and Portuguese are the next highest-value languages given emerging market footprint.

## Anti-scraping at 200K scale

At this scale, scraping becomes a real risk — someone can clone your entire database by hitting 200K URLs.

1. **Cloudflare rate limiting tightened.** Same IP pulling more than 300 factor pages per hour triggers a challenge. More than 1,000 per hour triggers block.
2. **Bot detection by user-agent patterns.** Known scraper UAs get the challenge path. Googlebot, Bingbot, and other verified crawlers are allowed-listed.
3. **Factor canaries.** Plant 20 synthetic factors with values off by the 4th decimal. Quarterly search for those exact values on the wider web. Any match is hard evidence of scraping.
4. **Terms of service** explicitly prohibit bulk extraction. License model permits personal, educational, and internal corporate use with attribution; commercial redistribution requires a license.
5. **No public bulk API in v1.** API access is gated behind authentication and attribution, with rate limits per account.
6. **Soft watermarks in copy-button output.** Default copy format includes "via Greentryst" unless explicitly toggled off. Forensic trace signal.

## SEO content surrounding the database

The database alone does not rank for the highest-volume queries ("emission factor", "scope 2 emission factor", "ghg protocol emission factors"). Those queries want explainers. Ship companion guides alongside:

- `/guides/what-are-emission-factors` (defines the concept, covers activity data, uncertainty, vintage)
- `/guides/how-to-choose-an-emission-factor` (decision tree, source selection)
- `/guides/location-based-vs-market-based-scope-2` (methodology explainer, links to factor pages)
- `/guides/defra-2024-emission-factors-explained` (source-specific deep dive, list of notable changes from 2023)
- `/guides/india-grid-electricity-emission-factors` (country-specific deep dive)
- `/guides/ghg-protocol-data-quality-hierarchy` (how to pick the right tier)

Each guide links down to ~20 factor pages. Each factor page links up to the relevant guide. This is the link graph that makes hubs rank.

## Measurement and KPIs specific to programmatic SEO

Beyond the generic SEO KPIs, track:

- **Indexed pages / submitted pages ratio.** Should stay above 60%. Below 40% signals quality rejection.
- **Impressions per indexed page.** A healthy programmatic SEO page averages 5 to 50 impressions per month. If 80% of indexed pages get 0 impressions, those pages are dead weight — noindex them.
- **Clicks per indexed page** (CTR health).
- **Orphan page count.** Any factor page with fewer than 3 internal inbound links is orphaned. Fix the internal linking.
- **Average position for leaf pages vs hub pages.** Hubs should rank better on average.
- **Index coverage errors in GSC.** Check weekly. "Crawled - currently not indexed" at scale is the signal to stop ingestion and fix quality.

## Risks specific to 200K-page programmatic SEO

| Risk | Mitigation |
|---|---|
| Mass thin-content penalty wipes out rankings | Tier pages, noindex archive, enrich templates per category |
| Google treats as spam and deindexes domain | Progressive launch, quality signals, internal linking, clean technical SEO |
| Crawl budget exhausted on low-value pages | Hub-first architecture, prioritized sitemaps, noindex archive |
| Scraped and cloned by competitor | Rate limiting, canaries, legal terms, watermarking |
| Maintenance burden at scale | Automated source refresh pipelines, not manual. Budget for a full-time data ops person by year two. |
| Site becomes too slow with 200K pages | Static generation + edge cache, zero-JS factor pages, image optimization |

## One-sentence summary

**At 200K factors, you are no longer running an editorial site — you are running a programmatic SEO product, and the entire design must be built around Google's patience with templates: every page must earn its place in the index, the hierarchy must carry authority from hubs to leaves, and the progressive launch must prove quality before scaling.**

## 90-day rollout aligned with this guidance

**Days 1–30:** build the architecture for 200K, not for 2K. Ingest 2,000 pages of gold and silver quality from DEFRA 2024, IPCC, India CEA 2024, EPA Hub 2025. Ship hub pages for the main clusters. Submit sitemaps. Monitor indexing rate.

**Days 31–60:** add 20,000 more pages in disciplined weekly batches. Ship 6 companion guides. Build hub pages for every category and every major region.

**Days 61–90:** evaluate index coverage. If healthy (>60% indexed), ramp ingestion to 50K additional pages. If unhealthy, pause and fix quality.

**Month 4 onwards:** complete the 200K target. By this point domain authority has grown, crawl budget is larger, and ranking compounds.
