import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkAndReserveCap } from "@/lib/llm-governor";
import { rateLimitDurable } from "@/lib/rate-limit";

const ASK_SERVER_URL =
  process.env.ASK_SERVER_URL || "http://127.0.0.1:5100";

const ASK_SERVER_TOKEN = process.env.ASK_SERVER_TOKEN || "";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AskStreamBody {
  query: string;
  enable_revise?: boolean;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!ASK_SERVER_TOKEN) {
      return json(503, {
        error:
          "server misconfigured: ASK_SERVER_TOKEN is unset; refusing to proxy",
      });
    }

    const { userId } = await auth();
    if (!userId) {
      return json(401, { error: "sign in to ask questions" });
    }

    const body = (await req.json()) as AskStreamBody;
    const query = (body.query || "").trim();
    if (!query) {
      return json(400, { error: "query is required" });
    }

    // Per-user per-minute cap. Shared bucket with /api/ask so switching
    // endpoint can't bypass the burst gate.
    const burst = await rateLimitDurable("ask", userId, 10, 60 * 1000);
    if (!burst.ok) {
      return json(429, { error: "slow down", retryAfterMs: burst.retryAfterMs });
    }

    // Freemium cap. Every signed-in user is "free" tier until Stripe
    // ships; upgrade this lookup when subscriptions land.
    const gate = await checkAndReserveCap("sustainiq", userId, "free");
    if (!gate.allowed) {
      return json(429, {
        error: "monthly limit reached",
        cap: gate.cap,
      });
    }

    // Phase 2: log the query as a usage event for dashboard counters.
    // Fire-and-forget; a logging hiccup should not break the user's
    // actual response. The existing checkAndReserveCap above still
    // enforces the monthly cap, so this is purely telemetry.
    try {
      const { db } = await import("@/lib/db");
      const { usageEvents } = await import("@/lib/schema");
      await db.insert(usageEvents).values({
        userId,
        kind: "sustainiq_query",
        metadata: JSON.stringify({ query: query.slice(0, 240) }),
        ts: new Date(),
      });
    } catch {
      /* telemetry hiccup; ignore */
    }

    const upstream = await fetch(`${ASK_SERVER_URL}/ask/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ASK_SERVER_TOKEN}`,
        "X-User-Id": userId,
      },
      body: JSON.stringify({
        query,
        enable_revise: body.enable_revise ?? true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const txt = await upstream.text().catch(() => "");
      return json(502, {
        error: `upstream ${upstream.status}`,
        details: txt.slice(0, 500),
      });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isConnRefused =
      msg.includes("ECONNREFUSED") || msg.includes("fetch failed");
    return json(503, {
      error: isConnRefused
        ? "Ask server is not reachable"
        : msg,
    });
  }
}
