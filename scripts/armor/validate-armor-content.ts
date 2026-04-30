/**
 * validate-armor-content.ts — CI guard for ArmorInnovate course bundles.
 *
 * Walks every `src/content/armor/<slug>/` directory and verifies:
 *   1. course.yaml passes the Zod schema.
 *   2. The course id matches the directory name.
 *   3. Every referenced lesson MDX file exists on disk (warning, not fatal).
 *   4. Every referenced quiz YAML parses with the QuizQuestionSchema (warning).
 *
 * Exit codes:
 *   0 — all course.yaml files are schema-valid (warnings allowed).
 *   1 — one or more course.yaml files failed Zod validation.
 *
 * Run:
 *   npx tsx scripts/armor/validate-armor-content.ts
 *   npx tsx scripts/armor/validate-armor-content.ts --strict   # fail on warnings
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import {
  ArmorCourseSchema,
  QuizQuestionSchema,
} from '../../src/lib/armor/schemas';

const ROOT = join(process.cwd(), 'src', 'content', 'armor');
const STRICT = process.argv.includes('--strict');

interface Diagnostic {
  level: 'error' | 'warn';
  slug: string;
  message: string;
}

function listSlugs(): string[] {
  if (!existsSync(ROOT)) return [];
  return readdirSync(ROOT).filter((d) => {
    if (d.startsWith('_') || d.startsWith('.')) return false;
    const p = join(ROOT, d, 'course.yaml');
    return existsSync(p) && statSync(p).isFile();
  });
}

function validateCourse(slug: string): Diagnostic[] {
  const diags: Diagnostic[] = [];
  const dir = join(ROOT, slug);
  const courseYaml = join(dir, 'course.yaml');

  let raw: unknown;
  try {
    raw = yaml.load(readFileSync(courseYaml, 'utf-8'));
  } catch (e) {
    diags.push({
      level: 'error',
      slug,
      message: `course.yaml is not valid YAML: ${(e as Error).message}`,
    });
    return diags;
  }

  const parsed = ArmorCourseSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      diags.push({
        level: 'error',
        slug,
        message: `course.yaml ${issue.path.join('.') || '(root)'} – ${issue.message}`,
      });
    }
    return diags;
  }

  const course = parsed.data;
  if (course.id !== slug) {
    diags.push({
      level: 'error',
      slug,
      message: `course.id "${course.id}" does not match directory "${slug}"`,
    });
  }

  const lessonsDir = join(dir, 'lessons');
  const quizzesDir = join(dir, 'quizzes');

  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      const mdxFile = lesson.mdx ?? `${lesson.id}.mdx`;
      const mdxPath = join(lessonsDir, mdxFile);
      if (!existsSync(mdxPath)) {
        diags.push({
          level: 'warn',
          slug,
          message: `module ${mod.id} lesson ${lesson.id}: missing MDX at lessons/${mdxFile}`,
        });
      }

      const quizFile = lesson.quiz ?? `${lesson.id}.yaml`;
      const quizPath = join(quizzesDir, quizFile);
      if (existsSync(quizPath)) {
        try {
          const rawQuiz = yaml.load(readFileSync(quizPath, 'utf-8'));
          if (!Array.isArray(rawQuiz)) {
            diags.push({
              level: 'error',
              slug,
              message: `quizzes/${quizFile} must be a YAML array of questions`,
            });
          } else {
            rawQuiz.forEach((q, i) => {
              const r = QuizQuestionSchema.safeParse(q);
              if (!r.success) {
                diags.push({
                  level: 'error',
                  slug,
                  message: `quizzes/${quizFile}[${i}] – ${r.error.issues
                    .map((x) => `${x.path.join('.')} ${x.message}`)
                    .join('; ')}`,
                });
              }
            });
          }
        } catch (e) {
          diags.push({
            level: 'error',
            slug,
            message: `quizzes/${quizFile} not valid YAML: ${(e as Error).message}`,
          });
        }
      } else if (lesson.quiz) {
        diags.push({
          level: 'warn',
          slug,
          message: `module ${mod.id} lesson ${lesson.id}: declared quiz "${lesson.quiz}" missing`,
        });
      }
    }
  }

  return diags;
}

function main(): void {
  const slugs = listSlugs();
  if (slugs.length === 0) {
    console.log('[armor] no courses under src/content/armor/ — nothing to validate.');
    return;
  }

  console.log(`[armor] validating ${slugs.length} course bundle(s)…\n`);

  let errors = 0;
  let warnings = 0;
  for (const slug of slugs) {
    const diags = validateCourse(slug);
    const errs = diags.filter((d) => d.level === 'error');
    const warns = diags.filter((d) => d.level === 'warn');
    errors += errs.length;
    warnings += warns.length;

    if (errs.length === 0 && warns.length === 0) {
      console.log(`  ✓ ${slug}`);
    } else {
      console.log(`  ${errs.length ? '✗' : '⚠'} ${slug}`);
      for (const d of [...errs, ...warns]) {
        const tag = d.level === 'error' ? '    error' : '    warn ';
        console.log(`${tag} ${d.message}`);
      }
    }
  }

  console.log(`\n[armor] ${errors} error(s), ${warnings} warning(s).`);
  if (errors > 0 || (STRICT && warnings > 0)) {
    process.exit(1);
  }
}

main();
