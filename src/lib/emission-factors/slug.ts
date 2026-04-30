// Deterministic public URL slug for a factor.
// Format: {activity_slug}-{region-lower}-{source_short_lower}-{vintage}
//
// The source_short may contain spaces or punctuation; we kebab-case it.
// Region is lowercased. Example: "uk-grid-electricity-gbr-defra-2024".

import type { Factor, Source } from './types';

function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function factorToSlug(factor: Factor, source: Source): string {
  const region = kebab(factor.region);
  const src = kebab(source.publisher_short);
  return `${factor.activity_slug}-${region}-${src}-${factor.vintage_year}`;
}
