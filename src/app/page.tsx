/**
 * ArmorInnovate OS — landing page.
 *
 * URL: /
 *
 * Phase 0 of the Greentryst → ArmorInnovate refactor (see
 * docs/armor-refactor-plan.md). This page stands alone — it does
 * not depend on `src/components/redesign/*` or `src/lib/courses`,
 * so it ships even before the IA migration completes.
 *
 * Sections
 *   1. ArmorNav (fixed top, light tone)
 *   2. Terminal-style hero (interactive CLI)
 *   3. Capability pillars (4 tiles)
 *   4. Live ICS-CERT advisory strip
 *   5. IEC 62443 certification path (4 specialists → 1 expert)
 *   6. Lab preview (HMI tile strip)
 *   7. Why ArmorInnovate (3 short proof points)
 *   8. CTA band → ArmorFooter
 *   + Floating "Surprise Me" widget
 *
 * The previous Greentryst homepage is preserved in git history
 * (commit prior to this PR). Restore via `git show HEAD~1:src/app/page.tsx`.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Activity, ShieldCheck, Cpu, AlertTriangle } from 'lucide-react';
import {
  ArmorNav,
  ArmorFooter,
  TerminalBanner,
  HmiCard,
  SurpriseMe,
  IconPLC,
  IconHMI,
  IconShield,
  IconTerminal,
  IconNetwork,
  IconVuln,
  IconModbus,
  IconRTU,
} from '@/components/armor';

// ──────────────────────────────────────────────────────────────────────
// Page metadata — homepage overrides the root layout default explicitly.
// During the transition the root template is still `%s | Greentryst`;
// Phase 6 will retitle the layout template to ArmorInnovate. The
// `default` slot here is what the browser tab renders verbatim.
// ──────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'ArmorInnovate OS — IEC 62443 & ICS Pentesting Operating System',
  description:
    'The professional operating system for ICS / SCADA security: IEC 62443 certification, hands-on OT pentesting labs, and live vulnerability intelligence — in one disciplined platform.',
  alternates: { canonical: '/' },
  openGraph: {
    url: '/',
    title: 'ArmorInnovate OS — ICS / SCADA Security, end to end',
    description:
      'IEC 62443 specialist tracks, terminal-grade pentesting labs (Modbus, S7comm, EtherNet/IP), and a live ICS-CERT advisory feed.',
  },
  twitter: {
    title: 'ArmorInnovate OS — ICS / SCADA Security',
    description:
      'IEC 62443 certification, OT pentesting labs, live vuln intel — one platform for OT defenders.',
  },
};

// ──────────────────────────────────────────────────────────────────────
// Static seed data (Phase 0). Phase 4 swaps these for live DB queries.
// ──────────────────────────────────────────────────────────────────────

const PILLARS: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  href: string;
  badge: string;
}[] = [
  {
    Icon: IconShield,
    title: 'Knowledge Base',
    body:
      'IEC 62443, NIST SP 800-82, ISA/IEC standards — distilled into modular, MDX lessons with terminal-style code blocks and verified citations.',
    href: '/knowledge',
    badge: '08 PARTS · 32 LESSONS',
  },
  {
    Icon: IconTerminal,
    title: 'Lab Environment',
    body:
      'Sandboxed PLC simulators (Modbus, S7comm, EtherNet/IP). Run nmap NSE, mbtget, and packet captures on live targets — never your client\u2019s plant.',
    href: '/labs',
    badge: '12 SCENARIOS',
  },
  {
    Icon: IconNetwork,
    title: 'Certification Path',
    body:
      'Four IEC 62443 specialist tracks (Foundations, Risk Assessment, Design, Maintenance) feeding the Cybersecurity Expert capstone.',
    href: '/certification',
    badge: '4 + 1 TRACKS',
  },
  {
    Icon: IconVuln,
    title: 'Vulnerability Intelligence',
    body:
      'Live CISA ICS-CERT feed, asset matching against your inventory, and severity prioritised by SL impact \u2014 not just CVSS.',
    href: '/intel',
    badge: 'LIVE FEED',
  },
];

const ADVISORIES: {
  id: string;
  vendor: string;
  title: string;
  cvss: number;
  severity: 'crit' | 'warn' | 'ok';
  age: string;
}[] = [
  { id: 'ICSA-24-009-01', vendor: 'Rockwell Automation',  title: 'CompactLogix unauth firmware overwrite', cvss: 9.8, severity: 'crit', age: '2h' },
  { id: 'ICSA-24-191-04', vendor: 'Rockwell',              title: 'FactoryTalk View ME RCE',                cvss: 8.6, severity: 'warn', age: '6h' },
  { id: 'ICSA-23-353-08', vendor: 'Siemens',               title: 'S7-1500 authentication bypass',          cvss: 8.6, severity: 'warn', age: '1d' },
  { id: 'ICSA-24-046-09', vendor: 'Schneider Electric',    title: 'Modicon M340 buffer overflow',           cvss: 7.5, severity: 'warn', age: '2d' },
  { id: 'ICSA-23-336-03', vendor: 'Mitsubishi Electric',   title: 'MELSEC iQ-R denial of service',          cvss: 5.3, severity: 'ok',   age: '3d' },
];

const CERT_TRACK = [
  { code: 'AI-CSP-FND', name: 'Fundamentals',    hours: 30, parts: '62443-1-1, 2-1' },
  { code: 'AI-CSP-RA',  name: 'Risk Assessment', hours: 35, parts: '62443-3-2' },
  { code: 'AI-CSP-DSN', name: 'Design',          hours: 40, parts: '62443-3-3, 4-2' },
  { code: 'AI-CSP-MNT', name: 'Maintenance',     hours: 30, parts: '62443-2-3, 2-4' },
];

export default function HomePage() {
  return (
    <div className="ai-root min-h-screen bg-ai-bg">
      <ArmorNav tone="light" />

      {/* spacer for the fixed nav (~64px) */}
      <div aria-hidden className="h-[64px]" />

      {/* ============================================================
          1. HERO — Terminal banner + headline
          ============================================================ */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none ai-bg-grid opacity-60"
        />
        <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 pt-14 pb-20 lg:pt-20 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="min-w-0 lg:col-span-5 animate-ai-fade-up">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono bg-ai-accent-soft text-ai-primary ring-1 ring-ai-primary/15">
                <span className="ai-led ai-led--ok" aria-hidden />
                ArmorInnovate.OS · v0.1
              </span>

              <h1 className="mt-5 text-[40px] sm:text-[52px] lg:text-[60px] font-extrabold leading-[1.02] tracking-tight text-ai-ink">
                The operating system for{' '}
                <span className="text-ai-primary">OT defenders</span>.
              </h1>

              <p className="mt-5 text-[17px] leading-relaxed text-ai-ink-soft max-w-[36ch]">
                One disciplined platform for{' '}
                <strong className="text-ai-ink">IEC 62443 certification</strong>,{' '}
                <strong className="text-ai-ink">ICS / SCADA pentesting</strong>, and{' '}
                <strong className="text-ai-ink">live OT vulnerability intelligence</strong>.
                Built by ICS engineers for the people keeping plants running.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/certification"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-ai-tile bg-ai-primary text-white font-bold font-ai-mono text-[13px] uppercase tracking-ai-mono hover:bg-ai-primary-hover transition-colors shadow-ai-glow-primary"
                >
                  Start Certification
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/labs"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-ai-tile border border-ai-line text-ai-ink hover:border-ai-primary hover:text-ai-primary font-bold font-ai-mono text-[13px] uppercase tracking-ai-mono transition-colors bg-ai-bg"
                >
                  Open a Lab
                </Link>
              </div>

              <dl className="mt-9 grid grid-cols-3 gap-4 max-w-md">
                {[
                  { k: 'IEC 62443',   v: 'Aligned' },
                  { k: 'NIST 800-82', v: 'r3' },
                  { k: 'CISA Feed',   v: 'Live' },
                ].map((s) => (
                  <div key={s.k}>
                    <dt className="text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-dim">
                      {s.k}
                    </dt>
                    <dd className="mt-0.5 text-[13px] font-bold font-ai-mono text-ai-ink">
                      {s.v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="min-w-0 lg:col-span-7 animate-ai-fade-up [animation-delay:120ms]">
              <TerminalBanner />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. CAPABILITY PILLARS
          ============================================================ */}
      <section className="bg-ai-bg-soft border-y border-ai-line">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-16 lg:py-20">
          <header className="max-w-2xl mb-10">
            <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
              Capability Set
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-ai-ink">
              Four pillars. One operating system.
            </h2>
            <p className="mt-3 text-[15px] text-ai-ink-soft leading-relaxed">
              Most OT security tools cover one slice — a course platform, a vuln feed,
              a pentest distro. ArmorInnovate is the integrated workbench: lessons,
              labs, certification, and intelligence cross-linked so you can move from
              an advisory to a hardening checklist to a hands-on lab in three clicks.
            </p>
          </header>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PILLARS.map((p) => (
              <Link
                key={p.title}
                href={p.href}
                className="group relative block rounded-ai-card bg-ai-bg border border-ai-line p-5 shadow-ai-tile hover:shadow-ai-tile-hover hover:border-ai-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center justify-center h-10 w-10 rounded-ai-tile bg-ai-primary/10 text-ai-primary ring-1 ring-ai-primary/20 group-hover:bg-ai-primary group-hover:text-white transition-colors">
                    <p.Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[9.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-dim">
                    {p.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-[17px] font-bold text-ai-ink">{p.title}</h3>
                <p className="mt-2 text-[13.5px] text-ai-ink-soft leading-relaxed">{p.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-bold font-ai-mono uppercase tracking-ai-mono text-ai-primary group-hover:gap-2 transition-all">
                  Open
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          3. LIVE VULN-INTEL STRIP (dark)
          ============================================================ */}
      <section className="bg-ai-deep relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none ai-bg-grid opacity-40 [background-size:24px_24px]"
        />
        <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 py-14">
          <div className="flex items-end justify-between gap-6 mb-7">
            <div>
              <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-cyber">
                <Activity className="h-3.5 w-3.5 animate-ai-data-flicker" />
                Live · ICS-CERT Stream
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-ai-ink-on-deep">
                Latest OT advisories
              </h2>
            </div>
            <Link
              href="/intel"
              className="hidden sm:inline-flex items-center gap-1 text-[12.5px] font-bold font-ai-mono uppercase tracking-ai-mono text-ai-cyber-glow hover:text-white transition-colors"
            >
              Full Feed
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-ai-card border border-ai-line-deep bg-ai-deep-2 overflow-hidden shadow-ai-card-deep">
            <div className="grid grid-cols-12 px-4 py-2.5 border-b border-ai-line-deep text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-on-deep-dim">
              <span className="col-span-3">Advisory</span>
              <span className="col-span-3">Vendor</span>
              <span className="col-span-4">Summary</span>
              <span className="col-span-1 text-right">CVSS</span>
              <span className="col-span-1 text-right">Age</span>
            </div>
            {ADVISORIES.map((a) => (
              <Link
                key={a.id}
                href={`/intel/${a.id}`}
                className="grid grid-cols-12 px-4 py-3 items-center text-[13px] font-ai-mono text-ai-ink-on-deep border-b border-ai-line-deep last:border-0 hover:bg-white/[0.03] transition-colors"
              >
                <span className="col-span-3 flex items-center gap-2 text-ai-cyber-glow">
                  <span className={`ai-led ai-led--${a.severity}`} aria-hidden />
                  {a.id}
                </span>
                <span className="col-span-3 text-ai-ink-on-deep-soft">{a.vendor}</span>
                <span className="col-span-4 text-ai-ink-on-deep truncate">{a.title}</span>
                <span
                  className={
                    a.severity === 'crit'
                      ? 'col-span-1 text-right font-bold text-red-400'
                      : a.severity === 'warn'
                      ? 'col-span-1 text-right font-bold text-amber-300'
                      : 'col-span-1 text-right font-bold text-emerald-400'
                  }
                >
                  {a.cvss.toFixed(1)}
                </span>
                <span className="col-span-1 text-right text-ai-ink-on-deep-dim">{a.age}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          4. CERTIFICATION TRACK
          ============================================================ */}
      <section className="bg-ai-bg">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-16 lg:py-20">
          <header className="max-w-3xl mb-12">
            <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
              IEC 62443 Certification
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-ai-ink">
              Four specialists. One Cybersecurity Expert.
            </h2>
            <p className="mt-3 text-[15px] text-ai-ink-soft leading-relaxed">
              Aligned with the ISA/IEC 62443 Cybersecurity Specialist program. Each
              specialist track combines theory (referenced to IEC parts), a written
              exam at 75% pass, and a hands-on lab. Complete all four to qualify for
              the Cybersecurity Expert capstone — a 40-hour multi-stage assessment.
            </p>
          </header>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CERT_TRACK.map((c, i) => (
              <div
                key={c.code}
                className="relative rounded-ai-card border border-ai-line bg-ai-bg shadow-ai-tile p-5 hover:shadow-ai-tile-hover hover:border-ai-primary/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
                    Stage 0{i + 1}
                  </span>
                  <span className="text-[10.5px] font-bold font-ai-mono text-ai-ink-dim">
                    {c.hours}h
                  </span>
                </div>
                <h3 className="mt-3 text-[17px] font-bold text-ai-ink">{c.name}</h3>
                <p className="mt-1 font-ai-mono text-[12px] text-ai-ink-soft tracking-ai-mono">
                  {c.code}
                </p>
                <p className="mt-3 text-[12.5px] text-ai-ink-soft">
                  IEC parts: <span className="font-ai-mono text-ai-ink">{c.parts}</span>
                </p>
                <Link
                  href="/certification"
                  className="mt-4 inline-flex items-center gap-1 text-[12px] font-bold font-ai-mono uppercase tracking-ai-mono text-ai-primary hover:text-ai-primary-hover"
                >
                  View track
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>

          {/* Capstone */}
          <div className="mt-6 rounded-ai-card border-2 border-ai-primary/30 bg-gradient-to-br from-ai-accent-soft via-ai-bg to-ai-bg p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <span className="inline-flex items-center justify-center h-14 w-14 rounded-ai-tile bg-ai-primary text-white shadow-ai-glow-primary shrink-0">
              <ShieldCheck className="h-7 w-7" />
            </span>
            <div className="flex-1">
              <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
                Capstone · AI-CSE-EXP
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-ai-ink">
                IEC 62443 Cybersecurity Expert
              </h3>
              <p className="mt-1.5 text-[14px] text-ai-ink-soft">
                40-hour practical · multi-stage pentest + report defence · valid 3 years
              </p>
            </div>
            <Link
              href="/certification#expert"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-ai-tile bg-ai-primary text-white font-bold font-ai-mono text-[12.5px] uppercase tracking-ai-mono hover:bg-ai-primary-hover transition-colors"
            >
              Path Details
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          5. LAB PREVIEW (HMI strip)
          ============================================================ */}
      <section className="bg-ai-bg-soft border-y border-ai-line">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-16 lg:py-20">
          <header className="max-w-3xl mb-10">
            <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
              Lab Environment
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-ai-ink">
              Pentest the protocols — without crashing your client&rsquo;s plant.
            </h2>
            <p className="mt-3 text-[15px] text-ai-ink-soft leading-relaxed">
              Each lab boots a sandboxed simulator (pymodbus, snap7, cpppo) with a
              realistic plant scenario. Use the same tools you&rsquo;d ship in your kit:
              nmap NSE, mbtget, scapy, Wireshark. Capture pcap, write your finding,
              submit. Pass criteria match the ISA/IEC practical exam.
            </p>
          </header>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <HmiCard
              tag="LAB-01"
              label="Modbus pentesting"
              value="502"
              unit="tcp"
              status="ok"
              statusLabel="READY"
              hint="Forced coil writes · enumeration · DPI defense"
            >
              <div className="mt-1 flex items-center gap-1.5 text-ai-ink-dim">
                <IconModbus className="h-4 w-4" />
                <span className="text-[11px] font-ai-mono">pymodbus-simulator</span>
              </div>
            </HmiCard>

            <HmiCard
              tag="LAB-02"
              label="S7comm exploitation"
              value="102"
              unit="tcp"
              status="ok"
              statusLabel="READY"
              hint="STOP/RUN abuse · block download · plcscan"
            >
              <div className="mt-1 flex items-center gap-1.5 text-ai-ink-dim">
                <IconPLC className="h-4 w-4" />
                <span className="text-[11px] font-ai-mono">snap7-simulator</span>
              </div>
            </HmiCard>

            <HmiCard
              tag="LAB-03"
              label="EtherNet/IP & CIP"
              value="44818"
              unit="udp"
              status="warn"
              statusLabel="QUEUE"
              hint="CIP class abuse · CompactLogix CVE-2024-21912"
            >
              <div className="mt-1 flex items-center gap-1.5 text-ai-ink-dim">
                <IconRTU className="h-4 w-4" />
                <span className="text-[11px] font-ai-mono">cpppo-simulator</span>
              </div>
            </HmiCard>

            <HmiCard
              tag="LAB-04"
              label="HMI hardening"
              value="L3.5"
              unit="dmz"
              status="ok"
              statusLabel="READY"
              hint="View ME RCE · zone & conduit design"
            >
              <div className="mt-1 flex items-center gap-1.5 text-ai-ink-dim">
                <IconHMI className="h-4 w-4" />
                <span className="text-[11px] font-ai-mono">view-me-mock</span>
              </div>
            </HmiCard>
          </div>
        </div>
      </section>

      {/* ============================================================
          6. WHY ArmorInnovate
          ============================================================ */}
      <section className="bg-ai-bg">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-16 lg:py-20 grid lg:grid-cols-3 gap-6">
          {[
            {
              Icon: Cpu,
              title: 'OT-first content',
              body:
                'Lessons start at the PLC, not at "ICS is like IT but with valves". Every chapter ends with a hands-on lab, not a multiple-choice cliff.',
            },
            {
              Icon: AlertTriangle,
              title: 'Tied to live threats',
              body:
                'Each module references current CISA advisories. When a new CVE drops, the affected lesson lights up and the relevant lab gets a new scenario.',
            },
            {
              Icon: ShieldCheck,
              title: 'Built for defenders',
              body:
                'No vuln-shaming. The platform leans into IEC 62443-3-3 SR mappings so you leave with a hardening checklist, not just an exploit.',
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-ai-card border border-ai-line bg-ai-bg-soft p-6"
            >
              <span className="inline-flex items-center justify-center h-9 w-9 rounded-ai-tile bg-ai-primary/10 text-ai-primary ring-1 ring-ai-primary/20">
                <c.Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              </span>
              <h3 className="mt-4 text-[17px] font-bold text-ai-ink">{c.title}</h3>
              <p className="mt-2 text-[14px] text-ai-ink-soft leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          7. CTA BAND (dark)
          ============================================================ */}
      <section className="bg-ai-deep relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none ai-bg-grid opacity-40 [background-size:24px_24px]"
        />
        <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 py-20 text-center">
          <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-cyber-glow">
            ArmorInnovate.OS
          </p>
          <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-ai-ink-on-deep max-w-3xl mx-auto leading-tight">
            Take the operating system for OT defense for a spin.
          </h2>
          <p className="mt-4 text-[16px] text-ai-ink-on-deep-soft max-w-xl mx-auto">
            Free Foundations track · sandbox lab access · no credit card.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-ai-tile bg-ai-cyber text-ai-deep font-bold font-ai-mono text-[13px] uppercase tracking-ai-mono hover:bg-ai-cyber-glow transition-colors shadow-ai-glow-cyber"
            >
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/knowledge"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-ai-tile border border-ai-line-deep text-ai-ink-on-deep hover:border-ai-cyber hover:text-ai-cyber-glow font-bold font-ai-mono text-[13px] uppercase tracking-ai-mono transition-colors"
            >
              Browse the Knowledge Base
            </Link>
          </div>
        </div>
      </section>

      <ArmorFooter />

      {/* Floating Surprise Me */}
      <SurpriseMe variant="floating" />
    </div>
  );
}
