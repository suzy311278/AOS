/**
 * migrate-content.ts
 *
 * Extracts MODULES and LESSONS from VM0042_Learning_Module.html and outputs:
 *  - src/content/vm0042/course.yaml
 *  - src/content/vm0042/lessons/<id>.mdx  (one per lesson)
 *  - src/content/vm0042/quizzes/<id>.yaml (one per lesson with a quiz)
 *
 * Run: npx tsx scripts/migrate-content.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as vm from 'vm';

// ─── Paths ────────────────────────────────────────────────────────────────────

const ROOT = join(__dirname, '..');
const HTML_SRC = join(ROOT, 'VM0042_Learning_Module.html');
const CONTENT_OUT = join(ROOT, 'src', 'content', 'vm0042');
const LESSONS_OUT = join(CONTENT_OUT, 'lessons');
const QUIZZES_OUT = join(CONTENT_OUT, 'quizzes');

mkdirSync(LESSONS_OUT, { recursive: true });
mkdirSync(QUIZZES_OUT, { recursive: true });

// ─── Extract script block ─────────────────────────────────────────────────────

const html = readFileSync(HTML_SRC, 'utf-8');
const scriptStart = html.indexOf('<script type="text/babel">');
const scriptEnd = html.indexOf('</script>', scriptStart);
const scriptContent = html.slice(scriptStart + '<script type="text/babel">'.length, scriptEnd);

// Data section ends before React components (line ~4474 in full file, "// === COMPONENTS" section)
// We find it by locating the first "function App()" or the colorMap definition which is just before components
const componentSectionMarker = '\nfunction App()';
const dataEndIdx = scriptContent.indexOf(componentSectionMarker);
const dataSection = dataEndIdx !== -1 ? scriptContent.slice(0, dataEndIdx) : scriptContent;

// ─── Evaluate MODULES and colorMap via Node.js VM ────────────────────────────

// We'll evaluate just the parts we need. The data section has no JSX.
// Replace template literals in LESSONS content so the eval doesn't execute them.
// Strategy: eval MODULES first (pure array), then parse LESSONS manually.

const modulesMatch = dataSection.match(/const MODULES\s*=\s*(\[[\s\S]*?\]);/);
if (!modulesMatch) {
  throw new Error('Could not find MODULES array in script');
}

const ctx = vm.createContext({});
vm.runInContext(`const MODULES = ${modulesMatch[1]};`, ctx);
const MODULES: Array<{
  id: number;
  color: string;
  icon: string;
  title: string;
  subtitle: string;
  lessons: Array<{ id: string; title: string }>;
}> = vm.runInContext('MODULES', ctx);

console.log(`✓ Extracted ${MODULES.length} modules from MODULES array`);

// ─── Parse LESSONS manually ───────────────────────────────────────────────────

interface ParsedLesson {
  id: string;
  title: string;
  vmRef: string;
  duration: string;
  content: string;
  quiz: Array<{ q: string; options: string[]; answer: number; explanation: string }>;
}

const parsedLessons: ParsedLesson[] = [];

// Collect all lesson IDs from MODULES
const allLessonIds: string[] = MODULES.flatMap(m => m.lessons.map(l => l.id));

for (const lessonId of allLessonIds) {
  const marker = `LESSONS["${lessonId}"] = {`;
  const markerIdx = scriptContent.indexOf(marker);
  if (markerIdx === -1) {
    console.warn(`  ⚠ LESSONS["${lessonId}"] not found — skipping`);
    continue;
  }

  const lessonStart = markerIdx + marker.length;

  // Extract simple string fields
  const titleMatch = scriptContent.slice(lessonStart, lessonStart + 200).match(/title:\s*"([^"]+)"/);
  const vmRefMatch = scriptContent.slice(lessonStart, lessonStart + 300).match(/vmRef:\s*"([^"]*)"/);
  const durationMatch = scriptContent.slice(lessonStart, lessonStart + 400).match(/duration:\s*"([^"]*)"/);

  const title = titleMatch?.[1] ?? '';
  const vmRef = vmRefMatch?.[1] ?? '';
  const duration = durationMatch?.[1] ?? '';

  // Extract content template literal
  const contentStart = scriptContent.indexOf('content: `', lessonStart);
  if (contentStart === -1) {
    console.warn(`  ⚠ No content field found for lesson ${lessonId}`);
    continue;
  }

  const contentBodyStart = contentStart + 'content: `'.length;
  let contentBody = '';
  let i = contentBodyStart;
  let depth = 0; // track ${...} interpolation depth
  while (i < scriptContent.length) {
    const ch = scriptContent[i];
    if (ch === '\\') {
      // escaped character — include both chars, skip
      contentBody += scriptContent[i] + scriptContent[i + 1];
      i += 2;
      continue;
    }
    if (ch === '$' && scriptContent[i + 1] === '{') {
      depth++;
      contentBody += '${';
      i += 2;
      continue;
    }
    if (depth > 0 && ch === '}') {
      depth--;
      contentBody += '}';
      i++;
      continue;
    }
    if (depth === 0 && ch === '`') {
      // closing backtick
      break;
    }
    contentBody += ch;
    i++;
  }

  // Extract quiz array — it follows the content template literal
  const afterContent = scriptContent.indexOf('quiz:', i);
  // Ensure it's within this lesson block (before next LESSONS["..."] or end of data section)
  const nextLessonMarker = scriptContent.indexOf('LESSONS["', i + 1);
  const quizFieldEnd = nextLessonMarker !== -1 ? nextLessonMarker : dataSection.length;

  let quiz: ParsedLesson['quiz'] = [];
  if (afterContent !== -1 && afterContent < quizFieldEnd) {
    const quizArrayStart = scriptContent.indexOf('[', afterContent);
    if (quizArrayStart !== -1 && quizArrayStart < quizFieldEnd) {
      // Extract balanced [ ... ]
      let bracketDepth = 0;
      let quizStr = '';
      let j = quizArrayStart;
      let inString = false;
      let stringChar = '';
      while (j < scriptContent.length) {
        const c = scriptContent[j];
        if (!inString) {
          if (c === '"' || c === "'") {
            inString = true;
            stringChar = c;
            quizStr += c;
          } else if (c === '[') {
            bracketDepth++;
            quizStr += c;
          } else if (c === ']') {
            bracketDepth--;
            quizStr += c;
            if (bracketDepth === 0) {
              j++;
              break;
            }
          } else {
            quizStr += c;
          }
        } else {
          if (c === '\\') {
            quizStr += c + scriptContent[j + 1];
            j += 2;
            continue;
          }
          if (c === stringChar) {
            inString = false;
          }
          quizStr += c;
        }
        j++;
      }
      // The quiz objects use `q:` key, not `question:` — normalize for YAML
      // Eval the quiz array in a fresh VM context
      try {
        const quizCtx = vm.createContext({});
        vm.runInContext(`const q = ${quizStr};`, quizCtx);
        quiz = vm.runInContext('q', quizCtx);
      } catch (e) {
        console.warn(`  ⚠ Could not eval quiz for lesson ${lessonId}:`, e);
      }
    }
  }

  parsedLessons.push({ id: lessonId, title, vmRef, duration, content: contentBody.trim(), quiz });
  console.log(`  ✓ Parsed lesson ${lessonId}: "${title}" (${quiz.length} quiz questions)`);
}

// ─── HTML → MDX transformation ────────────────────────────────────────────────

function htmlToMdx(html: string): string {
  let mdx = html;

  // Replace box divs with MDX components
  // highlight-box
  mdx = mdx.replace(/<div\s+class="highlight-box([^"]*)"([^>]*)>/g, '<HighlightBox>');
  // analogy-box
  mdx = mdx.replace(/<div\s+class="analogy-box([^"]*)"([^>]*)>/g, '<AnalogyBox>');
  // example-box
  mdx = mdx.replace(/<div\s+class="example-box([^"]*)"([^>]*)>/g, '<ExampleBox>');
  // formula-box
  mdx = mdx.replace(/<div\s+class="formula-box([^"]*)"([^>]*)>/g, '<FormulaBox>');

  // Close divs that were opened by box classes
  // We need to match the closing </div> for these. Since HTML is nested, we use
  // a heuristic: any </div> after a box component tag — this is imperfect but works
  // for the flat structure used in lessons.
  // Better approach: track depth
  mdx = closeBoxDivs(mdx);

  // Wrap tables in ResponsiveTable
  mdx = mdx.replace(/<table\b([^>]*)>/g, '<ResponsiveTable>\n<table$1>');
  mdx = mdx.replace(/<\/table>/g, '</table>\n</ResponsiveTable>');

  return mdx;
}

function closeBoxDivs(html: string): string {
  // Replace </div> that corresponds to an opened box component
  // We do this by tracking which tags are open
  const boxTags = ['HighlightBox', 'AnalogyBox', 'ExampleBox', 'FormulaBox'];
  const openTagRe = new RegExp(`<(${boxTags.join('|')})>`, 'g');
  const result = html;

  // Simple approach: for each box open tag, find its matching </div>
  // by counting nested divs
  let out = '';
  let i = 0;
  while (i < result.length) {
    // Check if current position starts a box component tag
    let found = false;
    for (const tag of boxTags) {
      const openTag = `<${tag}>`;
      if (result.startsWith(openTag, i)) {
        out += openTag;
        i += openTag.length;

        // Now consume content until matching </div>
        let depth = 1;
        let content = '';
        while (i < result.length && depth > 0) {
          if (result.startsWith('<div', i)) {
            depth++;
            content += result[i];
            i++;
          } else if (result.startsWith('</div>', i)) {
            depth--;
            if (depth === 0) {
              i += '</div>'.length;
              break;
            } else {
              content += '</div>';
              i += '</div>'.length;
            }
          } else {
            content += result[i];
            i++;
          }
        }
        out += content + `</${tag}>`;
        found = true;
        break;
      }
    }
    if (!found) {
      out += result[i];
      i++;
    }
  }
  return out;
}

// ─── Write MDX files ──────────────────────────────────────────────────────────

for (const lesson of parsedLessons) {
  const mdxContent = htmlToMdx(lesson.content);
  const mdxFile = `{/* ${lesson.id}: ${lesson.title} */}\n\n${mdxContent}\n`;
  writeFileSync(join(LESSONS_OUT, `${lesson.id}.mdx`), mdxFile);
}

console.log(`\n✓ Wrote ${parsedLessons.length} MDX lesson files to ${LESSONS_OUT}`);

// ─── Write quiz YAML files ────────────────────────────────────────────────────

function toYamlString(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (typeof value === 'string') {
    // Use block scalar for multi-line, quoted for single-line with special chars
    if (value.includes('\n')) {
      return `|\n${value.split('\n').map(l => pad + '  ' + l).join('\n')}`;
    }
    if (value.includes('"') || value.includes("'") || value.startsWith(' ') || value.endsWith(' ')) {
      return JSON.stringify(value);
    }
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'object' && item !== null) {
        const entries = Object.entries(item as Record<string, unknown>);
        return entries.map((([k, v], idx) => {
          const valStr = toYamlString(v, indent + 1);
          const prefix = idx === 0 ? `${pad}- ` : `${pad}  `;
          if (typeof v === 'object' && !Array.isArray(v)) {
            return `${prefix}${k}:\n${toYamlString(v, indent + 2)}`;
          }
          if (Array.isArray(v)) {
            return `${prefix}${k}:\n${toYamlString(v, indent + 2)}`;
          }
          return `${prefix}${k}: ${valStr}`;
        })).join('\n');
      }
      return `${pad}- ${toYamlString(item, indent + 1)}`;
    }).join('\n');
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value as Record<string, unknown>).map(([k, v]) => {
      if (typeof v === 'object') {
        return `${pad}${k}:\n${toYamlString(v, indent + 1)}`;
      }
      return `${pad}${k}: ${toYamlString(v, indent)}`;
    }).join('\n');
  }
  return String(value);
}

function lessonToQuizYaml(quiz: ParsedLesson['quiz']): string {
  if (!quiz || quiz.length === 0) return '';
  return quiz.map(q => {
    const question = q.q || '';
    const options = q.options || [];
    const answer = q.answer ?? 0;
    const explanation = q.explanation || '';

    const optionsYaml = options.map((o: string) => {
      // Always quote options to handle colons, special chars, etc.
      const escaped = o.includes('"') ? `'${o.replace(/'/g, "''")}'` : `"${o}"`;
      return `  - ${escaped}`;
    }).join('\n');

    const qLine = question.includes('"') ? `question: '${question.replace(/'/g, "''")}'` : `question: "${question}"`;
    const explPart = explanation
      ? (explanation.includes('"') ? `  explanation: '${explanation.replace(/'/g, "''")}'` : `  explanation: "${explanation}"`)
      : '';

    const parts = [`- ${qLine}`, `  options:`, optionsYaml, `  answer: ${answer}`];
    if (explPart) parts.push(explPart);
    return parts.join('\n');
  }).join('\n\n');
}

let quizCount = 0;
for (const lesson of parsedLessons) {
  if (lesson.quiz && lesson.quiz.length > 0) {
    const yamlContent = lessonToQuizYaml(lesson.quiz);
    writeFileSync(join(QUIZZES_OUT, `${lesson.id}.yaml`), yamlContent + '\n');
    quizCount++;
  }
}

console.log(`✓ Wrote ${quizCount} quiz YAML files to ${QUIZZES_OUT}`);

// ─── Write course.yaml ────────────────────────────────────────────────────────

// Build a map of lesson id → parsed lesson data
const lessonMap = new Map(parsedLessons.map(l => [l.id, l]));

const modulesYaml = MODULES.map(mod => {
  const lessonsYaml = mod.lessons.map((l, idx) => {
    const parsed = lessonMap.get(l.id);
    const duration = parsed?.duration ?? '';
    const vmRef = parsed?.vmRef ?? '';
    const prefix = idx === 0 ? '    - ' : '      ';
    const lines = [
      `    - id: "${l.id}"`,
      `      title: "${l.title.replace(/"/g, '\\"')}"`,
    ];
    if (duration) lines.push(`      duration: "${duration}"`);
    if (vmRef) lines.push(`      vmRef: "${vmRef.replace(/"/g, '\\"')}"`);
    return lines.join('\n');
  }).join('\n');

  return [
    `  - id: ${mod.id}`,
    `    title: "${mod.title.replace(/"/g, '\\"')}"`,
    `    subtitle: "${mod.subtitle.replace(/"/g, '\\"')}"`,
    `    icon: "${mod.icon}"`,
    `    color: ${mod.color}`,
    `    lessons:`,
    lessonsYaml,
  ].join('\n');
}).join('\n\n');

// Count total estimated hours from durations
let totalMin = 0;
for (const l of parsedLessons) {
  const m = l.duration.match(/(\d+)/);
  if (m) totalMin += parseInt(m[1], 10);
}
const estimatedHours = Math.round(totalMin / 60);

const courseYaml = `id: vm0042
title: "VM0042 v2.2 — Improved Agricultural Land Management"
subtitle: "Master soil carbon quantification for ALM projects"
description: "A comprehensive course covering Verra's VM0042 methodology for Improved Agricultural Land Management, including quantification, monitoring, verification, additionality, and project registration."
icon: "🌾"
color: green
status: published
category: methodologies
estimatedHours: ${estimatedHours}
modules:
${modulesYaml}
`;

writeFileSync(join(CONTENT_OUT, 'course.yaml'), courseYaml);
console.log(`✓ Wrote course.yaml (${MODULES.length} modules, ${parsedLessons.length} lessons, ~${estimatedHours}h)`);

console.log('\n✅ Migration complete!');
console.log(`   Run: npx tsx scripts/validate-content.ts to verify output`);
