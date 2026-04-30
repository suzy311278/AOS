# Emission Factors — Architecture

Engineering plan mapped to the product spec at `EMISSION_FACTORS_PRODUCT_SPEC.md`. This document defines the file layout, data model, routes, scripts, SEO surfaces, and build pipeline. It does not repeat product decisions already in the spec.

## Key architectural decisions

1. **Factors live as YAML in the repo, not in Turso.** Matches the existing content pattern for courses and glossary. Gives us git-based changelog for free, enables SSG at build time for every factor page, and supports the dual-editor review workflow via pull request (editor 1 opens the PR, editor 2 reviews and merges). No ops burden for factor data.
2. **Turso only stores dynamic signed-in state.** Specifically: issue reports, saved factors, cite lists, search history. Factor data itself is static content.
3. **Search is entirely client-side on a preloaded JSON index.** MiniSearch over a compact index generated at build time. No server round-trip for typical queries. Matches the 100ms search target.
4. **Routes live under the Tools hub.** Dev path: `src/app/redesign/tools/emission-factors/`. Canonical URL post redesign-merge: `/tools/emission-factors`. Emission Factors is a sibling of other planned tools (`/redesign/tools/ghg-calculator`, etc.) under the Tools section already referenced from the redesign dashboard.
5. **Design tokens are the existing redesign `gt-*` system.** Same Inter + JetBrains Mono, teal accents, rounded-2xl cards, no emoji, Lucide icons. Matches every other redesign surface.
6. **SSG for factor and source pages.** Client-side components for search, filters, and compare. No SSR for factor content — only for dynamic dashboard surfaces.

## Repository layout

```
src/
├── app/
│   └── redesign/
│       └── tools/
│           └── emission-factors/         # dev path; ships as /tools/emission-factors post-merge
│               ├── layout.tsx            # EF-specific layout, shares redesign nav
│               ├── page.tsx              # Surface 1: search home
│               ├── _components/          # EF-only UI components
│               │   ├── EFSearchBar.tsx
│               │   ├── EFResultsTable.tsx
│               │   ├── EFQuickStartChips.tsx
│               │   ├── EFSourceTrustRow.tsx
│               │   ├── EFFactorCard.tsx
│               │   ├── EFSourceCard.tsx
│               │   ├── EFCitationBlock.tsx       # APA, Harvard, inline, copy-as-value
│               │   ├── EFMethodologyExplainer.tsx
│               │   ├── EFRelatedFactors.tsx
│               │   ├── EFCompareTable.tsx
│               │   ├── EFFilterSidebar.tsx
│               │   ├── EFVintageBanner.tsx       # supersession banner
│               │   └── EFIssueReportButton.tsx
│               ├── [slug]/
│               │   └── page.tsx          # Surface 3: single factor page
│               ├── sources/
│               │   ├── page.tsx          # Sources index
│               │   └── [slug]/
│               │       └── page.tsx      # Surface 4: source page
│               ├── compare/
│               │   └── page.tsx          # Surface 5: compare
│               ├── search/
│               │   └── page.tsx          # Surface 2: results (deep-linkable with ?q=)
│               └── category/
│                   └── [category]/
│                       └── page.tsx      # Category landing pages for SEO
│
├── lib/
│   └── emission-factors/
│       ├── types.ts                      # TS interfaces + Zod schemas
│       ├── loader.ts                     # server-only YAML loader (build time)
│       ├── schemas.ts                    # Zod validation for YAML ingestion
│       ├── search-index.ts               # generate + load search index
│       ├── citations.ts                  # format APA / Harvard / inline / copy-as-value
│       ├── slug.ts                       # deterministic slug generation
│       ├── related.ts                    # related-factor computation
│       ├── jsonld.ts                     # schema.org Dataset JSON-LD builder
│       └── categories.ts                 # category taxonomy + display names
│
├── content/
│   └── emission-factors/
│       ├── README.md                     # editor onboarding
│       ├── CATEGORY_TAXONOMY.md          # canonical category names + rules
│       ├── defra-2024/
│       │   ├── source.yaml               # source metadata
│       │   └── factors.yaml              # all DEFRA 2024 factors
│       ├── ipcc-ar6/
│       │   ├── source.yaml
│       │   └── factors.yaml
│       ├── india-cea-2024/
│       │   ├── source.yaml
│       │   └── factors.yaml
│       ├── us-epa-hub-2025/
│       │   ├── source.yaml
│       │   └── factors.yaml
│       ├── india-morth-2024/
│       │   ├── source.yaml
│       │   └── factors.yaml
│       └── us-eeio-2024/
│           ├── source.yaml
│           └── factors.yaml
│
├── public/
│   └── emission-factors/
│       ├── search-index.json             # generated at build time
│       └── source-logos/                 # publisher logos (DEFRA, EPA, IPCC, CEA)
│
└── scripts/
    ├── validate-emission-factors.ts      # Zod validation of all YAML
    ├── generate-ef-search-index.ts       # MiniSearch index builder
    ├── generate-ef-sitemap.ts            # sitemap-emission-factors.xml
    └── ingest-factor-source.ts           # guided CLI for editors
```

## Data model

### Source (YAML schema)

```yaml
id: defra-2024
name: UK Government GHG Conversion Factors for Company Reporting 2024
publisher: UK Department for Environment, Food & Rural Affairs
publisher_short: DEFRA
country: GBR
document_type: government
license: Open Government Licence v3.0
attribution_required: true
source_url: https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024
source_pdf_url: https://assets.publishing.service.gov.uk/...
vintage_year: 2024
published_date: 2024-06-30
description: |
  The UK government's annually-updated reference dataset of conversion
  factors for organisational GHG reporting, covering electricity, fuels,
  travel, freight, waste, water, and refrigerants.
usage_note: |
  Use DEFRA factors for UK-specific reporting and for entities whose
  methodology explicitly defers to UK government guidance. For pan-European
  reporting use the IEA or country-specific equivalents.
```

### Factor (YAML schema — one entry inside `factors.yaml`)

```yaml
- id: defra-2024-elec-uk-grid
  activity: Electricity consumption, UK grid
  activity_slug: uk-grid-electricity
  category: electricity
  sub_category: grid
  scope: 2
  scope_3_category: null
  value: 0.207
  unit_numerator: kgCO2e
  unit_denominator: kWh
  region: GBR
  region_display: United Kingdom
  methodology: location_based
  gwp_horizon: 100
  gwp_assessment: AR6
  vintage_year: 2024
  published_year: 2024
  source_id: defra-2024
  source_page_ref: "Table 3.4, p. 47"
  source_url: https://assets.publishing.service.gov.uk/...#page=47
  uncertainty_low: null
  uncertainty_high: null
  ghg_protocol_clause: Scope 2 Guidance §6.3
  notes: |
    Location-based factor for the UK national grid. For market-based
    reporting, use supplier-specific residual mix or contractual instruments.
  tags: [electricity, grid, uk, location-based, scope-2]
  superseded_by: null
  last_verified_date: 2026-04-10
  verifier_initials: [PK, MS]
  changelog: []
```

The factor `id` is a stable UUID-like slug of the form `{source_id}-{short_activity}-{region}`. URL slug for the public page is derived deterministically.

### Turso tables (appended to `src/lib/schema.ts`)

```ts
// Issue reports (public: any visitor can submit)
export const efIssueReports = sqliteTable('ef_issue_reports', {
  id: text('id').primaryKey(),                    // nanoid
  factorId: text('factor_id').notNull(),           // refs YAML id
  submittedAt: integer('submitted_at', { mode: 'timestamp' }).notNull(),
  reporterEmail: text('reporter_email'),
  description: text('description').notNull(),
  status: text('status').notNull().default('open'), // open | triaged | resolved | wontfix
  editorNote: text('editor_note'),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
});

// Saved factors per user
export const savedFactors = sqliteTable('saved_factors', {
  userId: text('user_id').notNull(),
  factorId: text('factor_id').notNull(),
  savedAt: integer('saved_at', { mode: 'timestamp' }).notNull(),
  folder: text('folder'),                          // optional grouping
}, (t) => [primaryKey({ columns: [t.userId, t.factorId] })]);

// Cite lists (multi-factor collections per user)
export const citeLists = sqliteTable('cite_lists', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const citeListItems = sqliteTable('cite_list_items', {
  citeListId: text('cite_list_id').notNull(),
  factorId: text('factor_id').notNull(),
  addedAt: integer('added_at', { mode: 'timestamp' }).notNull(),
  note: text('note'),
}, (t) => [primaryKey({ columns: [t.citeListId, t.factorId] })]);

// Search-history for signed-in users (anonymous localStorage only)
export const efSearchHistory = sqliteTable('ef_search_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  query: text('query').notNull(),
  searchedAt: integer('searched_at', { mode: 'timestamp' }).notNull(),
});
```

Factors themselves never live in Turso.

## Search index

Generated at build time by `scripts/generate-ef-search-index.ts`. Structure:

```json
{
  "version": "1.0.0",
  "built_at": "2026-04-14T09:00:00Z",
  "factor_count": 1040,
  "factors": [
    {
      "id": "defra-2024-elec-uk-grid",
      "slug": "uk-grid-electricity-defra-2024",
      "title": "Electricity consumption, UK grid",
      "region_display": "United Kingdom",
      "category": "electricity",
      "sub_category": "grid",
      "scope": 2,
      "value": 0.207,
      "unit_display": "kgCO2e/kWh",
      "source_short": "DEFRA 2024",
      "vintage_year": 2024,
      "methodology": "location_based",
      "tags": ["electricity", "grid", "uk", "location-based", "scope-2"],
      "search_text": "electricity uk grid defra 2024 location based scope 2 ..."
    }
  ]
}
```

Target size under 500KB for v1. MiniSearch builds its own in-memory index from this JSON on first search.

## Route behaviour

Dev URLs use the `/redesign/tools/emission-factors/...` prefix; production URLs post-merge drop the `/redesign/` segment. The table below shows production paths.

| Route | Generation | Surface |
|---|---|---|
| `/tools/emission-factors` | SSG | Search home (Surface 1) |
| `/tools/emission-factors/search` | SSG shell + client-side query | Results (Surface 2) |
| `/tools/emission-factors/[slug]` | SSG (generateStaticParams for every factor) | Single factor (Surface 3) |
| `/tools/emission-factors/sources` | SSG | Sources index |
| `/tools/emission-factors/sources/[slug]` | SSG | Source page (Surface 4) |
| `/tools/emission-factors/compare` | SSG shell + client-side | Compare (Surface 5) |
| `/tools/emission-factors/category/[category]` | SSG | Category landing (SEO) |
| `/dashboard/emission-factors` | SSR (auth required) | Signed-in saves + cite lists (Surface 6) |

## URL slug strategy

Factor slug format: `{activity-slug}-{region-slug}-{source-short}-{vintage-year}`, for example `uk-grid-electricity-gbr-defra-2024`. Stable for the life of the factor. When superseded, the old URL remains but a banner points to the newer version.

`generateStaticParams()` runs at build time from YAML. `dynamicParams = false` — any request for a non-existent slug returns 404.

## Validation pipeline

`scripts/validate-emission-factors.ts` runs:

1. Zod validation of every factor and source against schema.
2. Referential integrity: every `source_id` resolves to an actual source folder.
3. Slug uniqueness across all factors.
4. No duplicate `(activity, region, source, vintage)` combinations within a source.
5. Units sanity: `unit_numerator` is a known GHG unit (kgCO2e, tCO2e, kgCH4, etc.), `unit_denominator` is from an allowed list (kWh, MJ, L, kg, km, tkm, passenger-km, USD, EUR, GBP, INR, etc.).
6. `last_verified_date` not older than 13 months. Warning, not error.
7. `superseded_by` points to a valid factor if set.
8. URL slug regex conformance.

Added to `package.json` scripts: `npm run validate:ef`. Also wired to `npm run build` as a precondition.

## Ingestion workflow (editor)

Per the spec, this is CLI-driven, manual, and dual-verified. Concrete commands:

```bash
# 1. Editor A drafts a new source
npx tsx scripts/ingest-factor-source.ts --new-source defra-2024

# 2. Editor A adds factors interactively
npx tsx scripts/ingest-factor-source.ts --add-factor defra-2024

# 3. Editor A opens a PR
git add src/content/emission-factors/defra-2024
git commit -m "Add DEFRA 2024 source + seed factors (editor: PK)"
git push -u origin feature/ef-defra-2024

# 4. Editor B reviews the PR. The validation CI runs. Editor B signs off in the `verifier_initials` field and merges.
```

The pair of verifier initials `[PK, MS]` is displayed on the public factor page.

## SEO and sitemap

### Sitemap

`src/app/sitemap.ts` already exists. Extend with an auxiliary sitemap specifically for emission factor URLs:

- Generated at build time by `scripts/generate-ef-sitemap.ts`, written to `public/sitemap-emission-factors.xml`.
- Referenced from the main sitemap index.
- Submitted separately in Google Search Console.

### Structured data

Every factor page emits JSON-LD `@type: Dataset` per the spec. `src/lib/emission-factors/jsonld.ts` builds the object from a factor record.

Every source page emits JSON-LD `@type: DataCatalog`.

### Internal links

Every factor page links to:
- At least 3 related factors (same activity, different sources; or same source, related category)
- The source page
- The category landing page
- Any existing lesson in the course library that references this factor (cross-link discovery handled in `related.ts`)

## Rate limiting and anti-scraping

Cloudflare rules (documented here, configured in Cloudflare dashboard, not in repo):

1. More than 60 requests/minute from a single IP to `/emission-factors/*` triggers Challenge.
2. More than 300/minute from a single IP triggers Block.
3. Requests without a standard Accept-Language header and without a typical browser user-agent on factor pages trigger Challenge.
4. Unauthenticated requests to any `/api/emission-factors/*` endpoint are rate-limited to 30/minute.

Canary factors are planted at ingestion time by the data team. Their identities are stored privately outside the repo.

## Citation system

`src/lib/emission-factors/citations.ts` exposes:

```ts
function formatCitation(factor: Factor, format: 'inline' | 'apa' | 'harvard' | 'copy_value'): string
```

Four formats produced deterministically from the factor and its source. `copy_value` includes the soft attribution `— via Greentryst`, with a settings toggle to disable.

## Performance budget

- Factor page HTML under 40KB gzipped.
- JS bundle on factor page under 120KB gzipped (redesign chrome + EF components only).
- Search home initial JS under 200KB gzipped including MiniSearch.
- Search index JSON under 500KB for v1, under 1.2MB at v1.1 with expanded sources.
- LCP under 1.2s on factor pages, under 1.5s on search home.

## Build pipeline

`npm run build` sequence:
1. `npm run validate:ef` (Zod + integrity checks).
2. `npm run generate:ef-index` (search index JSON).
3. `npm run generate:ef-sitemap` (sitemap XML).
4. Next.js build: SSG for every factor and source slug via `generateStaticParams`.
5. Existing build steps for lessons, glossary, etc.

## Dependencies

New runtime deps: `minisearch` (~50KB gzipped), `nanoid` (already likely present), `yaml` (already present via existing content pipeline).

No new infrastructure.

## Observability

- Search queries logged client-side to a lightweight analytics endpoint (`/api/analytics/ef-search`) with sampling. Aggregates stored in Turso for weekly review: what did users search for that returned zero results?
- Copy-button clicks logged for the success metric.
- Issue-report submissions visible in a small internal admin view.

No third-party analytics. Privacy-forward by default.

## Phased engineering plan

### Phase A (Foundation — this session)
- [ ] Architecture doc (this file)
- [ ] TypeScript interfaces + Zod schemas (`src/lib/emission-factors/types.ts`, `schemas.ts`)
- [ ] Content directory skeleton (`src/content/emission-factors/README.md`, one seed source)
- [ ] Turso schema additions (`src/lib/schema.ts` append)
- [ ] Validation script (`scripts/validate-emission-factors.ts`)
- [ ] Package.json script wiring

### Phase B (Routes + UI skeleton)
- [ ] Layout + home page + search results page
- [ ] Single factor page + source page
- [ ] Compare + category landing
- [ ] EF component library with redesign tokens

### Phase C (Search + citations + SEO)
- [ ] Search index generator + MiniSearch integration
- [ ] Citation formatters + copy-button UX
- [ ] JSON-LD per factor + source page
- [ ] Sitemap generator + Search Console submission

### Phase D (Ingestion + editorial)
- [ ] `ingest-factor-source.ts` interactive CLI
- [ ] Diff-review UI for second-editor pass
- [ ] DEFRA 2024 full ingestion (~280 factors)
- [ ] IPCC AR6 + remaining P0 sources

### Phase E (Signed-in features + polish)
- [ ] Saved factors, cite lists, search history (Turso-backed)
- [ ] Issue-report workflow
- [ ] Anti-scraping rules + canary factors
- [ ] Performance audit + lighthouse targets

### Phase F (Launch)
- [ ] Production deploy, sitemap submission, distribution push

## Open questions (engineering)

1. Should the signed-in dashboard live at `/dashboard/emission-factors` or `/emission-factors/saved`? The former keeps Dashboard as the unified auth home; the latter keeps everything EF-prefixed. Recommendation: `/dashboard/emission-factors` to reinforce Dashboard as the logged-in hub, with a shortcut card from the EF nav.
2. Do factor pages allow a user to submit a suggested value (for review, not live)? Spec says no user-generated factors. Recommendation: keep read-only in v1; add issue-report-with-suggested-correction in v1.1.
3. Do we cross-link existing lesson pages to factors in Phase C, or wait until v1.1? Recommendation: wait. The lessons-to-factors map is an editorial task that should not block launch.
4. Caching strategy for the search index: ship with the page or lazy-load on search-bar focus? Recommendation: lazy-load on focus — reduces initial JS cost and typical users do not search immediately.
5. Where do source logos come from and what format? SVG preferred, PNG fallback. Stored in `public/emission-factors/source-logos/`. Each source YAML references `logo_path: /emission-factors/source-logos/defra.svg`.
