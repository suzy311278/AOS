/**
 * ArmorInnovate course-generator CLI.
 *
 * Usage:
 *   npx tsx scripts/armor/generate-course.ts \
 *     --topic "Modbus Pentesting" \
 *     --track foundations \
 *     --difficulty intro \
 *     [--slug modbus-pentesting] \
 *     [--lessons 5] \
 *     [--questions 10] \
 *     [--isa-levels SL2,SL3] \
 *     [--live] \
 *     [--dry-run] \
 *     [--validate]
 *
 * Default mode is `mock`, which produces a deterministic schema-valid
 * stub course bundle. `--live` switches to the MCP pipeline (Phase 2.x).
 *
 * Stream:
 *   The CLI prints PipelineEvents as JSON Lines on stdout so it can be
 *   piped to the admin UI dev tools. Pass `--quiet` to suppress.
 *
 * Exit codes:
 *   0 — success.
 *   1 — generation or validation failed.
 *   2 — bad arguments.
 */

import { parseArgs } from 'node:util';
import { runMockPipeline } from '../../src/lib/armor/generator/mock';
import { runLivePipeline } from '../../src/lib/armor/generator/live';
import { writeGeneratedCourse } from '../../src/lib/armor/generator/writer';
import type {
  GenerateCourseInput,
  PipelineEvent,
} from '../../src/lib/armor/mcp-pipeline';

function usage(): never {
  console.error(`Usage: npx tsx scripts/armor/generate-course.ts \\
  --topic "<free text>" \\
  --track foundations|risk-assessment|design|maintenance|capstone|ics-pentest|ot-defense \\
  --difficulty intro|intermediate|advanced \\
  [--slug <slug>] [--lessons N] [--questions N] [--isa-levels SL1,SL2,...] \\
  [--live] [--dry-run] [--validate] [--quiet]
`);
  process.exit(2);
}

const { values } = parseArgs({
  options: {
    topic:        { type: 'string' },
    track:        { type: 'string' },
    difficulty:   { type: 'string' },
    slug:         { type: 'string' },
    lessons:      { type: 'string' },
    questions:    { type: 'string' },
    'isa-levels': { type: 'string' },
    live:         { type: 'boolean' },
    'dry-run':    { type: 'boolean' },
    validate:     { type: 'boolean' },
    quiet:        { type: 'boolean' },
    help:         { type: 'boolean' },
  },
  allowPositionals: false,
});

if (values.help || !values.topic || !values.track || !values.difficulty) {
  usage();
}

const validTracks = new Set([
  'foundations', 'risk-assessment', 'design', 'maintenance',
  'capstone', 'ics-pentest', 'ot-defense',
]);
const validDifficulty = new Set(['intro', 'intermediate', 'advanced']);

if (!validTracks.has(values.track as string)) {
  console.error(`error: --track must be one of ${[...validTracks].join(', ')}`);
  process.exit(2);
}
if (!validDifficulty.has(values.difficulty as string)) {
  console.error(`error: --difficulty must be one of intro|intermediate|advanced`);
  process.exit(2);
}

const input: GenerateCourseInput = {
  topic: values.topic as string,
  track: values.track as GenerateCourseInput['track'],
  difficulty: values.difficulty as GenerateCourseInput['difficulty'],
  slug: values.slug as string | undefined,
  lessonCount: values.lessons ? Number(values.lessons) : undefined,
  quizCount: values.questions ? Number(values.questions) : undefined,
  isaLevels: values['isa-levels']
    ? (values['isa-levels'] as string)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean) as ('SL1' | 'SL2' | 'SL3' | 'SL4')[]
    : undefined,
  dryRun: Boolean(values['dry-run']),
};

const QUIET = Boolean(values.quiet);

function emit(ev: PipelineEvent): void {
  if (QUIET) return;
  process.stdout.write(JSON.stringify(ev) + '\n');
}

async function main(): Promise<void> {
  const gen = values.live ? runLivePipeline(input) : runMockPipeline(input);

  let final: Awaited<ReturnType<typeof gen.next>>['value'] | undefined;
  while (true) {
    const step = await gen.next();
    if (step.done) {
      final = step.value;
      break;
    }
    emit(step.value);
    if (step.value.type === 'pipeline.error') {
      process.exit(1);
    }
  }

  if (!final || typeof final === 'string') {
    console.error('error: pipeline returned no output');
    process.exit(1);
  }

  if (input.dryRun) {
    if (!QUIET) {
      console.error(`[armor] dry-run complete for ${final.slug}; not writing to disk.`);
    }
    return;
  }

  const wrote = writeGeneratedCourse(final);
  if (!QUIET) {
    console.error(`[armor] wrote ${wrote.files.length} files to src/content/armor/${wrote.slug}/`);
  }

  if (values.validate) {
    // Run the validator on the bundle we just wrote.
    const { spawnSync } = await import('node:child_process');
    const r = spawnSync('npx', ['tsx', 'scripts/armor/validate-armor-content.ts'], {
      stdio: 'inherit',
    });
    process.exit(r.status ?? 0);
  }
}

main().catch((e) => {
  console.error('[armor] generator failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
