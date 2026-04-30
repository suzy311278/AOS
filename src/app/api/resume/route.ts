/**
 * DELETE /api/resume
 *
 * Wipe the authenticated user's resume: remove the Turso row AND the
 * permanent R2 object together. PII gone.
 *
 * Responses:
 *   200 { ok: true }
 *   401 — not signed in
 *   404 — no resume to delete
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { userResumes } from '@/lib/schema';
import { deleteResume } from '@/lib/r2-resumes';

export const runtime = 'nodejs';

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select({ fileR2Key: userResumes.fileR2Key })
    .from(userResumes)
    .where(eq(userResumes.userId, userId))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: 'no resume' }, { status: 404 });
  }

  // Best-effort R2 delete first. If it fails we still wipe the DB row —
  // the orphan R2 object becomes garbage that a future sweep can clean.
  try {
    await deleteResume(row.fileR2Key);
  } catch (err) {
    console.error('[resume/DELETE] R2 delete failed (continuing)', err);
  }

  await db.delete(userResumes).where(eq(userResumes.userId, userId));

  return NextResponse.json({ ok: true });
}
