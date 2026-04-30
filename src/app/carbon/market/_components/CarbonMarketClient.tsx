'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { SlidersHorizontal, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  CategoryLabel,
  SectionHeading,
  Stat,
  LightSection,
} from '@/components/redesign';
import ProjectTable from './ProjectTable';
import FilterSidebar, { FilterState } from './FilterSidebar';
import FilterDrawer from './FilterDrawer';
import type { CarbonMarketIndex, ProjectRecord, Registry, StatusBucket } from './types';
import CarbonAuthPrompt from '../../_components/CarbonAuthPrompt';
import RetirementsBanner from '../../_components/RetirementsBanner';

const ANON_PAGE_LIMIT = 3;
const EMPTY_FILTERS: FilterState = {
  registries: [],
  methodologies: [],
  countries: [],
  statuses: [],
  certifications: [],
  corsia: 'any',
};
function hasActiveFilters(s: FilterState): boolean {
  return (
    s.registries.length > 0 ||
    s.methodologies.length > 0 ||
    s.countries.length > 0 ||
    s.statuses.length > 0 ||
    s.certifications.length > 0 ||
    (s.corsia && s.corsia !== 'any') === true
  );
}

const PAGE_SIZE = 25;

export type SortKey = 'date' | 'reductions' | 'name';
export type SortDir = 'asc' | 'desc';
export interface Sort {
  key: SortKey;
  dir: SortDir;
}

const DEFAULT_SORT: Sort = { key: 'date', dir: 'desc' };

function formatBig(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString('en-US');
}

function parseUrlState(sp: URLSearchParams): FilterState {
  const get = (k: string) => (sp.get(k) ? sp.get(k)!.split(',').filter(Boolean) : []);
  const corsia = sp.get('corsia');
  return {
    registries: get('registry') as Registry[],
    methodologies: get('methodology'),
    countries: get('country'),
    statuses: get('status') as StatusBucket[],
    certifications: get('cert'),
    corsia: corsia === 'eligible' || corsia === 'ineligible' ? corsia : 'any',
  };
}

function parseSort(raw: string | null): Sort {
  if (!raw) return DEFAULT_SORT;
  const [key, dir] = raw.split('-') as [SortKey, SortDir];
  if (!['date', 'reductions', 'name'].includes(key)) return DEFAULT_SORT;
  return { key, dir: dir === 'asc' ? 'asc' : 'desc' };
}

function stateToQuery(s: FilterState, search: string, sort: Sort, page: number): string {
  const p = new URLSearchParams();
  if (s.registries.length) p.set('registry', s.registries.join(','));
  if (s.methodologies.length) p.set('methodology', s.methodologies.join(','));
  if (s.countries.length) p.set('country', s.countries.join(','));
  if (s.statuses.length) p.set('status', s.statuses.join(','));
  if (s.certifications.length) p.set('cert', s.certifications.join(','));
  if (s.corsia && s.corsia !== 'any') p.set('corsia', s.corsia);
  if (search) p.set('q', search);
  if (sort.key !== DEFAULT_SORT.key || sort.dir !== DEFAULT_SORT.dir) {
    p.set('sort', `${sort.key}-${sort.dir}`);
  }
  if (page > 1) p.set('page', String(page));
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

export default function CarbonMarketClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();

  const [index, setIndex] = useState<CarbonMarketIndex | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filtersRaw, setFiltersRaw] = useState<FilterState>(() => parseUrlState(searchParams));
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [sort, setSort] = useState<Sort>(() => parseSort(searchParams.get('sort')));
  const [page, setPage] = useState<number>(() => {
    const p = parseInt(searchParams.get('page') ?? '1', 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authPromptFor, setAuthPromptFor] =
    useState<'filter' | 'pagination' | null>(null);

  // Anonymous filter gate: if not signed in, block filter changes, but
  // clearing filters (going back to open view) is always allowed.
  const anonymous = authLoaded && !isSignedIn;
  const filters = filtersRaw;
  const setFilters = (next: FilterState) => {
    const goingToActive = hasActiveFilters(next);
    if (anonymous && goingToActive) {
      setAuthPromptFor('filter');
      return;
    }
    setFiltersRaw(next);
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/carbon-market-index.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: CarbonMarketIndex) => {
        if (!cancelled) setIndex(data);
      })
      .catch(err => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const next = stateToQuery(filters, search, sort, page);
    const current = window.location.search;
    if (next !== current) {
      router.replace(`/carbon/market${next}`, { scroll: false });
    }
  }, [filters, search, sort, page, router]);

  // Reset to page 1 whenever the filter universe changes.
  useEffect(() => {
    setPage(1);
  }, [filters, search, sort]);

  const filtered = useMemo(() => {
    if (!index) return [] as ProjectRecord[];
    const lc = search.trim().toLowerCase();
    const out: ProjectRecord[] = [];
    for (const p of index.projects) {
      if (filters.registries.length && !filters.registries.includes(p.registry)) continue;
      if (filters.methodologies.length) {
        if (!p.methodology || !filters.methodologies.includes(p.methodology)) continue;
      }
      if (filters.countries.length) {
        if (!p.country || !filters.countries.includes(p.country)) continue;
      }
      if (filters.statuses.length && !filters.statuses.includes(p.statusBucket)) continue;
      if (filters.certifications.length) {
        const has = filters.certifications.some(c => p.additionalCertifications.includes(c));
        if (!has) continue;
      }
      if (filters.corsia === 'eligible' && !p.corsiaEligible) continue;
      if (filters.corsia === 'ineligible' && p.corsiaEligible) continue;
      if (lc) {
        const hay = `${p.name} ${p.developer ?? ''} ${p.methodology ?? ''} ${p.country ?? ''}`
          .toLowerCase();
        if (!hay.includes(lc)) continue;
      }
      out.push(p);
    }

    const mul = sort.dir === 'asc' ? 1 : -1;
    if (sort.key === 'reductions') {
      out.sort(
        (a, b) => ((a.estAnnualReductions ?? 0) - (b.estAnnualReductions ?? 0)) * mul,
      );
    } else if (sort.key === 'name') {
      out.sort((a, b) => a.name.localeCompare(b.name) * mul);
    } else {
      out.sort((a, b) => {
        if (!a.registrationDate && !b.registrationDate) return 0;
        if (!a.registrationDate) return 1;
        if (!b.registrationDate) return -1;
        return a.registrationDate.localeCompare(b.registrationDate) * mul;
      });
    }
    return out;
  }, [index, filters, search, sort]);

  const facets = index?.facets ?? {
    registry: {},
    methodology: {},
    country: {},
    statusBucket: {},
  };
  const totals = index?.totals ?? {
    projects: 12234,
    vcusIssued: 1790870472,
    vcusRetired: 1169554561,
    bufferPool: 73790255,
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Anonymous users can walk up to ANON_PAGE_LIMIT pages; further pagination
  // triggers the auth prompt. Signed-in users are unrestricted.
  const effectiveTotalPages = anonymous
    ? Math.min(totalPages, ANON_PAGE_LIMIT)
    : totalPages;
  const safePage = Math.min(page, effectiveTotalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageSlice = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  function onHeaderSort(key: SortKey) {
    setSort(prev => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: key === 'name' ? 'asc' : 'desc' };
    });
  }

  function goToPage(p: number) {
    // Anonymous users get blocked trying to navigate past the free limit;
    // a clamp would be confusing, so instead we surface the auth prompt
    // and keep them on their current page.
    if (anonymous && p > ANON_PAGE_LIMIT) {
      setAuthPromptFor('pagination');
      return;
    }
    const target = Math.min(Math.max(1, p), totalPages);
    setPage(target);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <>
      <section className="relative isolate overflow-hidden pt-20 md:pt-24 pb-10 md:pb-12 bg-gt-text-dark">
        <div aria-hidden className="gt-dot-grid absolute inset-0 opacity-60 pointer-events-none" />
        <div
          aria-hidden
          className="gt-ambient-glow-dark absolute -top-32 right-1/4 w-[500px] h-[500px] rounded-full"
        />
        <div
          aria-hidden
          className="gt-ambient-glow-dark absolute -bottom-32 left-1/4 w-[500px] h-[500px] rounded-full opacity-60"
        />

        <div className="relative max-w-[1280px] mx-auto px-6 md:px-8">
          <div className="max-w-3xl">
            <CategoryLabel tone="dark">Carbon Market Intelligence</CategoryLabel>
            <SectionHeading size="section" tone="light" className="mt-5">
              Global carbon market,
              <br />
              made traceable.
            </SectionHeading>
            <p className="mt-6 text-[15px] text-white/70 leading-relaxed max-w-2xl">
              The work you used to do with five browser tabs, one search box away.{' '}
              {totals.projects.toLocaleString('en-US')} projects across{' '}
              {totals.registries ?? 11} global carbon registries, with retirement
              beneficiaries, vintage windows, and CORSIA eligibility surfaced inline.
            </p>
          </div>

          <div className="mt-10 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 max-w-4xl">
            <Stat
              value={formatBig(totals.creditsIssued ?? totals.vcusIssued)}
              label="credits issued"
              tone="light"
              className="[&>div]:!text-white"
            />
            <Stat
              value={formatBig(totals.creditsRetired ?? totals.vcusRetired)}
              label="credits retired"
              tone="light"
              className="[&>div]:!text-white"
            />
            <Stat
              value={totals.projects.toLocaleString('en-US')}
              label="projects indexed"
              tone="light"
              className="[&>div]:!text-white"
            />
            <Stat
              value={
                totals.uniqueBeneficiaries
                  ? totals.uniqueBeneficiaries.toLocaleString('en-US')
                  : formatBig(totals.bufferPool)
              }
              label={totals.uniqueBeneficiaries ? 'corporate retirers tracked' : 'buffer pool'}
              tone="light"
              className="[&>div]:!text-white"
            />
          </div>
        </div>
      </section>

      <RetirementsBanner
        totalRetirers={index?.totals.uniqueBeneficiaries}
        totalRetired={index?.totals.creditsRetired ?? index?.totals.vcusRetired}
      />

      <LightSection variant="pale" padding="lg" maxWidth="1440" className="!pt-12 !pb-20">
        <div className="flex flex-col lg:flex-row gap-10">
          <aside className="hidden lg:block w-[240px] shrink-0">
            <div className="sticky top-24">
              <FilterSidebar facets={facets} state={filters} setState={setFilters} />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gt-text-dim"
                    strokeWidth={2}
                  />
                  <input
                    type="text"
                    placeholder="Search projects, developers, methodologies"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gt-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-gt-medium/20 focus:border-gt-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-white border border-gt-border-light rounded-lg hover:border-gt-medium/40"
                >
                  <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
                  Filters
                </button>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 flex-wrap">
                <span className="text-sm text-gt-text-muted font-['JetBrains_Mono']">
                  {filtered.length.toLocaleString('en-US')} projects
                </span>
                <label className="inline-flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-[0.16em] text-gt-text-dim">
                  Sort
                  <select
                    value={`${sort.key}-${sort.dir}`}
                    onChange={e => {
                      const [k, d] = e.target.value.split('-') as [SortKey, SortDir];
                      setSort({ key: k, dir: d });
                    }}
                    className="text-sm font-medium normal-case tracking-normal bg-white border border-gt-border-light rounded-lg px-3 py-1.5 text-gt-text focus:outline-none focus:ring-2 focus:ring-gt-medium/20 focus:border-gt-medium"
                  >
                    <option value="date-desc">Most recent registration</option>
                    <option value="date-asc">Oldest registration</option>
                    <option value="reductions-desc">Largest annual credits</option>
                    <option value="reductions-asc">Smallest annual credits</option>
                    <option value="name-asc">Name A to Z</option>
                    <option value="name-desc">Name Z to A</option>
                  </select>
                </label>
              </div>
            </div>

            <ActiveFilterPills
              filters={filters}
              setFilters={setFilters}
              search={search}
              setSearch={setSearch}
            />

            {!index ? (
              <div className="bg-white border border-gt-border-light rounded-2xl p-12 text-center shadow-gt-card">
                <p className="text-base text-gt-text-muted">
                  {loadError ? `Failed to load index: ${loadError}` : 'Loading project index…'}
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-gt-border-light rounded-2xl p-12 text-center shadow-gt-card">
                <p className="text-base text-gt-text-muted">
                  No projects match these filters.
                </p>
              </div>
            ) : (
              <>
                <ProjectTable projects={pageSlice} sort={sort} onSort={onHeaderSort} />

                {anonymous &&
                safePage === ANON_PAGE_LIMIT &&
                totalPages > ANON_PAGE_LIMIT ? (
                  <div className="mt-6 p-4 bg-gt-pale/80 border border-gt-border-light rounded-xl flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-sm text-gt-text-muted">
                      <span className="font-semibold text-gt-text">
                        Sign up free
                      </span>{' '}
                      to page through all{' '}
                      {filtered.length.toLocaleString('en-US')} results and apply
                      filters. No credit card.
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

                <nav
                  aria-label="Pagination"
                  className="mt-8 flex items-center justify-between gap-4 flex-wrap"
                >
                  <span className="text-xs text-gt-text-dim font-['JetBrains_Mono']">
                    {(pageStart + 1).toLocaleString('en-US')}–
                    {Math.min(pageStart + PAGE_SIZE, filtered.length).toLocaleString('en-US')}
                    {' of '}
                    {filtered.length.toLocaleString('en-US')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goToPage(safePage - 1)}
                      disabled={safePage <= 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold bg-white border border-gt-border-light rounded-lg hover:border-gt-medium/40 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                      Prev
                    </button>
                    <span className="text-sm font-['JetBrains_Mono'] text-gt-text-muted px-2">
                      Page {safePage} of {totalPages.toLocaleString('en-US')}
                    </span>
                    <button
                      type="button"
                      onClick={() => goToPage(safePage + 1)}
                      disabled={safePage >= totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold bg-white border border-gt-border-light rounded-lg hover:border-gt-medium/40 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                </nav>
              </>
            )}
          </div>
        </div>
      </LightSection>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        facets={facets}
        state={filters}
        setState={setFilters}
      />

      <CarbonAuthPrompt
        open={authPromptFor !== null}
        trigger={authPromptFor ?? 'filter'}
        onClose={() => setAuthPromptFor(null)}
      />
    </>
  );
}

/**
 * ActiveFilterPills — small removable chip for every applied filter.
 * Shown above the results so users can see and dismiss individual
 * filters without opening the sidebar.
 */
function ActiveFilterPills({
  filters,
  setFilters,
  search,
  setSearch,
}: {
  filters: FilterState;
  setFilters: (s: FilterState) => void;
  search: string;
  setSearch: (s: string) => void;
}) {
  type Pill = { label: string; onRemove: () => void };
  const pills: Pill[] = [];

  if (search.trim()) {
    pills.push({ label: `Search: "${search}"`, onRemove: () => setSearch('') });
  }
  for (const r of filters.registries) {
    pills.push({
      label: `Registry: ${r.replace(/_/g, ' ')}`,
      onRemove: () =>
        setFilters({ ...filters, registries: filters.registries.filter(x => x !== r) }),
    });
  }
  for (const m of filters.methodologies) {
    pills.push({
      label: `Methodology: ${m}`,
      onRemove: () =>
        setFilters({ ...filters, methodologies: filters.methodologies.filter(x => x !== m) }),
    });
  }
  for (const c of filters.countries) {
    pills.push({
      label: `Country: ${c}`,
      onRemove: () =>
        setFilters({ ...filters, countries: filters.countries.filter(x => x !== c) }),
    });
  }
  for (const s of filters.statuses) {
    pills.push({
      label: `Status: ${s}`,
      onRemove: () =>
        setFilters({ ...filters, statuses: filters.statuses.filter(x => x !== s) }),
    });
  }
  for (const cert of filters.certifications) {
    pills.push({
      label: cert,
      onRemove: () =>
        setFilters({ ...filters, certifications: filters.certifications.filter(x => x !== cert) }),
    });
  }
  if (filters.corsia === 'eligible') {
    pills.push({
      label: 'CORSIA eligible',
      onRemove: () => setFilters({ ...filters, corsia: 'any' }),
    });
  }
  if (filters.corsia === 'ineligible') {
    pills.push({
      label: 'CORSIA: not eligible',
      onRemove: () => setFilters({ ...filters, corsia: 'any' }),
    });
  }

  if (pills.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {pills.map((p, i) => (
        <button
          key={i}
          type="button"
          onClick={p.onRemove}
          className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gt-medium/10 text-gt-medium text-xs font-semibold hover:bg-gt-medium/20 transition-colors"
        >
          <span>{p.label}</span>
          <span aria-hidden className="text-gt-medium/60 group-hover:text-gt-medium">×</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          setSearch('');
          setFilters({
            registries: [],
            methodologies: [],
            countries: [],
            statuses: [],
            certifications: [],
            corsia: 'any',
          });
        }}
        className="text-xs font-semibold text-gt-text-dim hover:text-gt-medium ml-2"
      >
        Clear all
      </button>
    </div>
  );
}
