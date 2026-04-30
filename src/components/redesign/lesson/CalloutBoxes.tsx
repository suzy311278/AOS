/**
 * CalloutBoxes
 *
 * Redesigned versions of the four callout components used across
 * nearly every lesson on Greentryst:
 *
 *   - HighlightBoxRedesign  (key takeaways, leaf green accent)
 *   - AnalogyBoxRedesign    (analogies, mint accent)
 *   - ExampleBoxRedesign    (worked examples, warm amber-on-forest accent)
 *   - KeyTakeawaysRedesign  (numbered summary list at the end of a lesson)
 *
 * All four share a single internal `BaseCallout` so spacing,
 * border treatment, icon tile recipe, and accessibility behavior
 * stay identical across the system. The differences are limited to:
 *   - Accent color (left bar + icon stroke + label)
 *   - Lucide icon
 *   - Eyebrow label text
 *
 * Per the locked design discipline, accents stay inside the brand
 * green family wherever possible. The exception is ExampleBox,
 * which keeps a warm amber accent so worked examples retain their
 * traditional "this is a practice problem" register.
 */

import type { ReactNode } from 'react';
import {
  Lightbulb,
  Compass,
  PenSquare,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/components/redesign/lib/cn';

interface BaseCalloutProps {
  /** Eyebrow label, mono uppercase, sits above the title row */
  eyebrow: string;
  /** Lucide icon used in the small dark forest tile on the left */
  Icon: LucideIcon;
  /** Hex string used for the icon stroke and the left accent bar */
  accentHex: string;
  /** Subtle background tint for the box itself (rgba) */
  bgTint: string;
  /** Subtle border tint (rgba) */
  borderTint: string;
  /** ARIA role for screen readers */
  role?: string;
  /** ARIA label for screen readers */
  ariaLabel?: string;
  children: ReactNode;
}

function BaseCallout({
  eyebrow,
  Icon,
  accentHex,
  bgTint,
  borderTint,
  role = 'note',
  ariaLabel,
  children,
}: BaseCalloutProps) {
  return (
    <div
      className="relative my-7 rounded-2xl overflow-hidden"
      role={role}
      aria-label={ariaLabel ?? eyebrow}
      style={{
        backgroundColor: bgTint,
        border: `1px solid ${borderTint}`,
      }}
    >
      {/* Left accent bar in the callout's accent color */}
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: accentHex }}
      />

      <div className="flex items-start gap-4 p-6 pl-7">
        {/* Small dark forest icon tile, identical recipe to the
            CourseRow / catalogue / module timeline tiles. */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.55)]"
          style={{
            background:
              'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
          }}
          aria-hidden
        >
          <Icon
            className="w-[18px] h-[18px]"
            style={{ color: accentHex }}
            strokeWidth={2}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-[10px] font-bold uppercase mb-1.5"
            style={{
              color: accentHex,
              letterSpacing: '0.18em',
              fontFamily:
                'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            }}
          >
            {eyebrow}
          </p>
          <div className="text-[15px] text-gt-text leading-relaxed [&>p]:mb-3 [&>p:last-child]:mb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Public callout components, each thin wrapper around BaseCallout
   ============================================================ */

export function HighlightBoxRedesign({ children }: { children: ReactNode }) {
  return (
    <BaseCallout
      eyebrow="Key takeaway"
      Icon={Lightbulb}
      accentHex="#52B788"
      bgTint="rgba(82,183,136,0.05)"
      borderTint="rgba(82,183,136,0.20)"
    >
      {children}
    </BaseCallout>
  );
}

export function AnalogyBoxRedesign({ children }: { children: ReactNode }) {
  return (
    <BaseCallout
      eyebrow="Analogy"
      Icon={Compass}
      accentHex="#2D6A4F"
      bgTint="rgba(45,106,79,0.05)"
      borderTint="rgba(45,106,79,0.18)"
    >
      {children}
    </BaseCallout>
  );
}

export function ExampleBoxRedesign({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <BaseCallout
      eyebrow={title ?? 'Worked example'}
      Icon={PenSquare}
      accentHex="#B45309"
      bgTint="rgba(180,83,9,0.04)"
      borderTint="rgba(180,83,9,0.16)"
    >
      {children}
    </BaseCallout>
  );
}

/* ============================================================
   KeyTakeaways - distinct from BaseCallout because it renders a
   numbered list parsed from a semicolon-delimited string prop.
   ============================================================ */

export function KeyTakeawaysRedesign({ items }: { items: string }) {
  const parsed = items
    .split(';;')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      className="relative mt-14 mb-8 rounded-2xl overflow-hidden border border-gt-medium/20 bg-gt-medium/[0.04]"
      role="note"
      aria-label="Key takeaways"
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 right-0 h-[3px] bg-gt-medium"
      />

      <div className="p-7">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.55)]"
            style={{
              background:
                'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
            }}
            aria-hidden
          >
            <Sparkles
              className="w-[18px] h-[18px] text-gt-leaf"
              strokeWidth={2}
            />
          </div>
          <p
            className="text-[10px] font-bold uppercase text-gt-medium"
            style={{
              letterSpacing: '0.2em',
              fontFamily:
                'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            }}
          >
            Key Takeaways
          </p>
        </div>

        <ol className="space-y-3.5">
          {parsed.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-[15px] text-gt-text leading-relaxed"
            >
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full bg-gt-medium text-white flex items-center justify-center text-[11px] font-bold mt-0.5"
                style={{
                  fontFamily:
                    'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                }}
                aria-hidden
              >
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// Export utility classes used by the lesson page
export { cn };
