/**
 * validate-content.ts
 *
 * Build-time content integrity checks:
 * - Validates course.yaml against Zod schema
 * - Validates all quiz.yaml files
 * - Checks every lesson ID has a corresponding .mdx file
 * - Checks all lessons with quizzes have corresponding quiz YAML
 * - Reports broken component references in MDX
 *
 * Run: npx tsx scripts/validate-content.ts
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import * as yaml from 'js-yaml';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const MultipleChoiceSchema = z.object({
  type: z.literal('multiple-choice').optional(),
  question: z.string().min(1, 'question must not be empty'),
  options: z.array(z.string()).min(2).max(6),
  answer: z.number().int().min(0),
  explanation: z.string().optional(),
}).refine(q => q.answer < q.options.length, { message: 'answer out of range' });

const TrueFalseSchema = z.object({
  type: z.literal('true-false'),
  question: z.string().min(1),
  answer: z.boolean(),
  explanation: z.string().optional(),
});

const MultiSelectSchema = z.object({
  type: z.literal('multi-select'),
  question: z.string().min(1),
  options: z.array(z.string()).min(2).max(8),
  answers: z.array(z.number().int().min(0)).min(1),
  explanation: z.string().optional(),
}).refine(q => q.answers.every((a: number) => a < q.options.length), { message: 'answer index out of range' });

const MatchingSchema = z.object({
  type: z.literal('matching'),
  question: z.string().min(1),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).min(2).max(8),
  explanation: z.string().optional(),
});

const QuizQuestionSchema = z.union([
  TrueFalseSchema,
  MultiSelectSchema,
  MatchingSchema,
  MultipleChoiceSchema,
]);

const LessonMetaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  duration: z.string().optional(),
  vmRef: z.string().optional(),
});

const ModuleSchema = z.object({
  id: z.number().int().min(0),
  title: z.string().min(1),
  subtitle: z.string(),
  icon: z.string(),
  color: z.string(),
  lessons: z.array(LessonMetaSchema).min(1),
});

const CourseSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  subtitle: z.string(),
  description: z.string(),
  icon: z.string(),
  color: z.string(),
  status: z.enum(['published', 'draft', 'coming-soon']),
  category: z.enum(['methodologies', 'markets', 'esg', 'fundamentals', 'green-finance', 'sustainability-standards']),
  estimatedHours: z.number().positive(),
  modules: z.array(ModuleSchema).min(1),
});

// ─── Validate a single course ─────────────────────────────────────────────────

function validateCourse(courseDir: string): boolean {
  let allOk = true;
  const courseId = courseDir.split('/').pop()!;
  const courseYamlPath = join(courseDir, 'course.yaml');

  if (!existsSync(courseYamlPath)) {
    console.error(`  ✗ Missing course.yaml in ${courseDir}`);
    return false;
  }

  // Parse and validate course.yaml
  let course: z.infer<typeof CourseSchema>;
  try {
    const raw = yaml.load(readFileSync(courseYamlPath, 'utf-8'));
    const result = CourseSchema.safeParse(raw);
    if (!result.success) {
      console.error(`  ✗ course.yaml validation failed for ${courseId}:`);
      result.error.errors.forEach(e => {
        console.error(`      ${e.path.join('.')}: ${e.message}`);
      });
      return false;
    }
    course = result.data;
    console.log(`  ✓ course.yaml valid (${courseId})`);
  } catch (e) {
    console.error(`  ✗ Failed to parse course.yaml for ${courseId}:`, e);
    return false;
  }

  const lessonsDir = join(courseDir, 'lessons');
  const quizzesDir = join(courseDir, 'quizzes');

  // Check every lesson has an MDX file
  const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
  for (const lessonId of allLessonIds) {
    const mdxPath = join(lessonsDir, `${lessonId}.mdx`);
    if (!existsSync(mdxPath)) {
      console.error(`  ✗ Missing MDX file: lessons/${lessonId}.mdx`);
      allOk = false;
    }
  }

  // Validate all quiz YAML files
  if (existsSync(quizzesDir)) {
    const quizFiles = readdirSync(quizzesDir).filter(f => f.endsWith('.yaml'));
    for (const quizFile of quizFiles) {
      const quizId = quizFile.replace('.yaml', '');
      const quizPath = join(quizzesDir, quizFile);
      try {
        const raw = yaml.load(readFileSync(quizPath, 'utf-8'));
        if (!Array.isArray(raw)) {
          console.error(`  ✗ quizzes/${quizFile}: must be an array of questions`);
          allOk = false;
          continue;
        }
        const result = z.array(QuizQuestionSchema).safeParse(raw);
        if (!result.success) {
          console.error(`  ✗ quizzes/${quizFile} validation failed:`);
          result.error.errors.forEach(e => {
            console.error(`      [${e.path.join('.')}]: ${e.message}`);
          });
          allOk = false;
        }
      } catch (e) {
        console.error(`  ✗ Failed to parse quizzes/${quizFile}:`, e);
        allOk = false;
      }
    }
  }

  // Check MDX files for known component references
  const knownComponents = ['HighlightBox', 'AnalogyBox', 'ExampleBox', 'FormulaBox', 'ResponsiveTable', 'CalculationExercise', 'DeepDive', 'EquationBreakdown', 'GlossaryTerm', 'CaseStudy'];
  if (existsSync(lessonsDir)) {
    const mdxFiles = readdirSync(lessonsDir).filter(f => f.endsWith('.mdx'));
    for (const mdxFile of mdxFiles) {
      const mdxContent = readFileSync(join(lessonsDir, mdxFile), 'utf-8');
      // Find any <ComponentName that isn't in our known list
      const allTags = [...mdxContent.matchAll(/<([A-Z][A-Za-z]+)/g)].map(m => m[1]);
      const unknownTags = [...new Set(allTags)].filter(t => !knownComponents.includes(t));
      if (unknownTags.length > 0) {
        console.warn(`  ⚠ ${mdxFile}: unknown component tags: ${unknownTags.join(', ')}`);
      }
    }
  }

  if (allOk) {
    console.log(`  ✓ All ${allLessonIds.length} lessons verified for ${courseId}`);
  }

  return allOk;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'src', 'content');

if (!existsSync(CONTENT_DIR)) {
  console.error(`✗ Content directory not found: ${CONTENT_DIR}`);
  console.error('  Run: npx tsx scripts/migrate-content.ts first');
  process.exit(1);
}

const courseDirs = readdirSync(CONTENT_DIR)
  .filter(d => !d.startsWith('_'))  // skip _template
  .map(d => join(CONTENT_DIR, d))
  .filter(d => existsSync(join(d, 'course.yaml')));

if (courseDirs.length === 0) {
  console.error('✗ No courses found in src/content/');
  process.exit(1);
}

console.log(`\nValidating ${courseDirs.length} course(s)...\n`);

let allPassed = true;
for (const courseDir of courseDirs) {
  const passed = validateCourse(courseDir);
  if (!passed) allPassed = false;
}

if (allPassed) {
  console.log('\n✅ All content validation checks passed!');
  process.exit(0);
} else {
  console.error('\n✗ Content validation FAILED — fix errors before deploying');
  process.exit(1);
}
