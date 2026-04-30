/**
 * EFSourceTrustRow
 *
 * Horizontally-arranged row of publisher logos (or wordmark fallbacks when
 * the SVG is missing). Used on the home page to signal authority.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import Image from 'next/image';
import type { Source } from '@/lib/emission-factors/types';

export interface EFSourceTrustRowProps {
  sources: Source[];
}

function logoExists(logoPath: string | null): boolean {
  if (!logoPath) return false;
  const full = join(process.cwd(), 'public', logoPath.replace(/^\/+/, ''));
  try {
    return existsSync(full);
  } catch {
    return false;
  }
}

export function EFSourceTrustRow({ sources }: EFSourceTrustRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
      {sources.map((source) => {
        const hasLogo = logoExists(source.logo_path);
        return (
          <div key={source.id} className="flex items-center">
            {hasLogo && source.logo_path ? (
              <Image
                src={source.logo_path}
                alt={source.publisher_short}
                width={120}
                height={36}
                className="h-9 w-auto"
              />
            ) : (
              <span className="inline-flex items-center rounded-full border border-gt-border-light bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-gt-text-muted">
                {source.publisher_short}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
