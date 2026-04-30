/**
 * StatBadge
 *
 * Small pill badges used to indicate feature status. Four variants:
 * - "live" (leaf green): Published features
 * - "coming-soon" (amber): Features planned for post-cutover
 * - "label-light" (forest on pale): Category label on light bg / inside cards
 * - "label-dark" (mint on deep): Category label on dark bg / inside dark cards
 */

import { cn } from '@/components/redesign/lib/cn';

type BadgeVariant = 'live' | 'coming-soon' | 'label-light' | 'label-dark';

export interface StatBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  live: 'bg-gt-leaf/20 text-gt-medium',
  'coming-soon': 'bg-gt-amber/15 text-gt-amber',
  'label-light': 'bg-gt-medium/10 text-gt-medium',
  'label-dark': 'bg-gt-mint/15 text-gt-mint',
};

export function StatBadge({ children, variant = 'label-light', className }: StatBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase',
        VARIANT_CLASSES[variant],
        className
      )}
      style={{ letterSpacing: '0.1em' }}
    >
      {children}
    </span>
  );
}
