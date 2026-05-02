/**
 * GET /api/armor/lab/[id]/socket
 *
 * WebSocket-style endpoint for the lab terminal. Since Next.js App Router
 * does not natively support WebSocket upgrades, this route implements a
 * streaming response using ReadableStream with a chunked transfer.
 *
 * The client-side Terminal component connects via WebSocket. In production,
 * the WS upgrade is handled by a middleware or a custom server sitting in
 * front of Next.js (e.g. a Node.js WS server on the same port via
 * instrumentation.ts). This route acts as the fallback SSE transport and
 * as the lab session lifecycle manager.
 *
 * Production deployment options:
 *   1. Vercel: Use Vercel's Edge Runtime WebSocket support or a separate
 *      WS server on a subdomain (ws.armorinnovate.com).
 *   2. Self-hosted: Custom server.ts with `ws` library doing the upgrade
 *      and calling createMockSession / createDockerSession.
 *
 * For Phase 3, this route creates a mock lab session and streams output
 * via SSE. The frontend Terminal falls back to its built-in mock shell
 * when it can't establish a WS connection, so the system works either way.
 */

import { NextResponse } from 'next/server';
import { createMockSession, getSession } from '@/lib/armor/lab-runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ── GET: Create session + stream output via SSE ──────────────────────

export async function GET(_req: Request, { params }: RouteParams) {
  const { id: labSlug } = await params;

  if (!labSlug || labSlug.length > 80) {
    return NextResponse.json({ error: 'invalid lab id' }, { status: 400 });
  }

  const session = createMockSession(labSlug);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send session info
      controller.enqueue(
        encoder.encode(`event: session\ndata: ${JSON.stringify({ id: session.id, labSlug, state: session.state })}\n\n`),
      );

      // Pipe lab output → SSE
      session.onData((data) => {
        try {
          controller.enqueue(
            encoder.encode(`event: output\ndata: ${JSON.stringify({ text: data })}\n\n`),
          );
        } catch {
          // Stream may be closed
        }
      });
    },
    cancel() {
      session.destroy();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Lab-Session': session.id,
    },
  });
}

// ── POST: Send input to a running session ────────────────────────────

export async function POST(req: Request, { params }: RouteParams) {
  const { id: labSlug } = await params;

  const body = await req.json().catch(() => null);
  if (!body?.sessionId || typeof body.input !== 'string') {
    return NextResponse.json({ error: 'sessionId and input required' }, { status: 400 });
  }

  const session = getSession(body.sessionId);
  if (!session) {
    return NextResponse.json({ error: 'session not found' }, { status: 404 });
  }
  if (session.labSlug !== labSlug) {
    return NextResponse.json({ error: 'session/lab mismatch' }, { status: 400 });
  }

  session.write(body.input);
  return NextResponse.json({ ok: true });
}
