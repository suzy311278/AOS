/**
 * /knowledge — Knowledge Base index.
 *
 * Lists every armor course (KNOWLEDGE_COURSES). Cards are grouped by
 * status (available / beta / coming-soon) and tagged with the
 * specialist track they belong to.
 *
 * Phase 2 (course engine) replaces the static seed with a real loader
 * that walks `src/content/armor/*` and validates the YAML schema.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Beaker, Award, Filter, Radio } from 'lucide-react';
import {
  listKnowledgeViews,
  type KnowledgeView,
  type KnowledgeViewTrack,
  type KnowledgeViewStatus,
} from '@/lib/armor/knowledge';
import { IconShield, IconTerminal, IconNetwork, IconRTU, IconHMI } from '@/components/armor';

export const metadata: Metadata = {
  title: 'Knowledge Base — IEC 62443 & ICS Security Courses',
  description:
    'The ArmorInnovate Knowledge Base: structured courses on IEC 62443, ICS pentesting, and OT defense. Every lesson is referenced to a specific IEC part or NIST SP 800-82 chapter.',
  alternates: { canonical: '/knowledge' },
};

const TRACK_ICON: Record<KnowledgeViewTrack, typeof IconShield> = {
  foundations: IconShield,
  'risk-assessment': IconNetwork,
  design: IconTerminal,
  maintenance: IconRTU,
  capstone: IconHMI,
};

const TRACK_LABEL: Record<KnowledgeViewTrack, string> = {
  foundations: 'Foundations',
  'risk-assessment': 'Risk Assessment',
  design: 'Design',
  maintenance: 'Maintenance',
  capstone: 'Capstone',
};

const STATUS_BADGE: Record<KnowledgeViewStatus, { label: string; tone: string }> = {
  available:    { label: 'Available',     tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  beta:         { label: 'Beta',          tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
  'coming-soon': { label: 'Coming soon',  tone: 'bg-slate-100 text-slate-700 ring-slate-200' },
};

export default function KnowledgeIndexPage() {
  const courses: KnowledgeView[] = listKnowledgeViews();
  const totalLessons = courses.reduce(
    (n, c) => n + c.modules.reduce((m, mod) => m + mod.lessons, 0),
    0,
  );
  const totalHours = courses.reduce((n, c) => n + c.hours + c.labHours, 0);
  const liveCount = courses.filter((c) => c.source === 'live').length;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-ai-line">
        <div aria-hidden className="absolute inset-0 pointer-events-none ai-bg-grid opacity-60" />
        <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 pt-16 pb-12 lg:pt-20">
          <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
            Knowledge Base
          </p>
          <h1 className="mt-3 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-ai-ink max-w-3xl">
            ICS / SCADA security, <span className="text-ai-primary">referenced.</span>
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-ai-ink-soft max-w-3xl">
            Five courses cover the full IEC 62443 path. Every lesson cites the
            specific IEC part or NIST SP 800-82 chapter it draws from — no hidden
            footnotes, no synthesised summaries without provenance. Each course
            ends with a hands-on lab.
          </p>

          <dl className="mt-8 grid grid-cols-3 gap-6 max-w-xl">
            {[
              { k: 'Courses',  v: String(courses.length) },
              { k: 'Lessons',  v: String(totalLessons) },
              { k: 'Hours',    v: `${totalHours}h` },
            ].map((s) => (
              <div key={s.k} className="border-l-2 border-ai-primary pl-3">
                <dt className="text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-dim">
                  {s.k}
                </dt>
                <dd className="mt-1 text-[22px] font-extrabold font-ai-mono text-ai-ink">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* COURSE GRID */}
      <section className="bg-ai-bg-soft">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-14">
          <header className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
                The Curriculum
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-ai-ink">
                All courses in the programme
              </h2>
            </div>
            <p className="inline-flex items-center gap-3 text-[12px] font-ai-mono text-ai-ink-dim">
              <span className="inline-flex items-center gap-1">
                <Radio className="h-3.5 w-3.5 text-ai-primary" />
                {liveCount}/{courses.length} live YAML
              </span>
              <span className="inline-flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                Phase 2 will add filter & search
              </span>
            </p>
          </header>

          <ul className="grid md:grid-cols-2 gap-5">
            {courses.map((c) => {
              const Icon = TRACK_ICON[c.track];
              const badge = STATUS_BADGE[c.status];
              const lessons = c.modules.reduce((n, m) => n + m.lessons, 0);
              return (
                <li key={c.slug}>
                  <Link
                    href={`/knowledge/${c.slug}`}
                    className="block rounded-ai-card border border-ai-line bg-ai-bg shadow-ai-tile hover:shadow-ai-tile-hover hover:border-ai-primary/30 transition-all overflow-hidden group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex items-center justify-center h-11 w-11 rounded-ai-tile bg-ai-primary/10 text-ai-primary ring-1 ring-ai-primary/20 group-hover:bg-ai-primary group-hover:text-white transition-colors">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono rounded-full ring-1 ${badge.tone}`}>
                          {badge.label}
                        </span>
                      </div>

                      <p className="mt-4 font-ai-mono text-[11px] tracking-ai-mono text-ai-primary">
                        {c.code || 'AI-CSP-???'} · {TRACK_LABEL[c.track]}
                        {c.source === 'live' && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-ai-ink-dim">
                            <span className="h-1.5 w-1.5 rounded-full bg-ai-primary" /> live
                          </span>
                        )}
                      </p>
                      <h3 className="mt-1 text-[18px] font-bold text-ai-ink leading-tight">
                        {c.title}
                      </h3>
                      <p className="mt-2 text-[13.5px] text-ai-ink-soft leading-relaxed">
                        {c.tagline}
                      </p>

                      <dl className="mt-5 grid grid-cols-3 gap-3">
                        <Stat icon={BookOpen} label="Lessons" value={String(lessons)} />
                        <Stat icon={Beaker}   label="Lab"     value={`${c.labHours}h`} />
                        <Stat icon={Award}    label="Theory"  value={`${c.hours}h`} />
                      </dl>

                      <p className="mt-5 inline-flex items-center gap-1 text-[12px] font-bold font-ai-mono uppercase tracking-ai-mono text-ai-primary group-hover:gap-2 transition-all">
                        Open course
                        <ArrowRight className="h-3.5 w-3.5" />
                      </p>
                    </div>

                    {/* IEC parts strip */}
                    <div className="border-t border-ai-line px-6 py-3 bg-ai-bg-soft flex flex-wrap gap-1.5">
                      {c.parts.map((p) => (
                        <span
                          key={p}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-ai-bg border border-ai-line font-ai-mono text-[10.5px] text-ai-ink"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
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
    <div>
      <span className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-dim">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <p className="mt-0.5 text-[15px] font-extrabold font-ai-mono text-ai-ink">{value}</p>
    </div>
  );
}
