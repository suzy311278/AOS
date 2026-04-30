/**
 * DarkSection
 *
 * Full-width dark section wrapper. Used strategically for impact (hero,
 * connected system, work modes). Not the default - see LightSection for
 * the more common case.
 */

import { cn } from '@/components/redesign/lib/cn';

export interface DarkSectionProps {
  children: React.ReactNode;
  /** Vertical padding size. Defaults to "lg" (py-32). */
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show the dot grid texture overlay */
  dotGrid?: boolean;
  /** Show an ambient green glow in the background */
  glow?: boolean;
  /** Max width of inner container. Defaults to 1280. */
  maxWidth?: '1280' | '1440' | 'full';
  /** Use the deeper "card-dark" bg instead of the hero near-black */
  variant?: 'hero' | 'deep';
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

export function DarkSection({
  children,
  padding = 'lg',
  dotGrid = false,
  glow = false,
  maxWidth = '1280',
  variant = 'hero',
  className,
  innerClassName,
  id,
}: DarkSectionProps) {
  const bgClass = variant === 'hero' ? 'bg-gt-text-dark' : 'bg-gt-deep';

  return (
    <section
      id={id}
      className={cn(
        'relative overflow-hidden text-gt-text-light',
        bgClass,
        PADDING_CLASSES[padding],
        className
      )}
    >
      {dotGrid && (
        <div
          className="gt-dot-grid absolute inset-0 opacity-60 pointer-events-none"
          aria-hidden
        />
      )}
      {glow && (
        <>
          <div
            className="gt-ambient-glow-dark absolute -top-32 right-1/4 w-[500px] h-[500px] rounded-full"
            aria-hidden
          />
          <div
            className="gt-ambient-glow-dark absolute -bottom-32 left-1/4 w-[500px] h-[500px] rounded-full opacity-60"
            aria-hidden
          />
        </>
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
