// Related-factor computation.
// Priority: same activity_slug different source, then same category same region,
// then same category different region. No cross-links to lessons in Phase B.

import type { ResolvedFactor } from './types';

export function findRelatedFactors(
  factor: ResolvedFactor,
  all: ResolvedFactor[],
  limit = 3
): ResolvedFactor[] {
  // Exclude every unit-variant that shares the current factor's slug (the
  // whole family is already on this page). Dedupe the pool so each family
  // appears only once, keeping the first occurrence per slug.
  const bySlug = new Map<string, ResolvedFactor>();
  for (const f of all) {
    if (f.slug === factor.slug) continue;
    if (!bySlug.has(f.slug)) bySlug.set(f.slug, f);
  }
  const others = Array.from(bySlug.values());
  const seen = new Set<string>();
  const picked: ResolvedFactor[] = [];

  const push = (f: ResolvedFactor) => {
    if (picked.length >= limit) return;
    if (seen.has(f.slug)) return;
    seen.add(f.slug);
    picked.push(f);
  };

  // Tier 1: same activity, different source
  for (const f of others) {
    if (f.activity_slug === factor.activity_slug && f.source_id !== factor.source_id) {
      push(f);
    }
  }
  // Tier 2: same category, same region
  for (const f of others) {
    if (f.category === factor.category && f.region === factor.region) {
      push(f);
    }
  }
  // Tier 3: same category, different region
  for (const f of others) {
    if (f.category === factor.category) {
      push(f);
    }
  }

  return picked.slice(0, limit);
}
