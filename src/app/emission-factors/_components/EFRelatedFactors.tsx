/**
 * EFRelatedFactors
 *
 * Renders up to 3 small cards linking to related factors.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ResolvedFactor } from '@/lib/emission-factors/types';
import { formatValue, formatUnit } from '@/lib/emission-factors/unit-display';

export interface EFRelatedFactorsProps {
  factors: ResolvedFactor[];
}

export function EFRelatedFactors({ factors }: EFRelatedFactorsProps) {
  if (factors.length === 0) return null;
  return (
    <section>
      <h2 className="text-lg font-semibold text-gt-text">Related factors</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {factors.map((f) => (
          <Link
            key={f.id}
            href={`/emission-factors/${f.slug}`}
            className="group rounded-2xl bg-white border border-gt-border-light shadow-gt-card p-5 hover:shadow-gt-card-hover transition-shadow"
          >
            <div className="text-xs uppercase tracking-[0.08em] text-gt-text-dim">
              {f.source.publisher_short} {f.vintage_year}
            </div>
            <div className="mt-1 font-semibold text-gt-text">{f.activity}</div>
            <div className="text-xs text-gt-text-muted">{f.region_display}</div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold text-[#2D6A4F]">
                {formatValue(f.value)}
              </span>
              <span className="font-mono text-xs text-gt-text-muted">{formatUnit(f)}</span>
            </div>
            <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#2D6A4F] group-hover:underline">
              View factor <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
