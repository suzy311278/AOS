/**
 * ClosingCTA
 *
 * Minimal closing band for the homepage. Three parallel promises
 * from Greentryst to the practitioner, followed by one closing
 * line, a signature, and two CTAs. Nothing else.
 *
 * Three "we" statements invert the CTA posture — the brand is
 * committing to the user, not asking the user to commit. The
 * middle promise ("We show you the source") is highlighted in
 * mint because it is the core trust contract.
 *
 * The fuller "letter" draft that this replaced lives in the
 * project notes for eventual use on /about or /manifesto.
 *
 * Design intent:
 *   - Dark surface with ambient teal glow, bookending the hero
 *   - Narrow reading column, centered
 *   - Single-sentence headline with intentional line breaks
 *   - Mono "— Greentryst" signature anchors it as a stated promise
 *   - Two CTAs (primary: Start Free, secondary: See Pricing)
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/components/redesign/lib/cn';

export interface ClosingCTAProps {
  className?: string;
}

export function ClosingCTA({ className }: ClosingCTAProps) {
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden bg-gt-text-dark',
        className
      )}
    >
      {/* Ambient teal glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 80% at 50% 50%, rgba(82,183,136,0.16) 0%, rgba(82,183,136,0.04) 40%, transparent 70%)',
        }}
      />
      {/* Subtle dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative max-w-[1280px] mx-auto px-8 py-16 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* ================================================
              Three promises
              ================================================ */}
          <h2
            className="text-3xl md:text-[38px] font-extrabold text-white leading-[1.2] tracking-tight space-y-1.5"
            style={{ letterSpacing: '-0.02em' }}
          >
            <div>We simplify.</div>
            <div className="text-gt-mint">We show you the source.</div>
            <div>We make the work easy for you.</div>
          </h2>

          <p
            className="mt-6 text-xl md:text-2xl font-semibold text-white/80 tracking-tight"
            style={{ letterSpacing: '-0.01em' }}
          >
            This is the whole deal.
          </p>

          {/* ================================================
              Signature
              ================================================ */}
          <p
            className="mt-3 text-xs text-white/45"
            style={{
              fontFamily:
                'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              letterSpacing: '0.08em',
            }}
          >
            — GREENTRYST
          </p>

          {/* ================================================
              CTAs
              ================================================ */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-7 py-4 bg-gt-leaf text-gt-text-dark text-sm font-bold hover:bg-white transition-colors shadow-lg shadow-gt-leaf/20"
            >
              Start free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-7 py-4 bg-white/5 text-white border border-white/15 text-sm font-bold hover:bg-white/10 hover:border-white/30 transition-colors"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
