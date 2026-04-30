/**
 * PricingSection
 *
 * Full pricing section with dual toggle and 5 tiers across two
 * audiences. Primary toggle switches between Individuals (Free /
 * Individual / Pro) and Teams & Enterprise (Team / Enterprise).
 * Secondary toggle switches between Monthly and Annual billing.
 *
 * Client component because it manages the two toggle states and
 * re-renders the tier cards based on the active audience + billing.
 *
 * Design principles:
 *   - Individuals side has 3 cards with Pro marked "Most Popular"
 *   - Teams side has 2 cards with Enterprise marked "Most Popular"
 *     (Enterprise at $400 is an unbeatable deal vs $30K+ competitors)
 *   - Feature lists use teal checkmarks for included items
 *   - "Most Popular" card has elevated shadow and teal top border
 *   - Annual price shows the effective monthly rate + total saved
 *   - Trust strip below mentions student discount, India pricing,
 *     free trial, and custom pricing link for 50+ seats
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { cn } from '@/components/redesign/lib/cn';

type Audience = 'individuals' | 'teams';
type Billing = 'monthly' | 'annual';

interface Tier {
  id: string;
  audience: Audience;
  name: string;
  tagline: string;
  /** Monthly price in USD. 0 for Free. */
  monthly: number;
  /**
   * Annual price in USD (the total annual cost, not monthly).
   * null means no annual option (e.g., Free tier).
   */
  annual: number | null;
  /** Optional user-limit note shown under the price (Team/Enterprise) */
  userLimit?: string;
  /** Highlighted as the "Most Popular" card */
  popular?: boolean;
  /** CTA button label */
  cta: string;
  /** CTA link destination */
  ctaHref: string;
  /** Feature list shown in order */
  features: string[];
  /** Optional note below the CTA (e.g., trial terms) */
  footnote?: string;
}

const TIERS: Tier[] = [
  // ============================================================
  // INDIVIDUALS SIDE
  // ============================================================
  {
    id: 'free',
    audience: 'individuals',
    name: 'Free',
    tagline: 'Try Greentryst without commitment.',
    monthly: 0,
    annual: null,
    cta: 'Start free',
    ctaHref: '/sign-up',
    footnote: 'No credit card required.',
    features: [
      '1 course per month (no certificate)',
      'Audio lessons and quizzes included',
      '5 SustainIQ queries per month',
      'Browse the job board',
      'Browse regulations',
      'Trial access to professional tools',
      'Basic free tools',
      'Community support',
    ],
  },
  {
    id: 'individual',
    audience: 'individuals',
    name: 'Individual',
    tagline: 'For the everyday sustainability practitioner.',
    monthly: 12,
    annual: 99,
    cta: 'Get Individual',
    ctaHref: '/sign-up?plan=individual',
    features: [
      'All courses, certificates, audio and quizzes',
      '5 SustainIQ queries per day',
      '1 professional tool per month (swap anytime)',
      'Extra tools at $15 per month each',
      'Regulations: browse + selected alerts',
      'Full job matching + resume + priority notifications',
      'Skill gap analysis with course recommendations',
      'Reports and exports as PDF',
      'Community support',
    ],
  },
  {
    id: 'pro',
    audience: 'individuals',
    name: 'Pro',
    tagline: 'For consultants and power practitioners.',
    monthly: 29,
    annual: 239,
    popular: true,
    cta: 'Start 7-day Pro trial',
    ctaHref: '/sign-up?plan=pro',
    footnote: '7-day free trial. Credit card required.',
    features: [
      'Everything in Individual',
      '25 SustainIQ queries per day',
      '3 professional tools per month (swap anytime)',
      'Unlimited extra tools at $15 per month each',
      'Full regulations applicability engine',
      'Reports in all formats with full audit trails and sources',
      'Priority community support',
    ],
  },

  // ============================================================
  // TEAMS & ENTERPRISE SIDE
  // ============================================================
  {
    id: 'team',
    audience: 'teams',
    name: 'Team',
    tagline: 'For small sustainability teams and consultants.',
    monthly: 99,
    annual: 799,
    userLimit: 'Up to 10 users',
    cta: 'Start Team',
    ctaHref: '/sign-up?plan=team',
    features: [
      'All professional tools, every user',
      'Unlimited SustainIQ queries (fair use)',
      'Full regulations applicability engine',
      'All report formats with full audit trails and sources',
      'Shared team workspace',
      'Team profile visible to job seekers',
      'Advanced admin dashboard',
      'SSO / SAML',
      'Custom onboarding',
      'Priority feature requests',
      'Priority email support',
      'Consultancy: free diagnostics, paid engagements',
      'All courses and certificates for every user',
    ],
  },
  {
    id: 'enterprise',
    audience: 'teams',
    name: 'Enterprise',
    tagline: 'For mid-size sustainability teams.',
    monthly: 400,
    annual: 3840,
    userLimit: 'Up to 50 users · 50+ = custom',
    popular: true,
    cta: 'Get Enterprise',
    ctaHref: '/sign-up?plan=enterprise',
    footnote: 'Fixed pricing. No sales calls required.',
    features: [
      'Everything in Team',
      'Up to 50 users (50+ users = custom pricing)',
      'All professional tools, every user',
      'Unlimited SustainIQ queries (fair use)',
      'Full regulations applicability engine',
      'All report formats with full audit trails and sources',
      'Shared team workspace + team profile',
      'Advanced admin dashboard',
      'SSO / SAML + custom onboarding',
      'Priority email support + consultancy add-on',
      'All courses and certificates for every user',
    ],
  },
];

/**
 * Format the big-number price. For Free tier returns "Free".
 * For all other tiers returns a whole-dollar string like "$8" or "$320".
 * We round to whole dollars to keep the headline clean; the exact
 * billed amount is always disclosed in the footnote below the price.
 */
function formatBigPrice(value: number): string {
  if (value === 0) return 'Free';
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

/**
 * Effective monthly rate when billed annually (total annual / 12).
 * Rounded to whole dollars for display consistency.
 */
function effectiveMonthlyFromAnnual(annual: number): number {
  return annual / 12;
}

/**
 * Calculate the savings percentage when paying annually vs monthly.
 * Returns a whole-number percent like 31 (meaning 31%).
 */
function annualSavingsPct(monthly: number, annual: number): number {
  if (monthly === 0 || annual === 0) return 0;
  const fullYear = monthly * 12;
  const savings = fullYear - annual;
  return Math.round((savings / fullYear) * 100);
}

export interface PricingSectionProps {
  className?: string;
}

export function PricingSection({ className }: PricingSectionProps) {
  const [audience, setAudience] = useState<Audience>('individuals');
  const [billing, setBilling] = useState<Billing>('annual');

  const visibleTiers = TIERS.filter((t) => t.audience === audience);

  return (
    <div className={cn('w-full', className)}>
      {/* ==========================================================
          Toggles
          ========================================================== */}
      <div className="flex flex-col items-center gap-5 mb-14">
        {/* Primary toggle: Individuals vs Teams */}
        <div
          role="tablist"
          aria-label="Pricing audience"
          className="inline-flex items-center gap-1 p-1 bg-white border border-gt-border-light rounded-full shadow-sm"
        >
          <button
            type="button"
            role="tab"
            aria-selected={audience === 'individuals'}
            onClick={() => setAudience('individuals')}
            className={cn(
              'px-5 py-2.5 rounded-full text-sm font-semibold transition-all',
              audience === 'individuals'
                ? 'bg-gt-deep text-white shadow-sm'
                : 'text-gt-text-muted hover:text-gt-text'
            )}
          >
            Individuals
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={audience === 'teams'}
            onClick={() => setAudience('teams')}
            className={cn(
              'px-5 py-2.5 rounded-full text-sm font-semibold transition-all',
              audience === 'teams'
                ? 'bg-gt-deep text-white shadow-sm'
                : 'text-gt-text-muted hover:text-gt-text'
            )}
          >
            Teams &amp; Enterprise
          </button>
        </div>

        {/* Secondary toggle: Monthly vs Annual */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setBilling('monthly')}
            className={cn(
              'text-sm font-semibold transition-colors',
              billing === 'monthly' ? 'text-gt-text' : 'text-gt-text-dim'
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={billing === 'annual'}
            onClick={() =>
              setBilling(billing === 'annual' ? 'monthly' : 'annual')
            }
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors',
              billing === 'annual' ? 'bg-gt-medium' : 'bg-gt-border-light'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                billing === 'annual' ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
          <button
            type="button"
            onClick={() => setBilling('annual')}
            className={cn(
              'text-sm font-semibold transition-colors',
              billing === 'annual' ? 'text-gt-text' : 'text-gt-text-dim'
            )}
          >
            Annual
          </button>
          <span
            className={cn(
              'ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all',
              billing === 'annual'
                ? 'bg-gt-leaf/20 text-gt-medium'
                : 'bg-gt-border-light/60 text-gt-text-dim'
            )}
            style={{ letterSpacing: '0.1em' }}
          >
            Save ~30%
          </span>
        </div>
      </div>

      {/* ==========================================================
          Tier cards grid
          ========================================================== */}
      <div
        className={cn(
          'grid gap-6 max-w-6xl mx-auto',
          audience === 'individuals'
            ? 'grid-cols-1 md:grid-cols-3'
            : 'grid-cols-1 md:grid-cols-2 max-w-4xl'
        )}
      >
        {visibleTiers.map((tier) => {
          // Big headline price logic:
          //   - Free: show "Free"
          //   - Annual billing: show the EFFECTIVE monthly rate (annual/12)
          //     as the big number, and disclose the total annual cost in
          //     the small footnote below. This is the standard pricing
          //     psychology trick: buyers anchor on the small monthly number.
          //   - Monthly billing: show the monthly price as-is.
          const headlineValue =
            tier.monthly === 0
              ? 0
              : billing === 'annual' && tier.annual !== null
              ? Math.round(effectiveMonthlyFromAnnual(tier.annual))
              : tier.monthly;

          const priceSuffix = tier.monthly === 0 ? '' : '/mo';

          const savingsPct =
            tier.annual !== null
              ? annualSavingsPct(tier.monthly, tier.annual)
              : 0;

          return (
            <div
              key={tier.id}
              className={cn(
                'relative bg-white rounded-2xl p-8 flex flex-col',
                tier.popular
                  ? 'shadow-gt-card-lg border-t-[3px] border-gt-medium'
                  : 'shadow-gt-card border border-gt-border-light'
              )}
            >
              {tier.popular && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gt-medium text-white text-[10px] font-bold uppercase rounded-full whitespace-nowrap"
                  style={{ letterSpacing: '0.15em' }}
                >
                  Most Popular
                </span>
              )}

              {/* Tier name + tagline */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gt-text mb-2">
                  {tier.name}
                </h3>
                <p className="text-sm text-gt-text-muted leading-snug">
                  {tier.tagline}
                </p>
              </div>

              {/* Price block */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-5xl font-extrabold text-gt-text tracking-tight"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {formatBigPrice(headlineValue)}
                  </span>
                  {priceSuffix && (
                    <span className="text-sm text-gt-text-dim">
                      {priceSuffix}
                    </span>
                  )}
                </div>
                {billing === 'annual' &&
                  tier.annual !== null &&
                  tier.monthly > 0 && (
                    <p className="text-xs text-gt-text-dim mt-1.5">
                      Billed annually at ${tier.annual.toLocaleString('en-US')}/year
                      {savingsPct > 0 && (
                        <>
                          {' · '}
                          <span className="text-gt-medium font-semibold">
                            save {savingsPct}%
                          </span>
                        </>
                      )}
                    </p>
                  )}
                {billing === 'monthly' && tier.annual !== null && (
                  <p className="text-xs text-gt-text-dim mt-1.5">
                    or ${tier.annual.toLocaleString('en-US')}/year ({annualSavingsPct(tier.monthly, tier.annual)}% off)
                  </p>
                )}
                {tier.userLimit && (
                  <p
                    className="text-xs text-gt-medium font-semibold mt-2"
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    }}
                  >
                    {tier.userLimit}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gt-border-light mb-6" />

              {/* Feature list */}
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-[13px] text-gt-text-muted leading-snug"
                  >
                    <Check
                      className="w-4 h-4 text-gt-medium flex-shrink-0 mt-0.5"
                      strokeWidth={2.5}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-auto">
                <Link
                  href={tier.ctaHref}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-bold transition-colors',
                    tier.popular
                      ? 'bg-gt-medium text-white hover:bg-gt-deepest shadow-sm'
                      : 'bg-transparent text-gt-medium border border-gt-medium hover:bg-gt-medium hover:text-white'
                  )}
                >
                  {tier.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {tier.footnote && (
                  <p className="mt-2 text-[11px] text-gt-text-dim text-center">
                    {tier.footnote}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ==========================================================
          Trust strip below the cards
          ========================================================== */}
      <div className="mt-14 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 text-sm text-gt-text-muted">
        <div className="flex items-start gap-2.5">
          <Check className="w-4 h-4 text-gt-medium flex-shrink-0 mt-0.5" strokeWidth={2.5} />
          <span>
            <span className="text-gt-text font-semibold">Students get 50% off</span>{' '}
            on Individual tier with a .edu or verified NGO email.
          </span>
        </div>
        <div className="flex items-start gap-2.5">
          <Check className="w-4 h-4 text-gt-medium flex-shrink-0 mt-0.5" strokeWidth={2.5} />
          <span>
            <span className="text-gt-text font-semibold">Cancel anytime.</span>{' '}
            No long-term contracts on any paid tier.
          </span>
        </div>
        <div className="flex items-start gap-2.5">
          <Check className="w-4 h-4 text-gt-medium flex-shrink-0 mt-0.5" strokeWidth={2.5} />
          <span>
            <span className="text-gt-text font-semibold">Need 50+ seats?</span>{' '}
            <Link
              href="/contact?topic=enterprise"
              className="text-gt-medium font-semibold underline underline-offset-2 hover:text-gt-deepest"
            >
              Contact us for custom pricing
            </Link>
            .
          </span>
        </div>
      </div>
    </div>
  );
}
