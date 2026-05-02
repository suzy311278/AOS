/**
 * /labs/[slug] — lab detail (Phase 1 stub).
 *
 * Renders the static lab brief: scenario, objectives, toolkit, success
 * criteria, related advisories, ISA SL coverage. The actual interactive
 * terminal is wired up in Phase 3 (xterm.js + WebSocket bridge to a
 * Docker-runner). For now we render a placeholder terminal pane so the
 * page reads as "the lab is real, the harness is being provisioned".
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Activity, ShieldCheck, Clock, Layers } from 'lucide-react';
import { LABS, getLab, ADVISORIES } from '@/lib/armor/seed';

const LabTerminal = dynamic(() => import('@/components/armor/lab/Terminal'), { ssr: false });

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return LABS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) return { title: 'Lab not found' };
  return {
    title: `${lab.shortLabel} — Lab ${lab.tag}`,
    description: lab.scenario,
    alternates: { canonical: `/labs/${lab.slug}` },
  };
}

const STATUS_BADGE: Record<string, { label: string; tone: string; led: 'ok' | 'warn' | 'crit' }> = {
  ready:       { label: 'Lab is ready',          tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200', led: 'ok'  },
  queue:       { label: 'Queue \u2014 boot delay', tone: 'bg-amber-50 text-amber-700 ring-amber-200',     led: 'warn' },
  maintenance: { label: 'Under maintenance',     tone: 'bg-rose-50 text-rose-700 ring-rose-200',           led: 'crit' },
};

export default async function LabDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) notFound();

  const advisories = ADVISORIES.filter((a) => lab.relatedAdvisories.includes(a.id));
  const status = STATUS_BADGE[lab.status];

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-ai-bg-soft border-b border-ai-line">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-3">
          <Link
            href="/labs"
            className="inline-flex items-center gap-1 text-[12px] font-ai-mono text-ai-ink-dim hover:text-ai-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All labs
          </Link>
        </div>
      </div>

      {/* HERO — dark terminal feel */}
      <section className="relative overflow-hidden bg-ai-deep border-b border-ai-line-deep">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none ai-bg-grid opacity-30 [background-size:24px_24px]"
        />
        <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 py-14 grid lg:grid-cols-12 gap-10">
          {/* Left — heading */}
          <div className="lg:col-span-7">
            <p className="flex items-center gap-2 font-ai-mono text-[10.5px] tracking-ai-eyebrow text-ai-cyber">
              <span className={`ai-led ai-led--${status.led}`} aria-hidden />
              {lab.tag} · {lab.protocol} · {lab.port}/{lab.unit}
            </p>
            <h1 className="mt-3 text-[28px] sm:text-[40px] font-extrabold leading-tight tracking-tight text-ai-ink-on-deep">
              {lab.title}
            </h1>
            <p className="mt-4 text-[15.5px] text-ai-ink-on-deep-soft leading-relaxed max-w-2xl">
              {lab.scenario}
            </p>

            <dl className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
              <DataPoint icon={Clock}       label="Duration" value={`${lab.durationMin}m`} />
              <DataPoint icon={Layers}      label="Level"    value={lab.difficulty} />
              <DataPoint icon={ShieldCheck} label="ISA SL"   value={lab.isaLevels.join(' · ')} />
              <DataPoint icon={Activity}    label="Track"    value={lab.track.split('-').join(' ')} />
            </dl>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                disabled={lab.status !== 'ready'}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-ai-tile bg-ai-cyber text-ai-deep font-bold font-ai-mono text-[12.5px] uppercase tracking-ai-mono hover:bg-ai-cyber-glow transition-colors shadow-ai-glow-cyber disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lab.status === 'ready' ? 'Boot environment' : 'Notify when available'}
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/certification"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-ai-tile border border-ai-line-deep text-ai-ink-on-deep hover:border-ai-cyber hover:text-ai-cyber-glow font-bold font-ai-mono text-[12.5px] uppercase tracking-ai-mono transition-colors"
              >
                Certification path
              </Link>
            </div>
          </div>

          {/* Right — live terminal */}
          <aside className="lg:col-span-5">
            <div className="rounded-ai-card border border-ai-line-deep bg-ai-deep-2 shadow-ai-card-deep overflow-hidden">
              <LabTerminal labSlug={lab.slug} className="" />
            </div>
          </aside>
        </div>
      </section>

      {/* OBJECTIVES + TOOLKIT */}
      <section className="bg-ai-bg">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-14 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
              Objectives
            </p>
            <ol className="mt-3 space-y-2.5">
              {lab.objectives.map((o, i) => (
                <li
                  key={o}
                  className="flex items-start gap-3 text-[14.5px] text-ai-ink-soft"
                >
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-ai-tile bg-ai-primary/10 text-ai-primary font-ai-mono text-[11px] font-bold ring-1 ring-ai-primary/20 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{o}</span>
                </li>
              ))}
            </ol>

            <p className="mt-10 text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
              Success criteria
            </p>
            <ul className="mt-3 space-y-2">
              {lab.successCriteria.map((s) => (
                <li key={s} className="flex items-start gap-2 text-[14.5px] text-ai-ink-soft">
                  <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-ai-primary shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Side rail */}
          <aside className="lg:col-span-5 space-y-5">
            <div className="rounded-ai-card border border-ai-line bg-ai-bg-soft p-5">
              <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-dim">
                Toolkit (provided in the runtime)
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {lab.toolkit.map((t) => (
                  <li
                    key={t}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-ai-bg border border-ai-line font-ai-mono text-[11px] text-ai-ink"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {advisories.length > 0 && (
              <div className="rounded-ai-card border border-ai-line bg-ai-bg-soft p-5">
                <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-dim">
                  Related advisories
                </p>
                <ul className="mt-3 space-y-2">
                  {advisories.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/intel/${a.id}`}
                        className="block group"
                      >
                        <p className="font-ai-mono text-[11px] tracking-ai-mono text-ai-primary group-hover:text-ai-primary-hover">
                          {a.id}
                          {a.cve && <span className="text-ai-ink-dim"> · {a.cve}</span>}
                        </p>
                        <p className="mt-0.5 text-[13px] font-bold text-ai-ink leading-tight">
                          {a.title}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}

function DataPoint({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="border-l-2 border-ai-cyber pl-3">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-on-deep-dim">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <p className="mt-1 text-[18px] font-extrabold font-ai-mono text-ai-ink-on-deep capitalize">{value}</p>
    </div>
  );
}
