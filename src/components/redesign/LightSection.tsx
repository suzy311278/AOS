/**
 * LightSection
 *
 * Full-width light section wrapper. This is the DEFAULT background mode
 * for the redesign. Used for trust identity, pricing, product showcases,
 * and any editorial content.
 *
 * Variants:
 * - "pale" (default): #D8F3DC, the primary brand light bg
 * - "alt": #F0FFF4, the alternate light bg for section rhythm
 * - "white": pure white, for dense content areas
 */

import { cn } from '@/components/redesign/lib/cn';

export interface LightSectionProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'pale' | 'alt' | 'white';
  /** Show a subtle dot grid texture */
  dotGrid?: boolean;
  /** Show a subtle ambient green glow */
  glow?: boolean;
  maxWidth?: '1280' | '1440' | 'full';
  className?: string;
  innerClassName?: string;
  id?: string;
}

const PADDING_CLASSES = {
  sm: 'py-16',
  md: 'py-24',
  lg: 'py-32',
  xl: 'py-40',
};

const MAX_WIDTH_CLASSES = {
  '1280': 'max-w-[1280px]',
  '1440': 'max-w-[1440px]',
  full: 'max-w-full',
};

const VARIANT_BG: Record<'pale' | 'alt' | 'white', string> = {
  pale: 'bg-gt-pale',       // off-white neutral (#F8FAF9)
  alt: 'bg-gt-pale-warm',   // very subtle warm tint (#F4F7F5)
  white: 'bg-white',        // pure white
};

export function LightSection({
  children,
  padding = 'lg',
  variant = 'pale',
  dotGrid = false,
  glow = false,
  maxWidth = '1280',
  className,
  innerClassName,
  id,
}: LightSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'relative text-gt-text-dark',
        VARIANT_BG[variant],
        PADDING_CLASSES[padding],
        className
      )}
    >
      {dotGrid && (
        <div
          className="gt-dot-grid-light absolute inset-0 opacity-50 pointer-events-none"
          aria-hidden
        />
      )}
      {glow && (
        <div
          className="gt-ambient-glow-light absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          aria-hidden
        />
      )}
      <div
        className={cn(
          'relative z-10 mx-auto px-8',
          MAX_WIDTH_CLASSES[maxWidth],
          innerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
