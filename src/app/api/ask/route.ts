import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkAndReserveCap } from "@/lib/llm-governor";
import { rateLimitDurable } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// Blocking proxy to the SustainIQ ASK server.
// ---------------------------------------------------------------------------
// The Python server (scripts/ask-server.py, hosted on HF Spaces or locally in
// dev) keeps 600MB+ of embeddings in memory and runs the full pipeline.
//
// Auth layers enforced here:
//   1. Clerk sign-in is required (anonymous users get 401).
//   2. Freemium cap via the LLM Governor (free tier = 5/month, tunable in
//      src/lib/llm-governor.ts CAPS).
//   3. Shared secret header (`ASK_SERVER_TOKEN`) is forwarded so the Python
//      server rejects direct-hit requests from the public internet.
//   4. The Python server also runs a per-user 2/min sliding-window limiter
//      as defense in depth against burst abuse.
// ---------------------------------------------------------------------------

const ASK_SERVER_URL =
  process.env.ASK_SERVER_URL || "http://127.0.0.1:5100";

const ASK_SERVER_TOKEN = process.env.ASK_SERVER_TOKEN || "";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AskRequestBody {
  query: string;
  enable_revise?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    if (!ASK_SERVER_TOKEN) {
      return Response.json(
        {
          error:
            "server misconfigured: ASK_SERVER_TOKEN is unset; refusing to proxy",
        },
        { status: 503 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return Response.json(
        { error: "sign in to ask questions" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as AskRequestBody;
    const query = (body.query || "").trim();

    if (!query) {
      return Response.json({ error: "query is required" }, { status: 400 });
    }

    // Per-user per-minute cap. Shared bucket across /ask and /ask/stream
    // so switching endpoint can't bypass. Sits in front of the monthly
    // governor cap so burst abuse is rejected cheaply.
    const burst = await rateLimitDurable("ask", userId, 10, 60 * 1000);
    if (!burst.ok) {
      return Response.json(
        { error: "slow down", retryAfterMs: burst.retryAfterMs },
        { status: 429 }
      );
    }

    // Freemium cap via Governor. Every signed-in user is "free" tier
    // until Stripe ships; upgrade this lookup when subscriptions land.
    const gate = await checkAndReserveCap("sustainiq", userId, "free");
    if (!gate.allowed) {
      return Response.json(
        { error: "monthly limit reached", cap: gate.cap },
        { status: 429 }
      );
    }

    const upstream = await fetch(`${ASK_SERVER_URL}/ask`, {
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

    if (!upstream.ok) {
      const errBody = await upstream.text().catch(() => "");
      return Response.json(
        {
          error: `ask server returned ${upstream.status}`,
          details: errBody.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    return Response.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isConnRefused =
      msg.includes("ECONNREFUSED") || msg.includes("fetch failed");
    return Response.json(
      {
        error: isConnRefused
          ? "Ask server is not reachable"
          : msg,
      },
      { status: 503 }
    );
  }
}

export async function GET() {
  // Health check for monitoring. No auth required (no sensitive data).
  try {
    const headers: Record<string, string> = {};
    if (ASK_SERVER_TOKEN) {
      headers.Authorization = `Bearer ${ASK_SERVER_TOKEN}`;
    }
    const upstream = await fetch(`${ASK_SERVER_URL}/health`, { headers });
    if (!upstream.ok) {
      return Response.json({ status: "upstream_error" }, { status: 502 });
    }
    const data = await upstream.json();
    return Response.json(data);
  } catch {
    return Response.json({ status: "down" }, { status: 503 });
  }
}
