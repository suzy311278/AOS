'use client';

import { Fragment, useEffect, useState } from 'react';
import { ExternalLink, GraduationCap, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ProjectRecord, REGISTRY_LABEL, COURSE_METHODOLOGIES } from './types';
import type { Sort, SortKey } from './CarbonMarketClient';

const REGISTRY_CHIP: Record<ProjectRecord['registry'], string> = {
  verra_vcs: 'bg-gt-leaf/15 text-gt-medium',
  verra_ccb: 'bg-gt-forest/15 text-gt-medium',
  verra_pwrp: 'bg-cyan-100 text-cyan-900',
  verra_jnr: 'bg-emerald-100 text-emerald-900',
  verra_fcpf: 'bg-teal-100 text-teal-900',
  goldstandard: 'bg-amber-100 text-amber-900',
  acr: 'bg-blue-100 text-blue-900',
  car: 'bg-rose-100 text-rose-900',
  car_compliance: 'bg-orange-100 text-orange-900',
  art: 'bg-violet-100 text-violet-900',
  gcc: 'bg-fuchsia-100 text-fuchsia-900',
};

const REGISTRY_SHORT: Record<ProjectRecord['registry'], string> = {
  verra_vcs: 'VCS',
  verra_ccb: 'CCB',
  verra_pwrp: 'PWRP',
  verra_jnr: 'JNR',
  verra_fcpf: 'FCPF',
  goldstandard: 'GS',
  acr: 'ACR',
  car: 'CAR',
  car_compliance: 'CAR-C',
  art: 'ART',
  gcc: 'GCC',
};

const STATUS_DOT: Record<ProjectRecord['statusBucket'], string> = {
  Registered: 'bg-gt-leaf',
  Validation: 'bg-sky-500',
  Development: 'bg-violet-500',
  Inactive: 'bg-red-500',
  Other: 'bg-gt-text-dim',
};

const STATUS_TEXT: Record<ProjectRecord['statusBucket'], string> = {
  Registered: 'text-gt-text-muted',
  Validation: 'text-gt-text-muted',
  Development: 'text-gt-text-muted',
  Inactive: 'text-red-600',
  Other: 'text-gt-text-muted',
};

function formatReductions(n: number | null, unit: ProjectRecord['estUnit']): string {
  if (n == null) return '—';
  const suffix = unit === 'tonnes_plastic' ? 't plastic' : 'tCO2e';
  return `${n.toLocaleString('en-US')} ${suffix}`;
}

function th(extra = ''): string {
  return `text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gt-text-dim whitespace-nowrap ${extra}`;
}

type DescriptionMap = Record<string, string>;

type CreditsSummary = {
  totalIssued: number;
  totalRetired: number;
  totalCancelled: number;
  outstanding: number;
  topBeneficiaries: { name: string; quantity: number; bridge?: string }[];
  bridges?: { label: string; quantity: number }[];
  lastRetirementDate: string | null;
  vintageYearStart: number | null;
  vintageYearEnd: number | null;
  batchCount: number;
};
type CreditsMap = Record<string, CreditsSummary>;

const HEX_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
function formatBeneficiaryName(raw: string): string {
  if (HEX_ADDRESS.test(raw)) return `${raw.slice(0, 6)}…${raw.slice(-4)}`;
  return raw;
}

const BRIDGE_CHIP: Record<string, string> = {
  Toucan: 'bg-emerald-100 text-emerald-900',
  KlimaDAO: 'bg-sky-100 text-sky-900',
  Moss: 'bg-indigo-100 text-indigo-900',
  C3: 'bg-amber-100 text-amber-900',
  Senken: 'bg-violet-100 text-violet-900',
  Flowcarbon: 'bg-rose-100 text-rose-900',
  'On-chain': 'bg-gt-text-dim/20 text-gt-text-muted',
};

let descCache: Promise<DescriptionMap> | null = null;
function loadDescriptions(): Promise<DescriptionMap> {
  if (!descCache) {
    descCache = fetch('/carbon-market-descriptions.json')
      .then(r => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return descCache;
}

let creditsCache: Promise<CreditsMap> | null = null;
function loadCredits(): Promise<CreditsMap> {
  if (!creditsCache) {
    creditsCache = fetch('/carbon-market-credits-summary.json')
      .then(r => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return creditsCache;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

interface Props {
  projects: ProjectRecord[];
  sort: Sort;
  onSort: (key: SortKey) => void;
}

function SortButton({
  label,
  sortKey,
  align,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  align?: 'left' | 'right';
  sort: Sort;
  onSort: (key: SortKey) => void;
}) {
  const active = sort.key === sortKey;
  const Icon = active ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : null;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] hover:text-gt-medium transition-colors ${active ? 'text-gt-medium' : 'text-gt-text-dim'} ${align === 'right' ? 'flex-row-reverse' : ''}`}
    >
      {label}
      {Icon ? <Icon className="w-3 h-3" strokeWidth={2.2} /> : null}
    </button>
  );
}

export default function ProjectTable({ projects, sort, onSort }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [descriptions, setDescriptions] = useState<DescriptionMap | null>(null);
  const [credits, setCredits] = useState<CreditsMap | null>(null);

  useEffect(() => {
    if (expanded.size > 0 && !descriptions) {
      loadDescriptions().then(setDescriptions);
    }
    if (expanded.size > 0 && !credits) {
      loadCredits().then(setCredits);
    }
  }, [expanded, descriptions]);

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="md:hidden flex flex-col gap-3">
        {projects.map(p => {
          const courseSlug = p.methodology ? COURSE_METHODOLOGIES[p.methodology] : null;
          // Most registries now have descriptions and/or credit summaries
          // available; let any row expand and show whatever is on file.
          const hasDescription = true;
          const isOpen = expanded.has(p.id);
          const desc = hasDescription && descriptions ? descriptions[p.id] : null;
          return (
            <article
              key={p.id}
              className="bg-white border border-gt-border-light rounded-2xl shadow-gt-card p-4"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${REGISTRY_CHIP[p.registry]}`}
                >
                  {REGISTRY_SHORT[p.registry]}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-[11px] ${STATUS_TEXT[p.statusBucket]}`}>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.statusBucket]}`}
                    aria-hidden
                  />
                  {p.statusBucket}
                </span>
                {p.registrationDate ? (
                  <span className="ml-auto text-[11px] font-['JetBrains_Mono'] text-gt-text-dim">
                    {p.registrationDate.slice(0, 7)}
                  </span>
                ) : null}
              </div>

              <a
                href={p.registryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-2 inline-flex items-start gap-1 font-semibold text-[15px] text-gt-text leading-snug hover:text-gt-medium"
              >
                <span>{p.name}</span>
                <ExternalLink
                  className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gt-text-dim group-hover:text-gt-medium"
                  strokeWidth={2}
                />
              </a>
              {p.developer ? (
                <p className="mt-0.5 text-[12px] text-gt-text-dim line-clamp-1">{p.developer}</p>
              ) : null}

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-gt-text-dim">
                    Methodology
                  </div>
                  <div className="mt-0.5 font-['JetBrains_Mono'] text-gt-text flex items-center gap-1.5 flex-wrap">
                    {p.methodology ?? '—'}
                    {courseSlug ? (
                      <a
                        href={`/courses/${courseSlug}`}
                        className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-gt-medium"
                      >
                        <GraduationCap className="w-3 h-3" strokeWidth={2.2} />
                        Course
                      </a>
                    ) : null}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-gt-text-dim">
                    Country
                  </div>
                  <div className="mt-0.5 text-gt-text truncate">{p.country ?? '—'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-gt-text-dim">
                    Est. annual
                  </div>
                  <div className="mt-0.5 font-['JetBrains_Mono'] text-gt-text">
                    {formatReductions(p.estAnnualReductions, p.estUnit)}
                  </div>
                </div>
              </div>

              {(p.additionalCertifications.length || p.corsiaEligible) ? (
                <div className="flex flex-wrap gap-1 mt-3">
                  {p.corsiaEligible ? (
                    <span
                      title={
                        p.corsiaConditional
                          ? 'Conditionally eligible under CORSIA'
                          : `CORSIA eligible${p.corsiaPhases?.length ? ' (' + p.corsiaPhases.join(', ') + ' phases)' : ''}`
                      }
                      className="px-1.5 py-0.5 rounded bg-gt-accent/15 text-gt-accent text-[10px] font-semibold"
                    >
                      CORSIA eligible
                    </span>
                  ) : null}
                  {p.additionalCertifications.slice(0, 3).map(c => (
                    <span
                      key={c}
                      className="px-1.5 py-0.5 rounded bg-gt-medium/10 text-gt-medium text-[10px] font-semibold"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : null}

              {hasDescription ? (
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em] text-gt-medium"
                >
                  {isOpen ? 'Hide summary' : 'Project summary'}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    strokeWidth={2.2}
                  />
                </button>
              ) : null}

              {isOpen ? (
                <div className="mt-3 pt-3 border-t border-gt-border-light space-y-4">
                  {descriptions === null ? (
                    <p className="text-xs text-gt-text-dim">Loading description…</p>
                  ) : desc ? (
                    <p className="text-[13px] leading-relaxed text-gt-text-muted whitespace-pre-line">
                      {desc.length > 500 ? `${desc.slice(0, 500).trimEnd()}…` : desc}
                    </p>
                  ) : null}

                  <CreditsBlock id={p.id} credits={credits} />

                  {!desc && descriptions !== null && !credits?.[p.id] ? (
                    <p className="text-xs text-gt-text-dim">No additional details on file.</p>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gt-border-light rounded-2xl shadow-gt-card overflow-hidden">
      <table className="w-full text-sm table-fixed">
        <colgroup>
          <col className="w-[38%]" />
          <col className="w-[9%]" />
          <col className="w-[12%]" />
          <col className="w-[13%]" />
          <col className="w-[11%]" />
          <col className="w-[11%]" />
          <col className="w-[6%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-gt-border-light bg-gt-pale">
            <th className={th()}>
              <SortButton label="Project" sortKey="name" sort={sort} onSort={onSort} />
            </th>
            <th className={th()}>Registry</th>
            <th className={th()}>Methodology</th>
            <th className={th()}>Country</th>
            <th className={th()}>Status</th>
            <th className={th('!text-right')}>
              <SortButton
                label="Est. annual"
                sortKey="reductions"
                align="right"
                sort={sort}
                onSort={onSort}
              />
            </th>
            <th className={th('!text-right')}>
              <SortButton
                label="Reg."
                sortKey="date"
                align="right"
                sort={sort}
                onSort={onSort}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map(p => {
            const courseSlug = p.methodology ? COURSE_METHODOLOGIES[p.methodology] : null;
            // Most registries now have descriptions and/or credit summaries
          // available; let any row expand and show whatever is on file.
          const hasDescription = true;
            const isOpen = expanded.has(p.id);
            const desc = hasDescription && descriptions ? descriptions[p.id] : null;

            return (
              <Fragment key={p.id}>
                <tr
                  onClick={() => hasDescription && toggle(p.id)}
                  className={`border-b border-gt-border-light/60 transition-colors ${hasDescription ? 'cursor-pointer hover:bg-gt-pale/70' : ''} ${isOpen ? 'bg-gt-pale/60' : ''}`}
                >
                  <td className="px-3 py-3 align-top">
                    <div className="flex items-start gap-2">
                      {hasDescription ? (
                        <ChevronDown
                          className={`w-3.5 h-3.5 mt-1 shrink-0 text-gt-text-dim transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          strokeWidth={2.2}
                        />
                      ) : (
                        <span className="w-3.5 shrink-0" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <a
                          href={p.registryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="group inline-flex items-start gap-1 font-semibold text-gt-text leading-snug hover:text-gt-medium"
                        >
                          <span className="line-clamp-2">{p.name}</span>
                          <ExternalLink
                            className="w-3 h-3 mt-0.5 shrink-0 text-gt-text-dim group-hover:text-gt-medium"
                            strokeWidth={2}
                          />
                        </a>
                        {p.developer ? (
                          <div className="text-[11px] text-gt-text-dim line-clamp-1 mt-0.5">
                            {p.developer}
                          </div>
                        ) : null}
                        {(p.additionalCertifications.length || p.corsiaEligible) ? (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {p.corsiaEligible ? (
                              <span
                                title={
                                  p.corsiaConditional
                                    ? 'Conditionally eligible under CORSIA'
                                    : `CORSIA eligible${p.corsiaPhases?.length ? ' (' + p.corsiaPhases.join(', ') + ' phases)' : ''}`
                                }
                                className="px-1.5 py-0.5 rounded bg-gt-accent/15 text-gt-accent text-[10px] font-semibold"
                              >
                                CORSIA eligible
                              </span>
                            ) : null}
                            {p.additionalCertifications.slice(0, 3).map(c => (
                              <span
                                key={c}
                                className="px-1.5 py-0.5 rounded bg-gt-medium/10 text-gt-medium text-[10px] font-semibold"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${REGISTRY_CHIP[p.registry]}`}
                      title={REGISTRY_LABEL[p.registry]}
                    >
                      {REGISTRY_SHORT[p.registry]}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-top font-['JetBrains_Mono'] text-[12px] text-gt-text">
                    {p.methodology ? (
                      <div className="flex flex-col gap-1 items-start">
                        <span className="truncate max-w-full">{p.methodology}</span>
                        {courseSlug ? (
                          <a
                            href={`/courses/${courseSlug}`}
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-gt-medium hover:text-gt-dark"
                          >
                            <GraduationCap className="w-3 h-3" strokeWidth={2.2} />
                            Course
                          </a>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-gt-text-dim">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top text-[13px] text-gt-text">
                    <div className="truncate">{p.country ?? '—'}</div>
                    {p.region ? (
                      <div className="text-[11px] text-gt-text-dim truncate">{p.region}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <span className={`inline-flex items-center gap-1.5 text-[12px] ${STATUS_TEXT[p.statusBucket]}`}>
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[p.statusBucket]}`}
                        aria-hidden
                      />
                      {p.statusBucket}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-top text-right font-['JetBrains_Mono'] text-[11px] text-gt-text whitespace-nowrap">
                    {p.estAnnualReductions != null
                      ? formatReductions(p.estAnnualReductions, p.estUnit)
                      : p.cumulativeCreditsRegistered != null
                        ? (
                            <span
                              title="Total credits registered to date (lifetime cumulative). APX registries do not publish a forward annual estimate."
                              className="text-gt-text-dim"
                            >
                              {p.cumulativeCreditsRegistered.toLocaleString()}{' '}
                              <span className="text-[9px] font-normal">lifetime</span>
                            </span>
                          )
                        : '—'}
                  </td>
                  <td className="px-3 py-3 align-top text-right font-['JetBrains_Mono'] text-[11px] text-gt-text-dim whitespace-nowrap">
                    {p.registrationDate ? p.registrationDate.slice(0, 7) : '—'}
                  </td>
                </tr>
                {isOpen ? (
                  <tr className="border-b border-gt-border-light/60 bg-gt-pale/40">
                    <td colSpan={7} className="px-8 py-5">
                      <div className="max-w-3xl space-y-5">
                        {descriptions === null ? (
                          <p className="text-xs text-gt-text-dim">Loading details…</p>
                        ) : desc ? (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-gt-text-dim">
                              Project summary
                            </span>
                            <p className="mt-2 text-[13px] leading-relaxed text-gt-text-muted whitespace-pre-line">
                              {desc.length > 500 ? `${desc.slice(0, 500).trimEnd()}…` : desc}
                            </p>
                          </div>
                        ) : null}

                        <CreditsBlock id={p.id} credits={credits} />

                        <a
                          href={p.registryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-gt-medium hover:text-gt-dark"
                        >
                          View full project on {REGISTRY_LABEL[p.registry]}
                          <ExternalLink className="w-3 h-3" strokeWidth={2} />
                        </a>

                        {!desc && descriptions !== null && !credits?.[p.id] ? (
                          <p className="text-xs text-gt-text-dim">
                            No additional details on file for this project.
                          </p>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}

/**
 * CreditsBlock — retirement & issuance summary shown inline in the
 * project detail dropdown. Renders only when we have credit data for
 * the project (currently VCS only; other registries can be wired as
 * their credit datasets land).
 */
function CreditsBlock({ id, credits }: { id: string; credits: CreditsMap | null }) {
  if (!credits) return null;
  const s = credits[id];
  if (!s) return null;
  const vintageRange =
    s.vintageYearStart && s.vintageYearEnd
      ? s.vintageYearStart === s.vintageYearEnd
        ? String(s.vintageYearStart)
        : `${s.vintageYearStart}–${s.vintageYearEnd}`
      : null;
  return (
    <div>
      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-gt-text-dim">
        Credits & retirements
      </span>
      <dl className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wider text-gt-text-dim">
            Issued
          </dt>
          <dd className="mt-0.5 font-['JetBrains_Mono'] text-[13px] text-gt-text">
            {fmtNum(s.totalIssued)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wider text-gt-text-dim">
            Retired
          </dt>
          <dd className="mt-0.5 font-['JetBrains_Mono'] text-[13px] text-gt-text">
            {fmtNum(s.totalRetired)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wider text-gt-text-dim">
            Outstanding
          </dt>
          <dd className="mt-0.5 font-['JetBrains_Mono'] text-[13px] text-gt-medium font-semibold">
            {fmtNum(s.outstanding)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wider text-gt-text-dim">
            Vintages
          </dt>
          <dd className="mt-0.5 font-['JetBrains_Mono'] text-[13px] text-gt-text">
            {vintageRange ?? '—'}
          </dd>
        </div>
      </dl>
      {s.topBeneficiaries.length ? (
        <div className="mt-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gt-text-dim">
            Top retirement beneficiaries
          </span>
          <ul className="mt-1 space-y-0.5">
            {s.topBeneficiaries.slice(0, 5).map(b => (
              <li
                key={b.name}
                className="flex items-baseline justify-between gap-3 text-[12px]"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    title={b.name}
                    className={`truncate text-gt-text ${HEX_ADDRESS.test(b.name) ? "font-['JetBrains_Mono']" : ''}`}
                  >
                    {formatBeneficiaryName(b.name)}
                  </span>
                  {b.bridge ? (
                    <span
                      title={`Blockchain retirement via ${b.bridge}`}
                      className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${BRIDGE_CHIP[b.bridge] ?? 'bg-gt-text-dim/20 text-gt-text-muted'}`}
                    >
                      via {b.bridge}
                    </span>
                  ) : null}
                </span>
                <span className="font-['JetBrains_Mono'] text-gt-text-dim shrink-0">
                  {fmtNum(b.quantity)}
                </span>
              </li>
            ))}
          </ul>
          {s.bridges && s.bridges.length ? (
            <p className="mt-2 text-[11px] text-gt-text-dim">
              On-chain rollup:{' '}
              {s.bridges.map((b, i) => (
                <span key={b.label}>
                  {i > 0 ? ' · ' : ''}
                  <span className="font-semibold text-gt-text-muted">{b.label}</span>{' '}
                  <span className="font-['JetBrains_Mono']">{fmtNum(b.quantity)}</span>
                </span>
              ))}
            </p>
          ) : null}
        </div>
      ) : null}
      {s.lastRetirementDate ? (
        <p className="mt-3 text-[11px] text-gt-text-dim">
          Last retirement recorded {s.lastRetirementDate.slice(0, 10)} · {s.batchCount.toLocaleString()} credit batch{s.batchCount !== 1 ? 'es' : ''} on file.
        </p>
      ) : null}
    </div>
  );
}
