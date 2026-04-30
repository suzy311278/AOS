/**
 * Stat
 *
 * Large mono number + uppercase label. Used in stats rows like:
 * "22+ Courses  ·  470+ Lessons  ·  80+ Source Documents  ·  100% Sourced"
 */

import { cn } from '@/components/redesign/lib/cn';

export interface StatProps {
  /** The main value, rendered in mono font */
  value: string;
  /** Small uppercase label below */
  label: string;
  /** Tone: "dark" for use on light backgrounds, "light" for dark backgrounds */
  tone?: 'dark' | 'light';
  /** Size variant */
  size?: 'md' | 'lg';
  className?: string;
}

export function Stat({ value, label, tone = 'dark', size = 'md', className }: StatProps) {
  const valueSize = size === 'lg' ? 'text-5xl md:text-6xl' : 'text-3xl md:text-4xl';
  const valueColor = tone === 'dark' ? 'text-gt-medium' : 'text-gt-mint';
  const labelColor = tone === 'dark' ? 'text-gt-text-dim' : 'text-gt-text-on-dark-muted';

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        className={cn('font-bold tracking-tight', valueSize, valueColor)}
        style={{ fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace' }}
      >
        {value}
      </div>
      <div
        className={cn('text-[11px] font-bold uppercase', labelColor)}
        style={{ letterSpacing: '0.2em' }}
      >
        {label}
      </div>
    </div>
  );
}
