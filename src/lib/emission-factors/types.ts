// Types for the Emission Factors product.
// See brainstorming/EMISSION_FACTORS_ARCHITECTURE.md for the data model.
// Client-safe: no Node fs imports.

export type DocumentType =
  | 'government'
  | 'intergovernmental'
  | 'industry_standard'
  | 'peer_reviewed';

export type Methodology =
  | 'location_based'
  | 'market_based'
  | 'operating_margin'
  | 'build_margin'
  | 'combined_margin'
  | 'residual_mix'
  | 'supplier_specific'
  | 'average_data'
  | 'activity_based'
  | 'spend_based'
  | 'hybrid'
  | 'not_applicable';

export type Category =
  | 'electricity'
  | 'fuels'
  | 'transport'
  | 'refrigerants'
  | 'waste'
  | 'water'
  | 'agriculture'
  | 'lulucf'
  | 'construction'
  | 'materials'
  | 'sector_spend'
  | 'gwp'
  | 'other';

export type Scope = 1 | 2 | 3 | 0; // 0 = not applicable (e.g. GWPs, methodology-only factors)

export type GwpAssessment = 'AR4' | 'AR5' | 'AR6' | 'SAR';

export type UncertaintyUnit = 'percent' | 'absolute';

export type IssueStatus = 'open' | 'triaged' | 'resolved' | 'wontfix';

export interface Source {
  id: string;
  name: string;
  publisher: string;
  publisher_short: string;
  country: string; // ISO 3166-1 alpha-3
  document_type: DocumentType;
  license: string;
  attribution_required: boolean;
  source_url: string;
  source_pdf_url: string | null;
  vintage_year: number;
  published_date: string; // ISO date
  description: string;
  usage_note: string;
  logo_path: string | null;
}

export interface FactorChangelogEntry {
  date: string; // ISO date
  editor_initials: string;
  change: string;
}

export interface Factor {
  id: string;
  /** Per-unit slug for identification (includes UOM). Not used for URLs. */
  record_id?: string;
  activity: string;
  activity_slug: string;
  category: Category;
  sub_category: string | null;
  scope: Scope;
  scope_3_category: number | null; // 1-15
  value: number;
  unit_numerator: string;
  unit_denominator: string;
  region: string; // ISO 3166-1 alpha-3, or custom slug (e.g. IND-NEWNE)
  region_display: string;
  methodology: Methodology;
  gwp_horizon: number; // 20 or 100
  gwp_assessment: GwpAssessment | null;
  vintage_year: number;
  published_year: number;
  source_id: string;
  source_page_ref: string;
  source_url: string;
  uncertainty_low: number | null;
  uncertainty_high: number | null;
  uncertainty_unit: UncertaintyUnit | null;
  ghg_protocol_clause: string | null;
  notes: string;
  /** Describes when/where this emission factor should be used. From source documentation. */
  when_to_use?: string | null;
  tags: string[];
  superseded_by: string | null;
  last_verified_date: string; // ISO date
  verifier_initials: string[]; // [editor1, editor2]
  changelog: FactorChangelogEntry[];
  // Extended fields for DEFRA BEIS-style multi-gas breakdown and raw tier preservation.
  scope_display?: string;
  value_co2e?: number;
  value_co2?: number | null;
  value_ch4?: number | null;
  value_n2o?: number | null;
  is_biogenic?: boolean;
  dataset_slug?: string;
  beis_original_ids?: string[];
  level_1?: string | null;
  level_2?: string | null;
  level_3?: string | null;
  level_4?: string | null;
  column_text?: string | null;
  /**
   * Publication gate. When absent or false, the loader suppresses the factor
   * from `loadAllFactors` / `loadResolvedFactors`. Used to keep the library
   * narrow while upstream ingestion covers more rows than the UI is ready
   * for. See `scripts/ef-ingest/defra-2025/parse.ts` for the rule set.
   */
  published?: boolean;
  /**
   * Stable short hash identifying a "unit family" of factors - the set of
   * siblings that are the same activity/scope/disambiguator but differ only
   * by UOM (e.g. Butane in tonnes / litres / kWh Net CV / kWh Gross CV share
   * one family id). Computed from level_1..level_4 + scope_display +
   * column_text, deliberately excluding UOM and the gas-specific
   * discriminator. See parser for exact canonical key.
   */
  factor_family_id?: string;
}

// Resolved factor = factor joined with its source for rendering.
export interface ResolvedFactor extends Factor {
  source: Source;
  slug: string; // public URL slug
  unit_display: string; // e.g. "0.207 kgCO2e/kWh"
}

// Search-index row — compact, shipped to the client.
export interface FactorSearchRow {
  id: string;
  slug: string;
  title: string;
  region_display: string;
  category: Category;
  sub_category: string | null;
  scope: Scope;
  value: number;
  unit_display: string;
  /** The denominator on its own, e.g. "tonnes" / "litres" / "kWh (Net CV)".
   *  Used to render per-unit pills inside a grouped row. */
  unit_denominator: string;
  source_short: string;
  source_slug: string; // e.g. "defra"; used by filter sidebar to match against source checkboxes
  dataset_slug: string; // e.g. "defra-2025"
  vintage_year: number;
  methodology: Methodology;
  tags: string[];
  /** See Factor.factor_family_id - stable unit-family hash used to collapse
   *  sibling rows (same activity, different UOMs) into a single result row. */
  factor_family_id: string;
  /** Business sector the factor applies to (Energy, Transport, Industry, etc.).
   *  Derived from category via categories.ts SECTOR_BY_CATEGORY. Useful for
   *  cross-source sector filtering and analytics. */
  sector: string;
  /** Fuel subtype for fuel/bioenergy factors (Liquid fuels, Gaseous fuels,
   *  Solid fuels, Biofuel, Biogas, Biomass). Derived from the DEFRA `level_2`
   *  field; null for non-fuel factors. */
  fuel_type: string | null;
  /** Present in the raw search-index.json for MiniSearch indexing; stripped
   *  from in-memory rows after the index is built to save memory. */
  search_text?: string;
}

export interface FactorSearchIndex {
  version: string;
  built_at: string;
  factor_count: number;
  factors: FactorSearchRow[];
}
