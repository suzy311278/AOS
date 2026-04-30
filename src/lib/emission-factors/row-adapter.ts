/**
 * Server-safe adapter from ResolvedFactor to FactorSearchRow.
 *
 * Lives in the lib (not in a 'use client' component file) so server
 * components can call it during render without crossing the client
 * boundary. This was previously exported from EFResultsTable.tsx which is
 * marked 'use client'; calling a named export from a client module inside
 * a server component yields a client reference, not the function body —
 * which broke server-rendered source and category pages.
 */

import type { ResolvedFactor, FactorSearchRow } from './types';
import { SECTOR_BY_CATEGORY } from './categories';

export function resolvedFactorsToRows(
  factors: ResolvedFactor[],
): FactorSearchRow[] {
  return factors.map((f) => ({
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
  }));
}
