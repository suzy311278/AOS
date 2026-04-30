/**
 * /intel — Vulnerability Intelligence dashboard.
 *
 * Phase 1 renders the static seed (`listAdvisories()`). Phase 4 will
 * back this with a real CISA ICS-CERT ingestion pipeline writing to
 * `ics_advisories` (drizzle migration 0001).
 *
 * The dashboard prioritises:
 *   - severity at a glance (LED colour + CVSS)
 *   - vendor / product
 *   - SL impact (more useful than raw CVSS for OT)
 *   - protocols affected (filterable in Phase 4)
 *   - age (stale advisories deprioritise)
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Activity, AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { listAdvisories, ADVISORIES, type Severity } from '@/lib/armor/seed';

export const metadata: Metadata = {
  title: 'Vulnerability Intelligence — ICS/OT Advisories',
  description:
    'Live OT vulnerability intelligence: CISA ICS-CERT advisories with SL impact mapping, protocol coverage, and asset matching against your inventory.',
  alternates: { canonical: '/intel' },
};

const SEV_LABEL: Record<Severity, string> = {
  crit: 'Critical',
  warn: 'High',
  ok: 'Medium',
};

const SEV_TEXT: Record<Severity, string> = {
  crit: 'text-red-300',
  warn: 'text-amber-200',
  ok: 'text-emerald-300',
};

export default function IntelDashboardPage() {
  const advisories = listAdvisories();
  const counts = {
    crit: advisories.filter((a) => a.severity === 'crit').length,
    warn: advisories.filter((a) => a.severity === 'warn').length,
    ok:   advisories.filter((a) => a.severity === 'ok').length,
  };

  // Distinct vendors and protocols, sorted, capped — for the filter row.
  const vendors = Array.from(new Set(ADVISORIES.map((a) => a.vendor))).sort();
  const protocols = Array.from(
    new Set(ADVISORIES.flatMap((a) => a.protocols)),
  ).sort();

  return (
    <>
      {/* HERO — dark, live feel */}
      <section className="relative overflow-hidden bg-ai-deep border-b border-ai-line-deep">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none ai-bg-grid opacity-40 [background-size:24px_24px]"
        />
        <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 pt-16 pb-12 lg:pt-20">
          <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-cyber">
            <Activity className="h-3.5 w-3.5 animate-ai-data-flicker" />
            Live · ICS-CERT Stream
          </p>
          <h1 className="mt-3 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-ai-ink-on-deep max-w-3xl">
            Vulnerability intelligence{' '}
            <span className="text-ai-cyber-glow">prioritised by SL impact.</span>
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-ai-ink-on-deep-soft max-w-3xl">
            Every CISA ICS-CERT advisory, normalised against IEC 62443 Security
            Levels and your asset inventory. Filter by vendor, protocol, or SL
            target — see the relevant lab and hardening checklist in one click.
          </p>

          {/* Severity tally */}
          <dl className="mt-9 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
            <SevTally
              label="Critical"
              value={counts.crit}
              icon={ShieldAlert}
              tone="bg-red-500/10 text-red-300 ring-red-400/30"
            />
            <SevTally
              label="High"
              value={counts.warn}
              icon={AlertTriangle}
              tone="bg-amber-400/10 text-amber-200 ring-amber-300/30"
            />
            <SevTally
              label="Medium"
              value={counts.ok}
              icon={ShieldCheck}
              tone="bg-emerald-500/10 text-emerald-300 ring-emerald-400/30"
            />
            <div className="rounded-ai-card border border-ai-line-deep bg-ai-deep-2 p-4">
              <p className="font-ai-mono text-[10px] tracking-ai-eyebrow uppercase text-ai-ink-on-deep-dim">
                Total tracked
              </p>
              <p className="mt-1 text-[26px] font-extrabold font-ai-mono text-ai-ink-on-deep">
                {advisories.length}
              </p>
              <p className="mt-1 font-ai-mono text-[10.5px] text-ai-ink-on-deep-dim">
                last 30 days · seed
              </p>
            </div>
          </dl>
        </div>
      </section>

      {/* Filter chips (Phase 4 wires real filters) */}
      <section className="bg-ai-bg-soft border-b border-ai-line">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-5 flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex items-center gap-2 shrink-0">
            <p className="font-ai-mono text-[10.5px] tracking-ai-eyebrow uppercase text-ai-ink-dim">
              Vendor
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {vendors.slice(0, 5).map((v) => (
                <li
                  key={v}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-ai-bg border border-ai-line font-ai-mono text-[11px] text-ai-ink"
                >
                  {v}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <p className="font-ai-mono text-[10.5px] tracking-ai-eyebrow uppercase text-ai-ink-dim">
              Protocol
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {protocols.slice(0, 8).map((p) => (
                <li
                  key={p}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-ai-bg border border-ai-line font-ai-mono text-[11px] text-ai-ink"
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <p className="ml-auto font-ai-mono text-[10.5px] text-ai-ink-dim">
            Phase 4 → live filter + asset match
          </p>
        </div>
      </section>

      {/* Advisory table */}
      <section className="bg-ai-deep">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-12">
          <div className="rounded-ai-card border border-ai-line-deep bg-ai-deep-2 overflow-hidden shadow-ai-card-deep">
            <div className="grid grid-cols-12 px-4 py-2.5 border-b border-ai-line-deep text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-on-deep-dim">
              <span className="col-span-3">Advisory</span>
              <span className="col-span-2">Vendor</span>
              <span className="col-span-3">Title</span>
              <span className="col-span-2">SL impact</span>
              <span className="col-span-1 text-right">CVSS</span>
              <span className="col-span-1 text-right">Age</span>
            </div>
            {advisories.map((a) => (
              <Link
                key={a.id}
                href={`/intel/${a.id}`}
                className="grid grid-cols-12 px-4 py-3 items-center text-[13px] font-ai-mono text-ai-ink-on-deep border-b border-ai-line-deep last:border-0 hover:bg-white/[0.03] transition-colors"
              >
                <span className="col-span-3 flex items-center gap-2 text-ai-cyber-glow">
                  <span className={`ai-led ai-led--${a.severity}`} aria-hidden />
                  {a.id}
                </span>
                <span className="col-span-2 text-ai-ink-on-deep-soft truncate">{a.vendor}</span>
                <span className="col-span-3 text-ai-ink-on-deep truncate">{a.title}</span>
                <span className="col-span-2 text-ai-ink-on-deep-soft">
                  {a.isaImpact.join(' · ')}
                </span>
                <span className={`col-span-1 text-right font-bold ${SEV_TEXT[a.severity]}`}>
                  {a.cvss.toFixed(1)}
                </span>
                <span className="col-span-1 text-right text-ai-ink-on-deep-dim">{a.age}</span>
              </Link>
            ))}
          </div>

          <p className="mt-4 font-ai-mono text-[11px] text-ai-ink-on-deep-dim">
            Showing {advisories.length} advisories. Severity tier:{' '}
            {(['crit', 'warn', 'ok'] as Severity[]).map((s, i) => (
              <span key={s} className={SEV_TEXT[s]}>
                {i > 0 && ' · '}
                <span className={`ai-led ai-led--${s}`} aria-hidden /> {SEV_LABEL[s]}
              </span>
            ))}
          </p>
        </div>
      </section>
    </>
  );
}

function SevTally({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <div className={`rounded-ai-card ring-1 p-4 ${tone}`}>
      <p className="flex items-center gap-1.5 font-ai-mono text-[10px] tracking-ai-eyebrow uppercase">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 text-[26px] font-extrabold font-ai-mono">{value}</p>
    </div>
  );
}
