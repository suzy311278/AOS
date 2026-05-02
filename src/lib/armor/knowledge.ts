/**
 * Knowledge-view layer.
 *
 * Bridges the static seed (`KNOWLEDGE_COURSES`) and the live course loader
 * (`getArmorCourse`) into a single shape the `/knowledge` index + detail
 * pages consume.
 *
 * Resolution rule
 * ───────────────
 *   1. If a YAML bundle exists under `src/content/armor/<slug>/` and parses
 *      cleanly → use it. Live data wins.
 *   2. Otherwise → fall back to the seed entry, if any.
 *   3. Otherwise → undefined (caller renders 404).
 *
 * This keeps Phase 1 pages working today while Phase 2 fills in real
 * course bundles one at a time. As MCP-generated courses replace seed
 * stubs, no consumer changes.
 */

import {
  KNOWLEDGE_COURSES,
  getKnowledgeCourse,
  type KnowledgeCourse,
} from './seed';
import {
  armorCourseExists,
  getAllArmorCourseSlugs,
  getArmorCourse,
} from './courses';
import type { ArmorCourse } from './types';
import type { SpecialistTrackId } from './certification';

export type KnowledgeViewTrack = SpecialistTrackId | 'capstone';
export type KnowledgeViewStatus = 'available' | 'beta' | 'coming-soon';

export interface KnowledgeView {
  slug: string;
  code: string;
  title: string;
  shortTitle: string;
  tagline: string;
  summary: string;
  description?: string;
  track: KnowledgeViewTrack;
  status: KnowledgeViewStatus;
  hours: number;
  labHours: number;
  /** IEC parts without the "IEC " prefix, e.g. "62443-3-3". */
  parts: string[];
  modules: { id: string; title: string; lessons: number; firstLessonId?: string }[];
  outcomes: string[];
  /** Whether the underlying source is a real loaded YAML or the seed stub. */
  source: 'live' | 'seed';
}

// ──────────────────────────────────────────────────────────────────────
// Mappers
// ──────────────────────────────────────────────────────────────────────

function statusFromArmor(s: ArmorCourse['status']): KnowledgeViewStatus {
  // 'draft' is a build-time-only state; surface as 'coming-soon' publicly.
  return s === 'draft' ? 'coming-soon' : s;
}

function trackFromArmor(t: ArmorCourse['track']): KnowledgeViewTrack {
  // Lab-only tracks (`ics-pentest`, `ot-defense`) are surfaced under the
  // closest specialist label. The /knowledge page is for credential-bearing
  // courses; non-track courses default to 'foundations' until we add a
  // generic "lab program" surface.
  if (t === 'capstone') return 'capstone';
  if (t === 'foundations' || t === 'risk-assessment' || t === 'design' || t === 'maintenance') {
    return t;
  }
  return 'foundations';
}

function stripIecPrefix(parts: string[]): string[] {
  return parts.map((p) => p.replace(/^IEC\s+/, ''));
}

function viewFromArmor(course: ArmorCourse): KnowledgeView {
  const totalLessons = course.modules.reduce((n, m) => n + m.lessons.length, 0);
  void totalLessons; // (kept for future per-module aggregations)

  return {
    slug: course.id,
    code: course.code ?? '',
    title: course.title,
    shortTitle: course.shortTitle ?? course.title,
    tagline: course.tagline ?? course.subtitle,
    summary: course.summary,
    description: course.description,
    track: trackFromArmor(course.track),
    status: statusFromArmor(course.status),
    hours: course.hours,
    labHours: course.labHours,
    parts: stripIecPrefix(course.iecParts),
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.length,
      firstLessonId: m.lessons[0]?.id,
    })),
    outcomes: course.outcomes,
    source: 'live',
  };
}

function viewFromSeed(seed: KnowledgeCourse): KnowledgeView {
  // Seed entries already use track ids that include 'capstone'.
  return {
    slug: seed.slug,
    code: seed.code,
    title: seed.title,
    shortTitle: seed.shortTitle,
    tagline: seed.tagline,
    summary: seed.summary,
    track: seed.track,
    status: seed.status,
    hours: seed.hours,
    labHours: seed.labHours,
    parts: seed.parts,
    modules: seed.modules,
    outcomes: seed.outcomes,
    source: 'seed',
  };
}

// ──────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────

/**
 * Get one knowledge view by slug. Live YAML beats seed; seed beats nothing.
 */
export function getKnowledgeView(slug: string): KnowledgeView | undefined {
  if (armorCourseExists(slug)) {
    try {
      return viewFromArmor(getArmorCourse(slug));
    } catch (err) {
      console.error(`[armor] live load failed for ${slug}, falling back to seed:`, err);
    }
  }
  const seed = getKnowledgeCourse(slug);
  return seed ? viewFromSeed(seed) : undefined;
}

/**
 * Returns the union of all live + seed courses, deduped by slug, with
 * live entries taking precedence. Sorted to keep card order stable
 * across the index page (foundations first, capstone last).
 */
export function listKnowledgeViews(): KnowledgeView[] {
  const liveSlugs = new Set(getAllArmorCourseSlugs());

  const liveViews: KnowledgeView[] = [];
  for (const slug of liveSlugs) {
    try {
      liveViews.push(viewFromArmor(getArmorCourse(slug)));
    } catch (err) {
      console.error(`[armor] skipping live course ${slug}:`, err);
    }
  }

  const seedViews: KnowledgeView[] = KNOWLEDGE_COURSES
    .filter((s) => !liveSlugs.has(s.slug))
    .map(viewFromSeed);

  return [...liveViews, ...seedViews].sort((a, b) => trackOrder(a) - trackOrder(b));
}

const TRACK_ORDER: Record<KnowledgeViewTrack, number> = {
  foundations: 0,
  'risk-assessment': 1,
  design: 2,
  maintenance: 3,
  capstone: 4,
};

function trackOrder(v: KnowledgeView): number {
  return TRACK_ORDER[v.track] ?? 99;
}

/**
 * Slugs to feed `generateStaticParams` for `/knowledge/[slug]`.
 * Includes both live and seed slugs.
 */
export function getKnowledgeStaticSlugs(): string[] {
  const live = getAllArmorCourseSlugs();
  const seed = KNOWLEDGE_COURSES.map((c) => c.slug);
  return Array.from(new Set([...live, ...seed]));
}
