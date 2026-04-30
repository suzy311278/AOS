/**
 * POST /api/ask/log
 *
 * Client-initiated log write. Called once by the browser after a
 * SustainIQ answer finishes streaming, with the fully assembled answer
 * + source metadata. The Vercel /api/ask/stream route is a pure
 * passthrough and cannot see the final text; the browser is the only
 * place with the complete record, so the insert has to come from there.
 *
 * Auth: Clerk. 401 for anonymous callers.
 * Idempotent on `id` — if the same id is POSTed twice, the second call
 * upserts the row. The client uses a stable UUID so retries are safe.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { sustainiqQueries } from '@/lib/schema';

export const runtime = 'nodejs';

const BodySchema = z.object({
  id: z.string().min(8).max(80),
  query: z.string().min(1).max(4000),
  answer: z.string().max(60_000),
  sources: z
    .array(
      z.object({
        document: z.string().optional(),
        section: z.string().optional(),
        pages: z.string().optional(),
        course: z.string().optional(),
      }),
    )
    .optional(),
  lessons: z
    .array(
      z.object({
        courseId: z.string(),
        courseTitle: z.string(),
        lessonId: z.string(),
        lessonTitle: z.string(),
        url: z.string(),
      }),
    )
    .optional(),
  model: z.string().optional(),
  reviseCount: z.number().int().min(0).max(10).optional(),
  latencyMs: z.number().int().min(0).optional(),
  tokensIn: z.number().int().min(0).optional(),
  tokensOut: z.number().int().min(0).optional(),
  tier: z.string().optional(),
  status: z.enum(['success', 'error', 'aborted']).default('success'),
  errorMessage: z.string().max(1_000).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let parsed: z.infer<typeof BodySchema>;
  try {
    const raw = await req.json();
    parsed = BodySchema.parse(raw);
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: (err as Error).message },
      { status: 400 },
    );
  }

  try {
    await db
      .insert(sustainiqQueries)
      .values({
        id: parsed.id,
        userId,
        query: parsed.query,
        answer: parsed.answer,
        sources: parsed.sources ? JSON.stringify(parsed.sources) : null,
        lessons: parsed.lessons ? JSON.stringify(parsed.lessons) : null,
        model: parsed.model ?? null,
        reviseCount: parsed.reviseCount ?? 0,
        latencyMs: parsed.latencyMs ?? null,
        tokensIn: parsed.tokensIn ?? null,
        tokensOut: parsed.tokensOut ?? null,
        tier: parsed.tier ?? null,
        status: parsed.status,
        errorMessage: parsed.errorMessage ?? null,
      })
      .onConflictDoUpdate({
        target: sustainiqQueries.id,
        set: {
          answer: parsed.answer,
          sources: parsed.sources ? JSON.stringify(parsed.sources) : null,
          lessons: parsed.lessons ? JSON.stringify(parsed.lessons) : null,
          status: parsed.status,
          errorMessage: parsed.errorMessage ?? null,
        },
        // Guard: if the row somehow already belongs to a different user
        // (collision on a client-generated UUID), never overwrite it.
        where: eq(sustainiqQueries.userId, userId),
      });
    return NextResponse.json({ ok: true, id: parsed.id });
  } catch (err) {
    console.error('[api/ask/log] insert failed', err);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }
}
