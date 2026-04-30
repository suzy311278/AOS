/**
 * GET /api/resume/status
 *
 * Cheap Turso read. The JobsClientRedesign UI polls this every 3 s
 * while the resume is being processed.
 *
 * Responses:
 *   200 { status: 'uploading' | 'parsing', uploadedAt }
 *   200 { status: 'ready', profile, uploadedAt, processedAt }
 *   200 { status: 'error', error, uploadedAt }
 *   401 — not signed in
 *   404 — no resume uploaded
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { userResumes } from '@/lib/schema';

export const runtime = 'nodejs';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select({
      status: userResumes.status,
      profile: userResumes.profile,
      error: userResumes.error,
      fileName: userResumes.fileName,
      uploadedAt: userResumes.uploadedAt,
      processedAt: userResumes.processedAt,
    })
    .from(userResumes)
    .where(eq(userResumes.userId, userId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: 'no resume' }, { status: 404 });
  }

  // Parse profile JSON only when ready; poll responses stay small while
  // the row is in-flight.
  const profile =
    row.status === 'ready' && row.profile ? safeParseJson(row.profile) : null;

  return NextResponse.json({
    status: row.status,
    fileName: row.fileName,
    uploadedAt: row.uploadedAt,
    processedAt: row.processedAt,
    profile,
    error: row.status === 'error' ? row.error : null,
  });
}

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
