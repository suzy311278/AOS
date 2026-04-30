'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';

type Trigger = 'filter' | 'pagination' | 'methodology-drill';

interface Props {
  open: boolean;
  trigger: Trigger;
  onClose: () => void;
}

/**
 * Auth prompt overlay shown when an anonymous user tries to:
 *   - apply a sidebar filter (trigger="filter")
 *   - navigate past page 3 (trigger="pagination")
 *   - drill into a specific methodology from the leaderboard (trigger="methodology-drill")
 *
 * Styled as the existing soft-registration wall (see LessonMeter) so the
 * pattern is consistent across the site: dark card, teal accent, two CTAs.
 */
export default function CarbonAuthPrompt({ open, trigger, onClose }: Props) {
  if (!open) return null;

  const copy = {
    filter: {
      badge: 'Filters require sign-in',
      title: 'Filter 13,107 projects across 11 registries.',
      body: "Sign up free to apply methodology, registry, country, status, certification, and CORSIA filters. No credit card.",
    },
    pagination: {
      badge: 'Read more',
      title: "You've reached the anonymous preview.",
      body: "Sign up free to page through the full dataset, save your filter state, and expand every project detail.",
    },
    'methodology-drill': {
      badge: 'Methodology filter',
      title: 'See every retirer using this methodology.',
      body: 'Sign up free to drill down by methodology, save retirer watchlists, and track retirement activity over time.',
    },
  }[trigger];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/60 to-white/90 backdrop-blur-[3px]"
      />

      <div className="relative w-full max-w-[460px] bg-[#0a1a1a] rounded-t-2xl sm:rounded-2xl shadow-[0_28px_80px_-24px_rgba(0,0,0,0.45)] overflow-hidden">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#8cd4ca] to-transparent" />

        <div className="px-7 py-7 sm:py-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#005c55]/30 text-[#8cd4ca]">
              <Lock className="w-3.5 h-3.5" strokeWidth={2} />
            </span>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8cd4ca]"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              {copy.badge}
            </p>
          </div>

          <h2 className="text-[19px] sm:text-[20px] font-semibold text-white leading-[1.35]">
            {copy.title}
          </h2>

          <p className="mt-3 text-[13.5px] text-white/65 leading-relaxed">
            {copy.body}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-white hover:bg-white/90 text-[#0a1a1a] text-[13px] font-semibold rounded-md transition-colors"
            >
              Sign up free
            </Link>
            <Link
              href="/sign-in"
              className="text-[13px] font-medium text-white/60 hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
            <span className="text-white/25" aria-hidden>
              ·
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-[13px] font-medium text-white/60 hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Continue browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
