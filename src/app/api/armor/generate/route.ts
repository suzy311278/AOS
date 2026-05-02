/**
 * POST /api/armor/generate
 *
 * Admin-gated SSE endpoint that runs the MCP content-generation pipeline.
 * Streams PipelineEvent objects as `data:` lines; the final event carries
 * the full GenerateCourseOutput so the admin uploader can preview the diff.
 *
 * Auth: Clerk — only users whose publicMetadata.role === 'admin' may call.
 * Body: GenerateCourseInput JSON.
 *
 * Phase 2 ships the mock pipeline; Phase 3+ swaps for live MCP servers.
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { GenerateCourseInput, GenerateCourseOutput } from '@/lib/armor/mcp-pipeline';
import { runMockPipeline } from '@/lib/armor/generator/mock';
// import { runLivePipeline } from '@/lib/armor/generator/live';
import { writeGeneratedCourse } from '@/lib/armor/generator/writer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Admin check ────────────────────────────────────────────────────────

async function isAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  if (!user) return false;
  const meta = user.publicMetadata as Record<string, unknown> | undefined;
  return meta?.role === 'admin';
}

// ── POST handler ───────────────────────────────────────────────────────

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let input: GenerateCourseInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  if (!input.topic || typeof input.topic !== 'string') {
    return NextResponse.json({ error: 'topic is required' }, { status: 400 });
  }
  if (!input.track || typeof input.track !== 'string') {
    return NextResponse.json({ error: 'track is required' }, { status: 400 });
  }

  const mode = (new URL(req.url).searchParams.get('mode') ?? 'mock') as 'mock' | 'live';
  const dryRun = new URL(req.url).searchParams.get('dry') === '1';

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      }

      try {
        send('status', { message: `Starting ${mode} pipeline…`, mode });

        const gen = mode === 'mock'
          ? runMockPipeline(input)
          : runMockPipeline(input); // Phase 3: swap for runLivePipeline

        // Consume the async generator — yield events, capture return value.
        let output: GenerateCourseOutput | undefined;
        let step = await gen.next();
        while (!step.done) {
          send('pipeline', step.value);
          step = await gen.next();
        }
        output = step.value; // generator return value

        send('status', { message: 'Pipeline complete.' });

        if (output && !dryRun) {
          send('status', { message: 'Writing course bundle to disk…' });
          try {
            const writeResult = writeGeneratedCourse(output);
            send('written', writeResult);
          } catch (writeErr: any) {
            send('error', { message: `Write failed: ${writeErr.message}` });
          }
        }

        send('done', {
          dryRun,
          mode,
          slug: output?.slug,
          diagnostics: output?.diagnostics,
        });
      } catch (err: any) {
        send('error', { message: err.message ?? 'pipeline failed' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
