/**
 * /frameworks/[frameworkId]/[pillarId] — pillar page.
 *
 * Renders every disclosure in the pillar inline at a stable anchor ID.
 * Each row presents three panels:
 *
 *   Requirement           — verbatim standard text.
 *   What it means         — plain-English explanation from the Desk.
 *   What good looks like  — instructive exemplar (never a real-company
 *                           attributed quote).
 *
 * A sticky TOC sidebar lists every disclosure; anchor IDs follow the
 * refToAnchor() transformation (e.g. 6(a)(i) -> 6-a-i).
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  breadcrumbList,
  SITE_URL,
  ORG_ID,
  EDITORIAL_ID,
  DESKS,
} from '@/lib/seo/schema';
import {
  getFrameworkPillar,
  getFrameworkPillarStaticParams,
  type DisclosureEntry,
} from '@/lib/frameworks';
import { PillarTOC } from '@/components/frameworks/PillarTOC';
import { lessonIdToUrl } from '@/lib/url-helpers';

export const dynamicParams = false;

export function generateStaticParams() {
  return getFrameworkPillarStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: { frameworkId: string; pillarId: string };
}): Promise<Metadata> {
  const result = getFrameworkPillar(params.frameworkId, params.pillarId);
  if (!result) return { title: 'Pillar not found' };
  const { framework, pillar } = result;
  return {
    title: `${framework.short_name} ${pillar.name}`,
    description: pillar.summary.replace(/\s+/g, ' ').trim().slice(0, 160),
    alternates: {
      canonical: `/frameworks/${framework.id}/${pillar.slug}`,
    },
  };
}

export default function PillarPage({
  params,
}: {
  params: { frameworkId: string; pillarId: string };
}) {
  const result = getFrameworkPillar(params.frameworkId, params.pillarId);
  if (!result) notFound();
  const { framework, pillar, disclosures } = result;

  const pageUrl = `${SITE_URL}/frameworks/${framework.id}/${pillar.slug}`;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${pageUrl}#article`,
    headline: `${framework.short_name}: ${pillar.name}`,
    description: pillar.summary.replace(/\s+/g, ' ').trim(),
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    inLanguage: 'en',
    author: { '@id': DESKS.climateDisclosure.id },
    reviewedBy: { '@id': EDITORIAL_ID },
    editor: { '@id': EDITORIAL_ID },
    publisher: { '@id': ORG_ID },
    isPartOf: {
      '@id': `${SITE_URL}/frameworks/${framework.id}#framework`,
      name: framework.name,
    },
    about: disclosures.map((d) => ({
      '@type': 'Thing',
      name: `${framework.short_name} ${d.ref}`,
    })),
  };

  return (
    <>
      <JsonLd data={articleLd} />
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', url: '/' },
          { name: 'Frameworks', url: '/frameworks' },
          { name: framework.short_name, url: `/frameworks/${framework.id}` },
          { name: pillar.name },
        ])}
      />
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gt-text-dark pt-32 pb-14">
        <div
          className="gt-ambient-glow-dark absolute -top-20 left-1/3 w-[600px] h-[600px] rounded-full"
          aria-hidden
        />
        <div
          className="gt-dot-grid absolute inset-0 opacity-40 pointer-events-none"
          aria-hidden
        />
        <div className="relative z-10 max-w-[1100px] mx-auto px-8">
          <Link
            href={`/frameworks/${framework.id}`}
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase text-gt-leaf/80 hover:text-gt-leaf mb-6"
            style={{ letterSpacing: '0.22em' }}
          >
            <ArrowLeft className="w-3 h-3" strokeWidth={2} />
            {framework.short_name} overview
          </Link>
          <p
            className="text-[11px] font-bold uppercase text-gt-leaf mb-3"
            style={{ letterSpacing: '0.25em' }}
          >
            Pillar {pillar.order} of {framework.pillars.length}
          </p>
          <h1 className="text-[40px] md:text-[48px] font-extrabold text-white leading-[1.05] mb-5 max-w-3xl">
            {framework.short_name}: {pillar.name}
          </h1>
          <p className="text-[17px] text-white/70 max-w-2xl leading-relaxed">
            {pillar.summary}
          </p>
          <div className="mt-8 flex items-center gap-6 text-white/60 text-[12px]">
            <span className="inline-flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" strokeWidth={1.75} />
              {disclosures.length} disclosure
              {disclosures.length === 1 ? '' : 's'}
            </span>
            <span>Authored by Greentryst Climate Disclosure Desk</span>
          </div>
        </div>
      </section>

      {/* Two-column body */}
      <main className="bg-[#fafbfa] py-14">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex gap-10">
            {/* TOC */}
            <aside className="hidden lg:block w-[240px] flex-shrink-0">
              <PillarTOC
                disclosures={disclosures}
                pillarName={pillar.name}
              />
            </aside>

            {/* Disclosures column */}
            <div className="flex-1 min-w-0">
              <div className="space-y-10">
                {disclosures.map((d) => (
                  <DisclosureBlock
                    key={d.ref}
                    disclosure={d}
                    framework={{
                      id: framework.id,
                      short_name: framework.short_name,
                      related_courses: framework.related_courses,
                    }}
                  />
                ))}
              </div>

              {/* Pillar-level course CTA (send-off) */}
              <div className="mt-14">
                <Link
                  href={`/courses/${framework.related_courses[0] ?? framework.id}`}
                  className="group relative overflow-hidden flex items-center justify-between gap-6 rounded-2xl bg-gt-text-dark px-7 py-6 text-white shadow-[0_10px_30px_rgba(24,24,27,0.12)]"
                >
                  <div
                    className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-gt-leaf/20 blur-3xl pointer-events-none"
                    aria-hidden
                  />
                  <div className="relative flex items-center gap-4 min-w-0">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gt-leaf/15 border border-gt-leaf/30">
                      <BookOpen
                        className="w-5 h-5 text-gt-leaf"
                        strokeWidth={1.75}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] font-redesign-mono text-gt-leaf mb-1">
                        In-depth course
                      </p>
                      <p className="text-[17px] font-semibold leading-tight">
                        Go deeper with our in-depth course on{' '}
                        {framework.short_name}
                      </p>
                      <p className="text-[12px] text-white/60 mt-1">
                        Self-paced lessons covering every pillar, authored by
                        the Climate Disclosure Desk.
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    className="relative w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </Link>
              </div>

              {/* Back link */}
              <div className="mt-10 pt-6 border-t border-[#e5e7e5]">
                <Link
                  href={`/frameworks/${framework.id}`}
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-gt-medium hover:text-gt-dark"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                  Back to {framework.short_name} overview
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <RedesignFooter />
    </>
  );
}

function DisclosureBlock({
  disclosure,
  framework,
}: {
  disclosure: DisclosureEntry;
  framework: { id: string; short_name: string; related_courses: string[] };
}) {
  const d = disclosure;
  const hasCommentary =
    d.plain_english.length > 0 || d.example_disclosure.length > 0;
  const monoLabel =
    'text-[10px] font-bold uppercase tracking-[0.22em] font-redesign-mono';
  const refLabel = d.ref;
  const parentLabel = d.parent ? d.parent : null;

  return (
    <section id={d.anchor} className="scroll-mt-24">
      {/* Ref header */}
      <div className="flex items-center justify-between mb-4 px-1 gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`${monoLabel} text-gt-medium bg-gt-medium/10 rounded-md px-2.5 py-1`}
          >
            {framework.short_name} {refLabel}
          </span>
          {parentLabel && (
            <span className="text-[11px] text-gt-text-dim">
              under {parentLabel}
            </span>
          )}
          {d.related_lessons[0] && (
            <Link
              href={`/courses/${d.related_lessons[0].course}/${lessonIdToUrl(d.related_lessons[0].lesson)}`}
              className="inline-flex items-center gap-1 text-[11px] text-gt-text-muted hover:text-gt-medium transition-colors"
            >
              <BookOpen className="w-3 h-3" strokeWidth={1.75} />
              Lesson {d.related_lessons[0].lesson}
            </Link>
          )}
        </div>
        <a
          href={`#${d.anchor}`}
          className="text-[11px] text-gt-text-dim hover:text-gt-medium transition-colors"
          aria-label={`Permanent link to disclosure ${d.ref}`}
        >
          permalink
        </a>
      </div>

      {/* Three-column panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1 — Requirement (paper/warm) */}
        <div className="rounded-2xl bg-gt-pale-warm shadow-[0_1px_2px_rgba(11,31,21,0.04)] p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm">
              <FileText className="w-4 h-4 text-gt-text" strokeWidth={1.75} />
            </span>
            <p className={`${monoLabel} text-gt-text-muted`}>Requirement</p>
          </div>
          <p className="text-[14.5px] text-gt-text leading-[1.7] flex-1">
            {d.requirement_text}
          </p>
          <p
            className={`${monoLabel} text-gt-text-dim mt-4 pt-3 border-t border-gt-text/5`}
          >
            Verbatim · {framework.short_name}
          </p>
        </div>

        {/* Column 2 — What it means (teal tint) */}
        <div className="rounded-2xl bg-gt-medium/[0.06] shadow-[0_1px_2px_rgba(45,106,79,0.05)] p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gt-medium/15">
              <Lightbulb
                className="w-4 h-4 text-gt-medium"
                strokeWidth={1.75}
              />
            </span>
            <p className={`${monoLabel} text-gt-medium`}>What it means</p>
          </div>
          {d.plain_english ? (
            <p className="text-[14.5px] text-gt-text leading-[1.7] flex-1">
              {d.plain_english}
            </p>
          ) : (
            <p className="text-[13px] text-gt-text-dim italic flex-1">
              In preparation by the Climate Disclosure Desk.
            </p>
          )}
          <p
            className={`${monoLabel} text-gt-medium/70 mt-4 pt-3 border-t border-gt-medium/10`}
          >
            Plain English · Greentryst
          </p>
        </div>

        {/* Column 3 — Exemplar (dark product card) */}
        <div className="relative rounded-2xl bg-gt-card-dark text-gt-text-on-dark p-6 flex flex-col overflow-hidden shadow-[0_10px_30px_rgba(24,24,27,0.12)]">
          <div
            className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-gt-leaf/20 blur-3xl pointer-events-none"
            aria-hidden
          />
          <div className="relative flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gt-leaf/40 bg-gt-leaf/10">
              <CheckCircle2
                className="w-4 h-4 text-gt-leaf"
                strokeWidth={1.75}
              />
            </span>
            <p className={`${monoLabel} text-gt-leaf`}>Illustrative Disclosure</p>
          </div>
          {d.example_disclosure ? (
            <div className="relative flex-1">
              <div
                className="absolute left-0 top-0 bottom-0 w-[2px] bg-gt-leaf/60"
                aria-hidden
              />
              <p className="pl-4 text-[14.5px] leading-[1.7] text-gt-text-on-dark/95">
                {d.example_disclosure}
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-gt-text-on-dark-muted italic flex-1">
              Illustrative disclosure in preparation.
            </p>
          )}
          <p
            className={`${monoLabel} text-gt-text-on-dark-muted mt-4 pt-3 border-t border-white/10 relative`}
          >
            What a good disclosure looks like
          </p>
        </div>
      </div>

      {!hasCommentary && (
        <p className="text-[12px] text-gt-text-dim italic mt-4 px-1">
          Commentary by the Climate Disclosure Desk is in preparation.
        </p>
      )}

      {/* Product CTA — single, prominent, the only per-row action */}
      <button
        type="button"
        disabled
        title="The readiness assessment tool is coming soon."
        className="group mt-5 w-full flex items-center justify-between gap-4 rounded-xl bg-gt-medium hover:bg-gt-dark transition-colors px-5 py-3 text-white text-left cursor-not-allowed shadow-[0_6px_20px_rgba(45,106,79,0.15)]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex-shrink-0">
            <ClipboardCheck className="w-4 h-4" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex items-baseline gap-3 flex-wrap">
            <p className="text-[14px] font-semibold leading-tight">
              Assess this condition for a company
            </p>
            <p className="text-[11px] text-white/65">
              Readiness check against {framework.short_name} {refLabel} ·
              Greentryst Assessor, coming soon
            </p>
          </div>
        </div>
        <ArrowRight
          className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5"
          strokeWidth={2}
        />
      </button>
    </section>
  );
}
