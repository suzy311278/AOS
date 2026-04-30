'use client';

/**
 * Client component for the factor detail page. Receives all unit siblings
 * (the family) and manages which unit is currently displayed. Unit switching
 * happens via React state - no navigation, same URL.
 */

import { useState } from 'react';
import type { ResolvedFactor } from '@/lib/emission-factors/types';
import { EFFactorCard } from './EFFactorCard';
import { EFCitationBlock } from './EFCitationBlock';
import { EFMethodologyExplainer } from './EFMethodologyExplainer';
import { EFRelatedFactors } from './EFRelatedFactors';
import { EFVintageBanner } from './EFVintageBanner';
import { EFIssueReportButton } from './EFIssueReportButton';
// Save/cite-list is deferred to v1.1 (signed-in workspace). The component is
// retained for the future revival; the import is commented out so the factor
// page ships without a CTA that has nowhere to go.
// import { EFSaveActions } from './EFSaveActions';
import { EFSourceCard } from './EFSourceCard';

interface EFFactorPageClientProps {
  family: ResolvedFactor[];
  related: ResolvedFactor[];
  supersedingSlug: string | null;
  supersedingLabel: string;
}

export function EFFactorPageClient({
  family,
  related,
  supersedingSlug,
  supersedingLabel,
}: EFFactorPageClientProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const factor = family[activeIndex];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {supersedingSlug && (
          <EFVintageBanner
            supersedingSlug={supersedingSlug}
            supersedingLabel={supersedingLabel}
          />
        )}

        <div>
          <EFFactorCard factor={factor} />

          {/* Unit selector - only show if multiple units exist */}
          {family.length > 1 && (
            <div className="mt-6 rounded-xl border border-gt-border-light bg-gt-pale px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gt-text-dim">
                Same activity, different unit
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {family.map((sib, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={sib.id}
                      onClick={() => setActiveIndex(idx)}
                      aria-current={isActive ? 'page' : undefined}
                      className={
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-mono transition-colors cursor-pointer ' +
                        (isActive
                          ? 'bg-[#2D6A4F] text-white'
                          : 'bg-white text-gt-text-muted border border-gt-border-light hover:border-[#2D6A4F] hover:text-[#2D6A4F]')
                      }
                    >
                      {sib.unit_denominator}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <section>
          <h2 className="text-lg font-semibold text-gt-text">Citation</h2>
          <p className="text-sm text-gt-text-muted mt-1">
            Pick a format. Copy-as-value embeds the number plus a short source
            reference for use inside spreadsheets or notes.
          </p>
          <div className="mt-4">
            <EFCitationBlock factor={factor} source={factor.source} />
          </div>
        </section>

        <EFMethodologyExplainer methodology={factor.methodology} />

        {factor.when_to_use && (
          <section className="rounded-2xl bg-[#e8f5e9] border border-[#a5d6a7] shadow-gt-card p-6">
            <h2 className="text-lg font-semibold text-gt-text">When to use</h2>
            <p className="mt-2 text-sm text-gt-text">
              {factor.when_to_use}
            </p>
          </section>
        )}

        {factor.notes && factor.notes.trim().length > 0 && (
          <section className="rounded-2xl bg-white border border-gt-border-light shadow-gt-card p-6">
            <h2 className="text-lg font-semibold text-gt-text">Notes</h2>
            <p className="mt-2 text-sm text-gt-text whitespace-pre-line">
              {factor.notes.trim()}
            </p>
          </section>
        )}

        <EFRelatedFactors factors={related} />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="text-xs text-gt-text-dim">
            Last verified {factor.last_verified_date} by{' '}
            {factor.verifier_initials.join(', ')}
          </div>
          <EFIssueReportButton factorId={factor.id} />
        </div>
      </div>

      <aside className="space-y-6">
        <EFSourceCard source={factor.source} />

        <div className="rounded-2xl bg-white border border-gt-border-light shadow-gt-card p-6 text-sm">
          <h3 className="font-semibold text-gt-text">Key metadata</h3>
          <dl className="mt-3 space-y-2">
            <Meta label="Category" value={factor.category} />
            {factor.sub_category && (
              <Meta label="Sub-category" value={factor.sub_category} />
            )}
            <Meta
              label="Scope"
              value={factor.scope === 0 ? 'Not applicable' : `Scope ${factor.scope}`}
            />
            {factor.scope_3_category !== null && (
              <Meta
                label="Scope 3 category"
                value={`Category ${factor.scope_3_category}`}
              />
            )}
            <Meta
              label="GWP"
              value={`${factor.gwp_assessment ?? 'n/a'} / GWP${factor.gwp_horizon}`}
            />
            <Meta label="Vintage" value={factor.vintage_year} />
            <Meta label="Source reference" value={factor.source_page_ref} />
            {factor.ghg_protocol_clause && (
              <Meta label="GHG Protocol" value={factor.ghg_protocol_clause} />
            )}
          </dl>
        </div>

        {/* GHG Breakdown */}
        {(factor.value_co2 !== null || factor.value_ch4 !== null || factor.value_n2o !== null) && (
          <div className="rounded-2xl bg-white border border-gt-border-light shadow-gt-card p-6">
            <h3 className="font-semibold text-gt-text text-sm">GHG Breakdown</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {factor.value_co2 !== null && factor.value_co2 !== undefined && (
                <div className="rounded-lg bg-gt-pale px-3 py-2 text-center">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-gt-text-dim">CO₂</div>
                  <div className="font-mono text-sm text-gt-text mt-1">{factor.value_co2.toFixed(5)}</div>
                </div>
              )}
              {factor.value_ch4 !== null && factor.value_ch4 !== undefined && (
                <div className="rounded-lg bg-gt-pale px-3 py-2 text-center">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-gt-text-dim">CH₄</div>
                  <div className="font-mono text-sm text-gt-text mt-1">{factor.value_ch4.toFixed(5)}</div>
                </div>
              )}
              {factor.value_n2o !== null && factor.value_n2o !== undefined && (
                <div className="rounded-lg bg-gt-pale px-3 py-2 text-center">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-gt-text-dim">N₂O</div>
                  <div className="font-mono text-sm text-gt-text mt-1">{factor.value_n2o.toFixed(5)}</div>
                </div>
              )}
            </div>
            <div className="text-[10px] text-gt-text-dim mt-2 text-center">
              {factor.unit_numerator}/{factor.unit_denominator}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs uppercase tracking-[0.08em] text-gt-text-dim">{label}</dt>
      <dd className="text-right text-gt-text">{value}</dd>
    </div>
  );
}
