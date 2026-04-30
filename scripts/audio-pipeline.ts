/**
 * audio-pipeline.ts - CLI helper for the audio generation pipeline.
 *
 * Commands:
 *   status                           Dashboard: lessons with/without audio per course
 *   next-batch [--limit N] [--course X]  JSON array of next N lessons needing audio
 *   extract <courseId> <lessonId>     Output stripped plain text to stdout
 *   insert <courseId> <lessonId> <r2Url>  Insert AudioPlayer tag into MDX
 *   log <courseId> <lessonId>         Append to daily generation log
 *
 * Run: npx tsx scripts/audio-pipeline.ts <command> [args]
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { stripMdx } from '../src/lib/reading-time';

const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'src', 'content');
const LOG_FILE = join(__dirname, '.audio-generation-log.json');
const R2_BASE = 'https://pub-033ee478bfa542229216e3781c99cb96.r2.dev';
const DAILY_LIMIT = 19;
const TEXT_CHAR_LIMIT = 50_000;

// ── Types ────────────────────────────────────────────────────────────────────

interface CourseYaml {
  id: string;
  title: string;
  icon: string;
  status?: string;
  modules: {
    id: number;
    title: string;
    lessons: { id: string; title: string }[];
  }[];
}

interface LogEntry {
  courseId: string;
  lessonId: string;
  timestamp: string;
  date: string; // YYYY-MM-DD for daily grouping
}

interface LessonInfo {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function discoverCourses(): CourseYaml[] {
  return readdirSync(CONTENT_DIR)
    .filter(d => !d.startsWith('_') && !d.startsWith('.'))
    .filter(d => existsSync(join(CONTENT_DIR, d, 'course.yaml')))
    .sort()
    .map(d => yaml.load(readFileSync(join(CONTENT_DIR, d, 'course.yaml'), 'utf-8')) as CourseYaml);
}

function lessonHasAudio(courseId: string, lessonId: string): boolean {
  const mdxPath = join(CONTENT_DIR, courseId, 'lessons', `${lessonId}.mdx`);
  if (!existsSync(mdxPath)) return false;
  const content = readFileSync(mdxPath, 'utf-8');
  return content.includes('<AudioPlayer');
}

function getMdxPath(courseId: string, lessonId: string): string {
  return join(CONTENT_DIR, courseId, 'lessons', `${lessonId}.mdx`);
}

function readLog(): LogEntry[] {
  if (!existsSync(LOG_FILE)) return [];
  try {
    return JSON.parse(readFileSync(LOG_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeLog(entries: LogEntry[]): void {
  writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2));
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function todayUsageCount(): number {
  const today = todayStr();
  return readLog().filter(e => e.date === today).length;
}

function getAllLessons(): LessonInfo[] {
  const courses = discoverCourses();
  const lessons: LessonInfo[] = [];
  for (const course of courses) {
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        lessons.push({
          courseId: course.id,
          courseTitle: course.title,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          moduleTitle: mod.title,
        });
      }
    }
  }
  return lessons;
}

/** Convert lesson ID to R2 filename format: "0.1" -> "0_1" */
function lessonIdToFilename(id: string): string {
  return id.replace(/\./g, '_');
}

// ── Commands ─────────────────────────────────────────────────────────────────

function cmdStatus(): void {
  const courses = discoverCourses();
  const today = todayStr();
  const usedToday = todayUsageCount();

  console.log(`\n  Audio Pipeline Status (${today})`);
  console.log(`  Daily usage: ${usedToday}/${DAILY_LIMIT}\n`);
  console.log('  Course                                  With Audio  Without  Total');
  console.log('  ' + '-'.repeat(72));

  let totalWith = 0;
  let totalWithout = 0;
  let totalLessons = 0;

  for (const course of courses) {
    let withAudio = 0;
    let withoutAudio = 0;

    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        const mdxPath = getMdxPath(course.id, lesson.id);
        if (!existsSync(mdxPath)) continue;
        if (lessonHasAudio(course.id, lesson.id)) {
          withAudio++;
        } else {
          withoutAudio++;
        }
      }
    }

    const total = withAudio + withoutAudio;
    const name = `${course.icon} ${course.id}`.padEnd(40);
    console.log(`  ${name}${String(withAudio).padStart(6)}    ${String(withoutAudio).padStart(6)}  ${String(total).padStart(5)}`);

    totalWith += withAudio;
    totalWithout += withoutAudio;
    totalLessons += total;
  }

  console.log('  ' + '-'.repeat(72));
  const totLabel = 'TOTAL'.padEnd(40);
  console.log(`  ${totLabel}${String(totalWith).padStart(6)}    ${String(totalWithout).padStart(6)}  ${String(totalLessons).padStart(5)}`);
  console.log();
}

function cmdNextBatch(args: string[]): void {
  let limit = DAILY_LIMIT;
  let courseFilter: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--course' && args[i + 1]) {
      courseFilter = args[i + 1];
      i++;
    }
  }

  const usedToday = todayUsageCount();
  const remaining = Math.max(0, DAILY_LIMIT - usedToday);
  limit = Math.min(limit, remaining);

  if (limit <= 0) {
    console.error(`Daily limit reached (${usedToday}/${DAILY_LIMIT}). Try again tomorrow.`);
    process.exit(1);
  }

  const allLessons = getAllLessons();
  const needsAudio = allLessons.filter(l => {
    if (courseFilter && l.courseId !== courseFilter) return false;
    const mdxPath = getMdxPath(l.courseId, l.lessonId);
    if (!existsSync(mdxPath)) return false;
    return !lessonHasAudio(l.courseId, l.lessonId);
  });

  const batch = needsAudio.slice(0, limit);
  console.log(JSON.stringify(batch, null, 2));
}

function cmdExtract(courseId: string, lessonId: string): void {
  const mdxPath = getMdxPath(courseId, lessonId);
  if (!existsSync(mdxPath)) {
    console.error(`File not found: ${mdxPath}`);
    process.exit(1);
  }

  const raw = readFileSync(mdxPath, 'utf-8');
  let text = stripMdx(raw);

  if (text.length > TEXT_CHAR_LIMIT) {
    text = text.slice(0, TEXT_CHAR_LIMIT);
  }

  process.stdout.write(text);
}

function cmdInsert(courseId: string, lessonId: string, r2Url: string): void {
  const mdxPath = getMdxPath(courseId, lessonId);
  if (!existsSync(mdxPath)) {
    console.error(`File not found: ${mdxPath}`);
    process.exit(1);
  }

  const content = readFileSync(mdxPath, 'utf-8');

  if (content.includes('<AudioPlayer')) {
    console.log(`Already has AudioPlayer, skipping: ${courseId}/${lessonId}`);
    return;
  }

  const lines = content.split('\n');

  // Find first heading line (<h2 or ##)
  let headingIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('<h2') || trimmed.startsWith('## ')) {
      headingIdx = i;
      break;
    }
  }

  const audioTag = `<AudioPlayer src="${r2Url}" title="Listen to this lesson (podcast-style overview)" />`;

  if (headingIdx === -1) {
    // No heading found - insert after first blank line or at line 2
    lines.splice(2, 0, '', audioTag, '');
  } else {
    // Insert AudioPlayer above the heading with blank lines
    // Check if there's already a blank line above
    const insertLines: string[] = [];
    if (headingIdx > 0 && lines[headingIdx - 1].trim() !== '') {
      insertLines.push('');
    }
    insertLines.push(audioTag);
    if (lines[headingIdx].trim() !== '') {
      insertLines.push('');
    }
    lines.splice(headingIdx, 0, ...insertLines);
  }

  writeFileSync(mdxPath, lines.join('\n'));
  console.log(`Inserted AudioPlayer into ${courseId}/${lessonId}`);
}

function cmdLog(courseId: string, lessonId: string): void {
  const entries = readLog();
  const now = new Date();
  entries.push({
    courseId,
    lessonId,
    timestamp: now.toISOString(),
    date: todayStr(),
  });
  writeLog(entries);
  console.log(`Logged: ${courseId}/${lessonId} (${todayUsageCount()}/${DAILY_LIMIT} today)`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case 'status':
    cmdStatus();
    break;

  case 'next-batch':
    cmdNextBatch(args);
    break;

  case 'extract':
    if (args.length < 2) {
      console.error('Usage: audio-pipeline.ts extract <courseId> <lessonId>');
      process.exit(1);
    }
    cmdExtract(args[0], args[1]);
    break;

  case 'insert':
    if (args.length < 3) {
      console.error('Usage: audio-pipeline.ts insert <courseId> <lessonId> <r2Url>');
      process.exit(1);
    }
    cmdInsert(args[0], args[1], args[2]);
    break;

  case 'log':
    if (args.length < 2) {
      console.error('Usage: audio-pipeline.ts log <courseId> <lessonId>');
      process.exit(1);
    }
    cmdLog(args[0], args[1]);
    break;

  default:
    console.log(`
Audio Pipeline - Generate podcast-style audio for lessons

Commands:
  status                              Show audio coverage per course
  next-batch [--limit N] [--course X] List next lessons needing audio (JSON)
  extract <courseId> <lessonId>        Output plain text for NotebookLM
  insert <courseId> <lessonId> <url>   Insert AudioPlayer tag into MDX
  log <courseId> <lessonId>            Record generation in daily log

Examples:
  npx tsx scripts/audio-pipeline.ts status
  npx tsx scripts/audio-pipeline.ts next-batch --limit 5
  npx tsx scripts/audio-pipeline.ts extract vm0042 0.2
  npx tsx scripts/audio-pipeline.ts insert vm0042 0.2 https://...r2.dev/vm0042/0_2.mp3
  npx tsx scripts/audio-pipeline.ts log vm0042 0.2
`);
    break;
}
