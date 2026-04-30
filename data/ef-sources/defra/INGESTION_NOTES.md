# DEFRA BEIS Ingestion Notes

## Currently ingesting

- **2025 flat format**: `2025/ghg-conversion-factors-2025-flat-format.xlsx`
  - Published: **10 June 2025**
  - Next publication: June 2026
  - Calculation method: **AR5** (IPCC Fifth Assessment, CH4 GWP=28, N2O GWP=265). Source: 2025 methodology paper. DEFRA notes that AR6 is not yet accepted by UNFCCC, so 2025 remains on AR5.

## Deferred / excluded from v1 ingestion

### Energy-density rows under GHG/Unit column (514 rows)

The flat file has 438 rows with `GHG/Unit = "kWh (Net CV)"` and 76 rows with `GHG/Unit = "kWh (net)"`. These are **not emission factors** — they're energy-density conversions (kWh per unit of fuel) that let users convert a fuel quantity into energy before applying a separate emission factor. The 514 rows are excluded from ingestion for v1.

Action for later: build a separate "unit conversion coefficients" surface or include them under a distinct `factor_type`, once the platform has room for non-emission reference data.

### `Column Text` field

Almost universally null in the 2025 flat file. Kept as a nullable column in the schema in case future editions populate it.

### Other DEFRA files in `2025/Otherfiles/`

- `ghg-conversion-factors-2025-full-set.xlsx` — the unabridged reference, includes per-fuel calorific values and derivation chains. Not ingested in v1; the flat file is the curated subset designed for system ingestion.
- `ghg-conversion-factors-2025-condensed-set.xlsx` — the human-facing simplified table. Duplicates the flat file in curated form.
- `2025-GHG-CF-methodology-paper.pdf` — primary source for methodology decisions. Confirms AR5.
- `2025-GHG-CF-major-changes-document.pdf` — year-over-year changes. Useful when we ingest 2026 and need to auto-detect supersession.

## Classification tags

- All 58 `Outside of Scopes` rows get `scope = "Outside of Scopes"`
- 57 of those are biogenic and get `is_biogenic = true` + `(biogenic)` suffix on `activity_name`. One (`Electricity generated > Electricity: UK`) is non-biogenic.

## Published slice (April 2026)

The full flat-file ingest produces 2,672 factors, but only the Fuels slice is
currently surfaced in the UI. The parser writes `published = true` for every
row whose `Level 1` matches one of:

- `Fuels`
- `Bioenergy`
- `Biofuel`
- `Biomass`
- `Biogas`
- `Forecourt fuels containing biofuel`
- `WTT- fuels`

Every other row is ingested with `published = false`; the loader filters on
that flag before handing factors to the UI. Current slice size: 280 factors
across 81 unit families (166 Scope 1, 114 Scope 3 WTT- fuels). All Scope 3
slice rows are stamped with `scope_3_category = 3` (Fuel and energy related
activities).

## factor_family_id

Each factor carries a stable 12-char sha1 prefix computed from
`level_1 || level_2 || level_3 || level_4 || scope_display || column_text`
(UOM deliberately excluded). All UOM siblings for the same activity + scope
+ disambiguator share the same `factor_family_id`. The search UI collapses
rows by this id and exposes siblings as unit pills; the factor detail page
exposes them as a unit selector. The parser also counts and warns on any
family id that ends up spanning more than one scope (zero such cases in the
2025 flat file).

## Scope 3 category rule table

Lightweight map applied at ingestion after the scope is assigned:

| Level 1                               | scope_3_category |
| ------------------------------------- | ---------------- |
| WTT- fuels                            | 3                |
| WTT- pass vehs and travel- land       | 3                |
| WTT- delivery vehs and freight        | 3                |
| Waste disposal                        | 5                |
| Business travel- *                    | 6                |
| Hotel stay                            | 6                |
| Freighting goods                      | 4 (upstream)     |
| any other Scope 3 row                 | null             |

The mapper runs against every row (even those not in the fuels slice) so the
stamping is already correct if future slices flip additional rows to
published. A counter of rows that remain `scope_3_category = null` despite
`scope = 3` is emitted as `stats.unmapped_scope3_rows` for later curation.
