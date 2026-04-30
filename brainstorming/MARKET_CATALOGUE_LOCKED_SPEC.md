# Carbon Market Intelligence, Locked Specification

Status: LOCKED on 2026-04-18
Branch: `main`
Live route: `/carbon/market`
Linked from: `/tools` hub (second tile, below Emission Factors)

This document is the single source of truth for the Carbon Market Intelligence page. Every section, component, piece of copy, and significant design or data decision is recorded here. Any change to a file referenced below requires a matching update to this document in the same commit.

## 1. Intent

The page exists to make the voluntary carbon market legible to a practitioner in one view. The two jobs are:

1. Act as Greentryst's visible claim to cross-registry coverage. Nine thousand six hundred and three projects across Verra VCS, Verra CCB, Verra PWRP, and Gold Standard, all normalized to one schema and served from a static file. No competitor in the Indian market exposes this much registry data for free.

2. Give a practitioner a way to triage the market without opening five browser tabs. Find a methodology, filter to a country, scan who is developing and retiring credits, read the full Verra project summary inline without leaving the page.

The tone is the same Bloomberg-terminal register used on the rest of the site. Dense, tabular, opinionated about defaults, no marketing language.

## 2. Branch and Safety Rules

All work on this page happens on `main`. There is no redesign branch for this feature. The pre-generated JSONs in `public/` are the shipped artifacts. Vercel does not regenerate them; the build script exits cleanly when the external aggregator data is absent (see Section 9).

## 3. Page Structure, In Order

The page flows through four sections:

1. Global navigation bar (`Nav tone="dark"`)
2. Dark charcoal header band with category label, two-line headline, subtitle, and four stat tiles
3. Light section containing the filter sidebar (desktop) or drawer (mobile), the toolbar, and the results surface
4. Global footer (`RedesignFooter`)

## 4. Section One. Navigation Bar

Reused unchanged. `Nav` from `@/components/Nav` with `tone="dark"` because the page opens on a dark hero band.

## 5. Section Two. Dark Charcoal Header Band

Inline in `src/app/carbon/market/_components/CarbonMarketClient.tsx`.

Background: `bg-gt-text-dark` (#18181B) with two overlays, matching the homepage hero and the `/courses` header:

1. `gt-dot-grid` absolute overlay at opacity 60
2. Two `gt-ambient-glow-dark` blobs (top-right and bottom-left) for the subtle teal ambient

Inner container: `max-w-[1280px]` with asymmetric padding `pt-20 md:pt-24 pb-10 md:pb-12` and `px-6 md:px-8` for tighter mobile gutters.

### 5.1 Headline block

- Eyebrow: `CategoryLabel tone="dark"` with the text `Carbon Market Intelligence`
- Headline: `SectionHeading size="section" tone="light"` split across two lines:
  > Global carbon market,
  > made traceable.
- Subtitle in white/70 at `text-[15px]`:
  > The work you used to do with five browser tabs, one search box away. 9,603 projects across all global carbon registries.

The projects count in the subtitle is rendered from the live index total. Do not hard-code.

### 5.2 Stat tiles

Four `Stat` components, `tone="light"` with `[&>div]:!text-white` override, matching the `/courses` pattern. Grid is `grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 max-w-4xl` with `mt-10 md:mt-12`.

Locked values (all pulled from `totals` on the index file):

1. `VCUs issued` — sum across VCS, CCB, and PWRP from `program_summary.json`
2. `VCUs retired` — sum across the same three programs
3. `projects indexed` — total count of rows in the catalogue
4. `buffer pool` — VCS AFOLU buffer credits only

Numbers are formatted with the `formatBig` helper: billions as `NB` to two decimals, millions as `NM` to one decimal, thousands as `NK` rounded.

## 6. Section Three. Catalogue Surface

Wrapper: `LightSection variant="pale" padding="lg" maxWidth="1440" className="!pt-12 !pb-20"`. The 1440 max width is intentional so the table has enough room without horizontal scrolling.

Layout is a two-column flex: `flex flex-col lg:flex-row gap-10`. Left column is the filter rail (`w-[240px]`, sticky at top-24, hidden below the `lg` breakpoint). Right column is the results area.

### 6.1 Filter rail

File: `src/app/carbon/market/_components/FilterSidebar.tsx`

Sections are stacked in this exact order. Any change to the order requires an update here.

1. **Registry** — checkbox list, sorted by project count descending. Values: Verra VCS, Verra CCB, Verra PWRP, Gold Standard.
2. **Status** — single-select `<select>` with an `Any status` empty option, then the five status buckets (Registered, Validation, Development, Inactive, Other) with live counts. Status was promoted to the second slot because it is the most common first filter after registry.
3. **Methodology** — searchable checkbox list. Shows top 10 by project count; `Show all` button expands to the full list. Course-available methodologies (VM0042, VM0044) carry a small `Course` pill linking to the matching course page.
4. **Country** — searchable checkbox list sorted by project count, capped at 50 visible entries.
5. **Additional Certifications** — checkbox list. The available options are `CCB`, `Climate Gold`, `Community Gold`, `Biodiversity Gold`, `Gold`. CORSIA, Article 6, and SD VISta were deliberately dropped from scope because that data is not present in the project-level CSVs.
6. **Clear all filters** button at the bottom, showing the active filter count.

### 6.2 Results toolbar

Above the results surface. Two groups:

- Left: search input (placeholder `Search projects, developers, methodologies`) and a mobile-only Filters button that opens the drawer.
- Right: mono project count and a Sort dropdown with six options:
  - Most recent registration (default)
  - Oldest registration
  - Largest annual credits
  - Smallest annual credits
  - Name A to Z
  - Name Z to A

Sort selection is also reflected in clickable column headers on the desktop table. Header clicks and dropdown changes share the same `{key, dir}` state.

### 6.3 Results surface (desktop)

File: `src/app/carbon/market/_components/ProjectTable.tsx`

Hidden below `md`. A fixed seven-column table inside a rounded white card:

| Col | Width | Sortable | Content |
|---|---|---|---|
| Project | 38% | yes (name) | Chevron (VCS only) + name with external-link icon + developer + cert chips |
| Registry | 9% | no | Short code (VCS / CCB / PWRP / GS) as a colored pill |
| Methodology | 12% | no | Mono text + optional `Course` pill |
| Country | 13% | no | Country with region subline |
| Status | 11% | no | Dot + label. Inactive renders in red. |
| Est. annual | 11% | yes (reductions) | Mono number right-aligned |
| Reg. | 6% | yes (date) | Mono YYYY-MM right-aligned |

Active sort column shows an up or down arrow in brand green. Default sort is `date desc`. Clicking the same header flips direction.

Row click on a VCS row toggles an inline drawer below the row with the first 500 characters of the Verra project description, trimmed and appended with a single ellipsis, plus a `View full project on Verra` link. Description data is lazy-loaded from `/carbon-market-descriptions.json` on first expand and cached in module scope.

### 6.4 Results surface (mobile)

Same file. Visible only below `md`. Each project renders as a stacked card:

1. Top row: registry chip, status chip (dot + label, inactive in red), registration date pushed to the right in mono
2. Project name as a link with the external-link icon, followed by the developer line
3. A two-column grid for Methodology and Country, with Course pill and region subline if present
4. Est. annual value full width
5. Certifications as chips below the grid
6. For VCS rows, a `Project summary` toggle button that expands the same 500-character description below the card

The mobile card list and the desktop table share one React component and one expand state so the two views stay in sync when the breakpoint crosses.

### 6.5 Pagination

Twenty-five rows per page. Page controls sit below the results surface as a simple Prev / `Page N of M` / Next nav with a `start–end of total` count on the left. Changing any filter, sort, or search resets to page 1. Page changes scroll to the top of the window.

### 6.6 Empty and loading states

- Before the index JSON has loaded: a centered white card with `Loading project index…`.
- After load, if no rows match: `No projects match these filters.`.
- If the fetch fails: the error message is surfaced verbatim in the same card.

## 7. URL State

All filter and sort state is mirrored to the URL so filtered views are shareable. Parameters:

- `registry`, `methodology`, `country`, `cert` — comma-separated values
- `status` — single value
- `q` — free-text search
- `sort` — one of `date-desc` / `date-asc` / `reductions-desc` / `reductions-asc` / `name-asc` / `name-desc`. Omitted when default.
- `page` — integer, omitted when 1

The `router.replace` is scroll-safe and debounced by React's render cycle.

## 8. Data Pipeline

### 8.1 Build-time generator

File: `scripts/generate-carbon-market-index.ts`

Reads four CSVs and ~4,778 VCS detail JSONs from the sibling `CarbonMarket Aggregator/data/` folder, normalizes to the schema below, and writes two artifacts to `public/`:

1. `carbon-market-index.json` — the full catalogue plus totals and precomputed facet counts. Current size: 5.35 MB uncompressed.
2. `carbon-market-descriptions.json` — a flat dictionary of `{ "vcs-<id>": "<description>" }`. Current size: 4.56 MB uncompressed, 4,778 entries.

When the aggregator folder is absent the script exits 0 with a warning. Vercel depends on this behavior because the aggregator data is never checked in.

### 8.2 Unified record schema

```
id: registry-prefixed string, e.g. "vcs-5976"
registry: "verra_vcs" | "verra_ccb" | "verra_pwrp" | "goldstandard"
name, developer, methodology, projectType, country, region: strings or null
status: raw registry status
statusBucket: "Registered" | "Validation" | "Development" | "Inactive" | "Other"
estAnnualReductions: number or null
estUnit: "tCO2e" | "tonnes_plastic" (PWRP uses tonnes_plastic)
registrationDate, creditingPeriodStart, creditingPeriodEnd: ISO date (YYYY-MM-DD) or null
additionalCertifications: string[] (CCB rows carry `CCB` plus parsed Distinctions)
registryUrl: canonical project URL on the source registry
```

### 8.3 Status bucket mapping

Collapses 23 VCS + 3 PWRP + 3 GS raw statuses into the five display buckets. Exact rules live in `normalizeVerraStatus` and `normalizeGsStatus`. Any new raw value not matched by these functions falls through to `Other`.

### 8.4 Registry coverage caveats

- VCS: 4,941 rows with full description coverage for 4,778 projects.
- CCB: 510 rows. No description data. Methodology not present in the CSV and is left `null`.
- PWRP: 88 rows. No descriptions. Est. annual uses the `Average Amount of Plastic Waste Collected/Recycled` column in tonnes of plastic.
- Gold Standard: 4,064 rows. No descriptions, no region column. Region is inferred via `COUNTRY_TO_REGION` at build time.

## 9. Runtime Loading

The page itself is SSG. `src/app/carbon/market/page.tsx` sets `dynamic = 'force-static'` and emits:

1. Page metadata (title, description, canonical, OpenGraph, Twitter)
2. A `Dataset` JSON-LD block pointing at `/carbon-market-index.json` so search engines can index the underlying dataset

The client component fetches `/carbon-market-index.json` once on mount, filters in memory, and lazy-fetches `/carbon-market-descriptions.json` only after the first row expand.

## 10. Design Tokens

All colors come from the `gt-` Tailwind palette. Notable choices:

- Charcoal header: `bg-gt-text-dark` with `gt-dot-grid` and `gt-ambient-glow-dark`, same as the homepage hero and `/courses` header
- Registry chips: `bg-gt-leaf/15 text-gt-medium` (VCS), `bg-gt-forest/15 text-gt-medium` (CCB), `bg-cyan-100 text-cyan-900` (PWRP), `bg-amber-100 text-amber-900` (Gold Standard)
- Status dot colors: `bg-gt-leaf` (Registered), `bg-sky-500` (Validation), `bg-violet-500` (Development), `bg-red-500` (Inactive), `bg-gt-text-dim` (Other)
- Status text color: muted gray for all states except Inactive, which uses `text-red-600` as a warning cue
- Course pill: `bg-gt-medium/10 text-gt-medium`, used in the methodology column and the filter rail

## 11. Locked Copy Inventory

Every piece of copy on this page is recorded here. Any change updates this list in the same commit.

1. Page title: `Carbon Market Intelligence`
2. Meta description (also the opening tagline for SEO): `Search 9,603 carbon credit projects from Verra VCS, Gold Standard, CCB, and Plastic Waste Reduction registries. Filter by methodology, country, vintage, and certification. Updated nightly.`
3. Header eyebrow: `Carbon Market Intelligence`
4. Header headline line 1: `Global carbon market,`
5. Header headline line 2: `made traceable.`
6. Header subtitle: `The work you used to do with five browser tabs, one search box away. {n} projects across all global carbon registries.`
7. Stat labels: `VCUs issued`, `VCUs retired`, `projects indexed`, `buffer pool`
8. Toolbar search placeholder: `Search projects, developers, methodologies`
9. Mobile filters button label: `Filters`
10. Sort options, in order: `Most recent registration`, `Oldest registration`, `Largest annual credits`, `Smallest annual credits`, `Name A to Z`, `Name Z to A`
11. Filter section headings: `Registry`, `Status`, `Methodology`, `Country`, `Additional Certifications`
12. Methodology search placeholder: `Search methodologies`
13. Country search placeholder: `Search countries`
14. Status empty option: `Any status`
15. Clear filters label: `Clear all filters`
16. Course pill label (in methodology column and filter rail): `Course`
17. Description drawer eyebrow (desktop): `Project summary`
18. Description mobile toggle label: `Project summary` / `Hide summary`
19. Description drawer CTA: `View full project on Verra`
20. Empty state: `No projects match these filters.`
21. Loading state: `Loading project index…`
22. End of results marker: `End of results` (legacy; not currently rendered because pagination replaces infinite scroll)
23. Tools hub tile title: `Carbon Market Intelligence`
24. Tools hub tile description: `Global carbon market, made traceable. 9,603 projects across Verra VCS, CCB, PWRP, and Gold Standard in one searchable index.`

## 12. Deferred and Post-Cutover Work

1. Description coverage for CCB, PWRP, and Gold Standard. The aggregator has empty `project_details/` folders for those registries. Running `python scraper/verra_api.py details --program CCB` (and the equivalents) will populate them; the generator already wires up only VCS because that is all we have.
2. Additional certifications at full scope. CORSIA-eligible, Article 6 Authorized, and SD VISta live in the assets CSVs, not projects CSVs, so they require a second build pass that joins on project id. Out of scope until we ship the retirements tab.
3. Refresh cadence. Today the index is refreshed manually by running the generator locally. A nightly GitHub Action that pulls the aggregator CSVs, regenerates the two JSONs, and opens a PR is the planned follow-up.
4. Per-project detail page. `/carbon/market/[id]` routes would let descriptions and document lists be crawlable. Not built today because the inline drawer is sufficient for the skimming use case.
5. Retirements intelligence. The richer dataset from `asset/search` (retirement beneficiary, serial numbers, retirement reason) is not yet exposed. This is the feature that unlocks the commercial upsell described in the PRD.

## 13. Change Control

If you are about to modify any of the following files, read this document first. Any change that affects an item in Section 11 (locked copy), the filter order in Section 6.1, the table column set in Section 6.3, the schema in Section 8.2, or the sort options in Section 6.2 must ship with an update to this document in the same commit.

1. `src/app/carbon/market/page.tsx`
2. `src/app/carbon/market/_components/CarbonMarketClient.tsx`
3. `src/app/carbon/market/_components/ProjectTable.tsx`
4. `src/app/carbon/market/_components/FilterSidebar.tsx`
5. `src/app/carbon/market/_components/FilterDrawer.tsx`
6. `src/app/carbon/market/_components/types.ts`
7. `scripts/generate-carbon-market-index.ts`
8. `src/app/tools/page.tsx` (Carbon Market Intelligence tile)

Spacing tweaks, color refinements within the locked palette, and internal refactors that do not alter rendered output do not require an update to this document.

## 14. File Index

For fast navigation:

1. `src/app/carbon/market/page.tsx` — server component, metadata, JSON-LD, layout wrapper
2. `src/app/carbon/market/_components/CarbonMarketClient.tsx` — filter + sort + pagination state, URL sync, data fetch
3. `src/app/carbon/market/_components/ProjectTable.tsx` — desktop table and mobile card list, expand drawers
4. `src/app/carbon/market/_components/FilterSidebar.tsx` — left rail filters
5. `src/app/carbon/market/_components/FilterDrawer.tsx` — mobile drawer wrapper around the same sidebar
6. `src/app/carbon/market/_components/types.ts` — ProjectRecord, CarbonMarketIndex, labels, constants
7. `scripts/generate-carbon-market-index.ts` — build-time merger
8. `public/carbon-market-index.json` — generated catalogue (5.35 MB)
9. `public/carbon-market-descriptions.json` — generated description side-file (4.56 MB)
10. `public/sitemap.xml` — includes `/carbon/market`
11. `scripts/generate-sitemap.ts` — owns the sitemap entry
12. `src/app/tools/page.tsx` — tools hub tile linking to `/carbon/market`
13. `brainstorming/CARBON_MARKET_INTELLIGENCE_PRD.md` — product rationale and roadmap
14. `CarbonMarket Aggregator/` (sibling of the repo root, not checked in) — source CSVs and detail JSONs

End of locked specification.
