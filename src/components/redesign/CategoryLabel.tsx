/**
 * CategoryLabel
 *
 * Small uppercase label used above section headings to categorize content.
 * Matches labels like "THE CONNECTED PLATFORM" / "PRICING" / "BUILT FOR
 * HOW YOU ACTUALLY WORK" in the approved designs.
 *
 * Two tones:
 * - "light" bg (default): forest green on pale background
 * - "dark" bg: mint green on dark section
 */

import { cn } from '@/components/redesign/lib/cn';

export interface CategoryLabelProps {
  children: React.ReactNode;
  /** Tone for the background the label sits on. Default "light". */
  tone?: 'light' | 'dark';
  className?: string;
}

export function CategoryLabel({ children, tone = 'light', className }: CategoryLabelProps) {
  return (
    <span
      className={cn(
        'inline-block text-[11px] font-bold uppercase',
        tone === 'light' ? 'text-gt-medium' : 'text-gt-mint',
        className
      )}
      style={{ letterSpacing: '0.25em' }}
    >
      {children}
    </span>
  );
}
