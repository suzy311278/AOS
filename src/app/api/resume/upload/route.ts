/**
 * POST /api/resume/upload  (multipart/form-data)
 *
 * First stop in the async "wait-and-see" upload flow. Validates, stashes
 * the PDF/DOCX bytes in R2, writes a `status='uploading'` row into
 * user_resumes, kicks off /api/resume/process in the background via
 * waitUntil, and returns 202 immediately.
 *
 * Response: 202 { status: 'uploading', uploadedAt }
 *
 * See breezy-wibbling-wadler.md for the state-machine and Voyage/Docling
 * flow this kicks off.
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { waitUntil } from '@vercel/functions';

import { db } from '@/lib/db';
import { userResumes } from '@/lib/schema';
import { checkAndReserveCap } from '@/lib/llm-governor';
import { putResume, makeResumeKey, deleteResume } from '@/lib/r2-resumes';

export const runtime = 'nodejs';
export const maxDuration = 30; // bytes -> R2 should be well under 30s

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

const ACCEPTED_MIMES = new Set<string>([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
const DOCX_MAGIC = [0x50, 0x4b, 0x03, 0x04]; // PK\x03\x04

function startsWith(bytes: Uint8Array, magic: number[]): boolean {
  if (bytes.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) {
    if (bytes[i] !== magic[i]) return false;
  }
  return true;
}

function extForMime(mime: string): 'pdf' | 'docx' {
  return mime === 'application/pdf' ? 'pdf' : 'docx';
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'sign in to upload a resume' }, { status: 401 });
  }

  // Freemium cap. Every signed-in user is "free" tier until Stripe ships.
  const gate = await checkAndReserveCap('resumeUpload', userId, 'free');
  if (!gate.allowed) {
    return NextResponse.json(
      {
        error: 'monthly upload limit reached',
        cap: gate.cap,
      },
      { status: 429 },
    );
  }

  // Pre-check Content-Length so we reject oversized bodies before buffering
  // the full multipart payload into memory (OOM / cost-amplification guard).
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_FILE_BYTES * 1.1) {
    return NextResponse.json(
      { error: 'file too large', max_bytes: MAX_FILE_BYTES },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'expected multipart/form-data' },
      { status: 400 },
    );
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "missing 'file' field" },
      { status: 400 },
    );
  }

  // 1. Size
  if (file.size === 0) {
    return NextResponse.json({ error: 'file is empty' }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: 'file too large', max_bytes: MAX_FILE_BYTES },
      { status: 413 },
    );
  }

  // 2. MIME allowlist
  const mime = file.type || 'application/octet-stream';
  if (!ACCEPTED_MIMES.has(mime)) {
    return NextResponse.json(
      {
        error: 'only PDF and DOCX resumes are accepted',
        received: mime,
      },
      { status: 415 },
    );
  }

  // 3. Magic bytes — confirms the file is what the MIME claims it is.
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (mime === 'application/pdf' && !startsWith(bytes, PDF_MAGIC)) {
    return NextResponse.json(
      { error: 'file is not a valid PDF' },
      { status: 415 },
    );
  }
  if (mime.endsWith('wordprocessingml.document') && !startsWith(bytes, DOCX_MAGIC)) {
    return NextResponse.json(
      { error: 'file is not a valid DOCX' },
      { status: 415 },
    );
  }

  const resumeId = nanoid(12);
  const ext = extForMime(mime);
  const key = makeResumeKey(userId, resumeId, ext);
  const fileName = file.name.slice(0, 200); // truncate absurd filenames

  // 4. Upload to R2 FIRST. If this fails we never write a DB row, so the
  // user can just retry without a DB-cleanup step.
  try {
    await putResume({ key, bytes, contentType: mime as 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  } catch (err) {
    console.error('[resume/upload] R2 put failed', err);
    return NextResponse.json(
      { error: 'storage error; please try again' },
      { status: 502 },
    );
  }

  // 5. Drizzle upsert. If the user had a previous resume, its row is
  // replaced. We don't bother deleting the old R2 object here — it's
  // orphan now, but the cleanup sweep + DELETE /api/resume handle it.
  const now = new Date();
  try {
    await db
      .insert(userResumes)
      .values({
        userId,
        fileName,
        mimeType: mime,
        fileR2Key: key,
        status: 'uploading',
        uploadedAt: now,
      })
      .onConflictDoUpdate({
        target: userResumes.userId,
        set: {
          fileName,
          mimeType: mime,
          fileR2Key: key,
          status: 'uploading',
          error: null,
          extractedText: null,
          embedding: null,
          profile: null,
          processedAt: null,
          uploadedAt: now,
        },
      });
  } catch (err) {
    console.error('[resume/upload] DB upsert failed; trying to clean up R2', err);
    // Best-effort: if we failed to record the row, drop the R2 object so
    // we don't leak storage.
    try {
      await deleteResume(key);
    } catch {
      /* ignore secondary failure */
    }
    return NextResponse.json(
      { error: 'database error; please try again' },
      { status: 502 },
    );
  }

  // 6. Fire-and-forget to /api/resume/process. waitUntil keeps the
  // function alive long enough to let the fetch actually dispatch, but
  // we return immediately.
  const processToken = process.env.RESUME_PROCESS_TOKEN;
  if (!processToken) {
    console.error('[resume/upload] RESUME_PROCESS_TOKEN not set — row will sit in uploading');
    // We still return 202 because the row is valid; an operator can
    // re-trigger /process manually.
  } else {
    const processUrl = new URL('/api/resume/process', req.url).toString();
    waitUntil(
      fetch(processUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${processToken}`,
        },
        body: JSON.stringify({ userId }),
      }).catch((err) => {
        console.error('[resume/upload] failed to kick /process', err);
      }),
    );
  }

  return NextResponse.json(
    {
      status: 'uploading',
      uploadedAt: now.toISOString(),
    },
    { status: 202 },
  );
}
