/**
 * ArmorInnovate course schemas — Zod source of truth.
 *
 * The legacy Greentryst loader (`src/lib/schemas.ts` + `src/lib/courses.ts`)
 * keeps serving every course under `src/content/<slug>/`. ArmorInnovate
 * runs in parallel under `src/content/armor/<slug>/` so we can ship the
 * new IA without disturbing production traffic.
 *
 * Why a separate schema?
 *   - Different metadata (track, IEC parts, ISA security levels, code).
 *   - Quiz / lab schemas embed inside the course bundle.
 *   - Stricter slug, code, and refinement rules so MCP-generated content
 *     is rejected the moment it deviates from the contract.
 *
 * Quiz reuse:
 *   The `QuizQuestionSchema` is shape-compatible with the legacy schema
 *   so quiz YAML files written today pass both validators. We re-export
 *   the existing union to keep that invariant explicit.
 */
import { z } from 'zod';
import { QuizQuestionSchema } from '../schemas';

// ──────────────────────────────────────────────────────────────────────
// Re-exported quiz schema (single source of truth lives in lib/schemas)
// ──────────────────────────────────────────────────────────────────────

export { QuizQuestionSchema };

// ──────────────────────────────────────────────────────────────────────
// Atomic schemas
// ──────────────────────────────────────────────────────────────────────

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,80}$/;
const COURSE_CODE_RE = /^AI-(CSP|CSE)-[A-Z]{2,5}$/;
const LESSON_ID_RE = /^[0-9]{1,2}\.[0-9]{1,2}$/;
const MODULE_ID_RE = /^[0-9]{1,2}$/;
const ISA_LEVEL = z.enum(['SL1', 'SL2', 'SL3', 'SL4']);
const TRACK_ID = z.enum([
  'foundations',
  'risk-assessment',
  'design',
  'maintenance',
  'capstone',
  'ics-pentest',
  'ot-defense',
]);
const DIFFICULTY = z.enum(['intro', 'intermediate', 'advanced']);
const STATUS = z.enum(['available', 'beta', 'coming-soon', 'draft']);

// ──────────────────────────────────────────────────────────────────────
// Lesson
// ──────────────────────────────────────────────────────────────────────

export const ArmorLessonSchema = z.object({
  id: z.string().regex(LESSON_ID_RE, 'lesson id must look like "1.2"'),
  title: z.string().min(4).max(120),
  durationMin: z.number().int().min(5).max(180),
  /** MDX file under <course>/lessons/<file>.mdx. Defaults to `${id}.mdx`. */
  mdx: z.string().regex(/^[\w.\-]+\.mdx$/).optional(),
  /** Reference document or standard fragment cited in the lesson. */
  vmRef: z.string().optional(),
  /** Optional slug of the quiz file (under <course>/quizzes/) for this lesson. */
  quiz: z.string().regex(/^[\w.\-]+\.yaml$/).optional(),
  /** Optional lab slug to link from the lesson footer. */
  lab: z.string().regex(SLUG_RE).optional(),
  /** Override SEO title; root layout appends " | Greentryst". Bare title ≤ 59. */
  seoTitle: z.string().max(59).optional(),
  seoDescription: z.string().max(170).optional(),
});

// ──────────────────────────────────────────────────────────────────────
// Module
// ──────────────────────────────────────────────────────────────────────

export const ArmorModuleSchema = z.object({
  id: z.string().regex(MODULE_ID_RE, 'module id must be a non-negative integer string'),
  title: z.string().min(4).max(120),
  subtitle: z.string().max(180).optional(),
  /** Short SCADA-style label rendered on the schematic. */
  shortLabel: z.string().max(28).optional(),
  lessons: z.array(ArmorLessonSchema).min(1).max(20),
});

// ──────────────────────────────────────────────────────────────────────
// Inline lab descriptor (the bundled hands-on for this course)
// ──────────────────────────────────────────────────────────────────────

export const ArmorLabSchema = z.object({
  slug: z.string().regex(SLUG_RE),
  tag: z.string().regex(/^LAB-[0-9]{2,3}$/),
  title: z.string().min(4).max(140),
  shortLabel: z.string().max(40),
  runtime: z.enum([
    'pymodbus-simulator',
    'snap7-simulator',
    'cpppo-simulator',
    'view-me-mock',
    'iec104-simulator',
    'opc-ua-mock',
  ]),
  protocol: z.string().min(2).max(40),
  port: z.string().regex(/^[0-9]{1,5}$/),
  unit: z.enum(['tcp', 'udp', 'mixed']),
  difficulty: DIFFICULTY,
  status: z.enum(['ready', 'queue', 'maintenance']),
  durationMin: z.number().int().min(15).max(600),
  track: z.enum(['ics-pentest', 'ot-defense', 'capstone']),
  isaLevels: z.array(ISA_LEVEL).min(1),
  objectives: z.array(z.string().min(8)).min(1).max(10),
  toolkit: z.array(z.string().min(2)).min(1).max(20),
  scenario: z.string().min(40).max(1200),
  successCriteria: z.array(z.string().min(8)).min(1).max(10),
  /** Optional advisory IDs (e.g. ICSA-24-191-04) the lab references. */
  relatedAdvisories: z.array(z.string()).default([]),
});

// ──────────────────────────────────────────────────────────────────────
// Course
// ──────────────────────────────────────────────────────────────────────

export const ArmorCourseSchema = z.object({
  /** Stable slug; matches the directory name. */
  id: z.string().regex(SLUG_RE),
  /** Public credential code (printed on certificates). Optional for non-cert courses. */
  code: z.string().regex(COURSE_CODE_RE).optional(),
  title: z.string().min(4).max(120),
  shortTitle: z.string().min(2).max(40).optional(),
  subtitle: z.string().min(4).max(180),
  tagline: z.string().max(160).optional(),
  summary: z.string().min(40).max(1200),
  description: z.string().min(40).max(2000),
  /** Track this course belongs to. Drives certification linkage. */
  track: TRACK_ID,
  difficulty: DIFFICULTY,
  status: STATUS,
  /** IEC 62443 parts covered. */
  iecParts: z.array(z.string().regex(/^IEC 62443-[0-9](-[0-9])?$/)).min(1),
  /** ISA Security Levels the course targets. */
  isaLevels: z.array(ISA_LEVEL).min(1),
  /** Lecture / reading hours, excluding lab time. */
  hours: z.number().min(1).max(200),
  /** Hands-on lab hours. */
  labHours: z.number().min(0).max(200),
  /** Pass score on the written exam (% out of 100). */
  passingScore: z.number().int().min(40).max(100),
  /** Free-form taxonomy tags for search. */
  tags: z.array(z.string().min(2).max(40)).default([]),
  /** Learner-facing outcomes, one bullet each. */
  outcomes: z.array(z.string().min(10).max(280)).min(1).max(12),
  /** Slugs of other Armor courses that should be completed first. */
  prereqs: z.array(z.string().regex(SLUG_RE)).default([]),
  /** Source URLs / standards the MCP pipeline cited when generating. */
  sources: z.array(z.object({
    label: z.string().min(2),
    url: z.string().url(),
  })).default([]),
  /** Bare title ≤ 59 so root layout's "%s | Greentryst" stays ≤ 70. */
  seoTitle: z.string().max(59).optional(),
  seoDescription: z.string().max(170).optional(),
  /** Module → lessons tree. */
  modules: z.array(ArmorModuleSchema).min(1).max(12),
  /** Optional bundled lab. */
  lab: ArmorLabSchema.optional(),
  /** Provenance — populated by the MCP generator. */
  generated: z.object({
    by: z.enum(['mcp', 'human', 'mock']),
    at: z.string().datetime(),
    pipelineVersion: z.string().min(1),
    tokenUsage: z.number().int().nonnegative().optional(),
  }).optional(),
}).superRefine((course, ctx) => {
  // Lesson ids must be unique within the course.
  const seen = new Set<string>();
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      if (seen.has(lesson.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['modules'],
          message: `duplicate lesson id "${lesson.id}"`,
        });
      }
      seen.add(lesson.id);
    }
  }
  // Capstone courses must reference at least one lab and have ≥ 1 outcome
  // referencing "practical" (best-effort heuristic, not a hard gate).
  if (course.track === 'capstone' && !course.lab) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lab'],
      message: 'capstone courses must bundle a hands-on lab',
    });
  }
});

// ──────────────────────────────────────────────────────────────────────
// Inferred types
// ──────────────────────────────────────────────────────────────────────

export type ArmorCourseInput = z.infer<typeof ArmorCourseSchema>;
export type ArmorModuleInput = z.infer<typeof ArmorModuleSchema>;
export type ArmorLessonInput = z.infer<typeof ArmorLessonSchema>;
export type ArmorLabInput = z.infer<typeof ArmorLabSchema>;
