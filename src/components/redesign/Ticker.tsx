/**
 * Ticker
 *
 * Continuous horizontal marquee of keywords, Bloomberg-terminal style.
 * Used to show the breadth of sustainability domains the platform
 * covers (TCFD, CSRD, PCAF, etc.) in a compact band.
 *
 * The track renders two copies of the items so the animation loops
 * seamlessly when the first copy scrolls past -50%. Uses mask-image
 * for fade edges so keywords don't snap at the viewport boundary.
 *
 * Hover anywhere on the ticker pauses it, so users can read specific
 * items. Individual items brighten on hover.
 *
 * Design Bible reference: Ticker sits below the hero as a visual bridge
 * to the Trust Identity section. Dark background matches the hero, which
 * creates continuity before transitioning to the light content below.
 */

import { cn } from '@/components/redesign/lib/cn';

export interface TickerProps {
  items: string[];
  /** Visual variant. Default 'dark' is for use under the dark hero. */
  variant?: 'dark' | 'light';
  /** Optional class for the outer wrapper */
  className?: string;
}

export function Ticker({ items, variant = 'dark', className }: TickerProps) {
  // Render two copies so the loop seamlessly continues when the first
  // copy translates off screen at -50%.
  const doubled = [...items, ...items];

  return (
    <div
      className={cn(
        'gt-ticker',
        variant === 'dark'
          ? 'bg-gt-text-dark border-y border-white/5'
          : 'bg-gt-pale-warm border-y border-gt-border-light',
        className
      )}
    >
      <div
        className="gt-ticker-track py-5"
        aria-hidden="true"
      >
        {doubled.map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-center">
            <span className="gt-ticker-item">{item}</span>
            <span className="gt-ticker-separator" />
          </div>
        ))}
      </div>
      {/* Accessible label for screen readers listing the domains once */}
      <span className="sr-only">
        Sustainability frameworks and methodologies covered:{' '}
        {items.join(', ')}
      </span>
    </div>
  );
}
