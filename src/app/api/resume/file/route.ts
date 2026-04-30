/**
 * GET /api/resume/file
 *
 * Streams the authenticated user's stored resume file (PDF or DOCX) from
 * the private greentryst-resumes R2 bucket. Used by the dashboard's
 * "View resume" button so the user can download/verify what we hold.
 *
 * Responses:
 *   200 — file bytes with appropriate Content-Type and a filename
 *         in Content-Disposition
 *   401 — not signed in
 *   404 — no resume uploaded
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { userResumes } from '@/lib/schema';
import { getResume } from '@/lib/r2-resumes';

export const runtime = 'nodejs';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select({
      fileR2Key: userResumes.fileR2Key,
      fileName: userResumes.fileName,
      mimeType: userResumes.mimeType,
      status: userResumes.status,
    })
    .from(userResumes)
    .where(eq(userResumes.userId, userId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: 'no resume' }, { status: 404 });
  }

  // Only serve files that have completed the scan + parse pipeline.
  // Any other status (uploading, scanning, parsing, infected, error)
  // means the file is either not yet cleared by AV or was flagged.
  // The quarantine invariant: no unscanned / unclean file is ever retrievable.
  if (row.status !== 'ready') {
    return NextResponse.json(
      { error: 'resume not ready', status: row.status },
      { status: 409 },
    );
  }

  try {
    const { bytes, contentType } = await getResume(row.fileR2Key);
    // Defensive: Buffer → ArrayBuffer copy so the Response body type is
    // happy across Node versions.
    const ab = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(ab).set(bytes);

    // Serve as an attachment. This is user-supplied content, and we
    // don't want the browser attempting to render any polyglot payload.
    const safeName = (row.fileName || 'resume').replace(/[^\w.\- ]+/g, '_');

    return new NextResponse(ab, {
      status: 200,
      headers: {
        'Content-Type': contentType ?? row.mimeType,
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex, nofollow',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch (err) {
    console.error('[resume/file] R2 getResume failed', err);
    return NextResponse.json({ error: 'file unavailable' }, { status: 502 });
  }
}
