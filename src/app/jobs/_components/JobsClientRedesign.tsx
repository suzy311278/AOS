/**
 * JobsClientRedesign - Premium Career Directory
 *
 * Design principles:
 * - DENSE: More jobs visible at once, tight rows for fast scanning
 * - COLUMNAR: Title, company, location, type, date in clear columns
 * - MONOSPACE: All metadata in JetBrains Mono for precision
 * - MINIMAL COLOR: Dark text on light, green only for actions
 * - SUBTLE: Thin borders, no chunky cards, premium feel
 *
 * UX: Users skim fast, filter by location/type, read brief, expand only
 * what interests them, then click through to apply.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  X,
  ChevronDown,
  ExternalLink,
  Briefcase,
  MapPin,
  Building2,
  Clock,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  TrendingUp,
  Sparkles,
  Lock,
} from 'lucide-react';
import type { JobSummary, JobDetail, JobsMeta } from '@/lib/jobs';
import { fetchJobDetail } from '@/app/jobs/actions';
import { useResumeState } from './useResumeState';
import { cn } from '@/components/redesign/lib/cn';
import { DarkUICard } from '@/components/redesign';

/* ============================================================
   Constants
   ============================================================ */

const PROFILE_LABELS: Record<string, string> = {
  all: 'All',
  climate_risk: 'Climate Risk',
  sustainable_finance: 'Sustainable Finance',
  eu_taxonomy_sfdr: 'EU Taxonomy / SFDR',
  carbon_markets: 'Carbon Markets',
  clean_energy_adjacent: 'Clean Energy',
};

const COURSE_SUGGESTIONS: Record<string, { label: string; href: string }[]> = {
  climate_risk: [
    { label: 'Climate Science 101', href: '/courses/climate-science-101' },
    { label: 'IFRS S2 Climate Disclosures', href: '/courses/ifrs-s2' },
    { label: 'TNFD & Biodiversity', href: '/courses/tnfd-biodiversity' },
    { label: 'SBTi Targets', href: '/courses/sbti' },
    { label: 'Double Materiality', href: '/courses/double-materiality' },
  ],
  sustainable_finance: [
    { label: 'ESG Reporting', href: '/courses/esg-reporting' },
    { label: 'ESG Investing', href: '/courses/esg-investing' },
    { label: 'ESG Benchmarking', href: '/courses/esg-benchmarking' },
    { label: 'Financed Emissions', href: '/courses/financed-emissions' },
    { label: 'IFC Performance Standards', href: '/courses/ifc-performance-standards' },
  ],
  carbon_markets: [
    { label: 'VCM 101', href: '/courses/vcm-101' },
    { label: 'GHG Scope 3', href: '/courses/ghg-scope-3' },
    { label: 'GHG Scope 1 & 2', href: '/courses/ghg-scope-1-2' },
    { label: 'VM0042 Methodology', href: '/courses/vm0042' },
    { label: 'Article 6 Markets', href: '/courses/article-6' },
  ],
  eu_taxonomy_sfdr: [
    { label: 'EU Taxonomy', href: '/courses/eu-taxonomy' },
    { label: 'EU SFDR', href: '/courses/eu-sfdr' },
    { label: 'EU CBAM', href: '/courses/eu-cbam' },
    { label: 'EUDR Deforestation', href: '/courses/eudr' },
    { label: 'Double Materiality', href: '/courses/double-materiality' },
  ],
  clean_energy_adjacent: [
    { label: 'Climate Science 101', href: '/courses/climate-science-101' },
    { label: 'TNFD & Biodiversity', href: '/courses/tnfd-biodiversity' },
    { label: 'Circular Economy', href: '/courses/circular-economy' },
    { label: 'SBTi Targets', href: '/courses/sbti' },
    { label: 'Human Rights Due Diligence', href: '/courses/human-rights-dd' },
  ],
};

/* ============================================================
   Match preview (resume-driven, client-side demo)

   The product model: users upload a resume, Greentryst builds
   a profile from it, and we match continuously against every
   job in the board using that profile plus the user's course
   completions and dashboard preferences (region, experience
   level). No skills picker is needed; skills are derived.

   For the redesign preview we simulate the resume flow with
   a localStorage flag and a deterministic mock score.
   ============================================================ */

/** Deterministic teaser score in [52, 97] for the pre-upload "All Jobs"
 *  view. Not used once the user's resume is ready — real scores from
 *  /api/resume/matches take over then (see useResumeState). */
function computeMockMatch(job: JobSummary): number {
  const title = job.title ?? '';
  const company = job.company ?? '';
  const str = title + '|' + company + '|' + (job.profile ?? '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  const base = 52 + (Math.abs(hash) % 46);
  return Math.max(52, Math.min(97, base));
}

/** Free tier shows only this many full matches; the rest are blurred. */
const FREE_TIER_VISIBLE_MATCHES = 2;

/* ============================================================
   Helpers
   ============================================================ */

function formatDate(d: string | null): string {
  if (!d) return '-';
  if (d.includes('week') || d.includes('day') || d.includes('hour')) return d;
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  const diffDays = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return '1d';
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  return `${Math.floor(diffDays / 30)}mo`;
}

function formatLocation(loc: string | null): string {
  if (!loc) return '-';
  // Truncate long locations
  if (loc.length > 20) return loc.slice(0, 18) + '...';
  return loc;
}

function formatProfile(p: string): string {
  return (
    PROFILE_LABELS[p] ??
    p
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/* ============================================================
   Props
   ============================================================ */

interface Filters {
  profile?: string;
  companyType?: string;
  country?: string;
  remote?: string;
  search?: string;
  sort?: 'relevance' | 'latest';
  page?: number;
  perPage?: number;
}

interface Props {
  jobs: JobSummary[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  meta: JobsMeta;
  filters: Filters;
  /** True when the request has a Clerk session. Drives the 5-job
   *  preview + auth-wall, and disables the Matched tab for anon
   *  visitors. */
  isAuthenticated: boolean;
}

/* ============================================================
   Main Component
   ============================================================ */

export function JobsClientRedesign({
  jobs,
  total,
  page,
  perPage,
  totalPages,
  meta,
  filters,
  isAuthenticated,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, JobDetail>>({});
  const [lockedJobs, setLockedJobs] = useState<Record<string, true>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const [viewMode, setViewMode] = useState<'all' | 'matched'>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  // Backend-driven resume state replaces the old localStorage mock. See
  // useResumeState.ts - handles upload, polling while parsing, match
  // score fetch, and delete against /api/resume/*.
  const resume = useResumeState();
  const resumeUploaded = resume.status === 'ready';
  const resumeFlagLoaded = resume.hydrated;

  // Upload CTA routes anonymous visitors to sign-up; for signed-in
  // users it pops the real file picker. Same button, two behaviours.
  const markResumeUploaded = useCallback(() => {
    if (!isAuthenticated) {
      router.push('/sign-up?redirect_url=/jobs');
      return;
    }
    resume.openUploader();
  }, [isAuthenticated, resume, router]);
  const clearResume = useCallback(() => {
    void resume.removeResume();
  }, [resume]);

  // Match scores come from /api/resume/matches once the user's resume is
  // ready. Until then matchesByJob is empty and the "Matched for you"
  // tab is effectively hidden behind the upload CTA.
  //
  // In "All Jobs" we still want to show a score preview on each card
  // for the psychological pull of the feature, but pre-upload we have
  // nothing real to show - so we use a deterministic mock for those
  // teaser cards and a real score once the resume is ready.
  const scoreByKey: Map<string, number> = resumeUploaded
    ? resume.matchesByJob
    : new Map(jobs.map((j) => [j.jobUrl, computeMockMatch(j)]));

  const displayedJobs =
    viewMode === 'matched' && resumeUploaded
      ? [...jobs].sort(
          (a, b) =>
            (scoreByKey.get(b.jobUrl) ?? 0) - (scoreByKey.get(a.jobUrl) ?? 0)
        )
      : jobs;

  const strongMatches = resumeUploaded
    ? displayedJobs.filter((j) => (scoreByKey.get(j.jobUrl) ?? 0) >= 80).length
    : 0;

  // Anti-scrape — deliberately narrow, meant to raise the bar against
  // casual bulk extraction. A determined scraper can defeat any of this;
  // the point is to keep the page from being a free JSON dump.
  //
  // Legacy /jobs (JobsClient.tsx in commit b0dfab4) shipped with:
  //   - block copy/cut/contextmenu/dragstart
  //   - block keyboard shortcuts for copy (Cmd/Ctrl+C), cut (+X), and
  //     view-source (+U)
  //   - select-none CSS on the container
  //   - noindex/nofollow meta (see page.tsx) + robots.txt Disallow /jobs
  // We carry all of that forward here.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const block = (e: Event) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      const cmd = e.ctrlKey || e.metaKey;
      if (cmd && (e.key === 'c' || e.key === 'x' || e.key === 'u')) {
        e.preventDefault();
      }
    };
    el.addEventListener('copy', block);
    el.addEventListener('cut', block);
    el.addEventListener('contextmenu', block);
    el.addEventListener('dragstart', block);
    el.addEventListener('keydown', onKeyDown);
    return () => {
      el.removeEventListener('copy', block);
      el.removeEventListener('cut', block);
      el.removeEventListener('contextmenu', block);
      el.removeEventListener('dragstart', block);
      el.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== 'page') params.delete('page');
      router.push(`/jobs?${params.toString()}`);
    },
    [router, searchParams]
  );

  async function toggleExpand(jobUrl: string) {
    if (expandedJob === jobUrl) {
      setExpandedJob(null);
      return;
    }
    setExpandedJob(jobUrl);
    if (!detailCache[jobUrl] && !lockedJobs[jobUrl]) {
      setLoadingDetail(jobUrl);
      try {
        const result = await fetchJobDetail(jobUrl);
        if (result.status === 'ok') {
          setDetailCache((prev) => ({ ...prev, [jobUrl]: result.detail }));
        } else if (result.status === 'locked') {
          setLockedJobs((prev) => ({ ...prev, [jobUrl]: true }));
        }
        // 'not_found' → leave caches untouched; the UI falls back to the
        // generic "detail unavailable" path (same as a network error).
      } catch {
        /* ignore */
      }
      setLoadingDetail(null);
    }
  }

  const activeProfile = filters.profile ?? 'all';
  const hasActiveFilters =
    filters.country || filters.companyType || filters.remote || filters.search;

  return (
    <div ref={containerRef} className="min-h-screen bg-[#fafbfa] select-none">
      {/* ============================================================
          Page hero — managed job search + live board stats.
          Shown to every visitor so the matching feature is the
          first thing they understand. Right column is the upload
          card that adapts to resume state.
          ============================================================ */}
      <section className="relative overflow-hidden bg-gt-text-dark">
        {/* Single restrained ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-1/3 w-[620px] h-[620px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(82,183,136,0.14) 0%, rgba(82,183,136,0.03) 55%, transparent 75%)',
            filter: 'blur(20px)',
          }}
        />
        <div
          className="gt-dot-grid absolute inset-0 opacity-[0.22] pointer-events-none"
          aria-hidden
        />
        {/* Crisp bottom hairline */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />

        <div className="relative z-10 max-w-[1280px] mx-auto px-8 pt-24 pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.85fr] gap-12 lg:gap-16 items-start">
            {/* ============== LEFT: narrative + step flow ============== */}
            <div>
              {/* Thin-rule eyebrow, replaces the pill */}
              <div className="flex items-center gap-3 mb-8">
                <span className="h-px w-8 bg-gt-leaf" aria-hidden />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.28em] text-gt-leaf"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  Career Directory
                </span>
                <span className="text-white/25">·</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  Managed job search
                </span>
              </div>

              <h1 className="text-[36px] md:text-[52px] font-extrabold text-white leading-[1.04] tracking-[-0.02em] max-w-2xl">
                We do the job search.
                <br />
                <span className="text-gt-leaf">You do the interviews.</span>
              </h1>
              <p className="mt-6 text-[15px] md:text-[16px] text-white/65 leading-relaxed max-w-xl">
                Every live role on the board is scored against your profile
                and re-ranked as you complete courses and add new skills.
                Upload a resume once, learn continuously, never rewrite your
                search from scratch.
              </p>

              {/* Editorial step flow */}
              <ol className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 max-w-xl">
                {MATCH_STEPS.map((s) => (
                  <li key={s.step} className="flex items-start gap-4">
                    <span
                      className="flex-shrink-0 text-[11px] font-bold text-gt-leaf tracking-[0.15em] pt-0.5"
                      style={{
                        fontFamily:
                          'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                      }}
                    >
                      {s.step}
                    </span>
                    <div className="pt-0 border-l border-gt-leaf/25 pl-4">
                      <p className="text-[13.5px] font-bold text-white leading-snug">
                        {s.title}
                      </p>
                      <p className="mt-1 text-[12.5px] text-white/55 leading-relaxed">
                        {s.blurb}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* ============== RIGHT: upload card (adaptive, refined) ============== */}
            <div className="lg:self-center">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(6px)',
                  boxShadow: '0 30px 60px -24px rgba(0, 0, 0, 0.6)',
                }}
              >
                {/* Persistent leaf-green top accent */}
                <span
                  className="absolute top-0 left-0 right-0 h-[2px] bg-gt-leaf"
                  aria-hidden
                />

                <div className="p-8">
                  {/* Card eyebrow */}
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.28em] text-gt-leaf mb-6"
                    style={{
                      fontFamily:
                        'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    }}
                  >
                    {resumeUploaded ? 'Resume on file' : 'Start here'}
                  </p>

                  {resumeUploaded ? (
                    <>
                      <h2 className="text-[22px] md:text-[24px] font-extrabold text-white leading-[1.15] tracking-tight">
                        Your matches are ranked below.
                      </h2>
                      <p className="mt-3 text-[13.5px] text-white/60 leading-relaxed">
                        Re-matching runs continuously as you complete courses
                        and refresh your preferences in the dashboard.
                      </p>
                      <div className="mt-8 flex items-center gap-3 flex-wrap">
                        <Link
                          href="/pricing"
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[12px] font-bold text-gt-text-dark bg-gt-leaf hover:bg-white transition-colors"
                        >
                          Upgrade to Individual
                          <ArrowRight
                            className="w-3.5 h-3.5"
                            strokeWidth={2.5}
                          />
                        </Link>
                        <button
                          type="button"
                          onClick={clearResume}
                          className="text-[12px] font-semibold text-white/60 hover:text-white transition-colors"
                        >
                          Replace resume
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-[22px] md:text-[24px] font-extrabold text-white leading-[1.15] tracking-tight">
                        Drop your resume.
                        <br />
                        We handle the rest.
                      </h2>
                      <p className="mt-3 text-[13.5px] text-white/60 leading-relaxed">
                        PDF or DOCX, parsed in under five seconds. Your
                        profile stays private and editable in your dashboard.
                      </p>
                      <button
                        type="button"
                        onClick={markResumeUploaded}
                        className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 text-[12px] font-bold text-gt-text-dark bg-gt-leaf hover:bg-white transition-colors"
                      >
                        Upload resume
                        <ArrowRight
                          className="w-3.5 h-3.5"
                          strokeWidth={2.5}
                        />
                      </button>
                    </>
                  )}
                </div>

                {/* Mini spec strip inside the card */}
                <div className="px-8 py-5 border-t border-white/8 grid grid-cols-3 gap-4 bg-white/[0.015]">
                  <UploadStat value="All" label="Live jobs scored" />
                  <UploadStat value="< 5s" label="Resume parse" />
                  <UploadStat value="Free" label="Top 2 matches" />
                </div>
              </div>
            </div>
          </div>

          {/* ============== Board-level stats bar ============== */}
          <div className="mt-16 pt-8 border-t border-white/[0.08]">
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-6 bg-white/20" aria-hidden />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                Directory at a glance
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.08]">
              <HeroStat value={meta.totalJobCount} label="Jobs Live" />
              <HeroStat value={meta.totalCompanies} label="Companies" />
              <HeroStat value={meta.countries.length} label="Countries" />
              <HeroStat value={meta.totalRemote} label="Remote" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          Split view tabs: All Jobs | Matched for you
          ============================================================ */}
      <div className="sticky top-16 z-40 bg-white border-b border-[#e5e7e5]">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex items-center gap-6">
            {(
              [
                { key: 'all', label: 'All Jobs', count: meta.totalJobCount },
                {
                  key: 'matched',
                  label: 'Matched for you',
                  count: resumeUploaded ? strongMatches : null,
                },
              ] as const
            ).map((tab) => {
              const isActive = viewMode === tab.key;
              // Matched tab requires a Clerk session. Anonymous visitors
              // see it but it's disabled — clicking is a no-op and a lock
              // icon replaces the sparkle.
              const isMatchedLocked =
                tab.key === 'matched' && !isAuthenticated;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    if (isMatchedLocked) return;
                    setViewMode(tab.key);
                  }}
                  disabled={isMatchedLocked}
                  aria-disabled={isMatchedLocked || undefined}
                  title={
                    isMatchedLocked
                      ? 'Sign in to match jobs against your resume'
                      : undefined
                  }
                  className={cn(
                    'relative inline-flex items-center gap-2 py-4 text-[13px] font-bold transition-colors',
                    isActive ? 'text-[#081C15]' : 'text-[#5a6a64] hover:text-[#081C15]',
                    isMatchedLocked && 'opacity-50 cursor-not-allowed hover:text-[#5a6a64]'
                  )}
                >
                  {tab.key === 'matched' &&
                    (isMatchedLocked ? (
                      <Lock className="w-3.5 h-3.5 text-[#8a9a94]" strokeWidth={2} />
                    ) : (
                      <Sparkles
                        className={cn(
                          'w-3.5 h-3.5',
                          isActive ? 'text-[#2D6A4F]' : 'text-[#8a9a94]'
                        )}
                        strokeWidth={2}
                      />
                    ))}
                  {tab.label}
                  {tab.count !== null && !isMatchedLocked && (
                    <span
                      className={cn(
                        'text-[10px] font-bold',
                        isActive ? 'text-[#2D6A4F]' : 'text-[#8a9a94]'
                      )}
                      style={{
                        fontFamily: 'var(--font-jetbrains-mono), monospace',
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <span
                      className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#2D6A4F]"
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================
          Live resume-processing strip: visible across both tabs
          whenever the backend is actively working or just errored.
          ============================================================ */}
      {(resume.status === 'uploading' ||
        resume.status === 'parsing' ||
        resume.status === 'error' ||
        resume.capMessage) && (
        <div
          className={cn(
            'border-b',
            resume.status === 'error' || resume.capMessage
              ? 'bg-[#fff4f2] border-[#f0c9c1]'
              : 'bg-[#eef5ef] border-[#cfe2d3]'
          )}
        >
          <div className="max-w-[1280px] mx-auto px-8 py-3">
            <div className="flex flex-wrap items-center gap-3">
              {resume.status === 'uploading' || resume.status === 'parsing' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-pulse" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#40916C] animate-pulse"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#52B788] animate-pulse"
                    style={{ animationDelay: '300ms' }}
                  />
                  <p className="text-[13px] text-[#081C15]">
                    <span className="font-semibold">
                      {resume.status === 'uploading'
                        ? 'Uploading your resume…'
                        : 'Analyzing your skills…'}
                    </span>{' '}
                    <span className="text-[#5a6a64]">
                      Stay on this page — scores appear automatically.
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <span className="text-[#b34c3a] text-[14px]">⚠</span>
                  <p className="text-[13px] text-[#081C15]">
                    <span className="font-semibold">
                      {resume.capMessage
                        ? 'Upload limit reached.'
                        : 'Resume upload failed.'}
                    </span>{' '}
                    <span className="text-[#5a6a64]">
                      {resume.capMessage ?? resume.error ?? 'Please try again.'}
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          Matched-for-you: compact summary strip (only when uploaded).
          The pre-upload CTA is now part of the page hero above.
          ============================================================ */}
      {viewMode === 'matched' && resumeFlagLoaded && resumeUploaded && (
        <div className="bg-[#f5f7f5] border-b border-[#e5e7e5]">
          <div className="max-w-[1280px] mx-auto px-8 py-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                <div className="w-9 h-9 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#081C15] leading-tight">
                    {strongMatches} job{strongMatches === 1 ? '' : 's'} match your profile at 80%+
                  </p>
                  <p
                    className="text-[11px] text-[#5a6a64] mt-0.5"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    Top {FREE_TIER_VISIBLE_MATCHES} matches visible on the free tier · Upgrade to Individual to see all
                  </p>
                </div>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold text-white bg-[#2D6A4F] hover:bg-[#1B4332] transition-colors"
              >
                Upgrade to Individual
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          Toolbar - Search + Profile tabs + filters
          ============================================================ */}
      <div className="sticky top-[113px] z-30 bg-white border-b border-[#e5e7e5]">
        <div className="max-w-[1280px] mx-auto px-8">
          {/* Top row: Search + inline filters + sort toggle switch */}
          <div className="flex flex-wrap items-center gap-3 py-3 border-b border-[#e5e7e5]">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9a94] pointer-events-none"
                strokeWidth={2}
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateFilter('search', searchInput.trim() || undefined);
                  }
                }}
                placeholder="Search jobs by title, company, or skill..."
                className="w-full pl-10 pr-8 py-2.5 border border-[#e5e7e5] text-[13px] text-[#081C15] placeholder:text-[#8a9a94] focus:outline-none focus:border-[#2D6A4F] transition-colors"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateFilter('search', undefined);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8a9a94] hover:text-[#081C15]"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Inline filters */}
            {meta.countries.length > 0 && (
              <FilterSelect
                value={filters.country}
                onChange={(v) => updateFilter('country', v)}
                placeholder="Country"
                options={meta.countries}
              />
            )}
            {meta.companyTypes.length > 0 && (
              <FilterSelect
                value={filters.companyType}
                onChange={(v) => updateFilter('companyType', v)}
                placeholder="Company type"
                options={meta.companyTypes}
              />
            )}
            <FilterSelect
              value={filters.remote}
              onChange={(v) => updateFilter('remote', v)}
              placeholder="Work mode"
              options={['Remote', 'Hybrid', 'On-site']}
            />

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => router.push('/jobs')}
                className="text-[12px] text-[#5a6a64] hover:text-[#2D6A4F] font-medium"
              >
                Clear all
              </button>
            )}

            {/* Sort toggle switch */}
            <div
              className="relative ml-auto inline-flex items-center p-1 rounded-full border border-[#e5e7e5] bg-[#f5f7f5]"
              role="group"
              aria-label="Sort order"
            >
              {(() => {
                const isLatest = filters.sort === 'latest';
                return (
                  <>
                    {/* Sliding pill */}
                    <span
                      aria-hidden
                      className={cn(
                        'absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-[#2D6A4F] transition-transform duration-300 ease-out',
                        isLatest ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'
                      )}
                      style={{ left: '4px' }}
                    />
                    <button
                      type="button"
                      onClick={() => updateFilter('sort', undefined)}
                      aria-pressed={!isLatest}
                      className={cn(
                        'relative z-10 px-4 py-1.5 text-[11px] font-semibold rounded-full transition-colors',
                        !isLatest ? 'text-white' : 'text-[#5a6a64] hover:text-[#081C15]'
                      )}
                    >
                      Relevance
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFilter('sort', 'latest')}
                      aria-pressed={isLatest}
                      className={cn(
                        'relative z-10 px-4 py-1.5 text-[11px] font-semibold rounded-full transition-colors',
                        isLatest ? 'text-white' : 'text-[#5a6a64] hover:text-[#081C15]'
                      )}
                    >
                      Latest
                    </button>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Profile tabs */}
          <div className="flex items-center gap-1 py-2 overflow-x-auto">
            {Object.entries(PROFILE_LABELS).map(([key, label]) => {
              const isActive = activeProfile === key;
              const count =
                key === 'all' ? meta.totalJobCount : meta.profileCounts[key] ?? 0;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    updateFilter('profile', key === 'all' ? undefined : key)
                  }
                  className={cn(
                    'flex-shrink-0 px-3 py-2 text-[12px] font-medium transition-colors',
                    isActive
                      ? 'text-white bg-[#2D6A4F]'
                      : 'text-[#5a6a64] hover:text-[#081C15] hover:bg-[#f5f7f5]'
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      'ml-1.5 text-[10px]',
                      isActive ? 'text-white/70' : 'text-[#8a9a94]'
                    )}
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* ============================================================
          Results count
          ============================================================ */}
      <div className="max-w-[1280px] mx-auto px-8 pt-4 pb-2">
        <p
          className="text-[11px] text-[#5a6a64]"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          {total} results
          {filters.search && ` for "${filters.search}"`}
        </p>
      </div>

      {/* ============================================================
          Job Table - Dense rows
          ============================================================ */}
      <div className="max-w-[1280px] mx-auto px-8 pb-8">
        {jobs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[15px] text-[#5a6a64]">No jobs match your filters.</p>
            <button
              type="button"
              onClick={() => router.push('/jobs')}
              className="mt-3 text-[13px] font-semibold text-[#2D6A4F] hover:text-[#1B4332]"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Table header — adds a Match Score column when we're on the
                Matched tab and the user has uploaded a resume. */}
            <div
              className={cn(
                'hidden lg:grid gap-4 px-4 py-2.5 text-[10px] font-bold uppercase text-[#5a6a64] border-b border-[#e5e7e5] bg-[#f8faf8]',
                viewMode === 'matched'
                  ? 'grid-cols-[minmax(200px,1.2fr)_minmax(140px,1fr)_minmax(120px,0.9fr)_100px_70px_90px_90px]'
                  : 'grid-cols-[minmax(200px,1.2fr)_minmax(140px,1fr)_minmax(120px,0.9fr)_100px_70px_90px]'
              )}
              style={{
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
            >
              <span>Role</span>
              <span>Company</span>
              <span>Location</span>
              <span>Type</span>
              <span>Posted</span>
              {viewMode === 'matched' && (
                <span className="text-[#2D6A4F]">Match</span>
              )}
              <span></span>
            </div>

            {/* Job rows */}
            <div className="divide-y divide-[#e5e7e5] relative">
              {displayedJobs.map((job, i) => {
                const isMatched = viewMode === 'matched' && resumeUploaded;
                // Pre-upload Matched tab: blur full list from row 3 onward,
                // pin an "Upload resume" overlay on row 3 as a teaser.
                const isPreUploadMatched =
                  viewMode === 'matched' && !resumeUploaded;
                const gatedByFreeTier =
                  isMatched && i >= FREE_TIER_VISIBLE_MATCHES;
                const gatedByNoResume = isPreUploadMatched && i >= 3;
                const gated = gatedByFreeTier || gatedByNoResume;
                // On the Matched tab the Match column is always present.
                // Real scores appear once a resume is uploaded; before
                // upload the column shows a skeleton placeholder.
                const onMatchedTab = viewMode === 'matched';
                const matchScore = isMatched
                  ? scoreByKey.get(job.jobUrl) ?? null
                  : null;
                return (
                  <div
                    key={job.jobUrl}
                    className={cn(
                      'relative transition-all',
                      gated && 'select-none'
                    )}
                  >
                    <div
                      className={cn(
                        gated && 'blur-[3px] opacity-60 pointer-events-none'
                      )}
                      aria-hidden={gated || undefined}
                    >
                      <JobRow
                        job={job}
                        isExpanded={expandedJob === job.jobUrl}
                        isLoadingDetail={loadingDetail === job.jobUrl}
                        detail={detailCache[job.jobUrl]}
                        isLocked={Boolean(lockedJobs[job.jobUrl])}
                        onToggle={() => toggleExpand(job.jobUrl)}
                        matchScore={matchScore}
                        showMatchColumn={onMatchedTab}
                        matchLocked={false}
                      />
                    </div>

                    {/* Free-tier upgrade overlay, pinned on the first gated row */}
                    {gatedByFreeTier && i === FREE_TIER_VISIBLE_MATCHES && (
                      <div className="absolute inset-x-0 top-0 flex justify-center pt-6 pointer-events-none">
                        <div className="pointer-events-auto max-w-md w-[92%] bg-white border border-[#e5e7e5] rounded-2xl shadow-[0_18px_40px_-14px_rgba(0,60,41,0.22)] p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center flex-shrink-0">
                            <Lock className="w-4 h-4" strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-[#081C15] leading-tight">
                              Unlock the rest of your matches
                            </p>
                            <p className="text-[12px] text-[#5a6a64] mt-1 leading-snug">
                              Free tier shows the top {FREE_TIER_VISIBLE_MATCHES} matches. Upgrade to Individual to see every job ranked against your profile, with continuous re-matching as you complete courses.
                            </p>
                          </div>
                          <Link
                            href="/pricing"
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold text-white bg-[#2D6A4F] hover:bg-[#1B4332] transition-colors whitespace-nowrap"
                          >
                            Upgrade
                            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Pre-upload teaser overlay, pinned at row index 3 */}
                    {gatedByNoResume && i === 3 && (
                      <div className="absolute inset-x-0 top-0 flex justify-center pt-6 pointer-events-none">
                        <div className="pointer-events-auto max-w-md w-[92%] bg-white border border-[#e5e7e5] rounded-2xl shadow-[0_18px_40px_-14px_rgba(0,60,41,0.22)] p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4" strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-[#081C15] leading-tight">
                              This is where your matches will appear
                            </p>
                            <p className="text-[12px] text-[#5a6a64] mt-1 leading-snug">
                              Upload your resume to rank every live job against your profile. Free tier shows the top {FREE_TIER_VISIBLE_MATCHES} matches with real scores.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={markResumeUploaded}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold text-white bg-[#2D6A4F] hover:bg-[#1B4332] transition-colors whitespace-nowrap"
                          >
                            Upload resume
                            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ============================================================
            Auth wall — anonymous visitors saw 5 jobs; the rest require
            a free account. Placed below the list so the preview is the
            first thing they see.
            ============================================================ */}
        {!isAuthenticated && (
          <div className="mt-6 rounded-2xl bg-gt-text-dark text-white p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)]">
            <div className="w-12 h-12 rounded-full bg-gt-leaf/15 text-gt-leaf flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-white leading-snug">
                {Math.max(0, meta.totalJobCount - jobs.length)} more jobs behind a free account
              </p>
              <p className="text-[13px] text-white/70 mt-1 leading-relaxed">
                Sign up to see every live sustainability role, filter by region and company
                type, and upload your resume for personalized match scores.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-bold text-gt-text-dark bg-white hover:bg-white/90 transition-colors whitespace-nowrap rounded-md"
              >
                Create free account
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-bold text-white border border-white/20 hover:bg-white/5 transition-colors whitespace-nowrap rounded-md"
              >
                Sign in
              </Link>
            </div>
          </div>
        )}

        {/* Pagination + Per-page selector */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            {/* Per-page count */}
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] text-[#5a6a64]"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                Show
              </span>
              <div className="flex items-center border border-[#e5e7e5] overflow-hidden">
                {[15, 30, 50].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => updateFilter('perPage', String(count))}
                    className={cn(
                      'px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                      perPage === count
                        ? 'bg-[#2D6A4F] text-white'
                        : 'bg-white text-[#5a6a64] hover:text-[#081C15]'
                    )}
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Page nav */}
            <div className="flex items-center gap-2">
              <PagButton
                disabled={page <= 1}
                onClick={() => updateFilter('page', String(page - 1))}
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              </PagButton>
              <span
                className="px-4 py-2 text-[11px] text-[#5a6a64]"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                {page} / {totalPages}
              </span>
              <PagButton
                disabled={page >= totalPages}
                onClick={() => updateFilter('page', String(page + 1))}
              >
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
              </PagButton>
            </div>
          </div>
        )}

        {/* Bottom banners - Start Learning + In-Demand Skills */}
        <section className="mt-12 pt-10 border-t border-[#e5e7e5] grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Start Learning Banner */}
          <DarkUICard
            label="Learn"
            className="md:col-span-3"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <BookOpen className="w-5 h-5 text-gt-leaf" strokeWidth={1.5} />
              <h3 className="text-[17px] font-bold text-white">Start Learning</h3>
            </div>
            <p className="text-[13px] text-white/60 leading-relaxed mb-5">
              Build the skills employers are looking for. Our courses cover the frameworks, standards, and domain knowledge mentioned in these job listings.
            </p>
            <div className="flex flex-wrap gap-2">
              {(COURSE_SUGGESTIONS[activeProfile] || COURSE_SUGGESTIONS.climate_risk).map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="px-4 py-2.5 bg-gt-leaf text-gt-text-dark text-[12px] font-bold hover:bg-gt-mint transition-colors"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </DarkUICard>

          {/* In-Demand Skills Banner */}
          <div className="md:col-span-2 p-6 bg-gt-leaf/[0.06] border border-gt-leaf/15 rounded-2xl">
            <div className="flex items-center gap-2.5 mb-4">
              <TrendingUp className="w-5 h-5 text-gt-medium" strokeWidth={1.5} />
              <h3 className="text-[15px] font-bold text-gt-text">In-Demand Skills</h3>
            </div>
            <div className="space-y-2.5 mb-5">
              {['Climate Risk Assessment', 'ESG Reporting (GRI, SASB)', 'Carbon Accounting', 'EU Taxonomy Alignment'].map((skill) => (
                <div key={skill} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gt-medium" />
                  <span className="text-[13px] text-gt-text-muted">{skill}</span>
                </div>
              ))}
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-gt-medium hover:text-gt-dark transition-colors"
            >
              Browse all courses
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ============================================================
   JobRow - Dense, columnar, scannable
   ============================================================ */

function JobRow({
  job,
  isExpanded,
  isLoadingDetail,
  detail,
  isLocked,
  onToggle,
  matchScore,
  matchLocked,
  showMatchColumn,
}: {
  job: JobSummary;
  isExpanded: boolean;
  isLoadingDetail: boolean;
  detail?: JobDetail;
  isLocked?: boolean;
  onToggle: () => void;
  matchScore?: number | null;
  matchLocked?: boolean;
  /** Reserve the Match column space even when no score is available yet. */
  showMatchColumn?: boolean;
}) {
  const remoteLabel = job.remote ? 'Remote' : job.jobType?.toLowerCase().includes('hybrid') ? 'Hybrid' : 'On-site';

  return (
    <div className={cn('transition-colors', isExpanded && 'bg-[#f5f7f5]')}>
      {/* Main row - clickable */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full text-left px-4 py-3.5 lg:grid lg:gap-4 lg:items-center hover:bg-[#f5f7f5] transition-colors',
          showMatchColumn
            ? 'lg:grid-cols-[minmax(200px,1.2fr)_minmax(140px,1fr)_minmax(120px,0.9fr)_100px_70px_90px_90px]'
            : 'lg:grid-cols-[minmax(200px,1.2fr)_minmax(140px,1fr)_minmax(120px,0.9fr)_100px_70px_90px]'
        )}
      >
        {/* Mobile: stacked layout */}
        <div className="lg:hidden space-y-1 mb-2">
          <p className="text-[14px] font-semibold text-[#081C15] leading-tight pr-20">
            {job.title}
          </p>
          <p className="text-[12px] text-[#5a6a64]">
            {job.company} · {formatLocation(job.location)}
          </p>
        </div>

        {/* Desktop: columnar */}
        {/* Role: title + category */}
        <div className="hidden lg:block min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-[#081C15] leading-tight truncate">
              {job.title}
            </p>
            {job.profile && job.profile !== 'all' && (
              <span
                className="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#2D6A4F] bg-[#2D6A4F]/8"
                style={{
                  letterSpacing: '0.05em',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
              >
                {formatProfile(job.profile).split(' ')[0]}
              </span>
            )}
          </div>
        </div>

        {/* Company */}
        <p
          className="hidden lg:block text-[12px] text-[#3a4a44] truncate"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          {job.company}
        </p>

        {/* Location */}
        <p
          className="hidden lg:block text-[12px] text-[#5a6a64] truncate"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          {formatLocation(job.location)}
        </p>

        {/* Type */}
        <p
          className="hidden lg:block text-[11px] text-[#5a6a64]"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          {remoteLabel}
        </p>

        {/* Posted */}
        <p
          className="hidden lg:block text-[11px] text-[#8a9a94]"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          {formatDate(job.datePosted)}
        </p>

        {/* Match score column — reserved on the Matched tab. Shows a
            real leaf-green score once the resume is uploaded, or a
            muted dashed placeholder otherwise. */}
        {showMatchColumn && (
          <div className="hidden lg:block">
            {matchScore != null ? (
              <div
                className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#2D6A4F]"
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
                title={`${matchScore}% match with your profile`}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-[#2D6A4F]"
                  aria-hidden
                />
                {matchScore}%
              </div>
            ) : (
              <div
                className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#8a9a94]"
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
                title="Upload your resume to reveal your match"
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-[#c0c8c4]"
                  aria-hidden
                />
                ––%
              </div>
            )}
          </div>
        )}

        {/* Apply + Expand indicator */}
        <div className="hidden lg:flex items-center justify-end gap-2">
          <a
            href={job.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-3 py-1.5 text-[11px] font-bold text-white bg-[#2D6A4F] hover:bg-[#1B4332] transition-colors"
          >
            Apply
          </a>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-[#8a9a94] transition-transform',
              isExpanded && 'rotate-180'
            )}
            strokeWidth={2}
          />
        </div>

        {/* Mobile: apply button + chevron */}
        <div className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <ChevronDown
            className={cn(
              'w-4 h-4 text-[#8a9a94] transition-transform',
              isExpanded && 'rotate-180'
            )}
            strokeWidth={2}
          />
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 lg:pl-4 lg:pr-[180px]">
          <div className="pt-3 border-t border-[#e5e7e5]">
            {isLocked ? (
              <LockedDetailPrompt jobTitle={job.title ?? 'this role'} />
            ) : isLoadingDetail ? (
              <div className="flex items-center gap-2 py-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#40916C] animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#52B788] animate-pulse" style={{ animationDelay: '300ms' }} />
                <span
                  className="text-[11px] text-[#5a6a64] ml-1"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  Loading...
                </span>
              </div>
            ) : detail ? (
              <div className="space-y-4">
                {/* Meta strip */}
                <div
                  className="flex flex-wrap gap-4 text-[11px] text-[#5a6a64]"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  {job.jobType && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" strokeWidth={2} />
                      {job.jobType}
                    </span>
                  )}
                  {job.jobLevel && <span>Level: {job.jobLevel}</span>}
                  {job.experience && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" strokeWidth={2} />
                      {job.experience}
                    </span>
                  )}
                </div>

                {/* Detail sections — stacked vertically so lopsided
                    content (long role summary, short skills list, etc.)
                    doesn't waste horizontal space on wider screens.
                    Each block takes full width and sits at its natural
                    height. */}
                <div className="flex flex-col gap-5 max-w-3xl">
                  {detail.roleSummary && (
                    <DetailBlock label="Role Summary" text={detail.roleSummary} />
                  )}
                  {detail.skillsRequired && (
                    <DetailBlock label="Skills Required" text={detail.skillsRequired} />
                  )}
                  {detail.domainContext && (
                    <DetailBlock label="Domain Context" text={detail.domainContext} />
                  )}
                </div>

                {/* Mobile apply */}
                <a
                  href={job.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lg:hidden inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-white bg-[#2D6A4F] hover:bg-[#1B4332] transition-colors"
                >
                  Apply on company site
                  <ExternalLink className="w-3 h-3" strokeWidth={2.5} />
                </a>
              </div>
            ) : (
              <p className="py-3 text-[12px] text-[#5a6a64]">
                Click Apply to see full details on the company website.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p
        className="text-[10px] font-bold uppercase text-[#2D6A4F] mb-1"
        style={{
          letterSpacing: '0.1em',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
        }}
      >
        {label}
      </p>
      <p
        className="text-[12px] text-[#3a4a44] leading-relaxed whitespace-pre-wrap break-words"
      >
        {text}
      </p>
    </div>
  );
}

/* ============================================================
   StatBlock - Header stat display
   ============================================================ */

function UploadStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p
        className="text-[16px] font-extrabold text-gt-leaf leading-none"
        style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
      >
        {value}
      </p>
      <p
        className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white/50"
        style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
      >
        {label}
      </p>
    </div>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-2 px-4 first:pl-0">
      <div
        className="text-[30px] md:text-[36px] font-extrabold text-white leading-none tracking-tight"
        style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
      >
        {value}
      </div>
      <div
        className="text-[10px] font-bold uppercase text-white/45 tracking-[0.2em]"
        style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
      >
        {label}
      </div>
    </div>
  );
}

function StatBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="text-[28px] md:text-[32px] font-bold text-gt-leaf leading-none tracking-tight"
        style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
      >
        {value}
      </div>
      <div
        className="text-[10px] font-bold uppercase text-white/50 leading-tight"
        style={{ letterSpacing: '0.18em' }}
      >
        {label}
      </div>
    </div>
  );
}

/* ============================================================
   Small UI primitives
   ============================================================ */

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="appearance-none pl-3 pr-7 py-2 border border-[#e5e7e5] bg-white text-[12px] text-[#081C15] cursor-pointer focus:outline-none focus:border-[#2D6A4F] transition-colors"
        style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#8a9a94] pointer-events-none"
        strokeWidth={2}
      />
    </div>
  );
}

function PagButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center w-8 h-8 border border-[#e5e7e5] bg-white text-[#3a4a44] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition-colors"
    >
      {children}
    </button>
  );
}

/* ============================================================
   MatchProfileSetup — inline form shown when the Matched tab
   opens and no profile has been saved yet. Three quick picks,
   then apply.
   ============================================================ */

/* ============================================================
   MatchProcessBanner — shown in the Matched tab when the user
   has not yet uploaded a resume. Redesigned as a 2-column
   premium hero: narrative + step flow on the left, elevated
   drag-and-drop style upload card on the right.
   ============================================================ */

const MATCH_STEPS = [
  {
    step: '01',
    title: 'Upload your resume',
    blurb: 'We parse your skills, roles, and years of experience automatically.',
  },
  {
    step: '02',
    title: 'Update your preferences',
    blurb: 'Set your preferred region and experience level in your dashboard.',
  },
  {
    step: '03',
    title: 'See your matches',
    blurb: 'Every live job, scored and ranked against your profile.',
  },
  {
    step: '04',
    title: 'Re-match as you grow',
    blurb: 'Finish a course and your match scores update across the board.',
  },
];

function MatchProcessBanner({ onUpload }: { onUpload: () => void }) {
  function handleUploadClick() {
    // Simulated upload for the preview. Real flow hits a resume parser.
    onUpload();
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 md:p-10"
      style={{
        background:
          'linear-gradient(135deg, #0B1F18 0%, #081C15 50%, #0B2A22 100%)',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(82,183,136,0.22) 0%, rgba(82,183,136,0.04) 55%, transparent 75%)',
          filter: 'blur(10px)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-16 w-[380px] h-[380px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(64,145,108,0.18) 0%, transparent 70%)',
          filter: 'blur(14px)',
        }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr] gap-10 items-start">
        {/* ============== LEFT: narrative + step flow ============== */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gt-leaf/30 bg-gt-leaf/10 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-gt-leaf" strokeWidth={2.2} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-gt-leaf"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              Managed job search
            </span>
          </div>

          <h2 className="text-[28px] md:text-[36px] font-extrabold text-white leading-[1.1] tracking-tight">
            We do the job search.{' '}
            <span className="text-gt-leaf">You do the interviews.</span>
          </h2>
          <p className="mt-4 text-[14px] md:text-[15px] text-white/70 leading-relaxed max-w-lg">
            Upload your resume once. We score every live role on the board
            against your profile, and re-rank continuously as you finish
            courses and pick up new skills.
          </p>

          {/* Connected step flow */}
          <ol className="mt-8 space-y-4">
            {MATCH_STEPS.map((s, i) => (
              <li key={s.step} className="flex items-start gap-4 relative">
                {/* Vertical connector */}
                {i < MATCH_STEPS.length - 1 && (
                  <span
                    className="absolute left-[14px] top-8 bottom-[-18px] w-px bg-gt-leaf/25"
                    aria-hidden
                  />
                )}
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-gt-leaf/15 border border-gt-leaf/40 flex items-center justify-center text-[10px] font-bold text-gt-leaf z-10"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  {s.step}
                </span>
                <div className="pt-0.5">
                  <p className="text-[13.5px] font-bold text-white leading-snug">
                    {s.title}
                  </p>
                  <p className="mt-1 text-[12.5px] text-white/55 leading-relaxed">
                    {s.blurb}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* ============== RIGHT: upload card ============== */}
        <div className="lg:self-center">
          <div
            className="relative rounded-2xl p-7 text-center"
            style={{
              background:
                'radial-gradient(ellipse at top, rgba(82,183,136,0.10), rgba(11,31,24,0.6))',
              border: '1.5px dashed rgba(140,212,202,0.35)',
            }}
          >
            {/* Pulsing sparkle */}
            <div className="mx-auto relative mb-5 w-16 h-16">
              <span
                className="absolute inset-0 rounded-full bg-gt-leaf/25 animate-ping"
                aria-hidden
              />
              <span className="relative flex w-16 h-16 rounded-full bg-gt-leaf text-gt-text-dark items-center justify-center">
                <Sparkles className="w-7 h-7" strokeWidth={2.2} />
              </span>
            </div>

            <p className="text-[16px] font-bold text-white leading-snug">
              Drop your resume to unlock every match
            </p>
            <p
              className="mt-2 text-[11px] text-white/55 tracking-wider"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              PDF or DOCX · parsed in under 5 seconds
            </p>

            <button
              type="button"
              onClick={handleUploadClick}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 text-[13px] font-bold text-gt-text-dark bg-gt-leaf hover:bg-white transition-colors rounded-full"
            >
              <Sparkles className="w-4 h-4" strokeWidth={2.5} />
              Upload resume
            </button>

            <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-3 gap-3 text-left">
              <div>
                <p
                  className="text-[16px] font-extrabold text-gt-leaf leading-none"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  All
                </p>
                <p
                  className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white/50"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  Live jobs scored
                </p>
              </div>
              <div>
                <p
                  className="text-[16px] font-extrabold text-gt-leaf leading-none"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  &lt; 5s
                </p>
                <p
                  className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white/50"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  Resume parse
                </p>
              </div>
              <div>
                <p
                  className="text-[16px] font-extrabold text-gt-leaf leading-none"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  Free
                </p>
                <p
                  className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white/50"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  Top 2 matches
                </p>
              </div>
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] text-white/45 leading-snug">
            Upgrade to Individual to unlock every match on the board.
          </p>
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   LockedDetailPrompt - Shown when an anonymous visitor expands
   a job card whose detail is gated behind sign-in.

   The list stays fully open (so visitors see real volume and
   variety); only the detail payload is gated. Copy is honest
   about why - no silent failures.
   ============================================================ */

function LockedDetailPrompt({ jobTitle }: { jobTitle: string }) {
  return (
    <div className="py-4 flex items-start gap-3 rounded-lg bg-gt-leaf/5 border border-gt-leaf/15 px-4">
      <div className="shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-gt-leaf/10 text-gt-leaf">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-gt-text-dark leading-snug">
          Sign in to see the full brief for {jobTitle}
        </p>
        <p
          className="mt-1 text-[12px] text-[#5a6a64] leading-snug"
          style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}
        >
          Role summary, required skills, and domain context open up with a free
          Greentryst account. No credit card required.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-1.5 rounded-md bg-gt-leaf px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-gt-leaf-dark transition-colors"
          >
            Create free account
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#e5e7e5] bg-white px-3 py-1.5 text-[12px] font-semibold text-gt-text-dark hover:bg-[#f5f7f6] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
