/**
 * AskEmptyState — Server-rendered landing content for /ask
 *
 * Renders keyword-rich HTML that crawlers can index while the
 * interactive chat client hydrates on top. All content is static;
 * interactivity (clicking a query, expanding the library) is handled
 * by the client component that wraps or overlays this.
 */

import {
  QUERY_LIBRARY,
  FEATURED_QUERY_IDS,
} from '../_lib/query-library';
import {
  Thermometer,
  Factory,
  FileText,
  Coins,
  Target,
  Landmark,
  type LucideIcon,
} from 'lucide-react';

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  'climate-science': Thermometer,
  'ghg-accounting': Factory,
  'esg-reporting': FileText,
  'carbon-markets': Coins,
  targets: Target,
  'eu-regulation': Landmark,
};

const CATEGORY_META: Record<
  string,
  { label: string; description: string }
> = {
  'climate-science': {
    label: 'Climate Science',
    description:
      'IPCC AR6 findings, climate sensitivity, radiative forcing, SSP scenarios, and the carbon cycle.',
  },
  'ghg-accounting': {
    label: 'GHG Accounting',
    description:
      'GHG Protocol Corporate Standard, Scope 1, Scope 2, and Scope 3 emissions, inventory boundaries, and emission factors.',
  },
  'esg-reporting': {
    label: 'ESG Reporting',
    description:
      'CSRD, ESRS, GRI Standards, SASB, IFRS S1 and S2, double materiality, and assurance readiness.',
  },
  'carbon-markets': {
    label: 'Carbon Markets',
    description:
      'Verra VCS methodologies including VM0042 and VM0044, Article 6 mechanisms, ICVCM Core Carbon Principles, and voluntary carbon markets.',
  },
  targets: {
    label: 'Targets & Strategy',
    description:
      'SBTi target validation, absolute and intensity-based targets, net-zero pathways, and IFRS S2 transition plan disclosures.',
  },
  'eu-regulation': {
    label: 'EU Regulation',
    description:
      'EU Taxonomy, SFDR, CBAM, EUDR, ESRS, and the European sustainability regulatory framework.',
  },
};

export default function AskEmptyState() {
  return (
    <div className="py-4 lg:py-12">
      {/* Hero */}
      <div className="text-center mb-10">
        <p
          className="text-[10px] font-bold uppercase text-gt-medium mb-3"
          style={{
            letterSpacing: '0.22em',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          SustainIQ
        </p>
        <h1 className="text-3xl md:text-[36px] font-extrabold text-gt-text leading-tight tracking-tight mb-4">
          Ask anything about sustainability.
          <br />
          Get a defensible, sourced answer.
        </h1>
        <p className="text-[15px] text-gt-text-muted leading-relaxed max-w-2xl mx-auto">
          SustainIQ answers questions on sustainability frameworks,
          standards, and methodologies — GHG Protocol, CSRD, ESRS, IFRS S2,
          GRI, SASB, SBTi, EU Taxonomy, SFDR, CBAM, and more. Every
          response is traced back to its primary source document. No
          hallucinations, no plausible-sounding guesses, no claims you
          cannot defend in front of an auditor.
        </p>
      </div>

      {/* What you can ask about — keyword-rich section for crawlers */}
      <section className="max-w-3xl mx-auto mb-12">
        <p
          className="text-[10px] font-bold uppercase text-gt-text-dim mb-4 text-center"
          style={{
            letterSpacing: '0.18em',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          What you can ask about
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUERY_LIBRARY.map((cat) => {
            const meta = CATEGORY_META[cat.id];
            if (!meta) return null;
            return (
              <div
                key={cat.id}
                className="p-4 rounded-xl bg-white border border-gt-border-light"
              >
                <p
                  className="text-[10px] font-bold uppercase text-gt-medium mb-1"
                  style={{
                    letterSpacing: '0.16em',
                    fontFamily:
                      'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                  }}
                >
                  {meta.label}
                </p>
                <p className="text-[13px] text-gt-text-muted leading-snug">
                  {meta.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured queries */}
      <section>
        <p
          className="text-[10px] font-bold uppercase text-gt-text-dim mb-4 text-center"
          style={{
            letterSpacing: '0.18em',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          Try a question
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURED_QUERY_IDS.map((q) => {
            const cat = QUERY_LIBRARY.find((c) => c.queries.includes(q));
            const Icon = cat ? CATEGORY_ICON_MAP[cat.id] ?? Target : Target;
            return (
              <div
                key={q}
                className="group flex items-start gap-3 text-left p-4 rounded-xl bg-white border border-gt-border-light"
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.55)]"
                  style={{
                    background:
                      'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
                  }}
                  aria-hidden
                >
                  <Icon
                    className="w-[18px] h-[18px] text-gt-leaf"
                    strokeWidth={2}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[10px] font-bold uppercase text-gt-medium mb-1"
                    style={{
                      letterSpacing: '0.16em',
                      fontFamily:
                        'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    }}
                  >
                    {cat?.label ?? 'Query'}
                  </p>
                  <p className="text-[14px] font-semibold text-gt-text leading-snug">
                    {q}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Full query library — expanded by default for crawlers */}
      <section className="mt-10">
        <p
          className="text-[10px] font-bold uppercase text-gt-text-dim mb-4 text-center"
          style={{
            letterSpacing: '0.18em',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          Browse all topics
        </p>
        <div className="space-y-8">
          {QUERY_LIBRARY.map((cat) => (
            <div key={cat.id}>
              <p
                className="text-[10px] font-bold uppercase text-gt-medium mb-3"
                style={{
                  letterSpacing: '0.18em',
                  fontFamily:
                    'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                }}
              >
                {cat.label}
              </p>
              <div className="space-y-1.5">
                {cat.queries.map((q) => (
                  <div
                    key={q}
                    className="w-full text-left px-4 py-2.5 rounded-lg bg-white border border-gt-border-light text-[13px] text-gt-text leading-snug"
                  >
                    {q}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
