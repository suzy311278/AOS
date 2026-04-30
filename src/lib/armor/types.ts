/**
 * ArmorInnovate domain types.
 *
 * Inferred from `src/lib/armor/schemas.ts`. Augmented with hydrated
 * fields populated by the loader at build time (e.g. readingMinutes).
 */

import type {
  ArmorCourseInput,
  ArmorLabInput,
  ArmorLessonInput,
  ArmorModuleInput,
} from './schemas';

// ──────────────────────────────────────────────────────────────────────
// Hydrated lesson — adds runtime-derived fields the loader fills in.
// ──────────────────────────────────────────────────────────────────────

export interface ArmorLesson extends ArmorLessonInput {
  /** Minutes of reading derived from the MDX file (loader-populated). */
  readingMinutes?: number;
  /** Whether the MDX file exists on disk (loader-populated). */
  mdxOk?: boolean;
  /** Whether the linked quiz YAML exists and is valid (loader-populated). */
  quizOk?: boolean;
}

export interface ArmorModule extends Omit<ArmorModuleInput, 'lessons'> {
  lessons: ArmorLesson[];
}

export interface ArmorCourse extends Omit<ArmorCourseInput, 'modules'> {
  modules: ArmorModule[];
}

export type ArmorLab = ArmorLabInput;

// ──────────────────────────────────────────────────────────────────────
// Navigation helper used by lesson pages.
// ──────────────────────────────────────────────────────────────────────

export interface ArmorLessonNavContext {
  prev: ArmorLesson | null;
  next: ArmorLesson | null;
  module: { id: string; title: string };
  position: { lessonIndex: number; moduleLessonCount: number };
}
