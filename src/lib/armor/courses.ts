/**
 * ArmorInnovate course loader.
 *
 * Mirrors `src/lib/courses.ts` but rooted at `src/content/armor/<slug>/`.
 * Side-effect free at module scope; every helper does I/O on demand and
 * returns frozen, typed data.
 *
 * Layout:
 *   src/content/armor/<slug>/course.yaml        ← schema-validated metadata
 *   src/content/armor/<slug>/lessons/<id>.mdx   ← long-form lesson body
 *   src/content/armor/<slug>/quizzes/<id>.yaml  ← quiz items (optional)
 *
 * Failure mode:
 *   `getArmorCourse(slug)` THROWS on validation failure. `getAllArmorCourses()`
 *   logs and skips broken bundles so a single bad MCP run doesn't break
 *   the whole site. The validator CLI (`scripts/armor/validate-armor-content.ts`)
 *   surfaces the same diagnostics in CI.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { ArmorCourseSchema, QuizQuestionSchema } from './schemas';
import { computeReadingTime } from '../reading-time';
import type { QuizQuestion } from '../types';
import type {
  ArmorCourse,
  ArmorLesson,
  ArmorLessonNavContext,
  ArmorModule,
} from './types';

// ──────────────────────────────────────────────────────────────────────
// Paths
// ──────────────────────────────────────────────────────────────────────

const ARMOR_CONTENT_DIR = join(process.cwd(), 'src', 'content', 'armor');

function isCourseDir(slug: string): boolean {
  if (slug.startsWith('_') || slug.startsWith('.')) return false;
  const courseYaml = join(ARMOR_CONTENT_DIR, slug, 'course.yaml');
  return existsSync(courseYaml) && statSync(courseYaml).isFile();
}

// ──────────────────────────────────────────────────────────────────────
// Discovery
// ──────────────────────────────────────────────────────────────────────

export function getAllArmorCourseSlugs(): string[] {
  if (!existsSync(ARMOR_CONTENT_DIR)) return [];
  return readdirSync(ARMOR_CONTENT_DIR).filter(isCourseDir).sort();
}

export function armorCourseExists(slug: string): boolean {
  return isCourseDir(slug);
}

// ──────────────────────────────────────────────────────────────────────
// Single course load + hydrate
// ──────────────────────────────────────────────────────────────────────

export function getArmorCourse(slug: string): ArmorCourse {
  if (!isCourseDir(slug)) {
    throw new Error(`armor course not found: ${slug}`);
  }
  const yamlPath = join(ARMOR_CONTENT_DIR, slug, 'course.yaml');
  const raw = yaml.load(readFileSync(yamlPath, 'utf-8'));
  const parsed = ArmorCourseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `invalid armor course.yaml for ${slug}: ${parsed.error.issues
        .map((i) => `${i.path.join('.')} – ${i.message}`)
        .join('; ')}`,
    );
  }
  if (parsed.data.id !== slug) {
    throw new Error(
      `armor course id "${parsed.data.id}" does not match directory "${slug}"`,
    );
  }

  const lessonsDir = join(ARMOR_CONTENT_DIR, slug, 'lessons');
  const quizzesDir = join(ARMOR_CONTENT_DIR, slug, 'quizzes');

  const modules: ArmorModule[] = parsed.data.modules.map((mod) => ({
    ...mod,
    lessons: mod.lessons.map((lesson): ArmorLesson => {
      const mdxFile = lesson.mdx ?? `${lesson.id}.mdx`;
      const mdxPath = join(lessonsDir, mdxFile);
      const mdxOk = existsSync(mdxPath);
      const readingMinutes = mdxOk
        ? computeReadingTime(readFileSync(mdxPath, 'utf-8')).minutes
        : undefined;

      const quizFile = lesson.quiz ?? `${lesson.id}.yaml`;
      const quizPath = join(quizzesDir, quizFile);
      const quizOk = existsSync(quizPath);

      return {
        ...lesson,
        readingMinutes,
        mdxOk,
        quizOk,
      };
    }),
  }));

  return {
    ...parsed.data,
    modules,
  } as ArmorCourse;
}

// ──────────────────────────────────────────────────────────────────────
// Bulk load (skips invalid bundles)
// ──────────────────────────────────────────────────────────────────────

export function getAllArmorCourses(): ArmorCourse[] {
  return getAllArmorCourseSlugs().reduce<ArmorCourse[]>((acc, slug) => {
    try {
      acc.push(getArmorCourse(slug));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[armor] course ${slug} failed validation: ${message}`);
    }
    return acc;
  }, []);
}

// ──────────────────────────────────────────────────────────────────────
// Lesson helpers
// ──────────────────────────────────────────────────────────────────────

export function getAllArmorLessons(course: ArmorCourse): ArmorLesson[] {
  return course.modules.flatMap((m) => m.lessons);
}

export function getArmorLessonNavContext(
  course: ArmorCourse,
  lessonId: string,
): ArmorLessonNavContext | null {
  const flat = getAllArmorLessons(course);
  const idx = flat.findIndex((l) => l.id === lessonId);
  if (idx === -1) return null;

  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;

  for (const mod of course.modules) {
    const inMod = mod.lessons.findIndex((l) => l.id === lessonId);
    if (inMod !== -1) {
      return {
        prev,
        next,
        module: { id: mod.id, title: mod.title },
        position: {
          lessonIndex: inMod + 1,
          moduleLessonCount: mod.lessons.length,
        },
      };
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────
// Quiz loader
// ──────────────────────────────────────────────────────────────────────

export function getArmorQuiz(slug: string, lessonId: string): QuizQuestion[] {
  if (!isCourseDir(slug)) return [];
  const quizPath = join(ARMOR_CONTENT_DIR, slug, 'quizzes', `${lessonId}.yaml`);
  if (!existsSync(quizPath)) return [];
  try {
    const raw = yaml.load(readFileSync(quizPath, 'utf-8'));
    if (!Array.isArray(raw)) return [];
    return raw
      .map((q: unknown) => {
        const result = QuizQuestionSchema.safeParse(q);
        return result.success ? (result.data as QuizQuestion) : null;
      })
      .filter((q): q is QuizQuestion => q !== null);
  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────────────────────────────
// Read MDX body for a lesson — used by the lesson page on render.
// ──────────────────────────────────────────────────────────────────────

export function getArmorLessonMdx(slug: string, lessonId: string): string | null {
  const course = getArmorCourse(slug);
  const lesson = getAllArmorLessons(course).find((l) => l.id === lessonId);
  if (!lesson) return null;
  const file = lesson.mdx ?? `${lessonId}.mdx`;
  const path = join(ARMOR_CONTENT_DIR, slug, 'lessons', file);
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf-8');
}

// ──────────────────────────────────────────────────────────────────────
// Static-params helpers (Next.js generateStaticParams)
// ──────────────────────────────────────────────────────────────────────

export function getArmorCourseStaticParams(): Array<{ slug: string }> {
  return getAllArmorCourseSlugs().map((slug) => ({ slug }));
}

export function getArmorLessonStaticParams(): Array<{
  slug: string;
  lessonId: string;
}> {
  return getAllArmorCourses().flatMap((course) =>
    getAllArmorLessons(course).map((l) => ({
      slug: course.id,
      lessonId: l.id.replace('.', '_'),
    })),
  );
}

// ──────────────────────────────────────────────────────────────────────
// Re-exports for convenience
// ──────────────────────────────────────────────────────────────────────

export { ARMOR_CONTENT_DIR };
