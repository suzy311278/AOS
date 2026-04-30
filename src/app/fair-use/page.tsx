/**
 * /redesign/fair-use — Fair use / usage limits reference page.
 *
 * Previously sat on the pricing page; moved to its own footer-linked
 * page so the pricing page stays focused on tiers. Design language
 * follows the dark product-spec aesthetic used across the redesign:
 * mono table on charcoal, wider tracking, brand-green accents.
 */

import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { RedesignFooter, LightSection, CategoryLabel, SectionHeading } from '@/components/redesign';

export const metadata: Metadata = {
  title: 'Fair Use',
  description:
    'The numbers behind every Greentryst tier. Query caps, tool caps, seats, exports, and retention: up front, no fine print.',
  alternates: { canonical: '/fair-use' },
  openGraph: {
    type: 'website',
    url: '/fair-use',
    title: 'Fair Use',
    description:
      'Query caps, tool caps, seats, exports, and retention across every Greentryst tier.',
  },
};

const USAGE_LIMITS = [
  { metric: 'SustainIQ queries (Free)', value: '5 / month' },
  { metric: 'SustainIQ queries (Individual)', value: '5 / day' },
  { metric: 'SustainIQ queries (Pro)', value: '25 / day' },
  {
    metric: 'SustainIQ queries (Team & Enterprise)',
    value: 'Unlimited, fair use',
  },
  { metric: 'Professional tools (Free)', value: 'Trial access' },
  { metric: 'Professional tools (Individual)', value: '1 active, swap any time' },
  { metric: 'Professional tools (Pro)', value: '3 active, swap any time' },
  { metric: 'Professional tools (Team & Enterprise)', value: 'All included' },
  { metric: 'À la carte extra tools', value: '$15 / month each' },
  { metric: 'Export volume', value: 'Unlimited within tier' },
  { metric: 'Seats (Team)', value: 'Up to 10 users' },
  { metric: 'Seats (Enterprise)', value: 'Up to 50 users · 50+ custom' },
  { metric: 'Data retention', value: '365 days of workspace history' },
  { metric: 'Learning progress & certificates', value: 'Retained permanently' },
  { metric: 'Data residency', value: 'EU or US (selectable)' },
];

export default function FairUsePage() {
  return (
    <>
      <Nav tone="dark" />

      {/* =====================================================================
          HERO
          ===================================================================== */}
      <section className="relative bg-gt-text-dark overflow-hidden">
        <div
          className="gt-dot-grid absolute inset-0 opacity-60 pointer-events-none"
          aria-hidden
        />
        <div
          className="gt-ambient-glow-dark absolute -top-32 right-1/4 w-[500px] h-[500px] rounded-full"
          aria-hidden
        />

        <div className="relative max-w-[1280px] mx-auto px-8 pt-24 pb-14">
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gt-leaf font-bold mb-6">
              Fair Use
            </p>
            <h1 className="text-4xl md:text-[44px] font-extrabold text-white leading-[1.1] tracking-tight">
              The numbers behind every tier.
            </h1>
            <p className="mt-6 text-[15px] md:text-base text-white/70 leading-relaxed max-w-2xl">
              A product-spec sheet for the limits that actually matter. Query
              caps, tool caps, seats, exports, and retention &mdash; up front, no
              fine print.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SPEC TABLE
          ===================================================================== */}
      <section className="bg-gt-text-dark pb-20">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
            <table
              className="w-full"
              style={{
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
            >
              <tbody>
                {USAGE_LIMITS.map((row, i) => (
                  <tr
                    key={row.metric}
                    className={
                      i < USAGE_LIMITS.length - 1
                        ? 'border-b border-white/5 transition-colors hover:bg-white/[0.03]'
                        : 'transition-colors hover:bg-white/[0.03]'
                    }
                  >
                    <td className="p-4 md:p-5 text-[12px] uppercase tracking-[0.15em] text-white/55">
                      {row.metric}
                    </td>
                    <td className="p-4 md:p-5 text-[14px] text-white text-right">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =====================================================================
          RATIONALE
          ===================================================================== */}
      <LightSection variant="pale" padding="lg" className="!pt-20 !pb-24">
        <div className="max-w-3xl">
          <CategoryLabel>Why we have limits</CategoryLabel>
          <SectionHeading size="section" tone="dark" className="mt-5">
            Fair use, because honesty beats unlimited.
          </SectionHeading>
          <p className="mt-6 text-[15px] text-gt-text leading-relaxed">
            The retrieval pipeline that powers SustainIQ is the most expensive
            thing we run. Every query reads across hundreds of source
            documents, scores them, re-ranks them, and produces a cited answer
            in under two seconds. An honest cap lets us keep individual
            pricing at twelve and twenty-nine dollars without burning the
            rest of the roadmap on retrieval costs.
          </p>
          <p className="mt-4 text-[15px] text-gt-text leading-relaxed">
            Team and Enterprise tiers run uncapped under fair use. In
            practice that means we measure for abusive automation, not for
            heavy human use. If your team hits a ceiling, we talk about it
            before we throttle anything.
          </p>
          <p className="mt-4 text-[15px] text-gt-text leading-relaxed">
            Tool caps exist for the same reason: every professional tool is
            a piece of software someone on our team maintains against
            regulation updates. Paying for the ones you actually use keeps
            the rest affordable.
          </p>
        </div>
      </LightSection>

      <RedesignFooter />
    </>
  );
}
