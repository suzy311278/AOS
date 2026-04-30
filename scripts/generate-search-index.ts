/**
 * generate-search-index.ts - Build-time script that generates:
 * - public/search-index.json (for global search)
 * - public/glossary.json (for GlossaryTerm tooltips)
 *
 * Run: npx tsx scripts/generate-search-index.ts
 */

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { stripMdx } from '../src/lib/reading-time';

const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'src', 'content');
const PUBLIC_DIR = join(ROOT, 'public');

interface SearchEntry {
  courseId: string;
  courseTitle: string;
  courseIcon: string;
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  snippet: string;
  headings: string[];
}

interface CourseYaml {
  id: string;
  title: string;
  icon: string;
  modules: {
    id: number;
    title: string;
    lessons: { id: string; title: string }[];
  }[];
}

// Ensure public dir exists
if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true });

// Discover courses
const courseDirs = readdirSync(CONTENT_DIR)
  .filter(d => !d.startsWith('_') && !d.startsWith('.'))
  .filter(d => existsSync(join(CONTENT_DIR, d, 'course.yaml')));

const index: SearchEntry[] = [];

for (const courseDir of courseDirs) {
  const courseYamlPath = join(CONTENT_DIR, courseDir, 'course.yaml');
  const course = yaml.load(readFileSync(courseYamlPath, 'utf-8')) as CourseYaml;

  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      const mdxPath = join(CONTENT_DIR, courseDir, 'lessons', `${lesson.id}.mdx`);
      if (!existsSync(mdxPath)) continue;

      const raw = readFileSync(mdxPath, 'utf-8');

      // Extract h2/h3 headings before stripping
      const headings = [...raw.matchAll(/^#{2,3}\s+(.+)$/gm)].map(m => m[1].trim());

      // Strip and create snippet
      const plainText = stripMdx(raw);
      const snippet = plainText.slice(0, 300);

      index.push({
        courseId: course.id,
        courseTitle: course.title,
        courseIcon: course.icon,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        moduleTitle: mod.title,
        snippet,
        headings,
      });
    }
  }
}

writeFileSync(join(PUBLIC_DIR, 'search-index.json'), JSON.stringify(index));
console.log(`Search index: ${index.length} entries written to public/search-index.json`);

// Generate glossary.json if glossary.yaml exists
const glossaryPath = join(CONTENT_DIR, 'glossary.yaml');
if (existsSync(glossaryPath)) {
  const glossaryData = yaml.load(readFileSync(glossaryPath, 'utf-8'));
  writeFileSync(join(PUBLIC_DIR, 'glossary.json'), JSON.stringify(glossaryData));
  console.log(`Glossary: written to public/glossary.json`);
} else {
  console.log('No glossary.yaml found - skipping glossary.json');
}
