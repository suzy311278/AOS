/**
 * check-course-completeness.ts
 *
 * Verifies that every course directory under src/content/ has all required
 * files tracked by git. Catches the "lessons committed but course.yaml forgotten"
 * mistake before it reaches deployment.
 *
 * Run: npx tsx scripts/check-course-completeness.ts
 * Also runs automatically via the prebuild script.
 */

import { readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'src', 'content');

function getTrackedFiles(): Set<string> {
  const output = execSync('git ls-files', { cwd: ROOT, encoding: 'utf-8' });
  return new Set(output.trim().split('\n'));
}

let errors = 0;
const tracked = getTrackedFiles();

const courseDirs = readdirSync(CONTENT_DIR).filter(d => {
  if (d.startsWith('_') || d.startsWith('.') || d === 'glossary.yaml') return false;
  const full = join(CONTENT_DIR, d);
  return statSync(full).isDirectory();
});

for (const courseId of courseDirs) {
  const dir = join(CONTENT_DIR, courseId);
  const rel = (f: string) => `src/content/${courseId}/${f}`;

  // 1. course.yaml must exist AND be tracked
  const courseYaml = join(dir, 'course.yaml');
  if (!existsSync(courseYaml)) {
    console.error(`  ✗ [${courseId}] Missing course.yaml`);
    errors++;
  } else if (!tracked.has(rel('course.yaml'))) {
    console.error(`  ✗ [${courseId}] course.yaml exists but is NOT tracked by git - run: git add ${rel('course.yaml')}`);
    errors++;
  }

  // 2. Check that lessons/ directory has tracked files
  const lessonsDir = join(dir, 'lessons');
  if (existsSync(lessonsDir)) {
    const mdxFiles = readdirSync(lessonsDir).filter(f => f.endsWith('.mdx'));
    for (const mdx of mdxFiles) {
      if (!tracked.has(rel(`lessons/${mdx}`))) {
        console.error(`  ✗ [${courseId}] lessons/${mdx} exists but is NOT tracked by git`);
        errors++;
      }
    }
  }

  // 3. Check that quizzes/ directory has tracked files
  const quizzesDir = join(dir, 'quizzes');
  if (existsSync(quizzesDir)) {
    const quizFiles = readdirSync(quizzesDir).filter(f => f.endsWith('.yaml'));
    for (const quiz of quizFiles) {
      if (!tracked.has(rel(`quizzes/${quiz}`))) {
        console.error(`  ✗ [${courseId}] quizzes/${quiz} exists but is NOT tracked by git`);
        errors++;
      }
    }
  }

  // 4. SOURCES.md should be tracked if it exists
  if (existsSync(join(dir, 'SOURCES.md')) && !tracked.has(rel('SOURCES.md'))) {
    console.error(`  ✗ [${courseId}] SOURCES.md exists but is NOT tracked by git`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`\n✗ ${errors} untracked course file(s) found - these will be missing from deployment!`);
  console.error('  Stage them with git add before committing.\n');
  process.exit(1);
} else {
  console.log(`✓ All course files tracked by git (${courseDirs.length} courses checked)`);
}
