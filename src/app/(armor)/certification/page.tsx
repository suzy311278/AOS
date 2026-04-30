/**
 * /certification — IEC 62443 Certification Track visualizer.
 *
 * Renders the contents of `src/lib/armor/certification.ts`:
 *   - Hero with mission statement + key counts
 *   - Schematic flow: 4 specialists  →  Cybersecurity Expert capstone
 *   - One detail card per specialist (prereqs, hours, IEC parts, ISA equivalent)
 *   - Capstone callout with practical exam metadata
 *   - FAQ-style strip (exam structure, validity, recertification)
 *
 * Pure server component — no client state needed.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Award, BookOpen, Beaker, Clock } from 'lucide-react';
import {
  SPECIALISTS,
  EXPERT_CAPSTONE,
  type SpecialistCertificate,
} from '@/lib/armor/certification';
import { IconShield, IconNetwork, IconTerminal, IconRTU } from '@/components/armor';

export const metadata: Metadata = {
  title: 'IEC 62443 Certification — 4 Specialists + Cybersecurity Expert',
  description:
    'The ArmorInnovate certification path: four IEC 62443 specialist tracks (Foundations, Risk Assessment, Design, Maintenance) and the Cybersecurity Expert capstone. Aligned with the ISA/IEC 62443 Cybersecurity Specialist program.',
  alternates: { canonical: '/certification' },
  openGraph: {
    url: '/certification',
    title: 'IEC 62443 Certification — ArmorInnovate',
    description:
      '4 specialist tracks → Cybersecurity Expert capstone. Aligned with ISA/IEC 62443. Each track combines theory, written exam, and a hands-on lab.',
  },
};

// One icon per specialist track id, kept local to the page.
const TRACK_ICON: Record<SpecialistCertificate['id'], typeof IconShield> = {
  foundations: IconShield,
  'risk-assessment': IconNetwork,
  design: IconTerminal,
  maintenance: IconRTU,
};

export default function CertificationPage() {
  const totalHours = SPECIALISTS.reduce((n, s) => n + s.hours + s.labHours, 0)
    + EXPERT_CAPSTONE.practicalLabHours;

  return (
    <>
      {/* ============================================================
          HERO
          ============================================================ */}
      <section className="relative overflow-hidden border-b border-ai-line">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none ai-bg-grid opacity-60"
        />
        <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 pt-16 pb-14 lg:pt-20 lg:pb-16">
          <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
            ArmorInnovate · Certification Path
          </p>
          <h1 className="mt-3 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-ai-ink max-w-3xl">
            Four specialists. <span className="text-ai-primary">One Cybersecurity Expert.</span>
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-ai-ink-soft max-w-3xl">
            Aligned with the ISA/IEC 62443 Cybersecurity Specialist program. Each
            specialist track combines theory referenced to specific IEC parts, a
            written exam at <strong className="text-ai-ink">75% pass</strong>, and a
            hands-on lab. Complete all four to qualify for the
            {' '}<strong className="text-ai-ink">Cybersecurity Expert</strong> capstone — a
            40-hour multi-stage practical assessment.
          </p>

          {/* Stat row */}
          <dl className="mt-9 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
            {[
              { label: 'Specialist tracks', value: String(SPECIALISTS.length) },
              { label: 'Capstone hours',     value: `${EXPERT_CAPSTONE.practicalLabHours}h` },
              { label: 'Total programme',    value: `${totalHours}h` },
              { label: 'Validity',           value: '3 yrs' },
            ].map((s) => (
              <div key={s.label} className="border-l-2 border-ai-primary pl-3">
                <dt className="text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-dim">
                  {s.label}
                </dt>
                <dd className="mt-1 text-[22px] font-extrabold font-ai-mono text-ai-ink">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ============================================================
          SCHEMATIC FLOW — 4 specialists → Expert capstone
          ============================================================ */}
      <section className="bg-ai-bg-soft border-b border-ai-line">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-14">
          <header className="mb-10">
            <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
              Programme Schematic
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-ai-ink">
              The track at a glance
            </h2>
          </header>

          {/* Specialist row */}
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SPECIALISTS.map((s, i) => {
              const Icon = TRACK_ICON[s.id];
              return (
                <li
                  key={s.id}
                  className="relative rounded-ai-card border border-ai-line bg-ai-bg shadow-ai-tile p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-ai-tile bg-ai-primary/10 text-ai-primary ring-1 ring-ai-primary/20">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-dim">
                      Stage 0{i + 1}
                    </span>
                  </div>
                  <p className="mt-3 font-ai-mono text-[11px] tracking-ai-mono text-ai-primary">
                    {s.code}
                  </p>
                  <h3 className="mt-1 text-[16px] font-bold text-ai-ink">{s.shortName}</h3>
                  <p className="mt-2 text-[12.5px] text-ai-ink-soft">
                    {s.iecParts.join(' · ')}
                  </p>
                </li>
              );
            })}
          </ol>

          {/* Visual connector → capstone */}
          <div className="my-8 flex items-center gap-4 text-ai-ink-dim">
            <div className="flex-1 border-t border-dashed border-ai-line" />
            <span className="font-ai-mono text-[11px] uppercase tracking-ai-mono">
              All four → capstone
            </span>
            <div className="flex-1 border-t border-dashed border-ai-line" />
          </div>

          {/* Capstone summary */}
          <div className="rounded-ai-card border-2 border-ai-primary/30 bg-gradient-to-br from-ai-accent-soft via-ai-bg to-ai-bg p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <span className="inline-flex items-center justify-center h-14 w-14 rounded-ai-tile bg-ai-primary text-white shadow-ai-glow-primary shrink-0">
              <ShieldCheck className="h-7 w-7" />
            </span>
            <div className="flex-1">
              <p className="font-ai-mono text-[10.5px] font-bold uppercase tracking-ai-eyebrow text-ai-primary">
                Capstone · {EXPERT_CAPSTONE.code}
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-ai-ink">
                {EXPERT_CAPSTONE.name}
              </h3>
              <p className="mt-1.5 text-[14px] text-ai-ink-soft max-w-2xl">
                {EXPERT_CAPSTONE.summary}
              </p>
            </div>
            <a
              href="#expert"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-ai-tile bg-ai-primary text-white font-bold font-ai-mono text-[12.5px] uppercase tracking-ai-mono hover:bg-ai-primary-hover transition-colors"
            >
              Capstone Detail
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================
          SPECIALIST DETAIL CARDS
          ============================================================ */}
      <section className="bg-ai-bg">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-16">
          <header className="mb-10 max-w-3xl">
            <p className="text-[10.5px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-primary">
              Specialist Tracks
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-ai-ink">
              The four specialist certifications
            </h2>
          </header>

          <div className="space-y-6">
            {SPECIALISTS.map((s, i) => {
              const Icon = TRACK_ICON[s.id];
              return (
                <article
                  key={s.id}
                  id={s.id}
                  className="rounded-ai-card border border-ai-line bg-ai-bg-soft shadow-ai-tile overflow-hidden"
                >
                  <div className="grid lg:grid-cols-12">
                    {/* Left rail — code + icon */}
                    <div className="lg:col-span-3 bg-ai-deep p-6 sm:p-8 text-ai-ink-on-deep flex flex-col justify-between gap-6 border-b lg:border-b-0 lg:border-r border-ai-line-deep">
                      <div>
                        <p className="font-ai-mono text-[10.5px] font-bold uppercase tracking-ai-eyebrow text-ai-cyber-glow">
                          Stage 0{i + 1}
                        </p>
                        <p className="mt-2 font-ai-mono text-[12px] tracking-ai-mono text-ai-ink-on-deep-dim">
                          {s.code}
                        </p>
                        <h3 className="mt-3 text-[22px] font-extrabold leading-tight">
                          {s.name}
                        </h3>
                      </div>
                      <span className="inline-flex items-center justify-center h-12 w-12 rounded-ai-tile bg-white/5 text-ai-cyber-glow ring-1 ring-white/10">
                        <Icon className="h-6 w-6" />
                      </span>
                    </div>

                    {/* Body */}
                    <div className="lg:col-span-9 p-6 sm:p-8">
                      <p className="text-[15px] text-ai-ink-soft leading-relaxed max-w-3xl">
                        {s.summary}
                      </p>

                      {/* Numeric grid */}
                      <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
                        <DataPoint label="Theory hours" value={`${s.hours}h`} icon={BookOpen} />
                        <DataPoint label="Lab hours"    value={`${s.labHours}h`} icon={Beaker} />
                        <DataPoint label="Pass score"   value={`${s.passingScore}%`} icon={Award} />
                        <DataPoint label="Validity"     value={`${s.validityYears} yrs`} icon={Clock} />
                      </dl>

                      <div className="mt-6 grid sm:grid-cols-3 gap-4 max-w-3xl">
                        <KeyValueBlock
                          label="IEC parts"
                          values={s.iecParts}
                        />
                        <KeyValueBlock
                          label="ISA SLs covered"
                          values={s.isaLevels.map((l) => l)}
                        />
                        <KeyValueBlock
                          label="Prerequisites"
                          values={
                            s.prereqs.length === 0
                              ? ['None']
                              : s.prereqs.map((p) => SPECIALISTS.find((x) => x.id === p)?.code ?? p)
                          }
                        />
                      </div>

                      <div className="mt-6 pt-5 border-t border-ai-line flex flex-col sm:flex-row gap-3 sm:items-center">
                        <p className="text-[12.5px] text-ai-ink-soft flex-1">
                          ISA equivalent: <strong className="text-ai-ink font-ai-mono text-[12px]">{s.isaEquivalent}</strong>
                        </p>
                        <Link
                          href={`/knowledge/${s.courses[0]}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-ai-tile bg-ai-primary text-white font-bold font-ai-mono text-[12px] uppercase tracking-ai-mono hover:bg-ai-primary-hover transition-colors"
                        >
                          Enrol in track
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          CAPSTONE DETAIL
          ============================================================ */}
      <section id="expert" className="bg-ai-deep relative overflow-hidden border-y border-ai-line-deep">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none ai-bg-grid opacity-30 [background-size:24px_24px]"
        />
        <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 py-16 lg:py-20">
          <p className="font-ai-mono text-[10.5px] font-bold uppercase tracking-ai-eyebrow text-ai-cyber-glow">
            Capstone · {EXPERT_CAPSTONE.code}
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-ai-ink-on-deep max-w-3xl leading-tight">
            {EXPERT_CAPSTONE.name}
          </h2>
          <p className="mt-4 text-[15px] text-ai-ink-on-deep-soft max-w-3xl leading-relaxed">
            {EXPERT_CAPSTONE.summary}
          </p>

          {/* Practical exam stages */}
          <ol className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              {
                stage: '01',
                name: 'Practical pentest',
                detail:
                  'Multi-stage, time-boxed assessment against a simulated chemical plant. Evidence captured to pcap and screen recording.',
              },
              {
                stage: '02',
                name: 'Written report',
                detail:
                  'Long-form 62443-3-2 risk + 3-3 control gap report. Submitted in markdown to the examiner board.',
              },
              {
                stage: '03',
                name: 'Oral defence',
                detail:
                  '45-minute panel with two examiners. Report walkthrough, design questions, scenario response.',
              },
            ].map((s) => (
              <li
                key={s.stage}
                className="rounded-ai-card border border-ai-line-deep bg-ai-deep-2 p-5"
              >
                <p className="font-ai-mono text-[11px] tracking-ai-mono text-ai-cyber-glow">
                  Stage {s.stage}
                </p>
                <h3 className="mt-2 text-[17px] font-bold text-ai-ink-on-deep">{s.name}</h3>
                <p className="mt-2 text-[13.5px] text-ai-ink-on-deep-soft leading-relaxed">{s.detail}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/knowledge/${EXPERT_CAPSTONE.capstoneCourse}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-ai-tile bg-ai-cyber text-ai-deep font-bold font-ai-mono text-[12.5px] uppercase tracking-ai-mono hover:bg-ai-cyber-glow transition-colors shadow-ai-glow-cyber"
            >
              Capstone briefing
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/labs"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-ai-tile border border-ai-line-deep text-ai-ink-on-deep hover:border-ai-cyber hover:text-ai-cyber-glow font-bold font-ai-mono text-[12.5px] uppercase tracking-ai-mono transition-colors"
            >
              Practice in the lab
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          FAQ
          ============================================================ */}
      <section className="bg-ai-bg">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ai-ink">
            Frequently asked
          </h2>
          <dl className="mt-8 grid md:grid-cols-2 gap-6 max-w-5xl">
            {[
              {
                q: 'Are these certificates recognised?',
                a: 'They are aligned with the ISA/IEC 62443 Cybersecurity Specialist program. Holders typically use them alongside ISA-issued credentials; we publish the mapping next to every track.',
              },
              {
                q: 'How long does the full programme take?',
                a: `Roughly ${totalHours} hours of focused work across the four specialists plus the capstone. Most learners complete one specialist per quarter and finish the capstone in the second year.`,
              },
              {
                q: 'Do I need to take Foundations first?',
                a: 'Yes. Foundations is a prerequisite for every other specialist track. The capstone additionally requires holding all four specialist certificates.',
              },
              {
                q: 'How do I recertify?',
                a: 'Every certificate is valid for three years. Recertification is a half-day refresher exam plus one new lab — no need to repeat the full programme.',
              },
              {
                q: 'Can I do the labs without a paid plan?',
                a: 'The Foundations track lab is free with a sign-up. The other lab environments require a Pro subscription so we can shoulder the simulator compute cost.',
              },
              {
                q: 'Where does the content come from?',
                a: 'Every lesson is referenced to a specific IEC 62443 part or NIST SP 800-82 chapter. Citations are visible in the lesson body — never hidden behind a footnote.',
              },
            ].map((f) => (
              <div key={f.q}>
                <dt className="text-[15px] font-bold text-ai-ink">{f.q}</dt>
                <dd className="mt-2 text-[14px] text-ai-ink-soft leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Local presentational helpers — kept in-file because they are only
// ever used on this page.
// ──────────────────────────────────────────────────────────────────────

function DataPoint({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-dim">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <p className="mt-1 text-[20px] font-extrabold font-ai-mono text-ai-ink">{value}</p>
    </div>
  );
}

function KeyValueBlock({ label, values }: { label: string; values: readonly string[] }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-ai-eyebrow font-ai-mono text-ai-ink-dim">
        {label}
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <li
            key={v}
            className="inline-flex items-center px-2 py-0.5 rounded-md bg-ai-bg border border-ai-line font-ai-mono text-[11px] text-ai-ink"
          >
            {v}
          </li>
        ))}
      </ul>
    </div>
  );
}
