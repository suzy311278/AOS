/**
 * Filesystem writer for the MCP content pipeline.
 *
 * Takes a `GenerateCourseOutput` and lays it down under
 * `src/content/armor/<slug>/`:
 *
 *   src/content/armor/<slug>/course.yaml
 *   src/content/armor/<slug>/lessons/<id>.mdx          (one per lesson)
 *   src/content/armor/<slug>/quizzes/<id>.yaml         (the canonical quiz)
 *   src/content/armor/<slug>/lab/Dockerfile            (if a lab was generated)
 *   src/content/armor/<slug>/lab/entrypoint.sh         (optional)
 *
 * Idempotency:
 *   - Files are overwritten in-place. The caller is responsible for
 *     branching / staging the workspace (the admin UI uses git worktrees
 *     in a future phase; the CLI simply writes).
 *
 * Safety:
 *   - Refuses to write outside `src/content/armor/`. Slugs are clamped.
 *   - Validates the rendered course YAML against `ArmorCourseSchema`
 *     before writing. Throws with the parse error if invalid.
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import * as yaml from 'js-yaml';
import { ArmorCourseSchema } from '../schemas';
import { ARMOR_CONTENT_DIR } from '../courses';
import type { GenerateCourseOutput } from '../mcp-pipeline';

export interface WriteResult {
  slug: string;
  files: string[];
}

export function writeGeneratedCourse(out: GenerateCourseOutput): WriteResult {
  const root = resolve(ARMOR_CONTENT_DIR);
  const target = resolve(join(ARMOR_CONTENT_DIR, out.slug));

  // Sanity: refuse path traversal.
  if (!target.startsWith(root + '/')) {
    throw new Error(`refusing to write outside content root: ${target}`);
  }

  // Schema-validate the course YAML before any I/O.
  const parsed = ArmorCourseSchema.safeParse(yaml.load(out.courseYaml));
  if (!parsed.success) {
    throw new Error(
      `generated course.yaml fails schema for ${out.slug}: ${parsed.error.issues
        .map((i) => `${i.path.join('.')} ${i.message}`)
        .join('; ')}`,
    );
  }

  const files: string[] = [];
  mkdirSync(target, { recursive: true });
  mkdirSync(join(target, 'lessons'), { recursive: true });
  mkdirSync(join(target, 'quizzes'), { recursive: true });

  // course.yaml
  const coursePath = join(target, 'course.yaml');
  writeFileSync(coursePath, out.courseYaml, 'utf-8');
  files.push(coursePath);

  // lessons/*.mdx
  for (const lesson of out.lessons) {
    const path = join(target, 'lessons', `${lesson.id}.mdx`);
    writeFileSync(path, lesson.mdx, 'utf-8');
    files.push(path);
  }

  // quizzes/<canonical>.yaml
  if (out.quiz?.yaml) {
    const path = join(target, 'quizzes', `${out.quiz.id}.yaml`);
    writeFileSync(path, out.quiz.yaml, 'utf-8');
    files.push(path);
  }

  // lab/* (optional)
  if (out.lab) {
    const labDir = join(target, 'lab');
    mkdirSync(labDir, { recursive: true });
    if (out.lab.dockerfile) {
      const p = join(labDir, 'Dockerfile');
      writeFileSync(p, out.lab.dockerfile, 'utf-8');
      files.push(p);
    }
    if (out.lab.entrypoint) {
      const p = join(labDir, 'entrypoint.sh');
      writeFileSync(p, out.lab.entrypoint, 'utf-8');
      files.push(p);
    }
    if (out.lab.yaml) {
      const p = join(labDir, 'lab.yaml');
      writeFileSync(p, out.lab.yaml, 'utf-8');
      files.push(p);
    }
  }

  return { slug: out.slug, files };
}
