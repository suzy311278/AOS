'use client';

/**
 * EFCompareTable
 *
 * Side-by-side comparison for 2-4 factors. Phase B: no LLM reasoning, just
 * a plain grid with a "View factor" link per column.
 */

import Link from 'next/link';
import { X } from 'lucide-react';
import type { ResolvedFactor } from '@/lib/emission-factors/types';
import { formatValue, formatUnit } from '@/lib/emission-factors/unit-display';

export interface EFCompareTableProps {
  factors: ResolvedFactor[];
  onRemove?: (slug: string) => void;
}

const ROWS: Array<{
  label: string;
  render: (f: ResolvedFactor) => React.ReactNode;
}> = [
  {
    label: 'Value',
    render: (f) => (
      <span className="font-mono font-semibold text-[#2D6A4F]">
        {formatValue(f.value)}
      </span>
    ),
  },
  { label: 'Unit', render: (f) => <span className="font-mono">{formatUnit(f)}</span> },
  { label: 'Region', render: (f) => f.region_display },
  {
    label: 'Scope',
    render: (f) => (f.scope === 0 ? 'n/a' : `Scope ${f.scope}`),
  },
  { label: 'Methodology', render: (f) => f.methodology.replace(/_/g, ' ') },
  { label: 'Vintage', render: (f) => f.vintage_year },
  {
    label: 'Source',
    render: (f) => `${f.source.publisher_short} ${f.source.vintage_year}`,
  },
  {
    label: 'GWP',
    render: (f) => `${f.gwp_assessment ?? 'n/a'} / GWP${f.gwp_horizon}`,
  },
];

export function EFCompareTable({ factors, onRemove }: EFCompareTableProps) {
  if (factors.length === 0) {
    return (
      <div className="rounded-2xl border border-gt-border-light bg-white p-6 text-center text-gt-text-muted">
        Pick 2 to 4 factors from the picker above to compare them side by side.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gt-border-light bg-white shadow-gt-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gt-pale">
            <tr>
              <th className="px-4 py-3 text-xs uppercase tracking-[0.08em] text-gt-text-dim w-40">
                Attribute
              </th>
              {factors.map((f) => (
                <th key={f.id} className="px-4 py-3 align-top">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs uppercase tracking-[0.08em] text-gt-text-dim">
                        {f.source.publisher_short} {f.vintage_year}
                      </div>
                      <div className="text-sm font-semibold text-gt-text">
                        {f.activity}
                      </div>
                    </div>
                    {onRemove && (
                      <button
                        type="button"
                        aria-label={`Remove ${f.activity}`}
                        onClick={() => onRemove(f.slug)}
                        className="text-gt-text-dim hover:text-[#2D6A4F]"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-t border-gt-border-light">
                <th
                  scope="row"
                  className="px-4 py-3 text-xs uppercase tracking-[0.08em] text-gt-text-dim"
                >
                  {row.label}
                </th>
                {factors.map((f) => (
                  <td key={f.id} className="px-4 py-3 text-gt-text">
                    {row.render(f)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-gt-border-light bg-gt-pale">
              <th scope="row" className="px-4 py-3" />
              {factors.map((f) => (
                <td key={f.id} className="px-4 py-3">
                  <Link
                    href={`/emission-factors/${f.slug}`}
                    className="text-xs font-semibold text-[#2D6A4F] hover:underline"
                  >
                    View factor
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
