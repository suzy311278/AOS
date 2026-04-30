/**
 * PricingCard
 *
 * Individual pricing tier card. White background with green accents.
 * Two variants:
 * - standard: subtle shadow, outlined secondary CTA
 * - highlighted: "MOST POPULAR" badge, green top border, elevated shadow,
 *   solid primary CTA
 */

import { Check } from 'lucide-react';
import { cn } from '@/components/redesign/lib/cn';
import { RedesignButton } from '@/components/redesign/RedesignButton';

export interface PricingCardProps {
  name: string;
  price: string;
  priceSuffix?: string;
  tagline?: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel: string;
  ctaHref: string;
  className?: string;
}

export function PricingCard({
  name,
  price,
  priceSuffix = '/month',
  tagline,
  features,
  highlighted = false,
  ctaLabel,
  ctaHref,
  className,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        'relative bg-white rounded-2xl p-8 flex flex-col',
        highlighted
          ? 'shadow-gt-card-lg border-t-[3px] border-gt-medium'
          : 'shadow-gt-card border border-gt-medium/10',
        className
      )}
    >
      {highlighted && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gt-medium text-gt-text-light text-[10px] font-bold uppercase rounded-full whitespace-nowrap"
          style={{ letterSpacing: '0.15em' }}
        >
          Most Popular
        </span>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-gt-text mb-2">{name}</h3>
        {tagline && (
          <p className="text-sm text-gt-text-dim leading-relaxed">{tagline}</p>
        )}
      </div>

      <div className="flex items-baseline gap-1 mb-8">
        <span
          className="text-5xl font-extrabold text-gt-text tracking-tight"
          style={{ letterSpacing: '-0.02em' }}
        >
          {price}
        </span>
        <span className="text-sm text-gt-text-dim">{priceSuffix}</span>
      </div>

      <div className="w-full h-px bg-gt-medium/15 mb-8" />

      <ul className="space-y-4 mb-10 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gt-text-muted">
            <Check
              className="w-4 h-4 text-gt-medium flex-shrink-0 mt-0.5"
              strokeWidth={2.5}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <RedesignButton
        href={ctaHref}
        variant={highlighted ? 'primary' : 'secondary-light'}
        size="lg"
        className="w-full"
      >
        {ctaLabel}
      </RedesignButton>
    </div>
  );
}
