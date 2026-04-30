/**
 * r2-resumes.ts — thin wrapper around the private `greentryst-resumes`
 * R2 bucket for the resume upload + matching pipeline.
 *
 * The Cloudflare R2 API is S3-compatible, so we use @aws-sdk/client-s3
 * pointed at https://<account>.r2.cloudflarestorage.com.
 *
 * Callers:
 *   - /api/resume/upload  → putResume()
 *   - /api/resume/process → getResume()
 *   - DELETE /api/resume  → deleteResume()
 *
 * Env vars required (set in .env.local and Vercel prod/preview):
 *   R2_ACCOUNT_ID         — Cloudflare account id (builds endpoint)
 *   R2_ACCESS_KEY_ID      — R2 API token access key
 *   R2_SECRET_ACCESS_KEY  — R2 API token secret
 *   R2_ENDPOINT           — https://<account>.r2.cloudflarestorage.com
 *   R2_RESUMES_BUCKET     — 'greentryst-resumes'
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  type GetObjectCommandOutput,
} from '@aws-sdk/client-s3';

// Module-scope singleton — S3 clients are safe to reuse across requests
// and connection pooling wants us to.
let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;

  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 credentials missing: set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY',
    );
  }

  _client = new S3Client({
    region: 'auto', // R2 doesn't use regions; 'auto' is the documented value.
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

function getBucket(): string {
  const bucket = process.env.R2_RESUMES_BUCKET;
  if (!bucket) {
    throw new Error('R2_RESUMES_BUCKET is not set');
  }
  return bucket;
}

// ---------------------------------------------------------------------------
// Key helpers. Layout: `<userId>/<resumeId>.<ext>`
// - One active key per user at a time; uploading a new resume overwrites
//   the previous object at the same key (we regenerate the resumeId).
// - userId is the Clerk user id; safe to embed in an object key.
// ---------------------------------------------------------------------------

export function makeResumeKey(
  userId: string,
  resumeId: string,
  ext: 'pdf' | 'docx',
): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    throw new Error('userId is not a safe path component');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(resumeId)) {
    throw new Error('resumeId is not a safe path component');
  }
  return `${userId}/${resumeId}.${ext}`;
}

// ---------------------------------------------------------------------------
// Upload: store bytes, return the key.
// ---------------------------------------------------------------------------

export async function putResume(params: {
  key: string;
  bytes: Uint8Array | Buffer;
  contentType: 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}): Promise<{ key: string }> {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: params.key,
      Body: params.bytes,
      ContentType: params.contentType,
    }),
  );
  return { key: params.key };
}

// ---------------------------------------------------------------------------
// Download: stream the bytes back. Used by /api/resume/process to forward
// the upload to the parser Space. Returns a Uint8Array (already buffered
// in memory, since Vercel functions don't have easy stream-pipe primitives
// to the fetch() body yet).
// ---------------------------------------------------------------------------

export async function getResume(key: string): Promise<{
  bytes: Uint8Array;
  contentType: string | null;
}> {
  const client = getClient();
  const out: GetObjectCommandOutput = await client.send(
    new GetObjectCommand({ Bucket: getBucket(), Key: key }),
  );
  if (!out.Body) {
    throw new Error(`R2 object ${key} has no body`);
  }
  // Body is a Readable stream on Node runtime; collect to Uint8Array.
  const bytes = await readableToUint8Array(out.Body as AsyncIterable<Uint8Array>);
  return { bytes, contentType: out.ContentType ?? null };
}

async function readableToUint8Array(
  body: AsyncIterable<Uint8Array>,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let total = 0;
  for await (const chunk of body) {
    chunks.push(chunk);
    total += chunk.byteLength;
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

// ---------------------------------------------------------------------------
// Delete. Used by DELETE /api/resume when the user wipes their resume.
// ---------------------------------------------------------------------------

export async function deleteResume(key: string): Promise<void> {
  const client = getClient();
  try {
    await client.send(
      new DeleteObjectCommand({ Bucket: getBucket(), Key: key }),
    );
  } catch (err) {
    // Best-effort: a 404 here (object already gone) is fine; rethrow
    // anything else so the API route can log it.
    const code = (err as { name?: string; $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;
    if (code === 404) return;
    throw err;
  }
}
