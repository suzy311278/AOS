/**
 * DEFRA 2025 GHG Conversion Factors parser.
 *
 * Reads `data/ef-sources/defra/2025/ghg-conversion-factors-2025-flat-format.xlsx`,
 * sheet "Factors by Category", header at row 5 (1-indexed), data from row 6.
 *
 * Output: `data/ef-sources/defra/2025/ingested.json` - ready for the UI loader.
 *
 * Run:  npx tsx scripts/ef-ingest/defra-2025/parse.ts
 *
 * ---------------------------------------------------------------------------
 * Published slice (Scope 1 fuels only, April 2026)
 *
 * Every row is ingested into the JSON, but only rows that satisfy BOTH:
 *   1. Level 1 is in FUELS_L1 (Fuels, Bioenergy, Biofuel, Biomass, Biogas,
 *      Forecourt fuels containing biofuel, WTT- fuels)
 *   2. Scope === 1
 *
 * get `published = true`. This excludes WTT- fuels (Scope 3) and biogenic
 * emissions (Outside of Scopes) for now. The server loader filters on this
 * flag so the UI only surfaces Scope 1 fuels while upstream breadth is staged.
 *
 * ---------------------------------------------------------------------------
 * Scope 3 category mapper (lightweight rule table)
 *
 *   WTT- fuels                         -> 3 (Fuel and energy related activities)
 *   WTT- pass vehs & travel- land      -> 3
 *   WTT- delivery vehs & freight       -> 3
 *   Waste disposal                     -> 5 (Waste generated in operations)
 *   Business travel- *                 -> 6 (Business travel)
 *   Hotel stay                         -> 6
 *   Freighting goods                   -> 4 (Upstream transportation)  [default upstream]
 *   anything else under Scope 3        -> null (flag for later curation)
 *
 * The mapper runs against every row, so WTT- pass vehs / WTT- delivery vehs
 * entries (which are not in the published fuels slice) still get their
 * scope_3_category stamped - which keeps the table complete if those rows
 * later flip to published.
 *
 * ---------------------------------------------------------------------------
 * factor_family_id
 *
 *   Canonical key = level_1 || level_2 || level_3 || level_4 || scope_display || column_text
 *
 * UOM is deliberately excluded so that all UOM siblings share one id.
 * The 2025 flat file does not carry a gas-specific discriminator on the row
 * itself (the gas column is folded into separate rows during grouping above),
 * so the key is safe as-is.
 */

import * as XLSX from 'xlsx';
import { createHash } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { nanoid } from 'nanoid';
import type { Factor, Source, Category, Scope } from '../../../src/lib/emission-factors/types';

const ROOT = join(__dirname, '..', '..', '..');
const XLSX_PATH = join(
  ROOT,
  'data',
  'ef-sources',
  'defra',
  '2025',
  'ghg-conversion-factors-2025-flat-format.xlsx'
);
const OUT_PATH = join(ROOT, 'data', 'ef-sources', 'defra', '2025', 'ingested.json');

const SHEET_NAME = 'Factors by Category';
const HEADER_ROW_INDEX = 5; // 0-based; header actually at row 6 (1-indexed)
const DATA_START_INDEX = 6;

// Columns (by header text)
const COL = {
  id: 'ID',
  scope: 'Scope',
  l1: 'Level 1',
  l2: 'Level 2',
  l3: 'Level 3',
  l4: 'Level 4',
  columnText: 'Column Text',
  uom: 'UOM',
  ghgUnit: 'GHG/Unit',
  value: 'GHG Conversion Factor 2025',
} as const;

type RawRow = {
  ID: string;
  Scope: string;
  'Level 1': string | null;
  'Level 2': string | null;
  'Level 3': string | null;
  'Level 4': string | null;
  'Column Text': string | null;
  UOM: string;
  'GHG/Unit': string;
  'GHG Conversion Factor 2025': number;
};

// --- helpers -----------------------------------------------------------------

function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function clean(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function mapCategory(l1: string | null): Category {
  if (!l1) return 'other';
  const lower = l1.toLowerCase();
  if (lower.includes('electricity')) return 'electricity';
  if (/refrigerant/i.test(l1)) return 'refrigerants';
  if (l1 === 'Waste disposal') return 'waste';
  if (l1 === 'Material use') return 'materials';
  if (l1 === 'Outside of scopes') return 'other';
  if (
    [
      'Fuels',
      'Bioenergy',
      'Biofuel',
      'Biomass',
      'Biogas',
      'Forecourt fuels containing biofuel',
    ].includes(l1)
  )
    return 'fuels';
  const transportL1 = [
    'Freighting goods',
    'Managed assets- vehicles',
    'Business travel- land',
    'Business travel- air',
    'Business travel- sea',
    'Passenger vehicles',
    'Delivery vehicles',
    'UK electricity for EVs',
    'UK electricity T&D for EVs',
    'Hotel stay',
  ];
  if (transportL1.includes(l1)) return 'transport';
  if (/^WTT-/i.test(l1)) return 'transport';
  if (/^SECR/i.test(l1)) return 'transport';
  return 'other';
}

function mapUnitType(uom: string): string | null {
  const energy = ['kWh', 'kWh (Net CV)', 'kWh (Gross CV)', 'GJ'];
  const weight = ['tonnes', 'kg'];
  const volume = ['litres', 'cubic metres', 'million litres'];
  const distance = ['km', 'miles', 'passenger.km', 'tonne.km'];
  if (energy.includes(uom)) return 'energy';
  if (weight.includes(uom)) return 'weight';
  if (volume.includes(uom)) return 'volume';
  if (distance.includes(uom)) return 'distance';
  if (uom === 'per FTE Working Hour') return 'time';
  if (uom === 'Room per night') return 'area';
  return null;
}

function mapScope(scopeText: string): { scope: Scope; scopeDisplay: string; scopeSlug: string } {
  const s = scopeText.trim();
  if (s === 'Scope 1') return { scope: 1, scopeDisplay: 'Scope 1', scopeSlug: 'scope-1' };
  if (s === 'Scope 2') return { scope: 2, scopeDisplay: 'Scope 2', scopeSlug: 'scope-2' };
  if (s === 'Scope 3') return { scope: 3, scopeDisplay: 'Scope 3', scopeSlug: 'scope-3' };
  return { scope: 0, scopeDisplay: 'Outside of Scopes', scopeSlug: 'scope-outside' };
}

const BIOGENIC_L2 = new Set([
  'Forecourt fuels containing biofuel',
  'Biofuel',
  'Biomass',
  'Biogas',
]);

// Level 1 values that belong to the Fuels publishing slice. Everything else
// stays in the JSON with `published = false` and is suppressed by the loader.
const FUELS_L1 = new Set([
  'Fuels',
  'Bioenergy',
  'Biofuel',
  'Biomass',
  'Biogas',
  'Forecourt fuels containing biofuel',
  'WTT- fuels',
]);

function isInFuelsSlice(l1: string | null): boolean {
  return !!l1 && FUELS_L1.has(l1);
}

// Stable short hash for a unit-family. sha1 prefix, 12 hex chars.
function factorFamilyHash(parts: (string | null | undefined)[]): string {
  const canonical = parts.map((p) => (p ?? '')).join('\u0001');
  return createHash('sha1').update(canonical).digest('hex').slice(0, 12);
}

// Scope 3 category mapper. See parser header comment for the rule table.
function mapScope3Category(
  scopeDisplay: string,
  l1: string | null,
): number | null {
  if (scopeDisplay !== 'Scope 3') return null;
  if (!l1) return null;
  if (l1 === 'WTT- fuels') return 3;
  if (l1 === 'WTT- pass vehs & travel- land') return 3;
  if (l1 === 'WTT- delivery vehs & freight') return 3;
  if (l1 === 'Waste disposal') return 5;
  if (l1.startsWith('Business travel')) return 6;
  if (l1 === 'Hotel stay') return 6;
  if (l1 === 'Freighting goods') return 4;
  return null;
}

// --- read workbook -----------------------------------------------------------

console.log('[defra-2025] reading', XLSX_PATH);
const wb = XLSX.readFile(XLSX_PATH);
const ws = wb.Sheets[SHEET_NAME];
if (!ws) throw new Error(`Missing sheet: ${SHEET_NAME}`);

const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
const headers = aoa[HEADER_ROW_INDEX] as string[];
const colIdx: Record<string, number> = {};
for (const key of Object.values(COL)) {
  const idx = headers.findIndex((h) => (h ? String(h).trim() : '') === key);
  if (idx < 0) throw new Error(`Header not found: ${key}. Found: ${JSON.stringify(headers)}`);
  colIdx[key] = idx;
}

const rawRows: RawRow[] = [];
let totalDataRows = 0;
let nullValueRows = 0;
for (let i = DATA_START_INDEX; i < aoa.length; i++) {
  const r = aoa[i];
  if (!r || r.every((v) => v === null || v === '' || v === undefined)) continue;
  const id = clean(r[colIdx[COL.id]]);
  const scope = clean(r[colIdx[COL.scope]]);
  const uom = clean(r[colIdx[COL.uom]]);
  const ghgUnit = clean(r[colIdx[COL.ghgUnit]]);
  if (!id || !scope || !uom || !ghgUnit) continue;
  totalDataRows++;
  const valCell = r[colIdx[COL.value]];
  if (valCell === null || valCell === undefined || valCell === '') {
    nullValueRows++;
    continue;
  }
  const val = typeof valCell === 'number' ? valCell : Number(valCell);
  if (!Number.isFinite(val)) {
    nullValueRows++;
    continue;
  }
  rawRows.push({
    ID: id,
    Scope: scope,
    'Level 1': clean(r[colIdx[COL.l1]]),
    'Level 2': clean(r[colIdx[COL.l2]]),
    'Level 3': clean(r[colIdx[COL.l3]]),
    'Level 4': clean(r[colIdx[COL.l4]]),
    'Column Text': clean(r[colIdx[COL.columnText]]),
    UOM: uom,
    'GHG/Unit': ghgUnit,
    'GHG Conversion Factor 2025': val,
  });
}

const inputRows = totalDataRows;
console.log(
  `[defra-2025] input rows: ${inputRows} (rows with values: ${rawRows.length}, null-value rows skipped: ${nullValueRows})`
);

// --- exclude energy-density rows --------------------------------------------

const EXCLUDED_GHG_UNITS = new Set(['kWh (Net CV)', 'kWh (net)']);
// Count energy-density exclusions against raw row count (both value and null rows).
let excludedEnergyDensity = 0;
for (let i = DATA_START_INDEX; i < aoa.length; i++) {
  const r = aoa[i];
  if (!r) continue;
  const ghg = clean(r[colIdx[COL.ghgUnit]]);
  const id = clean(r[colIdx[COL.id]]);
  if (!id || !ghg) continue;
  if (EXCLUDED_GHG_UNITS.has(ghg)) excludedEnergyDensity++;
}
const kept = rawRows.filter((r) => !EXCLUDED_GHG_UNITS.has(r['GHG/Unit']));
console.log(`[defra-2025] excluded energy-density rows: ${excludedEnergyDensity}`);

// --- group by collapse key ---------------------------------------------------

type GroupKey = string;
function groupKey(r: RawRow): GroupKey {
  // Include Column Text because some groups (notably refrigerants: Kyoto-only
  // vs non-Kyoto vs total) share L1-L4/UOM/Scope but are distinguished only by
  // the Column Text methodology note.
  return [
    r['Level 1'] ?? '',
    r['Level 2'] ?? '',
    r['Level 3'] ?? '',
    r['Level 4'] ?? '',
    r.UOM,
    r.Scope,
    r['Column Text'] ?? '',
  ].join('\u0001');
}

const groups = new Map<GroupKey, RawRow[]>();
for (const r of kept) {
  const k = groupKey(r);
  const arr = groups.get(k);
  if (arr) arr.push(r);
  else groups.set(k, [r]);
}

const GHG_FIELD: Record<string, 'value_co2e' | 'value_co2' | 'value_ch4' | 'value_n2o'> = {
  'kg CO2e': 'value_co2e',
  'kg CO2e of CO2 per unit': 'value_co2',
  'kg CO2e of CH4 per unit': 'value_ch4',
  'kg CO2e of N2O per unit': 'value_n2o',
};

const warnings: string[] = [];
const factors: Factor[] = [];
const seenSlugs = new Set<string>();
// Maps slug -> factor_family_id to allow siblings to share the same slug
const slugToFamily = new Map<string, string>();
let biogenicCount = 0;
const scopeCounts: Record<string, number> = { '1': 0, '2': 0, '3': 0, outside: 0 };
const unitTypeCounts: Record<string, number> = {};
let publishedCount = 0;
let biogenicInSlice = 0;
const sliceScopeCounts: Record<string, number> = { '1': 0, '2': 0, '3': 0, outside: 0 };
const sliceS3CategoryCounts: Record<string, number> = {};
let unmappedScope3Count = 0;
let familyScopeSpanCount = 0;
// Track every scope seen per family id so we can warn when a family spans
// multiple scopes (which should never happen given the canonical key).
const familyScopeMap = new Map<string, Set<number>>();

for (const [, rows] of groups) {
  const first = rows[0];
  const l1 = first['Level 1'];
  const l2 = first['Level 2'];
  const l3 = first['Level 3'];
  const l4 = first['Level 4'];
  const uom = first.UOM;
  const scopeText = first.Scope;

  const values: Record<string, number | null> = {
    value_co2e: null,
    value_co2: null,
    value_ch4: null,
    value_n2o: null,
  };
  const origIds: string[] = [];
  let columnText: string | null = null;

  for (const r of rows) {
    const field = GHG_FIELD[r['GHG/Unit']];
    if (!field) {
      warnings.push(
        `Unknown GHG/Unit "${r['GHG/Unit']}" in row ID ${r.ID} (L1=${l1}, L2=${l2})`
      );
      continue;
    }
    if (values[field] !== null) {
      warnings.push(`Duplicate ${field} in group ${l1}/${l2}/${l3}/${l4}/${uom}/${scopeText}`);
    }
    values[field] = r['GHG Conversion Factor 2025'];
    origIds.push(r.ID);
    if (!columnText && r['Column Text']) columnText = r['Column Text'];
  }

  if (values.value_co2e === null) {
    // Outside of Scopes rows publish only the CO2 component (no aggregate kg
    // CO2e row exists in the source). Use the CO2 value as the factor value
    // and preserve the gas breakdown.
    if (scopeText === 'Outside of Scopes' && values.value_co2 !== null) {
      values.value_co2e = values.value_co2;
    } else {
      warnings.push(
        `Group missing kg CO2e aggregate: ${l1}/${l2}/${l3}/${l4}/${uom}/${scopeText}. Skipped.`
      );
      continue;
    }
  }

  // Biogenic detection (Outside of Scopes rows only)
  let isBiogenic = false;
  if (scopeText === 'Outside of Scopes') {
    if (l1 === 'Outside of scopes' && l2 && BIOGENIC_L2.has(l2)) {
      isBiogenic = true;
    }
  }

  // Activity name. BEIS uses Column Text as the disposal-method / pathway
  // disambiguator (e.g. for waste: Landfill vs Composting vs Incineration).
  // Without folding it into the activity name, distinct factors look identical
  // in the UI. We include it whenever it's present and not already redundant.
  let baseName = l3 ?? l2 ?? l1 ?? '(unnamed)';
  let activity = baseName;
  if (l4) activity += ` (${l4})`;
  if (
    columnText &&
    columnText !== l3 &&
    columnText !== l4 &&
    !activity.toLowerCase().includes(columnText.toLowerCase())
  ) {
    activity += ` (${columnText})`;
  }
  if (isBiogenic) activity += ' (biogenic)';

  const activitySlug = kebab(activity);

  const { scope, scopeDisplay, scopeSlug } = mapScope(scopeText);
  const scopeKey = scope === 0 ? 'outside' : String(scope);
  scopeCounts[scopeKey] = (scopeCounts[scopeKey] ?? 0) + 1;

  const unitType = mapUnitType(uom);
  if (unitType) unitTypeCounts[unitType] = (unitTypeCounts[unitType] ?? 0) + 1;
  else unitTypeCounts['(none)'] = (unitTypeCounts['(none)'] ?? 0) + 1;

  if (isBiogenic) biogenicCount++;

  const category = mapCategory(l1);
  const subCategory = l2;

  const tags: string[] = [];
  if (subCategory) tags.push(kebab(subCategory));
  tags.push(scopeSlug);
  if (unitType) tags.push(unitType);
  if (isBiogenic) tags.push('biogenic');

  const firstId = origIds[0] ?? first.ID;

  // Family id (stable across UOM siblings). Computed BEFORE slug so siblings
  // can share the same URL.
  const factorFamilyId = factorFamilyHash([
    l1,
    l2,
    l3,
    l4,
    scopeDisplay,
    columnText,
  ]);

  // Family-based slug: one URL per activity/scope/source family, not per-unit.
  // All UOM siblings share the same slug; the detail page shows a unit selector.
  let slug = `${activitySlug}-${scopeSlug}-defra-2025`;
  // Disambiguate when Column Text differentiates otherwise-identical tuples.
  if (columnText) {
    const existingFamily = slugToFamily.get(slug);
    if (existingFamily && existingFamily !== factorFamilyId) {
      slug = `${activitySlug}-${kebab(columnText).slice(0, 40)}-${scopeSlug}-defra-2025`;
    }
  }
  // Track which family owns each slug
  if (!slugToFamily.has(slug)) {
    slugToFamily.set(slug, factorFamilyId);
  }
  seenSlugs.add(slug);

  // Publishing flag: Scope 1 fuels only for now. WTT- fuels (Scope 3) and
  // biogenic (Outside of Scopes) are staged but not yet surfaced.
  const published = isInFuelsSlice(l1) && scope === 1;

  // Scope 3 category rule table (runs for every row, not just the slice).
  const scope3Category = mapScope3Category(scopeDisplay, l1);

  // Warning: any Scope 3 row without a category mapping is flagged for later
  // curation. We count but do not spam the warnings array - the full list is
  // long and already implied by the rule table.
  if (scope === 3 && scope3Category === null) {
    unmappedScope3Count++;
  }

  // Warning: a factor_family should never span multiple scopes.
  let scopeSet = familyScopeMap.get(factorFamilyId);
  if (!scopeSet) {
    scopeSet = new Set<number>();
    familyScopeMap.set(factorFamilyId, scopeSet);
  }
  if (!scopeSet.has(scope)) {
    if (scopeSet.size > 0) {
      familyScopeSpanCount++;
      warnings.push(
        `factor_family_id ${factorFamilyId} spans multiple scopes: ${[
          ...scopeSet,
        ].join(',')},${scope} (${l1}/${l2}/${l3}/${l4})`
      );
    }
    scopeSet.add(scope);
  }

  // Per-unit slug for identification (includes UOM). Not used for URLs.
  const uomSlug = kebab(uom);
  const recordId = `${activitySlug}-${uomSlug}-${scopeSlug}-defra-2025`;

  const factor: Factor & { slug: string } = {
    slug,
    id: nanoid(12),
    record_id: recordId,
    activity,
    activity_slug: activitySlug,
    category,
    sub_category: subCategory,
    scope,
    scope_3_category: scope3Category,
    value: values.value_co2e,
    unit_numerator: 'kgCO2e',
    unit_denominator: uom,
    region: 'GBR',
    region_display: 'United Kingdom',
    methodology: 'activity_based',
    gwp_horizon: 100,
    gwp_assessment: 'AR5',
    vintage_year: 2025,
    published_year: 2025,
    source_id: 'defra',
    source_page_ref: `Factors by Category sheet, ID ${firstId}`,
    source_url:
      'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025',
    uncertainty_low: null,
    uncertainty_high: null,
    uncertainty_unit: null,
    ghg_protocol_clause: null,
    notes: columnText ?? '',
    when_to_use: scope === 1 && isInFuelsSlice(l1)
      ? 'Use this factor for Scope 1 emissions from stationary combustion, where your organization directly burns fuel at facilities you own or control. This includes boilers, furnaces, generators, and other fixed equipment at your premises.'
      : null,
    tags,
    superseded_by: null,
    last_verified_date: '2025-06-10',
    verifier_initials: ['DESNZ'],
    changelog: [],
    // Extended fields
    scope_display: scopeDisplay,
    value_co2e: values.value_co2e,
    value_co2: values.value_co2,
    value_ch4: values.value_ch4,
    value_n2o: values.value_n2o,
    is_biogenic: isBiogenic,
    dataset_slug: 'defra-2025',
    beis_original_ids: origIds,
    level_1: l1,
    level_2: l2,
    level_3: l3,
    level_4: l4,
    column_text: columnText,
    published,
    factor_family_id: factorFamilyId,
  };

  // Tier expectation check
  if (rows.length > 4) {
    warnings.push(
      `Group has ${rows.length} rows (>4): ${l1}/${l2}/${l3}/${l4}/${uom}/${scopeText}`
    );
  }

  if (published) {
    publishedCount++;
    if (isBiogenic) biogenicInSlice++;
    const sliceKey = scope === 0 ? 'outside' : String(scope);
    sliceScopeCounts[sliceKey] = (sliceScopeCounts[sliceKey] ?? 0) + 1;
    const s3Key = scope3Category === null ? 'null' : String(scope3Category);
    sliceS3CategoryCounts[s3Key] = (sliceS3CategoryCounts[s3Key] ?? 0) + 1;
  }

  factors.push(factor);
}

// --- metadata objects --------------------------------------------------------

const source: Source = {
  id: 'defra',
  name: 'Department for Energy Security and Net Zero',
  publisher: 'Department for Energy Security and Net Zero',
  publisher_short: 'DEFRA',
  country: 'GBR',
  document_type: 'government',
  license: 'Open Government Licence v3.0',
  attribution_required: true,
  source_url: 'https://www.gov.uk/government/organisations/department-for-energy-security-and-net-zero',
  source_pdf_url: null,
  vintage_year: 2025,
  published_date: '2025-06-10',
  description:
    'DEFRA emission factors are the United Kingdom\'s official greenhouse gas conversion factors for corporate climate reporting. The 2025 release was published on 10 June 2025 by the Department for Energy Security and Net Zero (DESNZ). Practitioners still refer to these as the "DEFRA factors" - a name retained from the dataset\'s origin at the Department for Environment, Food and Rural Affairs, before responsibility transferred to the Department for Business, Energy and Industrial Strategy (BEIS) and, in 2023, to DESNZ.\n\nUK organisations use DEFRA emission factors to meet mandatory Streamlined Energy and Carbon Reporting (SECR) obligations, complete Energy Savings Opportunity Scheme (ESOS) audits, and respond to Procurement Policy Note 06/21 carbon reduction plans for major government contracts. The dataset is also the default UK reference for voluntary disclosure under the GHG Protocol Corporate Standard, CDP climate questionnaires, TCFD-aligned reporting, and ISSB / IFRS S2 climate disclosures.\n\nThe complete DEFRA 2025 dataset covers Scope 1 direct emissions from stationary and mobile combustion, Scope 2 purchased electricity on both location-based and market-based methodologies, and Scope 3 categories spanning business travel, employee commuting, freight and goods transport, waste treatment, water supply and treatment, refrigerants, and purchased materials. Factors are published with full CO\u2082, CH\u2084, and N\u2082O component breakdowns alongside aggregated CO\u2082e values, assessed on AR5 100-year Global Warming Potentials.\n\nGreentryst currently publishes 166 verified Scope 1 fuel and bioenergy factors from this release. Scope 2 electricity and Scope 3 categories will follow as each slice completes our verification workflow.',
  usage_note:
    'Use DEFRA factors for UK-specific reporting and as the default UK reference when preparing SECR, ESOS, and voluntary GHG Protocol Corporate Standard inventories. They are the appropriate choice for any emission source located in or consumed within the United Kingdom, including stationary combustion at UK sites, UK fleet mobile combustion, UK-origin business travel and freight, and waste treated under UK infrastructure.\n\nApply these factors when the operational boundary sits inside the UK or when the underlying fuel, electricity, or service is procured domestically. For multi-country inventories, pair DEFRA with jurisdiction-specific sources (for example IPCC or EPA) so each activity is matched to factors that reflect its local fuel specification, grid mix, and waste-treatment infrastructure.\n\nAlways cite the DEFRA 2025 release year and the specific factor version used - auditors, CDP scorers, and SBTi validators expect vintage traceability. Re-baseline inventories when DEFRA republishes (typically every June) if the underlying factor has shifted materially, and document the transition in your methodology notes.\n\nAvoid DEFRA factors for non-UK operations, for financial-control boundaries outside the UK, or when a more granular supplier-specific or region-specific factor is available and auditable.',
  logo_path: '/emission-factors/source-logos/desnz.svg',
};

// Extended source block (includes slug + publisher_short for downstream).
const sourceExtended = {
  ...source,
  slug: 'defra',
};

const dataset = {
  slug: 'defra-2025',
  name: 'UK Government GHG Conversion Factors for Company Reporting 2025',
  year_released: 2025,
  year_most_applicable: 2025,
  published_date: '2025-06-10',
  next_publication_hint: '2026-06',
  original_url:
    'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025',
  original_file_url:
    'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025',
  methodology_document_url:
    'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025',
  license_type: 'Open Government Licence v3.0',
  license_url: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
  geography_text: 'United Kingdom',
  calculation_method: 'ar5',
  description:
    "The 2025 edition of the UK Government's greenhouse gas conversion factors, covering emission factors for UK grid electricity, natural gas, petrol and diesel, business travel by car, rail, and air, refrigerants, waste treatment, water supply and treatment, and material use. Applies IPCC Fifth Assessment Report (AR5) global warming potentials with methane at 28 and nitrous oxide at 265, consistent with UNFCCC reporting. Separate CO2, CH4, and N2O gas breakdowns are preserved alongside the aggregated CO2e value. Published by DESNZ under the Open Government Licence and used across UK SECR and ESOS company reporting and GHG Protocol inventories. Released 10 June 2025.",
  data_quality_assurance:
    'Values are cited verbatim from the 2025 release. DESNZ publishes under an annual editorial review process and the 2025 set is the authoritative UK Government reference for company GHG reporting for the financial year. Accepted for use in UK SECR and ESOS disclosures.',
};

const out = {
  version: '1.0.0',
  generated_at: new Date().toISOString(),
  source: sourceExtended,
  dataset,
  stats: {
    input_rows: inputRows,
    excluded_energy_density_rows: excludedEnergyDensity,
    output_factors: factors.length,
    published_factors: publishedCount,
    biogenic_factors: biogenicCount,
    biogenic_factors_in_slice: biogenicInSlice,
    scope_counts: scopeCounts,
    slice_scope_counts: sliceScopeCounts,
    slice_scope_3_category_counts: sliceS3CategoryCounts,
    unit_type_counts: unitTypeCounts,
    factor_family_count_total: familyScopeMap.size,
    unmapped_scope3_rows: unmappedScope3Count,
    factor_family_scope_span_warnings: familyScopeSpanCount,
    parsing_warnings: warnings,
  },
  factors,
};

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));

// --- summary log -------------------------------------------------------------

const topUnits = Object.entries(unitTypeCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([k, v]) => `${k}=${v}`)
  .join(', ');

// Count unit families in the published slice (for the slice summary).
const sliceFamilyIds = new Set<string>();
for (const f of factors) {
  if ((f as unknown as { published?: boolean }).published) {
    const fid = (f as unknown as { factor_family_id?: string }).factor_family_id;
    if (fid) sliceFamilyIds.add(fid);
  }
}

const s3Dist = Object.entries(sliceS3CategoryCounts)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([k, v]) => `${k}=${v}`)
  .join(', ');

console.log('');
console.log('[defra-2025] ========== SUMMARY ==========');
console.log(`  input_rows:              ${inputRows}`);
console.log(`  excluded_energy_density: ${excludedEnergyDensity}`);
console.log(`  output_factors:          ${factors.length}`);
console.log(`  published_factors:       ${publishedCount}`);
console.log(`  unit_families_in_slice:  ${sliceFamilyIds.size}`);
console.log(`  biogenic_factors:        ${biogenicCount} (${biogenicInSlice} in slice)`);
console.log(
  `  scope_counts (all):      1=${scopeCounts['1']} 2=${scopeCounts['2']} 3=${scopeCounts['3']} outside=${scopeCounts.outside}`
);
console.log(
  `  scope_counts (slice):    1=${sliceScopeCounts['1'] ?? 0} 2=${sliceScopeCounts['2'] ?? 0} 3=${sliceScopeCounts['3'] ?? 0} outside=${sliceScopeCounts.outside ?? 0}`
);
console.log(`  s3_category (slice):     ${s3Dist}`);
console.log(`  unmapped_scope3_rows:    ${unmappedScope3Count}`);
console.log(`  family_scope_spans:      ${familyScopeSpanCount}`);
console.log(`  unit_type top 5:         ${topUnits}`);
console.log(`  warnings:                ${warnings.length}`);
if (warnings.length > 0) {
  for (const w of warnings.slice(0, 10)) console.log(`    - ${w}`);
  if (warnings.length > 10) console.log(`    ... +${warnings.length - 10} more`);
}
console.log(`  wrote:                   ${OUT_PATH}`);
