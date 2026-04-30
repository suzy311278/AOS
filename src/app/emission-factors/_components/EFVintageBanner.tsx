/**
 * EFVintageBanner
 *
 * Amber banner that renders only when a factor has been superseded. Links to
 * the newer factor by slug. Resolution of `superseded_by` (factor id) to a
 * slug is done by the caller and passed in as `supersedingSlug`.
 */

import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export interface EFVintageBannerProps {
  supersedingSlug: string;
  supersedingLabel: string;
}

export function EFVintageBanner({
  supersedingSlug,
  supersedingLabel,
}: EFVintageBannerProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
      <AlertTriangle
        className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-600"
        aria-hidden
      />
      <div className="flex-1 text-sm">
        <div className="font-semibold text-amber-900">
          A newer version of this factor is available.
        </div>
        <div className="text-amber-800">
          Use the latest vintage for new reporting. The current page is kept for
          historical reference.
        </div>
        <Link
          href={`/emission-factors/${supersedingSlug}`}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-amber-900 hover:underline"
        >
          Open {supersedingLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
