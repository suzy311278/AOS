/**
 * resume-matcher.ts — multi-tenant port of
 * /Users/knowprajjwal/Job/mcp-servers/jobspy-mcp-server/pipeline/lib/resume_matcher.py
 *
 * Scores each job 0-100 against a per-user `Profile`. The Python reference
 * was single-user (resume hardcoded as module constants); this port takes
 * the profile as an argument so every signed-in user can have their own.
 *
 * Pipeline per job, summing to 100:
 *   1. Skills        0-15   (calibrated to 95th pct, title matches weighted 3x)
 *   2. Frameworks    0-15   (same shape)
 *   3. Seniority     0-15   (title-only level matching; universal)
 *   4. Domain        0-5    (same shape as skills)
 *   5. Semantic      0-40   (cosine similarity of Voyage embeddings)
 *
 * Jobs without a description are capped at 40 (title-only match).
 */

import { cosineSimilarity } from './voyage';
import type { JobRow, JobSummary } from './jobs';

// ---------------------------------------------------------------------------
// Per-user profile (extracted by the LLM from uploaded resume text).
// ---------------------------------------------------------------------------

export interface Profile {
  /** Things the candidate can do, lowercase, deduped. e.g. 'ghg accounting'. */
  skills: string[];
  /** Standards / regulations, lowercase, deduped. e.g. 'csrd', 'gri'. */
  frameworks: string[];
  /** Coarse level for display; not used directly by the matcher. */
  seniority: 'junior' | 'mid' | 'senior' | 'lead' | 'director' | null;
  /** Industries / domains, lowercase, deduped. e.g. 'banking', 'consulting'. */
  domains: string[];
  /** 1024-dim Voyage vector of the full resume text. */
  embedding: number[];
}

// ---------------------------------------------------------------------------
// Universal constants (same for every user)
// ---------------------------------------------------------------------------

const SKILLS_MAX = 15;
const FRAMEWORKS_MAX = 15;
const SENIORITY_MAX = 15;
const DOMAINS_MAX = 5;
const SEMANTIC_MAX = 40;
const TITLE_ONLY_CAP = 40;

// Calibration denominators from the Python reference (95th percentile of
// weighted hits across real data). Kept as-is for v1; revisit once we see
// actual score distributions from real users.
const SKILLS_CALIBRATION = 11;
const FRAMEWORKS_CALIBRATION = 3;
const DOMAINS_CALIBRATION = 8;

// Seniority lists (title-only). These are intentionally opinionated for the
// sustainability practitioner market and stay global, not per-user.
const SENIORITY_EXACT = [
  'manager',
  'deputy manager',
  'assistant manager',
  'consultant',
  'senior consultant',
  'associate director',
  'engagement manager',
];
const SENIORITY_CLOSE = [
  'senior associate',
  'lead',
  'senior analyst',
  'specialist',
  'advisor',
  'senior advisor',
  'principal',
  'team lead',
];
const SENIORITY_ACCEPTABLE = [
  'analyst',
  'associate',
  'executive',
  'officer',
  'coordinator',
];
const SENIORITY_TOO_SENIOR = [
  'vice president',
  'vp',
  'director',
  'head of',
  'partner',
  'chief',
  'cto',
  'cfo',
  'ceo',
  'cso',
  'managing director',
];

// ---------------------------------------------------------------------------
// Scoring primitives
// ---------------------------------------------------------------------------

function countWeightedMatches(
  titleLower: string,
  fullLower: string,
  terms: string[],
): number {
  let hits = 0;
  for (const term of terms) {
    const t = term.toLowerCase();
    if (!t) continue;
    if (titleLower.includes(t)) {
      hits += 3;
    } else if (fullLower.includes(t)) {
      hits += 1;
    }
  }
  return hits;
}

function seniorityScore(title: string): number {
  const t = title.toLowerCase();
  for (const term of SENIORITY_TOO_SENIOR) {
    if (t.includes(term)) return 0;
  }
  for (const term of SENIORITY_EXACT) {
    if (t.includes(term)) return SENIORITY_MAX;
  }
  for (const term of SENIORITY_CLOSE) {
    if (t.includes(term)) return 10;
  }
  for (const term of SENIORITY_ACCEPTABLE) {
    if (t.includes(term)) return 5;
  }
  // No seniority signal → partial credit.
  return 3;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, max: number): number {
  return n > max ? max : n < 0 ? 0 : n;
}

// ---------------------------------------------------------------------------
// Public: score a single job against a profile.
// ---------------------------------------------------------------------------

export interface JobMatchResult {
  jobUrl: string;
  total: number;
  breakdown: {
    skills: number;
    frameworks: number;
    seniority: number;
    domain: number;
    semantic: number;
  };
}

/** Text the matcher consumes for a job. Includes what the embedder used
 *  (roleSummary + skillsRequired + domainContext) plus the title and
 *  company for keyword matching. */
function buildJobText(job: JobRow | JobSummary): {
  title: string;
  full: string;
  hasDescription: boolean;
} {
  const title = job.title ?? '';
  const summary = 'roleSummary' in job ? (job.roleSummary ?? '') : '';
  const skills = 'skillsRequired' in job ? (job.skillsRequired ?? '') : '';
  const domain = 'domainContext' in job ? (job.domainContext ?? '') : '';
  const full = [title, job.company, summary, skills, domain]
    .filter(Boolean)
    .join(' ');
  const hasDescription = Boolean(summary || skills || domain);
  return { title, full, hasDescription };
}

export function scoreJob(
  profile: Profile,
  job: JobRow | JobSummary,
  jobEmbedding?: number[],
): JobMatchResult {
  const { title, full, hasDescription } = buildJobText(job);
  const titleLower = title.toLowerCase();
  const fullLower = full.toLowerCase();

  // 1. Skills (0-15)
  const skillHits = countWeightedMatches(titleLower, fullLower, profile.skills);
  const skills = clamp(
    round1((skillHits / SKILLS_CALIBRATION) * SKILLS_MAX),
    SKILLS_MAX,
  );

  // 2. Frameworks (0-15)
  const fwHits = countWeightedMatches(
    titleLower,
    fullLower,
    profile.frameworks,
  );
  const frameworks = clamp(
    round1((fwHits / FRAMEWORKS_CALIBRATION) * FRAMEWORKS_MAX),
    FRAMEWORKS_MAX,
  );

  // 3. Seniority (0-15)
  const seniority = seniorityScore(title);

  // 4. Domain (0-5)
  const domainHits = countWeightedMatches(
    titleLower,
    fullLower,
    profile.domains,
  );
  const domain = clamp(
    round1((domainHits / DOMAINS_CALIBRATION) * DOMAINS_MAX),
    DOMAINS_MAX,
  );

  // 5. Semantic (0-40). Replace the Python Ollama call with cosine over
  // pre-computed Voyage vectors. Same calibration: baseline ~0.5 for
  // unrelated text, scale 0.5→1.0 into 0→40.
  let semantic = 0;
  if (jobEmbedding && profile.embedding.length === jobEmbedding.length) {
    const sim = cosineSimilarity(profile.embedding, jobEmbedding);
    semantic = clamp(round1(Math.max(0, (sim - 0.5) * 80)), SEMANTIC_MAX);
  }

  let total = round1(skills + frameworks + seniority + domain + semantic);
  total = clamp(total, 100);
  if (!hasDescription && total > TITLE_ONLY_CAP) {
    total = TITLE_ONLY_CAP;
  }

  return {
    jobUrl: job.jobUrl,
    total,
    breakdown: { skills, frameworks, seniority, domain, semantic },
  };
}

// ---------------------------------------------------------------------------
// Public: batch score. Returns sorted by descending total.
// ---------------------------------------------------------------------------

export function scoreJobs(
  profile: Profile,
  jobs: Array<JobRow | JobSummary>,
  jobEmbeddings: Record<string, number[]> = {},
): JobMatchResult[] {
  const results = jobs.map((job) =>
    scoreJob(profile, job, jobEmbeddings[job.jobUrl]),
  );
  results.sort((a, b) => b.total - a.total);
  return results;
}

/** Convenience: top-N filter by percentile threshold, mirrors the Python
 *  `filter_matched_jobs` helper (v1 default: top 60%). */
export function topNByPercentile(
  results: JobMatchResult[],
  percentile = 40,
): JobMatchResult[] {
  if (results.length === 0) return [];
  const sorted = [...results].sort((a, b) => a.total - b.total);
  const idx = Math.floor((sorted.length * percentile) / 100);
  const threshold = sorted[Math.min(idx, sorted.length - 1)].total;
  return results.filter((r) => r.total >= threshold);
}
