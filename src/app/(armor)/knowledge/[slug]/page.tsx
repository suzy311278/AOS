/**
 * /knowledge/[slug] — course detail.
 *
 * Renders a single course from KNOWLEDGE_COURSES. Phase 2 swaps the
 * static seed for a real MDX-driven loader. For now the page presents:
 *
 *   - Hero (course code, title, tagline, status badge)
 *   - Outcomes (what you can do after passing)
 *   - Module / lesson schematic with lesson counts
 *   - IEC parts coverage chip row
 *   - Linked specialist + capstone reference
 *   - "Take to lab" CTA — links to a related lab if any
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ArrowLeft, ShieldCheck, BookOpen, Beaker, Award } from 'lucide-react';
import { LABS } from '@/lib/armor/seed';
import {
  getKnowledgeStaticSlugs,
  getKnowledgeView,
} from '@/lib/armor/knowledge';
import { SPECIALISTS } from '@/lib/armor/certification';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Pre-render every course at build time. Combines live + seed slugs.
export function generateStaticParams() {
  return getKnowledgeStaticSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = getKnowledgeView(slug);
  if (!course) return { title: 'Course not found' };
  return {
    title: `${course.title} — Knowledge Base`,
    description: course.summary,
    alternates: { canonical: `/knowledge/${course.slug}` },
  };
}

export default async function KnowledgeCoursePage({ params }: PageProps) {
  const { slug } = await params;
  const course = getKnowledgeView(slug);
  if (!course) notFound();

  const specialist =
    course.track === 'capstone'
      ? undefined
      : SPECIALISTS.find((s) => s.id === course.track);
  const relatedLabs = LABS.filter((l) =>
    course.track === 'capstone' ? false : l.specialist === course.track,
  );
  const totalLessons = course.modules.reduce((n, m) => n + m.lessons, 0);

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-ai-bg-soft border-b border-ai-line">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-3">
          <Link
            href="/knowledge"
            className="inline-flex items-center gap-1 text-[12px] font-ai-mono text-ai-ink-dim hover:text-ai-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All courses
          </Link>
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-ai-line bg-ai-bg">
        <div aria-hidden className="absolute inset-0 pointer-events-none ai-bg-grid opacity-50" />
        <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 py-14">
          <p className="font-ai-mono text-[11px] tracking-ai-mono text-ai-primary">
            {course.code}
          </p>
          <h1 className="mt-2 text-[32px] sm:text-[44px] font-extrabold leading-tight tracking-tight text-ai-ink max-w-3xl">
            {course.title}
          </h1>
          <p className="mt-4 text-[17px] text-ai-ink-soft max-w-3xl leading-relaxed">
            {course.tagline}
          </p>

          {/* Stat row */}
          <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
            <Stat icon={BookOpen} label="Lessons"      value={String(totalLessons)} />
            <Stat icon={Beaker}   label="Lab hours"    value={`${course.labHours}h`} />
            <Stat icon={Award}    label="Theory hours" value={`${course.hours}h`} />
            <Stat icon={ShieldCheck}
                  label="Status"
                  value={course.status === 'coming-soon' ? 'Coming' : course.status === 'beta' ? 'Beta' : 'Live'} />
          </dl>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {course.status === 'coming-soon' ? (
              <button
                disabled
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-ai-tile bg-ai-primary text-white font-bold font-ai-mono text-[12.5px] uppercase tracking-ai-mono disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Notify me
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                href={`/knowledge/${course.slug}/${course.modules[0]?.id ?? '0'}.1`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-ai-tile bg-ai-primary text-white font-bold font-ai-mono text-[12.5px] uppercase tracking-ai-mono hover:bg-ai-primary-hover transition-colors"
              >
                Start course
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {specialist && (
              <Link
                href="/certification"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-ai-tile border border-ai-line text-ai-ink hover:border-ai-primary hover:text-ai-primary font-bold font-ai-mono text-[12.5px] uppercase tracking-ai-mono transition-colors"
              >
                Track: {specialist.shortName}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* SUMMARY + IEC parts */}
      <section className="bg-ai-bg">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-14 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
              Course summary
            </p>
            <p className="mt-3 text-[16px] text-ai-ink-soft leading-relaxed">
              {course.summary}
            </p>

            <h2 className="mt-10 text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
              Outcomes
            </h2>
            <ul className="mt-3 space-y-2">
              {course.outcomes.map((o) => (
                <li key={o} className="flex items-start gap-2 text-[14.5px] text-ai-ink-soft">
                  <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-ai-primary shrink-0" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Side rail */}
          <aside className="lg:col-span-5 space-y-5">
            <div className="rounded-ai-card border border-ai-line bg-ai-bg-soft p-5">
              <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-dim">
                IEC parts covered
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {course.parts.map((p) => (
                  <li
                    key={p}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-ai-bg border border-ai-line font-ai-mono text-[11px] text-ai-ink"
                  >
                    IEC {p}
                  </li>
                ))}
              </ul>
            </div>

            {specialist && (
              <div className="rounded-ai-card border border-ai-line bg-ai-bg-soft p-5">
                <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-dim">
                  Counts toward certification
                </p>
                <p className="mt-2 font-ai-mono text-[12px] tracking-ai-mono text-ai-primary">
                  {specialist.code}
                </p>
                <p className="mt-1 text-[14px] font-bold text-ai-ink">{specialist.name}</p>
                <p className="mt-2 text-[13px] text-ai-ink-soft leading-relaxed">
                  Pass score {specialist.passingScore}% · Validity {specialist.validityYears} years
                </p>
                <Link
                  href="/certification"
                  className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold font-ai-mono uppercase tracking-ai-mono text-ai-primary hover:text-ai-primary-hover"
                >
                  Track detail
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* MODULE SCHEMATIC */}
      <section className="bg-ai-bg-soft border-y border-ai-line">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-14">
          <h2 className="text-2xl font-extrabold tracking-tight text-ai-ink">
            Modules
          </h2>
          <p className="mt-2 text-[14px] text-ai-ink-soft max-w-2xl">
            {totalLessons} lessons across {course.modules.length} modules. Each module
            ends with a knowledge check; the final module is the hands-on lab.
          </p>
          <ol className="mt-8 space-y-3">
            {course.modules.map((m) => {
              const firstLesson = m.firstLessonId ?? `${m.id}.1`;
              const isOpen = course.status !== 'coming-soon';
              const Wrapper = isOpen ? Link : 'div' as any;
              return (
                <li key={m.id}>
                  <Wrapper
                    {...(isOpen ? { href: `/knowledge/${course.slug}/${firstLesson}` } : {})}
                    className={`rounded-ai-card border border-ai-line bg-ai-bg p-4 flex items-center gap-4 ${
                      isOpen ? 'hover:border-ai-primary/30 hover:shadow-ai-tile transition-all cursor-pointer' : ''
                    }`}
                  >
                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-ai-tile bg-ai-primary/10 text-ai-primary ring-1 ring-ai-primary/20 font-ai-mono text-[12px] font-bold">
                      {m.id}
                    </span>
                    <div className="flex-1">
                      <p className="text-[15px] font-bold text-ai-ink">{m.title}</p>
                      <p className="mt-0.5 font-ai-mono text-[11px] tracking-ai-mono text-ai-ink-dim">
                        {m.lessons} lesson{m.lessons === 1 ? '' : 's'}
                      </p>
                    </div>
                    <span className="font-ai-mono text-[10.5px] uppercase tracking-ai-eyebrow text-ai-ink-dim flex items-center gap-1.5">
                      {isOpen ? (
                        <>Open <ArrowRight className="h-3 w-3" /></>
                      ) : 'TBD'}
                    </span>
                  </Wrapper>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* RELATED LABS */}
      {relatedLabs.length > 0 && (
        <section className="bg-ai-bg">
          <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-14">
            <h2 className="text-2xl font-extrabold tracking-tight text-ai-ink">
              Practise in the lab
            </h2>
            <p className="mt-2 text-[14px] text-ai-ink-soft max-w-2xl">
              These hands-on labs are scoped to the same specialist track.
            </p>
            <ul className="mt-6 grid md:grid-cols-2 gap-4">
              {relatedLabs.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/labs/${l.slug}`}
                    className="block rounded-ai-card border border-ai-line bg-ai-bg-soft p-5 hover:border-ai-primary/30 hover:shadow-ai-tile transition-all"
                  >
                    <p className="font-ai-mono text-[10.5px] tracking-ai-mono text-ai-primary">
                      {l.tag} · {l.protocol}
                    </p>
                    <h3 className="mt-1 text-[15px] font-bold text-ai-ink">
                      {l.title}
                    </h3>
                    <p className="mt-2 text-[12.5px] text-ai-ink-soft">
                      {l.durationMin} min · {l.difficulty}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold font-ai-mono uppercase tracking-ai-mono text-ai-primary">
                      Open lab
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="border-l-2 border-ai-primary pl-3">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-dim">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <p className="mt-1 text-[20px] font-extrabold font-ai-mono text-ai-ink">{value}</p>
    </div>
  );
}
