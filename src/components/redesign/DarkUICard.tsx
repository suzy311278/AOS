/**
 * DarkUICard
 *
 * The signature visual element of the Greentryst design language. A dark
 * card (deep green) used to show real product UI previews with label
 * badge, content area, and optional source citation footer.
 *
 * Works on any background (light or dark) as an accent element. On light
 * sections it provides strong contrast. On dark sections it uses the
 * glass variant for depth.
 *
 * Visual modes:
 * - "solid" (default): flat #0B3D2E background, subtle border
 * - "glass": backdrop blur + rgba, layers over dark sections
 */

import { cn } from '@/components/redesign/lib/cn';
import { StatBadge } from '@/components/redesign/StatBadge';

export interface DarkUICardProps {
  children: React.ReactNode;
  /** Small uppercase label shown at top-left (e.g., "SustainIQ") */
  label?: string;
  /** Right-side badge, shown at top-right. */
  headerRight?: React.ReactNode;
  /** Source citation in the footer, rendered in mono */
  source?: string;
  /** Custom footer content that replaces the source line */
  footer?: React.ReactNode;
  /** Visual style */
  variant?: 'solid' | 'glass';
  /** Enable leaf-green border highlight and subtle glow */
  highlighted?: boolean;
  /** Hover interactivity */
  hoverable?: boolean;
  className?: string;
}

export function DarkUICard({
  children,
  label,
  headerRight,
  source,
  footer,
  variant = 'solid',
  highlighted = false,
  hoverable = false,
  className,
}: DarkUICardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-7 flex flex-col text-gt-text-light',
        variant === 'glass'
          ? 'gt-glass-dark'
          : 'bg-gt-deep border border-gt-mint/15 shadow-gt-card-lg',
        hoverable && 'gt-glass-dark-hover transition-all duration-300',
        highlighted && 'border-gt-leaf/40',
        className
      )}
      style={
        highlighted
          ? { boxShadow: '0 0 30px rgba(82, 183, 136, 0.18)' }
          : undefined
      }
    >
      {(label || headerRight) && (
        <div className="flex justify-between items-start mb-5">
          {label ? <StatBadge variant="label-dark">{label}</StatBadge> : <span />}
          {headerRight ?? null}
        </div>
      )}

      <div className="flex-1 flex flex-col">{children}</div>

      {(source || footer) && (
        <div className="pt-5 mt-6 border-t border-gt-mint/10">
          {footer ? (
            footer
          ) : (
            <p
              className="text-[11px] text-gt-mint/60"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
            >
              {source}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
