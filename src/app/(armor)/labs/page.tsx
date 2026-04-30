/**
 * /labs — Lab catalogue.
 *
 * Lists every entry in LABS as an HMI tile. The page is intentionally
 * dense (mono captions, blueprint grid background) so it reads more
 * like a SCADA mimic-diagram than a typical course list.
 *
 * Phase 3 wires `/labs/[slug]` into a real xterm.js + Docker runner.
 * For now the detail page is a static brief that says exactly what the
 * lab will do once its runtime boots.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Activity, Filter } from 'lucide-react';
import { LABS, type Lab } from '@/lib/armor/seed';
import {
  IconModbus,
  IconPLC,
  IconRTU,
  IconHMI,
  IconNetwork,
  IconShield,
  IconTerminal,
} from '@/components/armor';

export const metadata: Metadata = {
  title: 'Lab Environment — ICS Pentesting & OT Defense Sandboxes',
  description:
    'Hands-on labs against sandboxed PLC simulators (Modbus, S7comm, EtherNet/IP, IEC 104, OPC UA). Pentest the protocols without crashing your client\u2019s plant.',
  alternates: { canonical: '/labs' },
};

const STATUS_COLOR: Record<Lab['status'], 'ok' | 'warn' | 'crit'> = {
  ready: 'ok',
  queue: 'warn',
  maintenance: 'crit',
};

const STATUS_LABEL: Record<Lab['status'], string> = {
  ready: 'READY',
  queue: 'QUEUE',
  maintenance: 'MAINT',
};

const RUNTIME_ICON: Record<Lab['runtime'], typeof IconModbus> = {
  'pymodbus-simulator': IconModbus,
  'snap7-simulator': IconPLC,
  'cpppo-simulator': IconRTU,
  'view-me-mock': IconHMI,
  'iec104-simulator': IconNetwork,
  'opc-ua-mock': IconShield,
};

const TRACK_LABEL: Record<Lab['track'], string> = {
  'ics-pentest': 'ICS Pentest',
  'ot-defense': 'OT Defense',
  capstone: 'Capstone',
};

export default function LabsIndexPage() {
  const ready = LABS.filter((l) => l.status === 'ready').length;
  const minutesTotal = LABS.reduce((n, l) => n + l.durationMin, 0);

  return (
    <>
      {/* HERO — terminal feel */}
      <section className="relative overflow-hidden bg-ai-deep border-b border-ai-line-deep">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none ai-bg-grid opacity-40 [background-size:24px_24px]"
        />
        <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 pt-16 pb-14 lg:pt-20">
          <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-cyber">
            <Activity className="h-3.5 w-3.5 animate-ai-data-flicker" />
            Lab Environment · v0.1
          </p>
          <h1 className="mt-3 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-ai-ink-on-deep max-w-3xl">
            Pentest the protocols.{' '}
            <span className="text-ai-cyber-glow">Don’t pentest production.</span>
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-ai-ink-on-deep-soft max-w-3xl">
            Each lab boots an isolated simulator (pymodbus, snap7, cpppo, IEC 104, OPC UA)
            with a realistic plant scenario. Use the tools you’d ship in your kit:
            nmap NSE, mbtget, scapy, Wireshark. Capture pcap, write the finding, submit.
          </p>

          <dl className="mt-9 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
            {[
              { k: 'Total labs',    v: String(LABS.length) },
              { k: 'Ready now',     v: String(ready) },
              { k: 'Avg duration',  v: `${Math.round(minutesTotal / LABS.length)}m` },
              { k: 'Protocols',     v: '6+' },
            ].map((s) => (
              <div key={s.k} className="border-l-2 border-ai-cyber pl-3">
                <dt className="text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-on-deep-dim">
                  {s.k}
                </dt>
                <dd className="mt-1 text-[22px] font-extrabold font-ai-mono text-ai-ink-on-deep">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* HMI grid */}
      <section className="bg-ai-bg-soft">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-14">
          <header className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
                Available environments
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-ai-ink">
                Pick a runtime
              </h2>
            </div>
            <p className="inline-flex items-center gap-2 text-[12px] font-ai-mono text-ai-ink-dim">
              <Filter className="h-3.5 w-3.5" />
              Phase 3 will add live availability + filtering
            </p>
          </header>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LABS.map((l) => {
              const RuntimeIcon = RUNTIME_ICON[l.runtime];
              const ledTone = STATUS_COLOR[l.status];
              const statusLabel = STATUS_LABEL[l.status];
              return (
                <li key={l.slug}>
                  <Link
                    href={`/labs/${l.slug}`}
                    className="group block rounded-ai-card border border-ai-line bg-ai-bg shadow-ai-tile hover:shadow-ai-tile-hover hover:border-ai-primary/30 transition-all overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-ai-line bg-ai-bg-soft flex items-center gap-2">
                      <span className={`ai-led ai-led--${ledTone}`} aria-hidden />
                      <span className="font-ai-mono text-[10.5px] font-bold uppercase tracking-ai-eyebrow text-ai-ink-dim flex-1">
                        {l.tag}
                      </span>
                      <span className="font-ai-mono text-[10.5px] font-bold uppercase tracking-ai-mono text-ai-primary">
                        {statusLabel}
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex items-center justify-center h-10 w-10 rounded-ai-tile bg-ai-primary/10 text-ai-primary ring-1 ring-ai-primary/20 group-hover:bg-ai-primary group-hover:text-white transition-colors">
                          <RuntimeIcon className="h-5 w-5" />
                        </span>
                        <span className="font-ai-mono text-[14px] font-extrabold text-ai-ink">
                          {l.port}
                          <span className="ml-1 text-[10.5px] font-bold uppercase tracking-ai-eyebrow text-ai-ink-dim">
                            /{l.unit}
                          </span>
                        </span>
                      </div>

                      <h3 className="mt-3 text-[15px] font-bold text-ai-ink leading-tight">
                        {l.shortLabel}
                      </h3>
                      <p className="mt-2 text-[12.5px] text-ai-ink-soft leading-relaxed line-clamp-2">
                        {l.title}
                      </p>

                      <dl className="mt-4 grid grid-cols-3 gap-2 font-ai-mono">
                        <DenseStat label="Proto"    value={l.protocol.split(' ')[0]} />
                        <DenseStat label="Time"     value={`${l.durationMin}m`} />
                        <DenseStat label="Level"    value={l.difficulty.slice(0, 3)} />
                      </dl>

                      <p className="mt-4 inline-flex items-center gap-1 text-[12px] font-bold font-ai-mono uppercase tracking-ai-mono text-ai-primary group-hover:gap-2 transition-all">
                        <IconTerminal className="h-3.5 w-3.5" />
                        Open lab
                        <ArrowRight className="h-3.5 w-3.5" />
                      </p>
                    </div>

                    <div className="px-5 py-2 border-t border-ai-line bg-ai-bg-soft text-[10.5px] font-ai-mono uppercase tracking-ai-eyebrow text-ai-ink-dim">
                      {TRACK_LABEL[l.track]}
                      {l.isaLevels.length > 0 && (
                        <span className="text-ai-ink-dim/70"> · {l.isaLevels.join('·')}</span>
                      )}
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

function DenseStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-ai-eyebrow text-ai-ink-dim">{label}</p>
      <p className="text-[12px] font-bold text-ai-ink">{value}</p>
    </div>
  );
}
