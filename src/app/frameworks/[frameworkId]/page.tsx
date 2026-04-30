/**
 * /frameworks/[frameworkId] — Greentryst's landing page for a single
 * disclosure framework. Brutalist editorial treatment: heavy typography,
 * rules as hierarchy, restrained color, semantic HTML throughout.
 *
 * SEO infrastructure is load-bearing. Real H1/H2/H3, definition-list
 * cover sheet, answer-shaped paragraph near the top, FAQ section wrapped
 * in FAQPage JSON-LD, ItemList for the pillars.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
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
  getFramework,
  getFrameworkStaticParams,
  type DisclosureEntry,
  type PillarMeta,
} from '@/lib/frameworks';
import { getCourse } from '@/lib/courses';
import { lessonIdToUrl } from '@/lib/url-helpers';

export const dynamicParams = false;

export function generateStaticParams() {
  return getFrameworkStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: { frameworkId: string };
}): Promise<Metadata> {
  const fw = getFramework(params.frameworkId);
  if (!fw) return { title: 'Framework not found' };
  const title = fw.seo_title ?? `${fw.name}: Practitioner Guide | Greentryst`;
  const description =
    fw.seo_description ??
    fw.summary.replace(/\s+/g, ' ').trim().slice(0, 160);
  const canonical = `/frameworks/${fw.id}`;
  const url = `${SITE_URL}${canonical}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: 'Greentryst',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

// Real issuer abbreviations — no invented codes.
const ISSUER_SHORT: Record<string, string> = {
  'ifrs-s2': 'ISSB (IFRS Foundation)',
  'ifrs-s1': 'ISSB (IFRS Foundation)',
  gri: 'GRI',
  esrs: 'EFRAG',
  csrd: 'European Commission',
  brsr: 'SEBI',
  tcfd: 'FSB',
  tnfd: 'TNFD Taskforce',
  sasb: 'IFRS Foundation',
  cdp: 'CDP Worldwide',
};

const SUPERSEDES: Record<string, string> = {
  'ifrs-s2': 'TCFD Recommendations',
};

/**
 * Entities substantively discussed on the page. Rendered into schema.org
 * `mentions` so search engines and AI crawlers recognise which other
 * authoritative entities this page is semantically connected to. Each URL
 * is verified: either the issuer's own canonical page or a Wikipedia
 * article. Do NOT add entities that are not actually discussed on the
 * page (Google penalises hollow mentions).
 */
type MentionEntity = {
  type: 'Organization' | 'CreativeWork';
  name: string;
  url: string;
};

const PAGE_MENTIONS: Record<string, MentionEntity[]> = {
  'ifrs-s2': [
    {
      type: 'Organization',
      name: 'International Sustainability Standards Board',
      url: 'https://www.ifrs.org/groups/international-sustainability-standards-board/',
    },
    {
      type: 'Organization',
      name: 'IFRS Foundation',
      url: 'https://www.ifrs.org/',
    },
    {
      type: 'CreativeWork',
      name: 'Task Force on Climate-related Financial Disclosures',
      url: 'https://www.fsb-tcfd.org/',
    },
    {
      type: 'CreativeWork',
      name: 'IFRS S1 General Requirements for Disclosure of Sustainability-related Financial Information',
      url: 'https://www.ifrs.org/issued-standards/ifrs-sustainability-standards-navigator/ifrs-s1-general-requirements/',
    },
    {
      type: 'CreativeWork',
      name: 'SASB Standards',
      url: 'https://sasb.ifrs.org/',
    },
  ],
};

// Plain-English key points per pillar. Authored copy, not extracted from
// the verbatim standard. Keyed by `${frameworkId}:${pillarId}`.
const PILLAR_KEY_POINTS: Record<string, string[]> = {
  'ifrs-s2:governance': [
    'Who at the board actually owns climate decisions',
    'Whether those people have the expertise to do it',
    'How climate gets onto board and committee agendas',
    'Whether executive pay is tied to climate targets',
  ],
  'ifrs-s2:strategy': [
    'Which climate risks and opportunities affect the business',
    'How those risks change the business model and strategy',
    'The financial impact today, and projected over time',
    'How resilient the strategy is under different climate scenarios',
  ],
  'ifrs-s2:risk-management': [
    'How climate risks are identified and prioritised',
    'How the size and likelihood of each risk is assessed',
    'Whether climate risk sits inside existing enterprise risk processes',
    'How the picture is updated as conditions change',
  ],
  'ifrs-s2:metrics-and-targets': [
    'Your Scope 1, 2, and 3 greenhouse gas emissions',
    'Exposure to transition risks like carbon pricing',
    'Exposure to physical risks like floods and heatwaves',
    'Climate targets you have set, and progress against them',
  ],
};

const MONO =
  'font-redesign-mono text-[10px] font-bold uppercase tracking-[0.22em]';
const MONO_SM =
  'font-redesign-mono text-[11px] font-bold uppercase tracking-[0.2em]';

export default function FrameworkOverviewPage({
  params,
}: {
  params: { frameworkId: string };
}) {
  const fw = getFramework(params.frameworkId);
  if (!fw) notFound();

  const liveDisclosureCount = fw.disclosures.length;
  const livePillars = fw.pillars.filter((p) => p.status === 'live');
  const livePillarCount = livePillars.length;

  const relatedCourses = fw.related_courses
    .map((id) => {
      try {
        return getCourse(id);
      } catch {
        return null;
      }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const disclosuresByPillar = new Map<string, DisclosureEntry[]>();
  for (const d of fw.disclosures) {
    const arr = disclosuresByPillar.get(d.pillar) ?? [];
    arr.push(d);
    disclosuresByPillar.set(d.pillar, arr);
  }

  const demoClause =
    fw.disclosures.find((d) => d.ref === '6(a)') ?? fw.disclosures[0] ?? null;

  const issuer = ISSUER_SHORT[fw.id] ?? fw.issuer;
  const supersedes = SUPERSEDES[fw.id];

  // FAQ content — per framework. IFRS S2 gets real authored answers;
  // other frameworks fall back to a short generic set until authored.
  const faqs = buildFaqs(fw);

  const pageUrl = `${SITE_URL}/frameworks/${fw.id}`;

  const mentions = PAGE_MENTIONS[fw.id] ?? [];
  const creativeWorkLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${pageUrl}#framework`,
    url: pageUrl,
    name: `Greentryst Practitioner Guide to ${fw.short_name}`,
    headline: fw.name,
    alternateName: fw.short_name,
    description: [fw.summary, fw.long_summary]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim(),
    creator: { '@type': 'Organization', name: fw.issuer },
    author: { '@id': DESKS.climateDisclosure.id },
    reviewedBy: { '@id': EDITORIAL_ID },
    publisher: { '@id': ORG_ID },
    inLanguage: 'en',
    ...(fw.last_reviewed ? { dateModified: fw.last_reviewed } : {}),
    about: fw.pillars.map((p) => ({
      '@type': 'Thing',
      name: `${fw.short_name} ${p.name}`,
    })),
    hasPart: fw.pillars
      .filter((p) => p.status === 'live')
      .map((p) => ({
        '@type': 'CreativeWork',
        '@id': `${pageUrl}/${p.slug}#article`,
        name: `${fw.short_name}: ${p.name}`,
        url: `${pageUrl}/${p.slug}`,
      })),
    ...(mentions.length > 0
      ? {
          mentions: mentions.map((m) => ({
            '@type': m.type,
            name: m.name,
            url: m.url,
          })),
        }
      : {}),
    keywords: [
      fw.short_name,
      fw.name,
      fw.issuer,
      'sustainability disclosure',
      'climate disclosure',
      ...fw.pillars.map((p) => p.name),
    ].join(', '),
  };

  const pillarsListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${pageUrl}#pillars`,
    name: `${fw.short_name} pillars`,
    numberOfItems: fw.pillars.length,
    itemListElement: fw.pillars.map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: `${fw.short_name} ${p.name}`,
      url: `${pageUrl}/${p.slug}`,
    })),
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a.replace(/\s+/g, ' ').trim(),
      },
    })),
  };

  return (
    <>
      <JsonLd data={creativeWorkLd} />
      <JsonLd data={pillarsListLd} />
      <JsonLd data={faqLd} />
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', url: '/' },
          { name: 'Frameworks', url: '/frameworks' },
          { name: fw.short_name },
        ])}
      />
      <Nav />

      {/* ==================================================================
          TITLE PAGE — cover sheet meta on left, massive title on right
          ================================================================== */}
      <section className="bg-white pt-28 pb-14">
        <div className="max-w-[1280px] mx-auto px-10">
          {/* Masthead strip */}
          <div className="flex items-center justify-between pb-4 border-b border-black/80">
            <p className={`${MONO} text-black/85`}>
              <Link href="/" className="hover:text-gt-medium transition-colors">
                Greentryst
              </Link>{' '}
              /{' '}
              <Link
                href="/frameworks"
                className="hover:text-gt-medium transition-colors"
              >
                Frameworks
              </Link>{' '}
              / <span className="text-black">{fw.short_name}</span>
            </p>
            <p className={`${MONO} text-black/60`}>
              Updated April 2026 · Greentryst Climate Disclosure Desk
            </p>
          </div>

          {/* Title block — cover sheet */}
          <div className="grid grid-cols-12 gap-10 pt-14 pb-16">
            {/* Title column (left) */}
            <div className="col-span-12 md:col-span-8 md:order-1">
              <p className={`${MONO_SM} text-gt-medium mb-6`}>
                Standard · Climate · Global Baseline
              </p>
              <h1 className="font-extrabold text-black leading-[0.95] tracking-[-0.03em] text-[72px] md:text-[120px] mb-4">
                {fw.short_name}.
              </h1>
              <p className="text-[24px] md:text-[32px] font-semibold text-black/80 leading-[1.15] tracking-tight mb-8 max-w-[620px]">
                {fw.name.replace(`${fw.short_name}:`, '').trim() ||
                  'Practitioner Guide'}
              </p>
              <p className="text-[16px] text-black/70 leading-[1.7] max-w-[620px]">
                Greentryst's step-by-step implementation guide to{' '}
                {fw.short_name}, written for reporting teams, auditors, and
                boards. Every paragraph of
                the standard, from{' '}
                <span className="font-semibold text-black">
                  {fw.pillars.map((p) => p.name).join(', ').replace(/, ([^,]*)$/, ' and $1')}
                </span>
                , is reproduced verbatim, translated into plain language,
                and paired with an illustrative disclosure showing what a strong
                disclosure looks like. {fw.pillars.length} pillars,{' '}
                {liveDisclosureCount} clauses guided, authored by the
                Climate Disclosure Desk and reviewed by an independent
                Editorial Board before publication.
              </p>
            </div>

            {/* Meta column (right) */}
            <div className="col-span-12 md:col-span-4 md:order-2 md:border-l md:border-black/15 md:pl-10">
              <p className={`${MONO} text-gt-medium mb-5`}>Cover Sheet</p>
              <dl className="space-y-3.5">
                <CoverRow label="Document" value={fw.short_name} />
                <CoverRow
                  label="Title"
                  value={fw.name.replace(`${fw.short_name}:`, '').trim() || fw.name}
                />
                <CoverRow
                  label="Issuer"
                  value={issuer}
                  href={fw.issuer_url}
                />
                <CoverRow label="Type" value={fw.type} />
                {fw.effective_from && (
                  <CoverRow label="Effective" value={fw.effective_from} />
                )}
                {supersedes && (
                  <CoverRow label="Supersedes" value={supersedes} />
                )}
                <CoverRow
                  label="Adoption"
                  value={fw.jurisdictions
                    .filter((j) => j !== 'global')
                    .map((j) => j.toUpperCase())
                    .join(' · ') || 'Global'}
                />
                <CoverRow
                  label="Sections"
                  value={`${fw.pillars.length} pillars · ${liveDisclosureCount} clauses guided`}
                />
                <CoverRow
                  label="Status"
                  value={fw.status === 'final' ? 'In force' : fw.status}
                />
              </dl>
            </div>
          </div>

          <div className="h-1 bg-black" aria-hidden />
        </div>
      </section>

      {/* ==================================================================
          ANSWER PARAGRAPH — what is X? AI Overview bait.
          ================================================================== */}
      <section className="bg-[#faf8f4]">
        <div className="max-w-[1280px] mx-auto px-10 py-14">
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-12 md:col-span-4">
              <p className={`${MONO} text-black/60 mb-2`}>
                Answer · What is {fw.short_name}?
              </p>
            </div>
            <div className="col-span-12 md:col-span-8">
              <p className="text-[19px] md:text-[22px] leading-[1.55] text-black font-medium">
                {fw.summary}
              </p>
              {fw.long_summary && (
                <p className="mt-5 text-[16px] leading-[1.75] text-black/70">
                  {fw.long_summary}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          CONTENTS — pillar rows. Hover expands an illuminated-initial
          preview; click navigates to the full pillar guide.
          ================================================================== */}
      <section className="bg-white">
        <div className="max-w-[1280px] mx-auto px-10 pt-16 pb-16">
          <div className="mb-5">
            <p className={`${MONO} text-black`}>
              {fw.pillars.length} Key Pillars for {fw.short_name} Disclosures
            </p>
          </div>
          <div className="h-[2px] bg-black" aria-hidden />
          <ol>
            {fw.pillars.map((pillar, idx) => {
              const count = disclosuresByPillar.get(pillar.id)?.length ?? 0;
              return (
                <ContentsRow
                  key={pillar.id}
                  frameworkId={fw.id}
                  pillar={pillar}
                  index={idx}
                  count={count}
                  disclosures={disclosuresByPillar.get(pillar.id) ?? []}
                />
              );
            })}
          </ol>
        </div>
      </section>

      {/* ==================================================================
          THREE-VOICE DEMO — anatomy of one clause
          ================================================================== */}
      {demoClause && (
        <section className="bg-black text-white">
          <div className="max-w-[1280px] mx-auto px-10 py-20">
            <div className="grid grid-cols-12 gap-10 mb-10">
              <div className="col-span-12 md:col-span-4">
                <p className={`${MONO} text-gt-leaf mb-3`}>
                  From Rule to Disclosure
                </p>
              </div>
              <div className="col-span-12 md:col-span-8">
                <h2 className="text-[36px] md:text-[52px] font-extrabold leading-[1.02] tracking-tight">
                  {fw.short_name} Paragraph {demoClause.ref}
                </h2>
                <p className="mt-4 text-[16px] text-white/60 italic">
                  Every clause on Greentryst is read three ways. Here is
                  the pattern, applied to {fw.short_name} paragraph{' '}
                  {demoClause.ref}.
                </p>
              </div>
            </div>

            <div className="h-[2px] bg-white" aria-hidden />

            {/* Voice 1 — Requirement, rendered in mono */}
            <VoiceBlock
              number="01"
              label="Requirement · Verbatim"
              family="mono"
              body={demoClause.requirement_text}
              footer={`Source: ${fw.short_name} paragraph ${demoClause.ref}`}
            />
            <div className="h-[1px] bg-white/30" aria-hidden />

            {/* Voice 2 — What it means, Inter regular */}
            {demoClause.plain_english && (
              <>
                <VoiceBlock
                  number="02"
                  label="What it means · Plain language"
                  family="sans"
                  body={demoClause.plain_english}
                  footer="Climate Disclosure Desk · Greentryst"
                />
                <div className="h-[1px] bg-white/30" aria-hidden />
              </>
            )}

            {/* Voice 3 — Exemplar, Inter italic */}
            {demoClause.example_disclosure && (
              <VoiceBlock
                number="03"
                label="Illustrative Disclosure · What a good disclosure looks like"
                family="italic"
                body={demoClause.example_disclosure}
                footer="Illustrative pattern · Not attributed"
              />
            )}
          </div>
        </section>
      )}

      {/* ==================================================================
          JURISDICTIONAL ADOPTION TABLE — featured-snippet bait, real
          semantic <table> with caption / thead / tbody.
          ================================================================== */}
      {fw.jurisdictions_detailed && fw.jurisdictions_detailed.length > 0 && (
        <section className="bg-[#faf8f4]">
          <div className="max-w-[1280px] mx-auto px-10 py-20">
            <div className="grid grid-cols-12 gap-10 mb-8">
              <div className="col-span-12 md:col-span-4">
                <p className={`${MONO} text-gt-medium mb-3`}>
                  Jurisdictional Adoption
                </p>
              </div>
              <div className="col-span-12 md:col-span-8">
                <h2 className="text-[36px] md:text-[48px] font-extrabold leading-[1.04] tracking-tight text-black">
                  Where {fw.short_name} has been adopted.
                </h2>
                <p className="mt-4 text-[15.5px] text-black/70 leading-[1.7] max-w-[640px]">
                  Adoption is jurisdiction-led. Each regulator decides
                  scope, timing, and how the standard is incorporated
                  locally. Status as of April 2026.
                </p>
              </div>
            </div>

            <div className="h-[2px] bg-black mb-6" aria-hidden />

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <caption className="sr-only">
                  {fw.short_name} adoption status by jurisdiction
                </caption>
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className={`${MONO} text-black/60 py-3 pr-4 align-bottom whitespace-nowrap`}>
                      Jurisdiction
                    </th>
                    <th className={`${MONO} text-black/60 py-3 pr-4 align-bottom whitespace-nowrap`}>
                      Regulator
                    </th>
                    <th className={`${MONO} text-black/60 py-3 pr-4 align-bottom whitespace-nowrap`}>
                      Status
                    </th>
                    <th className={`${MONO} text-black/60 py-3 pr-4 align-bottom whitespace-nowrap`}>
                      First mandatory period
                    </th>
                    <th className={`${MONO} text-black/60 py-3 align-bottom`}>
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fw.jurisdictions_detailed.map((row, i) => (
                    <tr
                      key={row.name}
                      className={`border-b border-black/10 ${i % 2 === 1 ? 'bg-white/60' : ''} hover:bg-white transition-colors`}
                    >
                      <td className="py-4 pr-4 text-[15px] font-bold text-black align-top whitespace-nowrap">
                        {row.name}
                      </td>
                      <td className="py-4 pr-4 text-[14px] text-black/80 align-top whitespace-nowrap">
                        {row.regulator}
                      </td>
                      <td className="py-4 pr-4 text-[14px] text-black/80 align-top whitespace-nowrap">
                        {row.status}
                      </td>
                      <td className="py-4 pr-4 text-[14px] text-black/80 align-top">
                        {row.period}
                      </td>
                      <td className="py-4 text-[14px] text-black/70 leading-snug align-top">
                        {row.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={`${MONO} text-black/40 mt-5`}>
              Sources: regulator publications. Updated April 2026.
            </p>
          </div>
        </section>
      )}

      {/* ==================================================================
          FAQ — brutalist Q.NN headers with prose answers + FAQPage JSON-LD
          ================================================================== */}
      {faqs.length > 0 && (
        <section className="bg-white">
          <div className="max-w-[1280px] mx-auto px-10 py-20">
            <div className="flex items-end justify-between mb-5">
              <p className={`${MONO} text-black`}>Frequently Asked</p>
              <p className={`${MONO} text-black/50`}>
                {faqs.length} question{faqs.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="h-[2px] bg-black mb-12" aria-hidden />
            <div className="space-y-10">
              {faqs.map((f, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-6 md:gap-10 pb-10 border-b border-black/10"
                >
                  <div className="col-span-12 md:col-span-4">
                    <p className={`${MONO} text-gt-medium mb-2`}>
                      Q.{String(i + 1).padStart(2, '0')}
                    </p>
                    <h3 className="text-[22px] md:text-[26px] font-extrabold leading-[1.15] tracking-tight text-black">
                      {f.q}
                    </h3>
                  </div>
                  <div className="col-span-12 md:col-span-8">
                    {f.aStructured ? (
                      <>
                        <p className="text-[16px] leading-[1.75] text-black/80 mb-4">
                          {f.aStructured.lead}
                        </p>
                        <dl className="space-y-3">
                          {f.aStructured.items.map((item) => (
                            <div
                              key={item.label}
                              className="grid grid-cols-12 gap-3 border-b border-black/10 pb-3 last:border-b-0"
                            >
                              <dt
                                className={`${MONO} col-span-12 md:col-span-3 text-gt-medium pt-1`}
                              >
                                {item.label}
                              </dt>
                              <dd className="col-span-12 md:col-span-9 text-[15.5px] leading-[1.7] text-black/80">
                                {item.text}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </>
                    ) : (
                      <p className="text-[16px] leading-[1.75] text-black/80">
                        {f.a}
                      </p>
                    )}
                    {f.lesson && (
                      <Link
                        href={`/courses/${fw.related_courses[0] ?? fw.id}/${lessonIdToUrl(f.lesson.id)}`}
                        className={`${MONO} text-gt-medium hover:text-black inline-flex items-center gap-1.5 mt-4 underline decoration-gt-medium/40 hover:decoration-black underline-offset-4`}
                      >
                        Lesson {f.lesson.id} · {f.lesson.title}
                        <ArrowUpRight
                          className="w-3 h-3 flex-shrink-0"
                          strokeWidth={2.25}
                        />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================================================================
          RELATED COURSE — a single bold brutalist CTA block
          ================================================================== */}
      {relatedCourses.length > 0 && (
        <section className="bg-[#faf8f4]">
          <div className="max-w-[1280px] mx-auto px-10 py-16">
            <p className={`${MONO} text-black mb-5`}>Go Deeper</p>
            <div className="h-[2px] bg-black mb-8" aria-hidden />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group block bg-white border border-black/10 p-8 hover:bg-black hover:text-white transition-colors"
                >
                  <p className={`${MONO} text-gt-medium group-hover:text-gt-leaf mb-4`}>
                    Greentryst Course
                  </p>
                  <h3 className="text-[26px] font-extrabold leading-[1.1] tracking-tight mb-3">
                    {course.title}
                  </h3>
                  {course.subtitle && (
                    <p className="text-[15px] leading-relaxed text-black/70 group-hover:text-white/70 mb-6">
                      {course.subtitle}
                    </p>
                  )}
                  <span className={`${MONO} text-gt-medium group-hover:text-gt-leaf inline-flex items-center gap-1`}>
                    Open the course
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================================================================
          COLOPHON — thick rule, mono credits
          ================================================================== */}
      <section className="bg-black text-white">
        <div className="max-w-[1280px] mx-auto px-10 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className={`${MONO} text-white/70`}>
              Greentryst Practitioner Guide · {fw.short_name} · 2026
            </p>
            <p className={`${MONO} text-white/50`}>
              Climate Disclosure Desk · Reviewed by Editorial Board · Updated
              April 2026
            </p>
          </div>
        </div>
      </section>

      <RedesignFooter />
    </>
  );
}

/* ============================ helpers ================================= */

function CoverRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="grid grid-cols-12 gap-3 border-b border-black/10 pb-3">
      <dt
        className={`${MONO} col-span-4 text-black/50 self-start pt-0.5`}
      >
        {label}
      </dt>
      <dd className="col-span-8 text-[13.5px] font-semibold text-black leading-tight">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-baseline gap-1 hover:text-gt-medium transition-colors underline decoration-black/20 hover:decoration-gt-medium underline-offset-2"
          >
            {value}
            <ArrowUpRight
              className="w-3 h-3 self-center flex-shrink-0"
              strokeWidth={2}
            />
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function ContentsRow({
  frameworkId,
  pillar,
  index,
  count,
}: {
  frameworkId: string;
  pillar: PillarMeta;
  index: number;
  count: number;
  disclosures: DisclosureEntry[];
}) {
  const isLive = pillar.status === 'live';
  const num = String(index + 1).padStart(2, '0');
  const initial = pillar.name.charAt(0).toUpperCase();
  const href = `/frameworks/${frameworkId}/${pillar.slug}`;
  const keyPoints = PILLAR_KEY_POINTS[`${frameworkId}:${pillar.id}`] ?? [];

  const baseRow = (
    <div className="grid grid-cols-12 gap-6 items-center py-5 px-6 transition-colors">
      <div className="col-span-2 md:col-span-1">
        <span className={`${MONO} text-black/50 group-hover:text-white/60`}>
          {num}
        </span>
      </div>
      <div className="col-span-7 md:col-span-6">
        <span className="text-[20px] md:text-[26px] font-extrabold tracking-tight">
          {pillar.name}
        </span>
      </div>
      <div className="hidden md:block md:col-span-3">
        <span className={`${MONO} text-black/50 group-hover:text-white/60`}>
          {isLive
            ? `${count} clause${count === 1 ? '' : 's'}`
            : 'Forthcoming'}
        </span>
      </div>
      <div className="col-span-3 md:col-span-2 text-right">
        <span
          className={`${MONO} ${isLive ? 'text-gt-medium group-hover:text-white' : 'text-black/40'} inline-flex items-center gap-1 justify-end`}
        >
          {isLive ? (
            <>
              Open guide
              <ArrowUpRight className="w-3 h-3" strokeWidth={2.25} />
            </>
          ) : (
            '···'
          )}
        </span>
      </div>
    </div>
  );

  const expandPanel = (
    <div className="grid grid-cols-12 gap-6 max-h-0 group-hover:max-h-[560px] overflow-hidden transition-[max-height] duration-500 ease-out px-6">
      {/* Spacer column aligning under the "01" number */}
      <div className="hidden md:block md:col-span-1" />

      {/* Drop-cap initial column — aligned under the title column */}
      <div className="col-span-12 md:col-span-3 px-3 md:px-0">
        <div
          aria-hidden
          className="font-extrabold leading-[0.8] tracking-[-0.06em] select-none text-white"
          style={{ fontSize: 'clamp(120px, 12vw, 180px)' }}
        >
          {initial}
        </div>
      </div>

      {/* Content column */}
      <div className="col-span-12 md:col-span-7 px-3 md:px-0 pb-8 md:pr-6">
        <p className="text-[15.5px] leading-[1.7] text-white/90 mb-6 max-w-[640px]">
          {pillar.summary}
        </p>

        {keyPoints.length > 0 && (
          <div>
            <p className={`${MONO} text-white/60 mb-3`}>Inside this pillar</p>
            <ul className="space-y-2">
              {keyPoints.map((point, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-[14.5px] leading-snug text-white/90"
                >
                  <span
                    className="mt-2 w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0"
                    aria-hidden
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  if (!isLive) {
    return (
      <li className="block border-b border-black/10 opacity-60">
        {baseRow}
      </li>
    );
  }

  return (
    <li className="block border-b border-black/10">
      <Link
        href={href}
        className="group block hover:bg-gt-medium hover:text-white transition-colors"
        aria-label={`Open the ${pillar.name} pillar guide`}
      >
        {baseRow}
        {expandPanel}
      </Link>
    </li>
  );
}

function VoiceBlock({
  number,
  label,
  family,
  body,
  footer,
}: {
  number: string;
  label: string;
  family: 'mono' | 'sans' | 'italic';
  body: string;
  footer: string;
}) {
  const bodyClass =
    family === 'mono'
      ? 'font-redesign-mono text-[14.5px] leading-[1.8] text-white tracking-tight'
      : family === 'italic'
        ? 'font-redesign-sans text-[19px] leading-[1.6] text-white italic tracking-tight'
        : 'font-redesign-sans text-[18px] leading-[1.65] text-white';
  return (
    <div className="grid grid-cols-12 gap-6 md:gap-10 py-10">
      <div className="col-span-12 md:col-span-4">
        <p className={`${MONO} text-gt-leaf mb-2`}>{number} · {label}</p>
      </div>
      <div className="col-span-12 md:col-span-8">
        <p className={bodyClass}>{body}</p>
        <p className={`${MONO} text-white/40 mt-4`}>{footer}</p>
      </div>
    </div>
  );
}

type Faq = {
  q: string;
  /**
   * Plain-text answer. ALWAYS used by FAQPage JSON-LD (Google requires
   * plain text). When `aStructured` is also provided, the visible render
   * uses the structured form; this string remains the canonical answer
   * for crawlers and AI extractors.
   */
  a: string;
  /**
   * Optional richer structure for display only. A short lead paragraph
   * followed by labelled items rendered as a definition list. Use for
   * comparison or enumeration answers where parallel structure reads
   * better than comma-separated prose.
   */
  aStructured?: {
    lead: string;
    items: { label: string; text: string }[];
  };
  /** Optional cross-link to the most relevant course lesson. */
  lesson?: { id: string; title: string };
};

function buildFaqs(fw: {
  id: string;
  short_name: string;
  name: string;
  issuer: string;
  effective_from?: string;
  long_summary?: string;
}): Faq[] {
  if (fw.id === 'ifrs-s2') {
    return [
      {
        q: 'What is IFRS S2?',
        a: 'IFRS S2 Climate-related Disclosures is the global baseline standard for corporate climate reporting. Issued by the International Sustainability Standards Board (ISSB) under the IFRS Foundation in June 2023, it carries forward the four TCFD pillars (Governance, Strategy, Risk Management, and Metrics and Targets) and adds quantitative and industry-based metric requirements drawn from the SASB Standards.',
        lesson: {
          id: '0.3',
          title: 'IFRS S2 at a Glance — Structure, Scope and Key Concepts',
        },
      },
      {
        q: 'Is IFRS S2 mandatory?',
        a: "IFRS S2 itself is a global standard, not law. It becomes mandatory in a given jurisdiction only when the local regulator adopts or endorses it. By April 2026, Australia, Canada, Brazil, Japan, Singapore, and Nigeria have done so on staggered timelines, the United Kingdom has endorsement underway, and the European Union has built interoperability with its own ESRS rather than direct adoption. For any specific entity, mandatory status depends on which regulator it reports to and the size or listing thresholds set in that jurisdiction.",
      },
      {
        q: 'When does IFRS S2 apply?',
        a: 'IFRS S2 is effective for annual reporting periods beginning on or after 1 January 2024. Adoption is jurisdiction-led: each regulator decides when in-scope entities must report, typically starting with listed issuers and large financial institutions. The United Kingdom, Australia, Canada, Brazil, Japan, Singapore, and Nigeria have adopted or formally referenced the standard, with staggered effective dates.',
        lesson: {
          id: '8.1',
          title: 'Effective Dates, Transition Reliefs and First-Year Reporting',
        },
      },
      {
        q: 'What are the transition reliefs under IFRS S2?',
        a: 'To smooth first-year adoption, paragraphs C3 to C5 of Appendix C provide transition reliefs. Entities can: (1) report only climate-related disclosures under IFRS S2 in their first reporting year, deferring broader IFRS S1 sustainability topics; (2) defer Scope 3 emissions disclosure by one year; (3) keep a previously used GHG measurement method, even if it is not GHG Protocol, in the first year; and (4) defer the comparative-period requirement for the first year of reporting. These reliefs are one-time and apply only to the first annual reporting period an entity applies the standard.',
        lesson: {
          id: '8.1',
          title: 'Effective Dates, Transition Reliefs and First-Year Reporting',
        },
      },
      {
        q: 'What are the four pillars of IFRS S2?',
        a: 'IFRS S2 organises climate-related disclosure around four pillars: Governance (oversight of climate-related risks and opportunities), Strategy (effects on business model, strategy, and financial planning), Risk Management (processes to identify, assess, and manage risks), and Metrics and Targets (greenhouse gas emissions, transition and physical risk exposure, and capital deployment). Every clause on this page sits within one of these pillars.',
        lesson: {
          id: '0.3',
          title: 'IFRS S2 at a Glance — Structure, Scope and Key Concepts',
        },
      },
      {
        q: 'Does IFRS S2 require Scope 3 emissions disclosure?',
        a: 'Yes. Paragraph 29 requires disclosure of absolute gross greenhouse gas emissions for Scopes 1, 2, and 3, measured in line with the GHG Protocol Corporate Standard. Scope 3 is the most demanding category because it covers value-chain emissions from suppliers, products in use, and downstream activities. Recognising the difficulty, IFRS S2 grants first-year transition reliefs for Scope 3 reporting, and a separate one-year relief for the Category 15 financed-emissions disclosure that financial institutions must produce. Disclosure must be disaggregated by Scope 3 category where material.',
        lesson: {
          id: '5.2',
          title: 'Scope 3 Emissions — Categories and Why They Matter',
        },
      },
      {
        q: 'Does IFRS S2 require scenario analysis?',
        a: "Yes. Paragraph 22 requires entities to assess and disclose climate resilience using climate-related scenario analysis. The analysis must consider the entity's identified climate-related risks and opportunities and use scenarios that are commensurate with the entity's circumstances, including at least one scenario aligned with the most ambitious global temperature goal in the Paris Agreement.",
        lesson: {
          id: '3.3',
          title: 'Climate Resilience and Scenario Analysis',
        },
      },
      {
        q: 'What assurance is required for IFRS S2 disclosures?',
        a: 'IFRS S2 itself does not prescribe an assurance requirement; that decision is left to local regulators. Several adopting jurisdictions are introducing assurance requirements separately, typically beginning with limited assurance and progressing to reasonable assurance over several years. Australia and the European Union (the latter under CSRD) have set explicit timelines for moving from limited to reasonable assurance on climate and broader sustainability disclosures. Practitioners should check the assurance regime in the jurisdictions they report into rather than assuming a uniform standard applies.',
      },
      {
        q: 'How does IFRS S2 relate to IFRS S1?',
        a: 'IFRS S1 is the general requirements standard for sustainability-related financial disclosures; IFRS S2 is the first topic-specific standard that sits under it. Entities reporting under IFRS S2 must also comply with IFRS S1 concepts of materiality, presentation, and connected information. The two were issued together in June 2023 as the first pair of IFRS Sustainability Disclosure Standards.',
        lesson: {
          id: '0.4',
          title: 'Materiality, Proportionality and Interoperability',
        },
      },
      {
        q: 'How is IFRS S2 different from TCFD?',
        a: 'IFRS S2 is the direct successor to the TCFD recommendations. It preserves the same four-pillar structure but makes the requirements a mandatory disclosure standard rather than a voluntary framework. It also adds specific metric categories: industry-based metrics from SASB, quantitative Scope 1, 2, and 3 emissions disclosure, and requirements around internal carbon pricing and remuneration linkages.',
        lesson: {
          id: '0.2',
          title: 'From TCFD to ISSB — The Road to IFRS S2',
        },
      },
      {
        q: 'How does IFRS S2 differ from CSRD and ESRS?',
        a: "Three key differences. Scope: IFRS S2 covers climate alone, while ESRS E1 is the climate counterpart inside a much wider set of twelve ESRS topical standards covering environment, social, and governance topics. Materiality: IFRS S2 uses a single financial-materiality lens, while ESRS uses double materiality (financial impact on the entity plus the entity's impact on people and planet). Authority: IFRS S2 is a voluntary global standard adopted jurisdiction by jurisdiction, while ESRS is mandatory for entities in scope of the EU's Corporate Sustainability Reporting Directive (CSRD).",
        aStructured: {
          lead: 'Three key differences.',
          items: [
            {
              label: 'Scope',
              text: "IFRS S2 covers climate alone. ESRS E1 is the climate counterpart inside a much wider set of twelve ESRS topical standards covering environment, social, and governance topics.",
            },
            {
              label: 'Materiality',
              text: "IFRS S2 uses a single financial-materiality lens. ESRS uses double materiality — the financial impact on the entity plus the entity's impact on people and planet.",
            },
            {
              label: 'Authority',
              text: "IFRS S2 is a voluntary global standard adopted jurisdiction by jurisdiction. ESRS is mandatory for entities in scope of the EU's Corporate Sustainability Reporting Directive (CSRD).",
            },
          ],
        },
        lesson: {
          id: '0.4',
          title: 'Materiality, Proportionality and Interoperability',
        },
      },
    ];
  }
  return [
    {
      q: `What is ${fw.short_name}?`,
      a: fw.long_summary ?? fw.name,
    },
  ];
}
