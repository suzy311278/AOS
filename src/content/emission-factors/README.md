# Emission Factors Content

This directory holds every emission factor in the Greentryst Emission Factors product. Factors live here as YAML, never in Turso. The build pipeline reads this directory to generate static factor pages, source pages, and the client-side search index.

See `brainstorming/EMISSION_FACTORS_PRODUCT_SPEC.md` for product intent and `brainstorming/EMISSION_FACTORS_ARCHITECTURE.md` for engineering details.

## Folder structure

```
src/content/emission-factors/
├── README.md                 (this file)
├── CATEGORY_TAXONOMY.md      (canonical category names + when to use which)
├── <source-slug>/
│   ├── source.yaml           (source metadata, one per folder)
│   └── factors.yaml          (array of all factors drawn from this source)
└── ...
```

One folder per source. Slug format: `{publisher-short}-{vintage-year}`, lowercase, e.g. `defra-2024`, `ipcc-ar6`, `india-cea-2024`, `us-epa-hub-2025`.

## Editorial workflow

1. Editor A drafts a new source in a feature branch: create `<source-slug>/source.yaml` using the template below and add factors to `factors.yaml`.
2. Editor A runs `npm run validate:ef` to catch schema errors before pushing.
3. Editor A opens a pull request titled `Add <source name> + seed factors`.
4. Editor B reviews the PR line by line against the primary source document, fills in their initials in every factor's `verifier_initials` array, and merges.
5. CI regenerates factor pages and the search index at build time. The factor goes live.

Every factor must be verified by two editors. No solo merges to `main`.

## Source YAML template

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
  The UK government's annually updated reference dataset of conversion
  factors for organisational GHG reporting.
usage_note: |
  Use DEFRA for UK-specific reporting. For pan-European reporting consider
  IEA or country-specific equivalents.
logo_path: /emission-factors/source-logos/defra.svg
```

## Factor YAML template

One entry inside the source's `factors.yaml`:

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
  source_page_ref: Table 3.4, p. 47
  source_url: https://assets.publishing.service.gov.uk/...#page=47
  uncertainty_low: null
  uncertainty_high: null
  uncertainty_unit: null
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

## Validation

Run before every commit:

```bash
npm run validate:ef
```

Checks Zod schema conformance, referential integrity (every `source_id` resolves), slug uniqueness across all factors, no duplicate `(activity, region, source, vintage)` tuples, units sanity, and `last_verified_date` freshness (warning after 13 months).

## Supersession policy

When a newer vintage of a factor is published (e.g. DEFRA releases 2025):

1. Add the new factor in the new source folder.
2. Set `superseded_by: <new-factor-id>` on the old factor.
3. The old factor page remains at its stable URL but displays a banner linking to the new version.
4. Never edit the old factor's `value` in place. Vintages are immutable for audit traceability.

## Source attribution

Honour each source's attribution requirements on every page. `attribution_required: true` in the source YAML means the public factor page must show the publisher's logo and a full citation. Do not strip attribution even when the license permits it.

## Canary factors

A small number of synthetic factors with intentionally-offset values are planted to detect scraping. These are NOT documented here or anywhere in the public repo. The data lead maintains the list privately.
