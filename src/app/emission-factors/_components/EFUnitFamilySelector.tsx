/**
 * EFUnitFamilySelector
 *
 * Renders a compact unit picker for the factor detail page. Given the active
 * factor, it enumerates every published sibling sharing the same
 * `factor_family_id` (computed by the parser) and surfaces each as a pill
 * link to that sibling's canonical URL. The active UOM is highlighted; all
 * other clicks trigger a full navigation (no client-side swap) so each unit
 * keeps its own SEO-indexable page and JSON-LD block.
 *
 * If no siblings exist (e.g. legacy YAML factor without family id) the
 * component silently renders nothing; the caller is free to include it
 * unconditionally.
 */

import Link from 'next/link';
import type { ResolvedFactor } from '@/lib/emission-factors/types';
import { loadResolvedFactors } from '@/lib/emission-factors/loader';

export interface EFUnitFamilySelectorProps {
  factor: ResolvedFactor;
}

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

export function EFUnitFamilySelector({ factor }: EFUnitFamilySelectorProps) {
  const familyId = factor.factor_family_id;
  if (!familyId) return null;

  const siblings = loadResolvedFactors()
    .filter((f) => f.factor_family_id === familyId)
    .sort((a, b) => unitRank(a.unit_denominator) - unitRank(b.unit_denominator));

  if (siblings.length <= 1) return null;

  return (
    <div className="mt-6 rounded-xl border border-gt-border-light bg-gt-pale px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gt-text-dim">
        Same activity, different unit
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {siblings.map((sib) => {
          const isActive = sib.id === factor.id;
          return (
            <Link
              key={sib.id}
              href={`/emission-factors/${sib.slug}`}
              aria-current={isActive ? 'page' : undefined}
              className={
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-mono transition-colors ' +
                (isActive
                  ? 'bg-[#2D6A4F] text-white'
                  : 'bg-white text-gt-text-muted border border-gt-border-light hover:border-[#2D6A4F] hover:text-[#2D6A4F]')
              }
            >
              {sib.unit_denominator}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
