/**
 * MCP-driven content pipeline contract — Topic in → Course out.
 *
 * This module defines the **contract**, not the implementation. The
 * implementation lives in `scripts/armor/generate-course.ts` (Phase 2)
 * and uses the MCP servers registered in `.mcp.json`.
 *
 * Pipeline summary
 * ────────────────
 *   INPUT:  topic, track, difficulty
 *   STEPS:
 *     1. docs.fetcher.search_docs       → list of source URLs
 *     2. docs.fetcher.fetch_url         → markdown corpus
 *     3. vuln.intel.search_cve          → top-N relevant CVEs
 *     4. content.generator.generate_lesson × 5
 *     5. content.generator.generate_quiz  (10 Qs, 4-option MCQ)
 *     6. content.generator.generate_lab   (Dockerfile + scenario YAML)
 *     7. validator (scripts/armor/validate-armor-content.ts)
 *     8. write to src/content/armor/<slug>/ + open PR
 *   OUTPUT: GenerateCourseOutput (course YAML + lessons + quiz + lab)
 *
 * Streaming
 * ─────────
 * The pipeline yields PipelineEvents so the admin UI at /admin/uploader
 * can render live progress over Server-Sent Events.
 *
 * Dry-run
 * ───────
 * `dryRun: true` skips the write step and returns the assembled output
 * without touching the filesystem — used by the admin preview pane.
 */

import type { SpecialistTrackId } from './certification';

// ──────────────────────────────────────────────────────────────────────
// Input / output
// ──────────────────────────────────────────────────────────────────────

export type ArmorTrack =
  | SpecialistTrackId
  | 'ics-pentest'      // hands-on offensive
  | 'ot-defense'       // hands-on defensive
  | 'capstone';        // expert path

export type Difficulty = 'intro' | 'intermediate' | 'advanced';

export interface GenerateCourseInput {
  /** Free-text topic (e.g. "Modbus Protocol Pentesting"). */
  topic: string;
  /** Target track — drives prereqs, lesson tone, lab style. */
  track: ArmorTrack;
  /** Tunes lesson depth and lab difficulty. */
  difficulty: Difficulty;
  /** Optional ISA/IEC Security Level scope to anchor controls in. */
  isaLevels?: ('SL1' | 'SL2' | 'SL3' | 'SL4')[];
  /** Number of lessons. Defaults to 5. */
  lessonCount?: number;
  /** Number of quiz questions. Defaults to 10. */
  quizCount?: number;
  /** Optional explicit slug. Otherwise derived from topic. */
  slug?: string;
  /** Don't write to disk; return the assembled output only. */
  dryRun?: boolean;
}

export interface GeneratedLesson {
  /** Stable id within the course (e.g. "1.2"). */
  id: string;
  /** Display title. */
  title: string;
  /** Estimated reading minutes. */
  durationMin: number;
  /** Full MDX body, ready to write. */
  mdx: string;
  /** Source URLs used by content.generator. Required for citation. */
  sources: string[];
}

export interface GeneratedQuiz {
  /** Quiz id (must match the course YAML). */
  id: string;
  /** YAML body. Conforms to existing quiz schema (see src/content). */
  yaml: string;
}

export interface GeneratedLab {
  /** Lab id (used as the URL segment under /labs/<id>). */
  id: string;
  /** Lab metadata YAML. */
  yaml: string;
  /** Container build file. Targets infra/lab-runner. */
  dockerfile: string;
  /** Optional setup script (entrypoint contents). */
  entrypoint?: string;
}

export interface GenerateCourseOutput {
  /** Final course slug. */
  slug: string;
  /** Course-level metadata YAML, ready to write to course.yaml. */
  courseYaml: string;
  /** Generated lessons in order. */
  lessons: GeneratedLesson[];
  /** Single quiz that covers all lessons. */
  quiz: GeneratedQuiz;
  /** Single hands-on lab tied to the topic. */
  lab: GeneratedLab;
  /** Telemetry — useful for admin UI and audit logs. */
  diagnostics: {
    warnings: string[];
    tokenUsage: number;
    latencyMs: number;
    sources: { url: string; title: string }[];
  };
}

// ──────────────────────────────────────────────────────────────────────
// Streaming events — consumed by /admin/uploader over SSE
// ──────────────────────────────────────────────────────────────────────

export type PipelineEvent =
  | { type: 'pipeline.start'; input: GenerateCourseInput }
  | { type: 'step.start';     step: PipelineStep }
  | { type: 'step.done';      step: PipelineStep; durationMs: number }
  | { type: 'source.found';   url: string; title: string }
  | { type: 'lesson.draft';   index: number; title: string; tokens: number }
  | { type: 'quiz.draft';     questions: number; tokens: number }
  | { type: 'lab.draft';      runtime: string; tokens: number }
  | { type: 'validation';     ok: boolean; messages: string[] }
  | { type: 'write.commit';   slug: string; files: string[] }
  | { type: 'pipeline.done';  output: GenerateCourseOutput }
  | { type: 'pipeline.error'; step: PipelineStep; message: string };

export type PipelineStep =
  | 'docs.search'
  | 'docs.fetch'
  | 'vuln.intel'
  | 'lessons'
  | 'quiz'
  | 'lab'
  | 'validate'
  | 'write';

// ──────────────────────────────────────────────────────────────────────
// MCP server contract
//
// The pipeline calls into these named MCP servers. The names below
// must match the keys registered in `.mcp.json`. Concrete clients are
// built in scripts/armor/generate-course.ts; this file only types them.
// ──────────────────────────────────────────────────────────────────────

export interface DocsFetcherServer {
  searchDocs(args: { query: string; limit?: number }): Promise<
    { url: string; title: string; score: number }[]
  >;
  fetchUrl(args: { url: string }): Promise<{ markdown: string; title: string }>;
  extractPdf?(args: { url: string }): Promise<{ markdown: string; pages: number }>;
}

export interface ContentGeneratorServer {
  generateLesson(args: {
    topic: string;
    track: ArmorTrack;
    difficulty: Difficulty;
    sources: { url: string; title: string; markdown: string }[];
    style: 'mdx';
  }): Promise<GeneratedLesson>;

  generateQuiz(args: {
    lessons: { id: string; title: string; mdx: string }[];
    questionCount: number;
  }): Promise<GeneratedQuiz>;

  generateLab(args: {
    topic: string;
    runtime: 'pymodbus-simulator' | 'snap7-simulator' | 'cpppo-simulator' | 'view-me-mock';
    difficulty: Difficulty;
  }): Promise<GeneratedLab>;
}

export interface VulnIntelServer {
  searchCve(args: { keyword: string; limit?: number }): Promise<
    { id: string; title: string; cvss: number; vendor: string; published: string }[]
  >;
  cisaAdvisory(args: { id: string }): Promise<{ markdown: string; references: string[] }>;
}

export interface LabScaffolderServer {
  createRuntime(args: {
    runtime: string;
    objectives: string[];
  }): Promise<{ dockerfile: string; entrypoint: string }>;
}

export interface McpServers {
  docs:    DocsFetcherServer;
  content: ContentGeneratorServer;
  vuln:    VulnIntelServer;
  lab:     LabScaffolderServer;
}

// ──────────────────────────────────────────────────────────────────────
// Pipeline interface
// ──────────────────────────────────────────────────────────────────────

export interface McpPipeline {
  /**
   * Execute the pipeline. Yields PipelineEvents and returns the final
   * GenerateCourseOutput. Implementations must:
   *   - never write to disk if `input.dryRun === true`
   *   - emit `validation` before `write.commit`
   *   - emit `pipeline.error` and re-throw on hard failure
   */
  run(
    input: GenerateCourseInput,
    servers: McpServers,
  ): AsyncGenerator<PipelineEvent, GenerateCourseOutput, void>;
}

// ──────────────────────────────────────────────────────────────────────
// Slug derivation — pure helper
// ──────────────────────────────────────────────────────────────────────

const SLUG_NOISE = /[^\p{L}\p{N}]+/gu;

/**
 * Convert a free-text topic into a stable slug. Must be deterministic;
 * the admin UI shows the slug before commit so the user can override.
 */
export function deriveSlug(topic: string): string {
  return topic
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(SLUG_NOISE, '-')
    .replace(/^-+|-+$/g, '');
}

// ──────────────────────────────────────────────────────────────────────
// Default pipeline parameters
// ──────────────────────────────────────────────────────────────────────

export const PIPELINE_DEFAULTS = {
  lessonCount: 5,
  quizCount: 10,
  /** Hard cap on source documents fed into the lesson generator. */
  maxSources: 12,
  /** Wall-clock budget. Pipelines beyond this should fail loudly. */
  timeoutMs: 5 * 60 * 1000,
} as const;
