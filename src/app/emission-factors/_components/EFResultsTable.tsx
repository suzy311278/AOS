'use client';

/**
 * EFResultsTable
 *
 * Sticky-header table of factors. Accepts compact `FactorSearchRow[]` (not
 * full ResolvedFactors) so the search surface can ship under 20 KB HTML.
 * Each row links out to the factor detail page for full metadata; rows no
 * longer expand inline - the payload cost of shipping full ResolvedFactors
 * on the search page was untenable at 200k+ factors.
 *
 * Rows are grouped by `factor_family_id`, collapsing UOM siblings into a
 * single visual row. The row shows the primary unit's value as the big
 * number and an inline set of unit pills for each sibling factor; each pill
 * is a Link to that specific factor's detail page.
 *
 * Rendered rows are paginated: 50 by default, "Load more" reveals +100.
 */

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, type LucideIcon } from 'lucide-react';
import type { FactorSearchRow } from '@/lib/emission-factors/types';
import { CATEGORY_META } from '@/lib/emission-factors/categories';

export interface EFResultsTableProps {
  rows: FactorSearchRow[];
  query?: string;
  /** Hide the Source column (used on source detail pages). */
  hideSource?: boolean;
}

const INITIAL_VISIBLE = 50;
const LOAD_STEP = 100;

function matches(row: FactorSearchRow, q: string): boolean {
  if (!q) return true;
  const hay = [
    row.title,
    row.region_display,
    row.source_short,
    String(row.vintage_year),
    row.methodology,
    row.category,
    ...row.tags,
  ]
    .join(' ')
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => hay.includes(t));
}

// Preferred UOM ordering per unit-family; the first match wins as the
// "primary" unit shown in the big value column.
const UNIT_RANK: string[] = [
  'kWh',
  'kWh (Net CV)',
  'kWh (Gross CV)',
  'litres',
  'cubic metres',
  'tonnes',
  'kg',
  'km',
  'miles',
  'passenger.km',
  'tonne.km',
  'GJ',
];

function unitRank(uom: string): number {
  const idx = UNIT_RANK.indexOf(uom);
  return idx === -1 ? 999 : idx;
}

interface FamilyGroup {
  familyId: string;
  primary: FactorSearchRow;
  siblings: FactorSearchRow[]; // includes primary; sorted by UNIT_RANK
}

function groupByFamily(rows: FactorSearchRow[]): FamilyGroup[] {
  const by = new Map<string, FactorSearchRow[]>();
  for (const r of rows) {
    // Fall back to row id when factor_family_id is missing (legacy rows).
    const key = r.factor_family_id || r.id;
    const arr = by.get(key);
    if (arr) arr.push(r);
    else by.set(key, [r]);
  }
  const groups: FamilyGroup[] = [];
  for (const [familyId, members] of by) {
    const sorted = [...members].sort(
      (a, b) => unitRank(a.unit_denominator) - unitRank(b.unit_denominator),
    );
    groups.push({ familyId, primary: sorted[0], siblings: sorted });
  }
  return groups;
}

export function EFResultsTable({
  rows,
  query = '',
  hideSource = false,
}: EFResultsTableProps) {
  const filtered = useMemo(
    () => rows.filter((r) => matches(r, query)),
    [rows, query],
  );

  const groups = useMemo(() => groupByFamily(filtered), [filtered]);

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  // Reset visible window when the filtered set changes (query / filter flip).
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [query, rows]);

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-gt-border-light bg-white p-8 text-center text-gt-text-muted">
        No factors match this query. Try a broader term or browse by category.
      </div>
    );
  }

  const visible = groups.slice(0, visibleCount);
  const hasMore = visibleCount < groups.length;

  return (
    <div className="rounded-2xl border border-gt-border-light bg-white shadow-gt-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-gt-pale text-gt-text-muted text-xs uppercase tracking-[0.08em]">
            <tr>
              <th className="px-3 py-3">Activity</th>
              <th className="px-3 py-3">Sector</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Region</th>
              <th className="px-3 py-3 text-right">Value</th>
              <th className="px-3 py-3">Units</th>
              {!hideSource && <th className="px-3 py-3">Source</th>}
              <th className="px-3 py-3">Vintage</th>
              <th className="px-3 py-3">Scope</th>
              <th className="px-3 py-3 sr-only">Open</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((group) => {
              const r = group.primary;
              const meta = CATEGORY_META[r.category];
              const CatIcon: LucideIcon = meta.icon;
              return (
                <tr
                  key={group.familyId}
                  className="border-t border-gt-border-light hover:bg-gt-pale"
                >
                  <td className="px-3 py-3 align-top">
                    <div className="flex items-start gap-2">
                      <CatIcon className="h-4 w-4 mt-0.5 text-[#2D6A4F]" aria-hidden />
                      <div>
                        <div className="font-medium text-gt-text">{r.title}</div>
                        {r.sub_category && (
                          <div className="text-xs text-gt-text-dim">{r.sub_category}</div>
                        )}
                        {r.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {r.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-gt-pale px-2 py-0.5 text-[10px] text-gt-text-dim"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top text-gt-text">
                    {r.sector ?? '—'}
                  </td>
                  <td className="px-3 py-3 align-top text-gt-text-muted capitalize">
                    {meta.shortLabel}
                  </td>
                  <td className="px-3 py-3 align-top">{r.region_display}</td>
                  <td className="px-3 py-3 align-top text-right font-mono font-semibold text-[#2D6A4F]">
                    {r.value}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-wrap gap-1">
                      {group.siblings.map((sib) => {
                        const isPrimary = sib.id === r.id;
                        return (
                          <Link
                            key={sib.id}
                            href={`/emission-factors/${sib.slug}`}
                            className={
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-mono transition-colors ' +
                              (isPrimary
                                ? 'bg-[#2D6A4F] text-white'
                                : 'bg-gt-pale text-gt-text-muted border border-gt-border-light hover:bg-white hover:text-[#2D6A4F]')
                            }
                          >
                            {sib.unit_denominator}
                          </Link>
                        );
                      })}
                    </div>
                  </td>
                  {!hideSource && (
                    <td className="px-3 py-3 align-top">{r.source_short}</td>
                  )}
                  <td className="px-3 py-3 align-top">{r.vintage_year}</td>
                  <td className="px-3 py-3 align-top">
                    {r.scope === 0 ? 'n/a' : `Scope ${r.scope}`}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Link
                      href={`/emission-factors/${r.slug}`}
                      className="text-xs font-semibold text-[#2D6A4F] hover:underline inline-flex items-center gap-1"
                    >
                      Open <ExternalLink className="h-3 w-3" aria-hidden />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gt-border-light bg-gt-pale px-4 py-3 flex items-center justify-between gap-3 text-xs text-gt-text-dim">
        <span>
          Showing {visible.length} of {groups.length} unit-famil
          {groups.length === 1 ? 'y' : 'ies'} ({filtered.length} factor
          {filtered.length === 1 ? '' : 's'})
        </span>
        {hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + LOAD_STEP)}
            className="rounded-full border border-gt-border-light bg-white px-3 py-1.5 text-xs font-semibold text-gt-text hover:bg-gt-pale"
          >
            Load more (show {Math.min(LOAD_STEP, groups.length - visibleCount)} more)
          </button>
        )}
      </div>
    </div>
  );
}
