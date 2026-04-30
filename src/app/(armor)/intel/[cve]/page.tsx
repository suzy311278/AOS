/**
 * /intel/[cve] — advisory detail.
 *
 * The dynamic segment matches an ICSA id (e.g. ICSA-24-009-01). Phase 1
 * uses the static seed; Phase 4 swaps the lookup for a DB query against
 * `ics_advisories`.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShieldAlert, ExternalLink } from 'lucide-react';
import {
  ADVISORIES,
  getAdvisory,
  relatedLabsForAdvisory,
  type Severity,
} from '@/lib/armor/seed';

interface PageProps {
  params: Promise<{ cve: string }>;
}

// The dynamic segment is named `[cve]` for the URL but the value
// matches the ICSA id in our seed (e.g. `ICSA-24-009-01`).
export function generateStaticParams() {
  return ADVISORIES.map((a) => ({ cve: a.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cve } = await params;
  const a = getAdvisory(cve);
  if (!a) return { title: 'Advisory not found' };
  return {
    title: `${a.id} — ${a.vendor} ${a.product}`,
    description: a.summary,
    alternates: { canonical: `/intel/${a.id}` },
  };
}

const SEV_BANNER: Record<Severity, { label: string; tone: string; led: 'ok' | 'warn' | 'crit' }> = {
  crit: { label: 'Critical', tone: 'bg-red-500/15 text-red-300 ring-red-400/30',     led: 'crit' },
  warn: { label: 'High',     tone: 'bg-amber-400/15 text-amber-200 ring-amber-300/30', led: 'warn' },
  ok:   { label: 'Medium',   tone: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30', led: 'ok'  },
};

export default async function AdvisoryDetailPage({ params }: PageProps) {
  const { cve } = await params;
  const a = getAdvisory(cve);
  if (!a) notFound();

  const banner = SEV_BANNER[a.severity];
  const labs = relatedLabsForAdvisory(a.id);

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-ai-bg-soft border-b border-ai-line">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-3">
          <Link
            href="/intel"
            className="inline-flex items-center gap-1 text-[12px] font-ai-mono text-ai-ink-dim hover:text-ai-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All advisories
          </Link>
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-ai-deep border-b border-ai-line-deep">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none ai-bg-grid opacity-30 [background-size:24px_24px]"
        />
        <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 py-14 grid lg:grid-cols-12 gap-10">
          {/* Left — meta */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ring-1 font-ai-mono text-[11px] font-bold uppercase tracking-ai-mono ${banner.tone}`}
              >
                <span className={`ai-led ai-led--${banner.led}`} aria-hidden />
                {banner.label}
              </span>
              <span className="font-ai-mono text-[12px] text-ai-ink-on-deep-dim">
                Published {a.publishedISO} · {a.age} ago
              </span>
            </div>

            <p className="mt-4 font-ai-mono text-[12px] tracking-ai-mono text-ai-cyber-glow">
              {a.id}
              {a.cve && <span className="text-ai-ink-on-deep-dim"> · {a.cve}</span>}
            </p>
            <h1 className="mt-2 text-[28px] sm:text-[40px] font-extrabold leading-tight tracking-tight text-ai-ink-on-deep">
              {a.title}
            </h1>
            <p className="mt-4 text-[15.5px] text-ai-ink-on-deep-soft leading-relaxed max-w-3xl">
              {a.summary}
            </p>
          </div>

          {/* Right — CVSS + product */}
          <aside className="lg:col-span-4">
            <div className="rounded-ai-card border border-ai-line-deep bg-ai-deep-2 p-5">
              <p className="font-ai-mono text-[10px] tracking-ai-eyebrow uppercase text-ai-ink-on-deep-dim">
                CVSS v3.1
              </p>
              <p className={`mt-1 text-[40px] font-extrabold font-ai-mono leading-none ${
                a.severity === 'crit' ? 'text-red-300' :
                a.severity === 'warn' ? 'text-amber-200' :
                'text-emerald-300'
              }`}>
                {a.cvss.toFixed(1)}
              </p>

              <div className="mt-5 space-y-2 text-[13px] font-ai-mono">
                <Row label="Vendor"  value={a.vendor} />
                <Row label="Product" value={a.product} />
                <Row label="SL impact" value={a.isaImpact.join(' · ')} />
                <Row label="Protocols" value={a.protocols.join(' · ')} />
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* MITIGATIONS + REFERENCES */}
      <section className="bg-ai-bg">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-14 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
              <ShieldAlert className="h-3.5 w-3.5" />
              Mitigations
            </p>
            <ol className="mt-4 space-y-3">
              {a.mitigations.map((m, i) => (
                <li
                  key={m}
                  className="flex items-start gap-3 rounded-ai-card border border-ai-line bg-ai-bg-soft p-4"
                >
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded-ai-tile bg-ai-primary/10 text-ai-primary font-ai-mono text-[11px] font-bold ring-1 ring-ai-primary/20 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[14px] text-ai-ink-soft leading-relaxed">{m}</span>
                </li>
              ))}
            </ol>
          </div>

          <aside className="lg:col-span-5 space-y-5">
            <div className="rounded-ai-card border border-ai-line bg-ai-bg-soft p-5">
              <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-dim">
                References
              </p>
              <ul className="mt-3 space-y-2.5">
                {a.references.map((r) => (
                  <li key={r.url}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-start gap-1.5 text-[13.5px] text-ai-primary hover:text-ai-primary-hover"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span className="font-ai-mono text-[12px] tracking-ai-mono">{r.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {labs.length > 0 && (
              <div className="rounded-ai-card border border-ai-line bg-ai-bg-soft p-5">
                <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-dim">
                  Practise the exploit
                </p>
                <ul className="mt-3 space-y-3">
                  {labs.map((l) => (
                    <li key={l.slug}>
                      <Link
                        href={`/labs/${l.slug}`}
                        className="block group"
                      >
                        <p className="font-ai-mono text-[11px] tracking-ai-mono text-ai-primary group-hover:text-ai-primary-hover">
                          {l.tag} · {l.protocol}
                        </p>
                        <p className="mt-0.5 text-[13.5px] font-bold text-ai-ink leading-tight">
                          {l.title}
                        </p>
                        <span className="mt-1 inline-flex items-center gap-1 font-ai-mono text-[11px] uppercase tracking-ai-mono text-ai-ink-dim group-hover:text-ai-primary">
                          Open lab <ArrowRight className="h-3 w-3" />
                        </span>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[10px] font-bold uppercase tracking-ai-eyebrow text-ai-ink-on-deep-dim">
        {label}
      </span>
      <span className="text-[12.5px] text-ai-ink-on-deep text-right truncate">{value}</span>
    </div>
  );
}
