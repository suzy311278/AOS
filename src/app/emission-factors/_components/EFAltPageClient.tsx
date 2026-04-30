'use client';

/**
 * Client component for the alt (brutalist) factor page. Receives all unit
 * siblings and manages which unit is currently displayed via state.
 */

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, AlertTriangle, Flame } from 'lucide-react';
import type { ResolvedFactor, Methodology } from '@/lib/emission-factors/types';
import { licenseUrl } from '@/lib/emission-factors/license';
import { EFAltCitationBlock } from './EFAltCitationBlock';
// Save/cite-list deferred to v1.1 (see EFFactorPageClient).
// import { EFSaveActions } from './EFSaveActions';
import { EFIssueReportButton } from './EFIssueReportButton';

const METHODOLOGY_BRIEFS: Partial<Record<Methodology, string>> = {
  location_based:
    'Average grid emissions intensity in a defined geography. Ignores contractual instruments such as RECs or PPAs.',
  market_based:
    'Reflects contractually-chosen electricity (supplier-specific, residual mix, or green-certificate-backed). Pairs with location-based, never replaces it.',
  activity_based:
    'Derived from direct physical activity measurements (litres, kilometres, kilograms). The most accurate approach where activity data exists.',
  spend_based:
    'Derived from spend multiplied by a sector-average intensity (e.g. USEEIO). Use when activity data is unavailable; swap for supplier-specific once obtained.',
  operating_margin:
    'Captures the intensity of power plants dispatching on the margin. Common in grid attribution methodologies for offset projects.',
  combined_margin:
    'Weighted blend of operating margin and build margin. Used in CDM-era grid-factor methodologies and adapted by several national authorities.',
  supplier_specific:
    'Factor provided directly by a supplier for their specific product or service. Highest data-quality tier for Scope 3.',
  average_data:
    'Factor drawn from average industry data. Second tier after supplier-specific in the GHG Protocol data-quality hierarchy.',
  hybrid:
    'Combines direct measurement for measurable activity with average data for the rest. Common for complex multi-site operations.',
};

interface EFAltPageClientProps {
  family: ResolvedFactor[];
  related: ResolvedFactor[];
  supersedingSlug: string | null;
  supersedingLabel: string;
}

export function EFAltPageClient({
  family,
  related,
  supersedingSlug,
  supersedingLabel,
}: EFAltPageClientProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const factor = family[activeIndex];

  const methodologyBrief = METHODOLOGY_BRIEFS[factor.methodology];
  const scopeLabel = factor.scope === 0 ? 'Not applicable' : `Scope ${factor.scope}`;
  const bigValue = String(factor.value);

  // Dynamic font size based on number length to prevent layout shift
  const getFontSize = (val: string) => {
    const len = val.length;
    if (len <= 5) return 'clamp(88px, 16vw, 200px)';
    if (len <= 6) return 'clamp(72px, 14vw, 160px)';
    if (len <= 7) return 'clamp(56px, 11vw, 120px)';
    return 'clamp(44px, 9vw, 96px)';
  };

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative">
        {supersedingSlug && (
          <div className="mx-auto max-w-6xl px-6 pt-6">
            <Link
              href={`/emission-factors/${supersedingSlug}`}
              className="inline-flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200 ring-1 ring-amber-400/30 hover:bg-amber-500/15 transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="font-mono uppercase tracking-[0.14em]">
                Superseded by {supersedingLabel}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        )}

        <div className="mx-auto max-w-6xl px-6 pt-14 pb-12 md:pt-20 md:pb-16">
          {/* Top eyebrow */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-white/40">
            <span>
              Factor record ·{' '}
              <span className="font-mono normal-case tracking-normal text-white/60">
                {factor.record_id ?? factor.id}
              </span>
            </span>
            <span className="font-mono tracking-normal">
              last verified {factor.last_verified_date} · {factor.verifier_initials.join(' · ')}
            </span>
          </div>

          {/* Number + spine */}
          <div className="mt-10 flex flex-col gap-4">
            <div
              className="font-mono font-semibold tracking-[-0.04em] leading-[0.9] text-[#95D5B2] whitespace-nowrap transition-all duration-300"
              style={{ fontSize: getFontSize(bigValue) }}
            >
              {bigValue}
            </div>
            <div>
              <div className="font-mono text-base md:text-lg text-white">
                {factor.unit_numerator} / {factor.unit_denominator}
              </div>
              <h1 className="mt-3 text-xl md:text-3xl font-semibold text-white leading-tight">
                {factor.activity}
              </h1>
              <div className="mt-1 text-sm text-white/60 inline-flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-[#95D5B2]" strokeWidth={1.5} />
                Fuels
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] font-mono">
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/70">
                  {factor.source.publisher_short} {factor.vintage_year}
                </span>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/70">
                  {scopeLabel}
                </span>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/70">
                  {factor.methodology.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Unit selector */}
          {family.length > 1 && (
            <div className="mt-8">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-3">
                Select unit
              </div>
              <div className="flex flex-wrap gap-2">
                {family.map((sib, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={sib.id}
                      onClick={() => setActiveIndex(idx)}
                      aria-current={isActive ? 'page' : undefined}
                      className={
                        'inline-flex items-center rounded-md px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer ' +
                        (isActive
                          ? 'bg-[#95D5B2] text-[#0a1a1a]'
                          : 'bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white')
                      }
                    >
                      {sib.unit_denominator}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hairline */}
          <div className="mt-12 h-px w-full bg-[#2D6A4F]/50" aria-hidden />

          {/* GHG Breakdown */}
          {(factor.value_co2 != null || factor.value_ch4 != null || factor.value_n2o != null) && (
            <div className="mt-8">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-3">
                GHG Breakdown
              </div>
              {/* Mobile: stack vertically (three narrow columns clip the
                  number and break the unit line ugly). Tablet+: 3 columns. */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {factor.value_co2 !== null && factor.value_co2 !== undefined && (
                  <div className="rounded-md bg-white/[0.04] px-3 py-3 ring-1 ring-white/10 hover:ring-[#95D5B2]/40 hover:bg-white/[0.06] transition-all duration-300 hover:scale-[1.02] flex items-center gap-3">
                    {/* CO₂ molecule: O=C=O linear */}
                    <svg className="w-12 h-10 shrink-0 opacity-70 animate-[pulse_3s_ease-in-out_infinite]" viewBox="0 0 48 24" fill="none" stroke="#95D5B2" strokeWidth="1.5">
                      <circle cx="8" cy="12" r="5" />
                      <circle cx="24" cy="12" r="4" fill="#95D5B2" fillOpacity="0.2" />
                      <circle cx="40" cy="12" r="5" />
                      <line x1="13" y1="12" x2="20" y2="12" />
                      <line x1="28" y1="12" x2="35" y2="12" />
                    </svg>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-[#95D5B2]">CO₂</div>
                      <div className="font-mono text-base text-white/90">{factor.value_co2.toFixed(4)}</div>
                      <div className="text-[9px] text-white/50">{factor.unit_numerator}/{factor.unit_denominator}</div>
                    </div>
                  </div>
                )}
                {factor.value_ch4 !== null && factor.value_ch4 !== undefined && (
                  <div className="rounded-md bg-white/[0.04] px-3 py-3 ring-1 ring-white/10 hover:ring-[#95D5B2]/40 hover:bg-white/[0.06] transition-all duration-300 hover:scale-[1.02] flex items-center gap-3">
                    {/* CH₄ molecule: tetrahedral methane */}
                    <svg className="w-12 h-10 shrink-0 opacity-70 animate-[pulse_3s_ease-in-out_infinite_0.5s]" viewBox="0 0 48 28" fill="none" stroke="#95D5B2" strokeWidth="1.5">
                      <circle cx="24" cy="14" r="5" fill="#95D5B2" fillOpacity="0.2" />
                      <circle cx="24" cy="3" r="2.5" />
                      <circle cx="12" cy="20" r="2.5" />
                      <circle cx="36" cy="20" r="2.5" />
                      <circle cx="24" cy="25" r="2.5" />
                      <line x1="24" y1="9" x2="24" y2="5.5" />
                      <line x1="19" y1="17" x2="14" y2="18.5" />
                      <line x1="29" y1="17" x2="34" y2="18.5" />
                      <line x1="24" y1="19" x2="24" y2="22.5" />
                    </svg>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-[#95D5B2]">CH₄</div>
                      <div className="font-mono text-base text-white/90">{factor.value_ch4.toFixed(4)}</div>
                      <div className="text-[9px] text-white/50">{factor.unit_numerator}/{factor.unit_denominator}</div>
                    </div>
                  </div>
                )}
                {factor.value_n2o !== null && factor.value_n2o !== undefined && (
                  <div className="rounded-md bg-white/[0.04] px-3 py-3 ring-1 ring-white/10 hover:ring-[#95D5B2]/40 hover:bg-white/[0.06] transition-all duration-300 hover:scale-[1.02] flex items-center gap-3">
                    {/* N₂O molecule: N=N=O linear */}
                    <svg className="w-12 h-10 shrink-0 opacity-70 animate-[pulse_3s_ease-in-out_infinite_1s]" viewBox="0 0 48 24" fill="none" stroke="#95D5B2" strokeWidth="1.5">
                      <circle cx="8" cy="12" r="5" fill="#95D5B2" fillOpacity="0.2" />
                      <circle cx="24" cy="12" r="5" fill="#95D5B2" fillOpacity="0.2" />
                      <circle cx="40" cy="12" r="4" />
                      <line x1="13" y1="12" x2="19" y2="12" />
                      <line x1="29" y1="12" x2="36" y2="12" />
                    </svg>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-[#95D5B2]">N₂O</div>
                      <div className="font-mono text-base text-white/90">{factor.value_n2o.toFixed(4)}</div>
                      <div className="text-[9px] text-white/50">{factor.unit_numerator}/{factor.unit_denominator}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ===== METADATA + CITATION ===== */}
      <section className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16 grid gap-12 lg:grid-cols-2">
          {/* Metadata table */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-4">
              Record
            </div>
            <dl className="divide-y divide-white/5 font-mono text-[13px]">
              <Row label="Identifier" value={factor.id} />
              <Row label="Activity" value={factor.activity} />
              <Row label="Category" value={factor.category} />
              {factor.sub_category && (
                <Row label="Sub-category" value={factor.sub_category} />
              )}
              <Row label="Region" value={`${factor.region} · ${factor.region_display}`} />
              <Row label="Value" value={`${factor.value} ${factor.unit_numerator}/${factor.unit_denominator}`} highlight />
              <Row label="Scope" value={scopeLabel} />
              {factor.scope_3_category !== null && (
                <Row
                  label="Scope 3 category"
                  value={`Category ${factor.scope_3_category}`}
                />
              )}
              <Row
                label="Methodology"
                value={factor.methodology.replace(/_/g, ' ')}
              />
              <Row
                label="GWP"
                value={`${factor.gwp_assessment ?? 'n/a'} / GWP${factor.gwp_horizon}`}
              />
              <Row label="Vintage year" value={String(factor.vintage_year)} />
              <Row label="Published" value={String(factor.published_year)} />
              <Row label="Source reference" value={factor.source_page_ref} />
              {factor.ghg_protocol_clause && (
                <Row label="GHG Protocol" value={factor.ghg_protocol_clause} />
              )}
              <Row
                label="Source"
                value={
                  <Link
                    href={`/emission-factors/sources/${factor.source.id}`}
                    className="underline underline-offset-2 hover:text-[#95D5B2] transition-colors"
                  >
                    {factor.source.publisher} ({factor.source.publisher_short})
                  </Link>
                }
              />
              <Row
                label="License"
                value={(() => {
                  const url = licenseUrl(factor.source.license);
                  return url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-white/30 hover:decoration-[#95D5B2] hover:text-[#95D5B2] transition-colors"
                    >
                      {factor.source.license}
                    </a>
                  ) : (
                    factor.source.license
                  );
                })()}
              />
              <Row
                label="Verified"
                value={`${factor.last_verified_date} · ${factor.verifier_initials.join(' · ')}`}
              />
            </dl>

            {/* Source + Report buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={factor.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-white/5 hover:bg-white/10 px-3 py-2 text-[12px] text-white/80 ring-1 ring-white/10 transition-colors"
              >
                <span className="font-mono uppercase tracking-[0.14em]">Open primary source</span>
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
              <EFIssueReportButton factorId={factor.id} />
            </div>
          </div>

          {/* Citation */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-4">
              Citation
            </div>
            <EFAltCitationBlock factor={factor} source={factor.source} />

            {factor.when_to_use && (
              <div className="mt-10">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#95D5B2] mb-3">
                  When to use
                </div>
                <p className="text-[14px] text-white/90 leading-relaxed">
                  {factor.when_to_use}
                </p>
              </div>
            )}

            {methodologyBrief && (
              <div className="mt-10">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-3">
                  Methodology
                </div>
                <p className="text-[14px] text-white/80 leading-relaxed">
                  {methodologyBrief}
                </p>
              </div>
            )}

            {factor.notes && factor.notes.trim().length > 0 && (
              <div className="mt-10">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-3">
                  Notes
                </div>
                <p className="text-[14px] text-white/80 leading-relaxed whitespace-pre-line">
                  {factor.notes.trim()}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== RELATED ===== */}
      {related.length > 0 && (
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                Related records
              </div>
              <Link
                href="/emission-factors/search"
                className="inline-flex items-center gap-1.5 text-[12px] text-[#95D5B2] hover:text-white transition-colors"
              >
                Browse full library
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </div>

            <ul className="mt-6 divide-y divide-white/5" role="list">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/emission-factors/${r.slug}`}
                    className="flex w-full items-center gap-3 px-2 py-[11px] font-mono text-[13px] transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="w-[14%] text-white/70 truncate">
                      {r.source.publisher_short} {r.vintage_year}
                    </span>
                    <span className="flex-1 text-white/90 truncate">{r.activity}</span>
                    <span className="w-[14%] text-[#95D5B2] font-semibold truncate">
                      {r.value}
                    </span>
                    <span className="w-[16%] text-white/60 truncate">
                      {r.unit_numerator}/{r.unit_denominator}
                    </span>
                    <span className="w-[10%] text-white/60 truncate">
                      {r.region}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-white/40" strokeWidth={2} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ===== FOOTER META ===== */}
      <section className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-white/40">
          <span>
            {factor.source.publisher} · {factor.source.vintage_year} ·{' '}
            {(() => {
              const url = licenseUrl(factor.source.license);
              return url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-white/20 hover:text-white/70 transition-colors"
                >
                  {factor.source.license}
                </a>
              ) : (
                factor.source.license
              );
            })()}
          </span>
          <Link
            href="/emission-factors"
            className="text-white/60 hover:text-white transition-colors"
          >
            Back to the library
          </Link>
        </div>
      </section>
    </>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-2.5">
      <dt className="text-[10px] uppercase tracking-[0.18em] text-white/40 whitespace-nowrap">
        {label}
      </dt>
      <dd
        className={
          'text-right ' + (highlight ? 'text-[#95D5B2] font-semibold' : 'text-white/85')
        }
      >
        {value}
      </dd>
    </div>
  );
}
