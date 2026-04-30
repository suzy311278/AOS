/**
 * /frameworks — directory of practitioner guides published by the
 * Greentryst Climate Disclosure Desk.
 *
 * The page is not a list of frameworks. It is a list of the GUIDES we
 * have written for each framework. Every card answers one question:
 * what is inside Greentryst's guide for this framework? Applicability
 * and jurisdiction live elsewhere.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Compass,
  FileText,
  Landmark,
  Lightbulb,
} from 'lucide-react';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbList, SITE_URL, ORG_ID } from '@/lib/seo/schema';
import { getFramework, listFrameworks } from '@/lib/frameworks';

export const metadata: Metadata = {
  title: 'Sustainability Reporting Frameworks and Standards',
  description:
    'A working library of practitioner guides for IFRS S2, IFRS S1, GRI, SASB, ESRS, CSRD, BRSR, TCFD, TNFD, and CDP. Verbatim requirements, plain-English commentary, and illustrative disclosures. Reviewed by the Greentryst Editorial Board.',
  alternates: { canonical: '/frameworks' },
};

const CATALOGUE_LD = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${SITE_URL}/frameworks#page`,
  url: `${SITE_URL}/frameworks`,
  name: 'Sustainability Reporting Frameworks and Standards',
  description:
    "Practitioner's library of sustainability reporting frameworks, standards, and directives covered by the Greentryst Climate Disclosure Desk.",
  publisher: { '@id': ORG_ID },
};

// Mono editorial issuer abbreviation. Real bodies, not invented codes.
const ISSUER_SHORT: Record<string, string> = {
  'ifrs-s2': 'ISSB (IFRS)',
  'ifrs-s1': 'ISSB (IFRS)',
  gri: 'GRI',
  esrs: 'EFRAG',
  csrd: 'EU COMMISSION',
  brsr: 'SEBI',
  tcfd: 'FSB',
  tnfd: 'TNFD',
  sasb: 'IFRS FOUNDATION',
  cdp: 'CDP',
};

const PILLAR_ICONS: Record<string, typeof Landmark> = {
  governance: Landmark,
  strategy: Compass,
  'risk-management': AlertTriangle,
  'metrics-and-targets': BarChart3,
};

const MONO_LABEL =
  'font-redesign-mono text-[10px] font-bold uppercase tracking-[0.22em]';

export default function FrameworksHubPage() {
  const frameworks = listFrameworks();
  const live = frameworks.filter((f) => f.status === 'live');
  const inPrep = frameworks.filter((f) => f.status === 'in_preparation');
  const otherLive = live.filter((f) => f.id !== 'ifrs-s2');

  const ifrsS2 = getFramework('ifrs-s2');
  const sample = ifrsS2?.disclosures.find((d) => d.ref === '6(a)') ?? null;
  const pillarCounts: Record<string, number> = {};
  if (ifrsS2) {
    for (const d of ifrsS2.disclosures) {
      pillarCounts[d.pillar] = (pillarCounts[d.pillar] ?? 0) + 1;
    }
  }

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_URL}/frameworks#guides`,
    name: 'Greentryst Disclosure Guides',
    numberOfItems: frameworks.length,
    itemListElement: frameworks.map((f, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: f.name,
      url: `${SITE_URL}/frameworks/${f.id}`,
    })),
  };

  const ifrsS2Ld = ifrsS2
    ? {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': `${SITE_URL}/frameworks#ifrs-s2-guide`,
        name: 'Greentryst Practitioner Guide to IFRS S2',
        headline: 'IFRS S2: Climate-related Disclosures',
        description: [ifrsS2.summary, ifrsS2.long_summary]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim(),
        about: {
          '@type': 'CreativeWork',
          name: ifrsS2.name,
          alternateName: ifrsS2.short_name,
          author: { '@type': 'Organization', name: ifrsS2.issuer },
        },
        url: `${SITE_URL}/frameworks/${ifrsS2.id}`,
        publisher: { '@id': ORG_ID },
        inLanguage: 'en',
        keywords:
          'IFRS S2, ISSB, climate-related disclosures, TCFD, sustainability reporting, governance, strategy, risk management, metrics and targets',
      }
    : null;

  return (
    <>
      <JsonLd data={CATALOGUE_LD} />
      <JsonLd data={itemListLd} />
      {ifrsS2Ld && <JsonLd data={ifrsS2Ld} />}
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', url: '/' },
          { name: 'Frameworks' },
        ])}
      />
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gt-text-dark pt-32 pb-24">
        <div
          className="gt-ambient-glow-dark absolute -top-20 left-1/4 w-[600px] h-[600px] rounded-full"
          aria-hidden
        />
        <div
          className="gt-dot-grid absolute inset-0 opacity-40 pointer-events-none"
          aria-hidden
        />
        <div className="relative z-10 max-w-[1280px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className={`${MONO_LABEL} text-gt-leaf mb-5`}>
                Greentryst · Sustainability Disclosure Guides
              </p>
              <h1 className="text-[40px] md:text-[56px] font-extrabold text-white leading-[1.03] tracking-tight mb-6">
                Simplified Guides to Every Sustainability Disclosure.
              </h1>
              <p className="text-[17px] text-white/65 leading-relaxed">
                Every guide treats every clause three ways:{' '}
                <span className="text-white font-semibold">
                  the Requirement verbatim
                </span>
                ,{' '}
                <span className="text-white font-semibold">
                  what it means in plain English
                </span>
                , and{' '}
                <span className="text-white font-semibold">
                  what a good disclosure for that requirement looks like
                </span>
                .
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
                <Stat label="Total guides" value={frameworks.length} />
                <Stat label="Live" value={live.length} />
                <Stat label="In preparation" value={inPrep.length} />
                <Stat
                  label="Authored by"
                  value="Climate Disclosure Desk"
                />
              </div>
            </div>

            {/* Text morph — the same idea rewritten three ways */}
            <TextMorph
              eyebrow="Each Clause, Simplified Thrice"
              voices={[
                {
                  label: 'Published Requirement',
                  text: 'Disclose the body or individual responsible for oversight of climate-related risks and opportunities.',
                },
                {
                  label: 'What it means',
                  text: 'Who actually is responsible for climate risk at the board level. Committees and Members.',
                },
                {
                  label: 'Illustrative Disclosure',
                  text: 'The Risk and Sustainability Committee, chaired by the CFO, holds quarterly oversight of climate matters.',
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* IFRS S2 — flagship folio */}
      {ifrsS2 && (
        <section className="bg-[#fafbfa] pt-20 pb-20">
          <div className="max-w-[1200px] mx-auto px-8">
            <div className="flex items-center gap-4 mb-6">
              <p className={`${MONO_LABEL} text-gt-medium`}>
                Published Guides · {live.length}
              </p>
              <div className="flex-1 h-px bg-gt-text/10" />
            </div>

            <article
              id="ifrs-s2"
              className="relative overflow-hidden rounded-2xl bg-gt-card-dark text-white shadow-[0_20px_60px_rgba(24,24,27,0.18)]"
            >
              <div
                className="absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full bg-gt-leaf/15 blur-[120px] pointer-events-none"
                aria-hidden
              />
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gt-leaf" />

              <div className="relative p-10 lg:p-12">
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <span
                    className={`${MONO_LABEL} text-gt-text-dark bg-gt-leaf rounded-md px-2.5 py-1`}
                  >
                    Flagship Standard Guide
                  </span>
                  <span className={`${MONO_LABEL} text-gt-leaf/90`}>
                    {ISSUER_SHORT[ifrsS2.id]}
                  </span>
                  <span className="text-white/30">·</span>
                  <span className={`${MONO_LABEL} text-white/55`}>
                    Effective {ifrsS2.effective_from?.slice(0, 4)}
                  </span>
                  <span className="text-white/30">·</span>
                  <span className={`${MONO_LABEL} text-white/55`}>
                    {ifrsS2.disclosures.length} clauses guided
                  </span>
                </div>

                <h2 className="text-[36px] md:text-[44px] font-extrabold leading-[1.05] tracking-tight mb-4 max-w-3xl">
                  IFRS S2: Climate-related Disclosures
                </h2>
                <p className="text-[15.5px] text-white/75 leading-relaxed max-w-3xl mb-10">
                  {ifrsS2.summary}
                </p>

                <p className={`${MONO_LABEL} text-white/45 mb-3`}>
                  Pillars covered
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
                  {ifrsS2.pillars.map((p) => {
                    const Icon = PILLAR_ICONS[p.id] ?? Landmark;
                    const count = pillarCounts[p.id] ?? 0;
                    const href = `/frameworks/${ifrsS2.id}/${p.slug}`;
                    return (
                      <Link
                        key={p.id}
                        href={href}
                        className="group/pillar rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors flex items-center gap-3.5"
                      >
                        <span className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-gt-leaf/10 border border-gt-leaf/25 flex-shrink-0">
                          <Icon
                            className="w-5 h-5 text-gt-leaf"
                            strokeWidth={1.75}
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[15.5px] font-bold text-white leading-tight mb-1">
                            {p.name}
                          </p>
                          <p className="font-redesign-mono text-[11.5px] font-bold uppercase tracking-[0.18em] text-white/55">
                            {count} clauses
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/10">
                  <p className={`${MONO_LABEL} text-white/50`}>
                    Climate Disclosure Desk · Reviewed by Editorial Board
                  </p>
                  <Link
                    href={`/frameworks/${ifrsS2.id}`}
                    className="group inline-flex items-center gap-2 rounded-lg bg-gt-leaf hover:bg-white text-gt-text-dark font-semibold text-[14px] px-4 py-2 transition-colors"
                  >
                    Open the IFRS S2 Guide
                    <ArrowRight
                      className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </Link>
                </div>
              </div>
            </article>

            {otherLive.length > 0 && (
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
                {otherLive.map((f) => (
                  <LibraryCard key={f.id} stub={f} status="live" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* The Practitioner's Lens — methodology demo band */}
      {sample && (
        <section className="bg-white py-20 border-t border-[#eef0ee]">
          <div className="max-w-[1200px] mx-auto px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className={`${MONO_LABEL} text-gt-medium mb-3`}>
                The Practitioner's Lens
              </p>
              <h2 className="text-[32px] md:text-[36px] font-extrabold text-gt-text leading-tight tracking-tight mb-4">
                How every guide reads.
              </h2>
              <p className="text-[15px] text-gt-text-muted leading-relaxed">
                Using IFRS S2 paragraph 6(a) as a reference for our three-panel
                analytical framework. The same treatment applies to every
                clause in every guide on this site.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <DemoPanel
                tone="paper"
                icon={FileText}
                label="Requirement"
                body={sample.requirement_text}
                footer="VERBATIM · IFRS S2"
                delayMs={0}
              />
              <DemoPanel
                tone="teal"
                icon={Lightbulb}
                label="What it means"
                body={sample.plain_english}
                footer="PLAIN ENGLISH · GREENTRYST"
                delayMs={120}
              />
              <DemoPanel
                tone="dark"
                icon={CheckCircle2}
                label="Illustrative Disclosure"
                body={sample.example_disclosure}
                footer="WHAT A GOOD DISCLOSURE LOOKS LIKE"
                delayMs={240}
              />
            </div>
          </div>
        </section>
      )}

      {/* In preparation */}
      {inPrep.length > 0 && (
        <section className="bg-[#fafbfa] py-20">
          <div className="max-w-[1200px] mx-auto px-8">
            <div className="flex items-center gap-4 mb-8">
              <p className={`${MONO_LABEL} text-gt-text-muted`}>
                In preparation · {inPrep.length} guide
                {inPrep.length === 1 ? '' : 's'}
              </p>
              <div className="flex-1 h-px bg-gt-text/10" />
              <p className="text-[12px] text-gt-text-dim">
                In review by the Editorial Board
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inPrep.map((f) => (
                <LibraryCard key={f.id} stub={f} status="in_prep" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Editorial colophon — Field Study banner treatment */}
      <section className="bg-[#fafbfa] py-20">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="relative w-full overflow-hidden rounded-2xl min-h-[620px] bg-[#0d2a26]">
            {/* Aerial-style topographic field built from layered radial gradients */}
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden
              style={{
                background:
                  'radial-gradient(ellipse 60% 45% at 18% 30%, rgba(82,183,136,0.45), transparent 60%), radial-gradient(ellipse 50% 40% at 78% 20%, rgba(45,106,79,0.55), transparent 65%), radial-gradient(ellipse 70% 55% at 70% 75%, rgba(15,82,56,0.65), transparent 70%), radial-gradient(ellipse 45% 35% at 30% 85%, rgba(82,183,136,0.30), transparent 65%), linear-gradient(160deg, #0d2a26 0%, #102e29 50%, #0a1f1c 100%)',
              }}
            />
            {/* Topographic contour SVG overlay */}
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.18] mix-blend-screen pointer-events-none"
              viewBox="0 0 1200 520"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <pattern
                  id="contour"
                  x="0"
                  y="0"
                  width="1200"
                  height="520"
                  patternUnits="userSpaceOnUse"
                >
                  {Array.from({ length: 14 }).map((_, i) => (
                    <ellipse
                      key={i}
                      cx={300 + i * 35}
                      cy={260 + (i % 2 === 0 ? -20 : 20)}
                      rx={500 + i * 24}
                      ry={120 + i * 14}
                      fill="none"
                      stroke="#8cd4ca"
                      strokeWidth="0.6"
                      transform={`rotate(${-12 + i} 600 260)`}
                    />
                  ))}
                </pattern>
              </defs>
              <rect width="1200" height="520" fill="url(#contour)" />
            </svg>
            {/* Teal multiply wash for depth */}
            <div
              className="absolute inset-0 bg-gt-medium/15 mix-blend-multiply pointer-events-none"
              aria-hidden
            />
            {/* Top accent rule */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px] bg-gt-leaf"
              aria-hidden
            />
            {/* Mono spine top-right */}
            <div className="hidden md:flex absolute top-10 right-10 flex-col items-end gap-2 text-right">
              <p className={`${MONO_LABEL} text-gt-leaf/85`}>
                Greentryst · 2026
              </p>
              <p className={`${MONO_LABEL} text-white/45`}>
                Updated April 2026
              </p>
              <p className={`${MONO_LABEL} text-white/45`}>
                Climate Disclosure Desk
              </p>
            </div>
            {/* Cream card pinned bottom-left */}
            <div className="absolute bottom-10 left-10 right-10 md:right-auto md:max-w-[700px] bg-gt-pale-warm p-10 md:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
              <p className={`${MONO_LABEL} text-gt-medium mb-5`}>
                Editor's Note // 2026
              </p>
              <h2 className="text-[30px] md:text-[38px] font-extrabold text-gt-text leading-[1.05] tracking-tight mb-6">
                How we write these guides.
              </h2>
              <p className="text-[15.5px] text-gt-text leading-[1.75] mb-4">
                Sustainability rules are written by lawyers and standard-
                setters. They are precise, but rarely reader friendly. We
                turn each rule into a guide a working professional can
                actually use.
              </p>
              <p className="text-[15.5px] text-gt-text-muted leading-[1.75] mb-4">
                For every clause in every standard we cover, we show
                three things side by side:
              </p>
              <ul className="text-[15.5px] text-gt-text-muted leading-[1.7] mb-5 space-y-2 pl-1">
                <li className="flex gap-3">
                  <span
                    className="mt-2 w-1.5 h-1.5 rounded-full bg-gt-medium flex-shrink-0"
                    aria-hidden
                  />
                  <span>
                    <span className="font-semibold text-gt-text">
                      The exact words of the rule
                    </span>
                    , published without changes.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span
                    className="mt-2 w-1.5 h-1.5 rounded-full bg-gt-medium flex-shrink-0"
                    aria-hidden
                  />
                  <span>
                    <span className="font-semibold text-gt-text">
                      What the rule is really asking for
                    </span>
                    , in plain language, so you understand why the
                    requirement is there.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span
                    className="mt-2 w-1.5 h-1.5 rounded-full bg-gt-medium flex-shrink-0"
                    aria-hidden
                  />
                  <span>
                    <span className="font-semibold text-gt-text">
                      What a good disclosure for that requirement looks like
                    </span>
                    , so you have a model to write against.
                  </span>
                </li>
              </ul>
              <p className="text-[15.5px] text-gt-text-muted leading-[1.75]">
                The guides are written by the Greentryst Climate
                Disclosure Desk and reviewed by an independent Editorial
                Board before they go live.
              </p>
            </div>
          </div>
        </div>
      </section>

      <RedesignFooter />
    </>
  );
}

function truncate(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

type Voice = { label: string; text: string };

const VOICE_ACCENTS = ['#cfd6d2', '#8cd4ca', '#52b788'] as const;

function TextMorph({
  eyebrow,
  voices,
}: {
  eyebrow: string;
  voices: Voice[];
}) {
  return (
    <div className="relative w-full max-w-[480px] mx-auto">
      {/* Eyebrow */}
      <p className={`${MONO_LABEL} text-white/40 mb-5 tracking-[0.28em]`}>
        {eyebrow}
      </p>

      {/* Stage label — shifts color with the active voice */}
      <div className="relative h-7 mb-5">
        {voices.map((v, i) => (
          <p
            key={i}
            className={`gt-label-shift-${i + 1} absolute inset-0 font-redesign-mono text-[14px] font-bold uppercase tracking-[0.22em]`}
          >
            {v.label}
          </p>
        ))}
      </div>

      {/* Layered text — each voice cross-fades with per-word entry */}
      <div className="relative min-h-[120px]">
        {voices.map((v, i) => {
          const accent = VOICE_ACCENTS[i] ?? VOICE_ACCENTS[0];
          const cycleStart = i * 4; // 12s loop, 4s per voice
          const words = v.text.split(/\s+/);
          return (
            <div
              key={i}
              className={`gt-text-morph-${i + 1} absolute inset-0`}
            >
              {/* Left accent rule */}
              <div
                className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full"
                style={{ backgroundColor: accent, opacity: 0.5 }}
                aria-hidden
              />
              <p className="pl-5 text-[20px] md:text-[22px] leading-[1.4] font-medium text-white tracking-tight">
                {words.map((w, j) => (
                  <span
                    key={j}
                    className="gt-word"
                    style={{
                      animationDelay: `${cycleStart + j * 0.04}s`,
                      animationDuration: '600ms',
                      animationIterationCount: 1,
                    }}
                  >
                    {w}
                    {j < words.length - 1 ? '\u00A0' : ''}
                  </span>
                ))}
              </p>
            </div>
          );
        })}
      </div>

      {/* Voice indicators */}
      <div className="mt-1 flex items-center gap-3">
        {voices.map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className={`gt-morph-dot-${i + 1} w-1.5 h-1.5 rounded-full bg-white/25`}
              aria-hidden
            />
            <span
              className={`${MONO_LABEL} text-white/40 hidden sm:inline`}
              aria-hidden
            >
              0{i + 1}
            </span>
          </div>
        ))}
        <div className="flex-1 h-px bg-white/10 ml-2" />
        <span className={`${MONO_LABEL} text-white/30`}>IFRS S2 · 6(a)</span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className={`${MONO_LABEL} text-white/45 mb-1`}>{label}</p>
      <p className="text-[15px] font-semibold text-white font-redesign-mono tracking-tight">
        {value}
      </p>
    </div>
  );
}

function DemoPanel({
  tone,
  icon: Icon,
  label,
  body,
  footer,
  delayMs = 0,
}: {
  tone: 'paper' | 'teal' | 'dark';
  icon: typeof FileText;
  label: string;
  body: string;
  footer: string;
  delayMs?: number;
}) {
  const animStyle = { animationDelay: `${delayMs}ms` };
  if (tone === 'dark') {
    return (
      <div
        style={animStyle}
        className="gt-demo-panel relative rounded-2xl bg-gt-card-dark text-white p-6 flex flex-col overflow-hidden shadow-[0_10px_30px_rgba(24,24,27,0.12)] hover:shadow-[0_18px_50px_rgba(24,24,27,0.22)]"
      >
        <div
          className="gt-demo-glow absolute -top-16 -right-10 w-56 h-56 rounded-full bg-gt-leaf/20 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div className="relative flex items-center gap-2 mb-4">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gt-leaf/40 bg-gt-leaf/10">
            <Icon className="w-4 h-4 text-gt-leaf" strokeWidth={1.75} />
          </span>
          <p className={`${MONO_LABEL} text-gt-leaf`}>{label}</p>
        </div>
        <div className="relative flex-1">
          <div
            className="absolute left-0 top-0 bottom-0 w-[2px] bg-gt-leaf/60"
            aria-hidden
          />
          <p className="pl-4 text-[14.5px] leading-[1.7] text-white/95">
            {body}
          </p>
        </div>
        <p
          className={`${MONO_LABEL} text-white/45 mt-4 pt-3 border-t border-white/10 relative`}
        >
          {footer}
        </p>
      </div>
    );
  }

  if (tone === 'teal') {
    return (
      <div
        style={animStyle}
        className="gt-demo-panel rounded-2xl bg-gt-medium/[0.06] shadow-[0_1px_2px_rgba(45,106,79,0.05)] hover:shadow-[0_10px_30px_rgba(45,106,79,0.12)] p-6 flex flex-col"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gt-medium/15">
            <Icon className="w-4 h-4 text-gt-medium" strokeWidth={1.75} />
          </span>
          <p className={`${MONO_LABEL} text-gt-medium`}>{label}</p>
        </div>
        <p className="text-[14.5px] text-gt-text leading-[1.7] flex-1">
          {body}
        </p>
        <p
          className={`${MONO_LABEL} text-gt-medium/70 mt-4 pt-3 border-t border-gt-medium/10`}
        >
          {footer}
        </p>
      </div>
    );
  }

  // paper
  return (
    <div
      style={animStyle}
      className="gt-demo-panel rounded-2xl bg-gt-pale-warm shadow-[0_1px_2px_rgba(11,31,21,0.04)] hover:shadow-[0_10px_30px_rgba(11,31,21,0.08)] p-6 flex flex-col"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm">
          <Icon className="w-4 h-4 text-gt-text" strokeWidth={1.75} />
        </span>
        <p className={`${MONO_LABEL} text-gt-text-muted`}>{label}</p>
      </div>
      <p className="text-[14.5px] text-gt-text leading-[1.7] flex-1">
        {body}
      </p>
      <p
        className={`${MONO_LABEL} text-gt-text-dim mt-4 pt-3 border-t border-gt-text/5`}
      >
        {footer}
      </p>
    </div>
  );
}

function LibraryCard({
  stub,
  status,
}: {
  stub: ReturnType<typeof listFrameworks>[number];
  status: 'live' | 'in_prep';
}) {
  const issuerShort = ISSUER_SHORT[stub.id] ?? '';
  const isLive = status === 'live';

  const Wrapper = isLive
    ? ({ children }: { children: React.ReactNode }) => (
        <Link
          href={`/frameworks/${stub.id}`}
          className="group flex flex-col rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(11,31,21,0.04)] hover:shadow-[0_8px_24px_rgba(11,31,21,0.08)] transition-shadow"
        >
          {children}
        </Link>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <div className="flex flex-col rounded-2xl bg-gt-pale-warm p-6 opacity-90">
          {children}
        </div>
      );

  return (
    <Wrapper>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`${MONO_LABEL} ${
              isLive
                ? 'text-gt-medium bg-gt-medium/10'
                : 'text-gt-text-muted bg-gt-text/5'
            } rounded-md px-2 py-0.5`}
          >
            {stub.type}
          </span>
          {issuerShort && (
            <span className={`${MONO_LABEL} text-gt-text-dim`}>
              {issuerShort}
            </span>
          )}
        </div>
        <span
          className={`${MONO_LABEL} ${
            isLive ? 'text-gt-leaf' : 'text-gt-text-dim'
          }`}
        >
          {isLive ? 'Live' : 'In review'}
        </span>
      </div>

      <h3 className="text-[20px] font-extrabold text-gt-text leading-tight mb-1">
        {stub.short_name}
      </h3>
      <p className="text-[12px] text-gt-text-dim mb-3">{stub.issuer}</p>
      <p className="text-[13.5px] text-gt-text-muted leading-relaxed flex-1">
        {stub.summary}
      </p>

      <div className="mt-5 pt-4 border-t border-gt-text/5 flex items-center justify-between">
        <p className={`${MONO_LABEL} text-gt-text-dim`}>
          Climate Disclosure Desk
        </p>
        {isLive ? (
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-gt-medium group-hover:text-gt-dark transition-colors">
            Open guide
            <ArrowRight
              className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </span>
        ) : (
          <span className={`${MONO_LABEL} text-gt-text-dim`}>
            Forthcoming
          </span>
        )}
      </div>
    </Wrapper>
  );
}
