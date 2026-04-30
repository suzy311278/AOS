/**
 * EFFactorCard
 *
 * Hero card on the single-factor page. Shows the big value in teal accent,
 * the activity + region, and a short strip of key metadata pills.
 */

import { Gauge, MapPin, Layers, CalendarClock, type LucideIcon } from 'lucide-react';
import type { ResolvedFactor } from '@/lib/emission-factors/types';
import { CATEGORY_META } from '@/lib/emission-factors/categories';
import { formatValue, formatUnit } from '@/lib/emission-factors/unit-display';

export interface EFFactorCardProps {
  factor: ResolvedFactor;
}

export function EFFactorCard({ factor }: EFFactorCardProps) {
  const CatIcon = CATEGORY_META[factor.category].icon;
  return (
    <div className="rounded-2xl bg-white border border-gt-border-light shadow-gt-card p-8">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#2D6A4F]">
        <CatIcon className="h-4 w-4" aria-hidden />
        {CATEGORY_META[factor.category].label}
      </div>
      <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-gt-tight text-gt-text">
        {factor.activity}
      </h1>
      <p className="mt-1 text-gt-text-muted">
        {factor.region_display} - {factor.source.publisher_short} {factor.vintage_year}
      </p>

      <div className="mt-8 flex items-baseline gap-3">
        <span className="font-mono text-5xl md:text-6xl font-bold text-[#2D6A4F]">
          {formatValue(factor.value)}
        </span>
        <span className="font-mono text-lg text-gt-text-muted">{formatUnit(factor)}</span>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Pill icon={Gauge} label={factor.methodology.replace(/_/g, ' ')} />
        <Pill icon={MapPin} label={factor.region_display} />
        <Pill
          icon={Layers}
          label={factor.scope === 0 ? 'Not applicable' : `Scope ${factor.scope}`}
        />
        <Pill
          icon={CalendarClock}
          label={`${factor.gwp_assessment ?? 'n/a'} / GWP${factor.gwp_horizon}`}
        />
      </div>
    </div>
  );
}

function Pill({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gt-pale border border-gt-border-light px-3 py-1 text-xs font-medium text-gt-text-muted">
      <Icon className="h-3.5 w-3.5 text-[#2D6A4F]" aria-hidden />
      {label}
    </span>
  );
}
