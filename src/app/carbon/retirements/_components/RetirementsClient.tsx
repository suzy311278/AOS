'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Search, TrendingDown, ArrowUpRight, Globe, ExternalLink, ChevronRight } from 'lucide-react';
import {
  CategoryLabel,
  SectionHeading,
  Stat,
} from '@/components/redesign';
import { REGISTRY_LABEL } from '../../market/_components/types';
import type { Registry } from '../../market/_components/types';
import CarbonAuthPrompt from '../../_components/CarbonAuthPrompt';

const ANON_PAGE_LIMIT = 3;

type BeneficiaryRecord = {
  name: string;
  totalRetired: number;
  projectCount: number;
  registries: Registry[];
  methodologies: string[];
  bridge?: string;
};

type LeaderboardPayload = {
  generatedAt: string;
  totalBeneficiaries: number;
  totalRetiredInLeaderboard: number;
  beneficiaries: BeneficiaryRecord[];
};

const REGISTRY_CHIP: Record<Registry, string> = {
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
const REGISTRY_SHORT: Record<Registry, string> = {
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
const BRIDGE_CHIP: Record<string, string> = {
  Toucan: 'bg-emerald-100 text-emerald-900',
  KlimaDAO: 'bg-sky-100 text-sky-900',
  Moss: 'bg-indigo-100 text-indigo-900',
  C3: 'bg-amber-100 text-amber-900',
  Senken: 'bg-violet-100 text-violet-900',
  Flowcarbon: 'bg-rose-100 text-rose-900',
  'On-chain': 'bg-gt-text-dim/20 text-gt-text-muted',
};

const HEX_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

function formatBig(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString('en-US');
}

function displayName(name: string): string {
  if (HEX_ADDRESS.test(name)) return `${name.slice(0, 6)}…${name.slice(-4)}`;
  return name;
}

const PAGE_SIZE = 50;

export default function RetirementsClient() {
  const [data, setData] = useState<LeaderboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const anonymous = authLoaded && !isSignedIn;

  const [search, setSearch] = useState('');
  const [registryFilterRaw, setRegistryFilterRaw] = useState<Registry | ''>('');
  const [methodologyFilterRaw, setMethodologyFilterRaw] = useState<string>('');
  const [page, setPage] = useState(1);
  const [authPromptFor, setAuthPromptFor] =
    useState<'filter' | 'pagination' | 'methodology-drill' | null>(null);

  // Gate filter changes for anonymous visitors. Clearing a filter is
  // always allowed (brings them back toward the open view).
  const registryFilter = registryFilterRaw;
  const methodologyFilter = methodologyFilterRaw;
  const setRegistryFilter = (v: Registry | '') => {
    if (anonymous && v !== '') {
      setAuthPromptFor('filter');
      return;
    }
    setRegistryFilterRaw(v);
  };
  const setMethodologyFilter = (v: string) => {
    if (anonymous && v !== '') {
      setAuthPromptFor('methodology-drill');
      return;
    }
    setMethodologyFilterRaw(v);
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/carbon-market-retirements.json')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: LeaderboardPayload) => {
        if (!cancelled) setData(d);
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [] as BeneficiaryRecord[];
    const lc = search.trim().toLowerCase();
    return data.beneficiaries.filter(b => {
      if (registryFilter && !b.registries.includes(registryFilter)) return false;
      if (methodologyFilter && !b.methodologies.includes(methodologyFilter)) return false;
      if (lc && !b.name.toLowerCase().includes(lc)) return false;
      return true;
    });
  }, [data, search, registryFilter, methodologyFilter]);

  // Unique methodologies across the leaderboard with retirer counts. Sorted
  // by count desc so the most common methodologies surface first in the
  // dropdown.
  const methodologyOptions = useMemo(() => {
    if (!data) return [] as { code: string; retirerCount: number }[];
    const counts = new Map<string, number>();
    for (const b of data.beneficiaries) {
      for (const m of b.methodologies) {
        counts.set(m, (counts.get(m) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([code, retirerCount]) => ({ code, retirerCount }))
      .sort((a, b) => b.retirerCount - a.retirerCount);
  }, [data]);

  useEffect(() => {
    setPage(1);
  }, [search, registryFilter, methodologyFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const effectiveTotalPages = anonymous
    ? Math.min(totalPages, ANON_PAGE_LIMIT)
    : totalPages;
  const safePage = Math.min(page, effectiveTotalPages);
  const pageSlice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function goToPage(p: number) {
    if (anonymous && p > ANON_PAGE_LIMIT) {
      setAuthPromptFor('pagination');
      return;
    }
    setPage(Math.min(Math.max(1, p), totalPages));
  }

  const totalRetired = data?.totalRetiredInLeaderboard ?? 0;
  const uniqueBeneficiaries = data?.totalBeneficiaries ?? 0;

  return (
    <>
      <section className="relative isolate overflow-hidden pt-20 md:pt-24 pb-10 md:pb-12 bg-gt-text-dark">
        <div aria-hidden className="gt-dot-grid absolute inset-0 opacity-60 pointer-events-none" />
        <div
          aria-hidden
          className="gt-ambient-glow-dark absolute -top-32 right-1/4 w-[500px] h-[500px] rounded-full"
        />
        <div className="relative max-w-[1280px] mx-auto px-6 md:px-8">
          <div className="max-w-3xl">
            <CategoryLabel tone="dark">Retirement leaderboard</CategoryLabel>
            <SectionHeading size="section" tone="light" className="mt-5">
              Who actually retired
              <br />
              their carbon credits.
            </SectionHeading>
            <p className="mt-6 text-[15px] text-white/70 leading-relaxed max-w-2xl">
              A single view across every retirement record we have indexed,
              from Verra, Gold Standard, ACR, CAR, and other registries. Cross-reference
              corporate net-zero claims against the public record, or watch who's
              buying into specific methodologies.
            </p>
          </div>
          <div className="mt-10 md:mt-12 grid grid-cols-3 gap-3 sm:gap-5 md:gap-6 max-w-3xl">
            <Stat
              value={formatBig(totalRetired)}
              label="credits retired (top 500)"
              tone="light"
              className="[&>div]:!text-white"
            />
            <Stat
              value={uniqueBeneficiaries.toLocaleString('en-US')}
              label="unique retirers tracked"
              tone="light"
              className="[&>div]:!text-white"
            />
            <Stat
              value={filtered.length.toLocaleString('en-US')}
              label="matching your filters"
              tone="light"
              className="[&>div]:!text-white"
            />
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4 mb-6">
            <div className="relative flex-1 md:max-w-md">
              <Search
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gt-text-dim pointer-events-none"
                strokeWidth={2}
              />
              <input
                type="text"
                placeholder="Search beneficiary (Shell, Microsoft…)"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-[15px] md:text-sm bg-white border border-gt-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-gt-medium/20 focus:border-gt-medium"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gt-text-dim md:flex-row md:items-center md:gap-2 min-w-0">
                Registry
                <select
                  value={registryFilter}
                  onChange={e => setRegistryFilter(e.target.value as Registry | '')}
                  className="w-full sm:w-auto text-[15px] md:text-sm font-medium normal-case tracking-normal bg-white border border-gt-border-light rounded-lg px-3 py-2 md:py-1.5 text-gt-text focus:outline-none focus:ring-2 focus:ring-gt-medium/20 focus:border-gt-medium"
                >
                  <option value="">Any registry</option>
                  {(Object.keys(REGISTRY_LABEL) as Registry[]).map(r => (
                    <option key={r} value={r}>
                      {REGISTRY_LABEL[r]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gt-text-dim md:flex-row md:items-center md:gap-2 min-w-0">
                Methodology
                <select
                  value={methodologyFilter}
                  onChange={e => setMethodologyFilter(e.target.value)}
                  className="w-full sm:w-auto max-w-full text-[15px] md:text-sm font-medium normal-case tracking-normal bg-white border border-gt-border-light rounded-lg px-3 py-2 md:py-1.5 text-gt-text focus:outline-none focus:ring-2 focus:ring-gt-medium/20 focus:border-gt-medium"
                >
                  <option value="">Any methodology</option>
                  {methodologyOptions.map(m => (
                    <option key={m.code} value={m.code}>
                      {m.code} ({m.retirerCount})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {error ? (
            <div className="bg-white border border-gt-border-light rounded-2xl p-12 text-center shadow-gt-card">
              <p className="text-base text-gt-text-muted">Failed to load leaderboard: {error}</p>
            </div>
          ) : !data ? (
            <div className="bg-white border border-gt-border-light rounded-2xl p-12 text-center shadow-gt-card">
              <p className="text-base text-gt-text-muted">Loading leaderboard…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-gt-border-light rounded-2xl p-12 text-center shadow-gt-card">
              <p className="text-base text-gt-text-muted">No retirers match these filters.</p>
            </div>
          ) : (
            <>
              {/* Mobile card list — single column, stacked, touch-friendly */}
              <ul className="md:hidden flex flex-col gap-3">
                {pageSlice.map((b, i) => {
                  const rank = (safePage - 1) * PAGE_SIZE + i + 1;
                  return (
                    <li
                      key={b.name}
                      className="bg-white border border-gt-border-light rounded-2xl shadow-gt-card p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-['JetBrains_Mono'] text-[13px] font-semibold text-gt-text-dim shrink-0 w-8 pt-0.5">
                          #{rank}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-semibold text-gt-text break-words ${HEX_ADDRESS.test(b.name) ? "font-['JetBrains_Mono'] text-[13px]" : 'text-[15px]'}`}
                            >
                              {displayName(b.name)}
                            </span>
                            {b.bridge ? (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${BRIDGE_CHIP[b.bridge] ?? 'bg-gt-text-dim/20 text-gt-text-muted'}`}
                              >
                                via {b.bridge}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1">
                            {b.registries.map(r => (
                              <span
                                key={r}
                                title={REGISTRY_LABEL[r]}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${REGISTRY_CHIP[r]}`}
                              >
                                {REGISTRY_SHORT[r]}
                              </span>
                            ))}
                          </div>

                          {b.methodologies.length ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {b.methodologies.slice(0, 3).map(m => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => setMethodologyFilter(m)}
                                  className="px-1.5 py-0.5 rounded bg-gt-medium/10 text-gt-medium text-[10px] font-['JetBrains_Mono'] font-semibold"
                                >
                                  {m}
                                </button>
                              ))}
                              {b.methodologies.length > 3 ? (
                                <span className="px-1.5 py-0.5 rounded bg-gt-pale text-gt-text-dim text-[10px] font-semibold">
                                  +{b.methodologies.length - 3}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gt-border-light/60 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-gt-text-dim">
                            Retired
                          </div>
                          <div className="mt-0.5 font-['JetBrains_Mono'] text-[15px] font-semibold text-gt-text">
                            {b.totalRetired.toLocaleString('en-US')}
                          </div>
                          <div className="text-[11px] text-gt-text-dim">
                            {b.projectCount.toLocaleString('en-US')}{' '}
                            project{b.projectCount === 1 ? '' : 's'}
                          </div>
                        </div>
                        <Link
                          href={`/carbon/market?q=${encodeURIComponent(b.name)}`}
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-gt-medium hover:text-gt-dark shrink-0"
                        >
                          View projects
                          <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Desktop / tablet table */}
              <div className="hidden md:block bg-white border border-gt-border-light rounded-2xl shadow-gt-card overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="bg-gt-pale/60">
                    <tr>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gt-text-dim w-10">
                        #
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gt-text-dim">
                        Retirer
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gt-text-dim">
                        Registries
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gt-text-dim">
                        Methodologies
                      </th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gt-text-dim">
                        Projects
                      </th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gt-text-dim">
                        Total retired (tCO2e)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageSlice.map((b, i) => {
                      const rank = (safePage - 1) * PAGE_SIZE + i + 1;
                      return (
                        <tr
                          key={b.name}
                          className="border-b border-gt-border-light/60 hover:bg-gt-pale/40 transition-colors"
                        >
                          <td className="px-4 py-3 align-top font-['JetBrains_Mono'] text-[12px] text-gt-text-dim">
                            {rank}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                title={b.name}
                                className={`font-semibold text-gt-text ${HEX_ADDRESS.test(b.name) ? "font-['JetBrains_Mono'] text-[12px]" : ''}`}
                              >
                                {displayName(b.name)}
                              </span>
                              {b.bridge ? (
                                <span
                                  title={`Retirements routed through ${b.bridge}`}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${BRIDGE_CHIP[b.bridge] ?? 'bg-gt-text-dim/20 text-gt-text-muted'}`}
                                >
                                  via {b.bridge}
                                </span>
                              ) : null}
                            </div>
                            <Link
                              href={`/carbon/market?q=${encodeURIComponent(b.name)}`}
                              className="mt-1 inline-flex items-center gap-1 text-[11px] text-gt-text-dim hover:text-gt-medium"
                            >
                              View their projects
                              <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
                            </Link>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-wrap gap-1">
                              {b.registries.map(r => (
                                <span
                                  key={r}
                                  title={REGISTRY_LABEL[r]}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${REGISTRY_CHIP[r]}`}
                                >
                                  {REGISTRY_SHORT[r]}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            {b.methodologies.length === 0 ? (
                              <span className="text-[11px] text-gt-text-dim">—</span>
                            ) : (
                              <div
                                className="flex flex-wrap gap-1 max-w-[260px]"
                                title={b.methodologies.join(', ')}
                              >
                                {b.methodologies.slice(0, 3).map(m => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMethodologyFilter(m)}
                                    title={`Filter to retirers using ${m}`}
                                    className="px-1.5 py-0.5 rounded bg-gt-medium/10 text-gt-medium text-[10px] font-['JetBrains_Mono'] font-semibold hover:bg-gt-medium/20 transition-colors"
                                  >
                                    {m}
                                  </button>
                                ))}
                                {b.methodologies.length > 3 ? (
                                  <span className="px-1.5 py-0.5 rounded bg-gt-pale text-gt-text-dim text-[10px] font-semibold">
                                    +{b.methodologies.length - 3}
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top text-right font-['JetBrains_Mono'] text-[12px] text-gt-text">
                            {b.projectCount.toLocaleString('en-US')}
                          </td>
                          <td className="px-4 py-3 align-top text-right font-['JetBrains_Mono'] text-[12px] font-semibold text-gt-text">
                            {b.totalRetired.toLocaleString('en-US')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>

              {anonymous &&
              safePage === ANON_PAGE_LIMIT &&
              totalPages > ANON_PAGE_LIMIT ? (
                <div className="mt-6 p-4 bg-gt-pale/80 border border-gt-border-light rounded-xl flex items-center justify-between gap-4 flex-wrap">
                  <p className="text-sm text-gt-text-muted">
                    <span className="font-semibold text-gt-text">Sign up free</span> to
                    page through the full leaderboard ({filtered.length.toLocaleString('en-US')}{' '}
                    retirers) and drill in by methodology or registry.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAuthPromptFor('pagination')}
                    className="inline-flex items-center gap-1 px-4 py-1.5 text-sm font-semibold bg-gt-medium text-white rounded-lg hover:bg-gt-dark"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              ) : null}

              {totalPages > 1 ? (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-xs text-gt-text-dim font-['JetBrains_Mono']">
                    Page {safePage} of {totalPages} · Showing{' '}
                    {((safePage - 1) * PAGE_SIZE + 1).toLocaleString('en-US')}–
                    {Math.min(safePage * PAGE_SIZE, filtered.length).toLocaleString('en-US')} of{' '}
                    {filtered.length.toLocaleString('en-US')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => goToPage(safePage - 1)}
                      disabled={safePage <= 1}
                      className="px-3 py-1.5 text-sm font-semibold bg-white border border-gt-border-light rounded-lg hover:border-gt-medium/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => goToPage(safePage + 1)}
                      disabled={safePage >= totalPages}
                      className="px-3 py-1.5 text-sm font-semibold bg-white border border-gt-border-light rounded-lg hover:border-gt-medium/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}

          <div className="mt-12 p-6 bg-gt-pale/60 border border-gt-border-light rounded-2xl">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-gt-text-dim mb-2">
              How to read this
            </h2>
            <ul className="text-sm text-gt-text-muted space-y-1.5 leading-relaxed">
              <li>
                <strong className="text-gt-text">Total retired</strong> is the sum of all
                credit batches where this beneficiary appears in the "Retired on Behalf of" or
                "Account Holder" field on the source registry.
              </li>
              <li>
                <strong className="text-gt-text">Projects</strong> counts the number of distinct
                projects this beneficiary retired credits from.
              </li>
              <li>
                Hex-address rows (<code className="font-['JetBrains_Mono']">0x…</code>) are
                on-chain retirements routed via Toucan, KlimaDAO, Moss, or C3. The bridge tag
                identifies the protocol when detectable.
              </li>
              <li>
                Leaderboard includes the top 500 retirers across all indexed registries
                (Verra VCS, ACR, CAR, CAR-compliance). Additional registry credit datasets
                are being added.
              </li>
              <li>
                Click <em>View their projects</em> to see every project a beneficiary retired
                from in the main catalogue.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <CarbonAuthPrompt
        open={authPromptFor !== null}
        trigger={authPromptFor ?? 'filter'}
        onClose={() => setAuthPromptFor(null)}
      />
    </>
  );
}
