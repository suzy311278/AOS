/**
 * POST /api/resume/matches
 *
 * Score every job on the board against the authenticated user's resume
 * profile. Pure CPU work over pre-computed Voyage vectors — sub-500 ms
 * for 400+ jobs; no network egress aside from the Turso read.
 *
 * Responses:
 *   200 { jobs: JobMatchResult[] (top 100 by total score) }
 *   401 — not signed in
 *   404 — no resume uploaded
 *   409 { status } — resume exists but is not status='ready'
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import fs from 'node:fs';
import path from 'node:path';

import { db } from '@/lib/db';
import { userResumes } from '@/lib/schema';
import { getAllJobsFull } from '@/lib/jobs';
import { scoreJobs, type Profile } from '@/lib/resume-matcher';

export const runtime = 'nodejs';

// ---------------------------------------------------------------------------
// Job-embedding cache: loaded once per runtime instance, reused across
// requests. File is ~6 MB; the 5-10 ms first-read isn't worth retaining
// per request.
// ---------------------------------------------------------------------------
let _jobEmbeddings: Record<string, number[]> | null = null;

function loadJobEmbeddings(): Record<string, number[]> {
  if (_jobEmbeddings) return _jobEmbeddings;
  const p = path.join(process.cwd(), 'public', 'jobs-embeddings.json');
  if (!fs.existsSync(p)) {
    console.error(
      '[resume/matches] public/jobs-embeddings.json missing - did prebuild run?',
    );
    _jobEmbeddings = {};
    return _jobEmbeddings;
  }
  try {
    const raw = fs.readFileSync(p, 'utf-8');
    const parsed = JSON.parse(raw) as {
      embeddings?: Record<string, number[]>;
    };
    _jobEmbeddings = parsed.embeddings ?? {};
  } catch (err) {
    console.error('[resume/matches] failed to parse jobs-embeddings.json', err);
    _jobEmbeddings = {};
  }
  return _jobEmbeddings;
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select({
      status: userResumes.status,
      embedding: userResumes.embedding,
      profile: userResumes.profile,
    })
    .from(userResumes)
    .where(eq(userResumes.userId, userId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: 'no resume' }, { status: 404 });
  }
  if (row.status !== 'ready') {
    return NextResponse.json(
      { error: 'resume not ready', status: row.status },
      { status: 409 },
    );
  }
  if (!row.embedding || !row.profile) {
    return NextResponse.json(
      { error: 'resume row is corrupt — re-upload' },
      { status: 500 },
    );
  }

  // Reconstruct Profile from stored JSON
  let profile: Profile;
  try {
    const parsed = JSON.parse(row.profile) as Omit<Profile, 'embedding'>;
    const embedding = JSON.parse(row.embedding) as number[];
    profile = {
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      frameworks: Array.isArray(parsed.frameworks) ? parsed.frameworks : [],
      seniority: (parsed.seniority ?? null) as Profile['seniority'],
      domains: Array.isArray(parsed.domains) ? parsed.domains : [],
      embedding,
    };
  } catch (err) {
    console.error('[resume/matches] failed to parse stored profile', err);
    return NextResponse.json(
      { error: 'resume row is corrupt — re-upload' },
      { status: 500 },
    );
  }

  const jobs = getAllJobsFull();
  const jobEmbeddings = loadJobEmbeddings();

  const scored = scoreJobs(profile, jobs, jobEmbeddings);
  const top = scored.slice(0, 100);

  return NextResponse.json({
    count: scored.length,
    top: top.length,
    jobs: top,
  });
}
