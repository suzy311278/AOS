/**
 * generate-ef-search-index.ts
 *
 * Reads every emission-factor YAML via the server loader, emits a compact
 * FactorSearchIndex JSON at public/emission-factors/search-index.json.
 *
 * The runtime client then feeds this into MiniSearch. The script does not
 * build a MiniSearch index itself because MiniSearch serializes awkwardly
 * and re-building client-side from the raw rows is cheap.
 *
 * Canary factors: any canary rows for anti-scraping forensics are inserted
 * into YAML via a private env path and flow through this script unchanged.
 * No special handling lives here for v1.
 *
 * Run: npx tsx scripts/generate-ef-search-index.ts
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { loadResolvedFactors } from '../src/lib/emission-factors/loader';
import { SECTOR_BY_CATEGORY } from '../src/lib/emission-factors/categories';
import type {
  FactorSearchIndex,
  FactorSearchRow,
  ResolvedFactor,
} from '../src/lib/emission-factors/types';

const OUT_DIR = join(process.cwd(), 'public', 'emission-factors');
const OUT_FILE = join(OUT_DIR, 'search-index.json');

// Note: `search_text` is no longer emitted to the JSON. The client
// reconstructs it on-the-fly when building the MiniSearch index from the
// other fields (title + region + source + category + methodology + tags +
// vintage). This roughly halves the JSON payload at no search-quality cost.

function toRow(f: ResolvedFactor): FactorSearchRow {
  return {
    id: f.id,
    slug: f.slug,
    title: f.activity,
    region_display: f.region_display,
    category: f.category,
    sub_category: f.sub_category,
    scope: f.scope,
    value: f.value,
    unit_display: f.unit_display,
    unit_denominator: f.unit_denominator,
    source_short: `${f.source.publisher_short} ${f.source.vintage_year}`,
    source_slug: f.source_id,
    dataset_slug: f.dataset_slug ?? f.source_id,
    vintage_year: f.vintage_year,
    methodology: f.methodology,
    tags: f.tags,
    factor_family_id: f.factor_family_id ?? f.id,
    sector: SECTOR_BY_CATEGORY[f.category] ?? 'Other',
    fuel_type: f.level_2 ?? null,
  };
}

function main() {
  const factors = loadResolvedFactors();
  const index: FactorSearchIndex = {
    version: '1.0.0',
    built_at: new Date().toISOString(),
    factor_count: factors.length,
    factors: factors.map(toRow),
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(index), 'utf8');

  const bytes = Buffer.byteLength(JSON.stringify(index));
  // eslint-disable-next-line no-console
  console.log(
    `[ef-search-index] wrote ${factors.length} factors to ${OUT_FILE} (${(
      bytes / 1024
    ).toFixed(1)} KB)`
  );
}

main();
