/**
 * /api/usage — Phase 2 of the dashboard real-data plan.
 *
 * GET  -> summary for the signed-in user:
 *   {
 *     today:  { sustainiq_query, report_generated, export_csv, watchlist_created },
 *     month:  { sustainiq_query, report_generated, export_csv, watchlist_created },
 *     limits: { sustainiq_query_daily, report_generated_monthly }
 *   }
 *
 * POST { kind, metadata? } -> 201 | 429 when over quota
 *   Records a usage event. Returns 429 if the signed-in user's
 *   quota for that kind is already exhausted; the caller should
 *   surface the limit to the user (they've already been nudged to
 *   upgrade on the dashboard).
 *
 * Quotas map to the Free / Individual / Pro / Team tiers documented
 * in the pricing page. For now everyone is on "free tier preview"
 * until Dodo Payments (Phase 1) lands — so we apply the generous
 * preview cap rather than gate hard.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { usageEvents } from '@/lib/schema';
import { and, eq, gte, sql } from 'drizzle-orm';

const VALID_KINDS = [
  'sustainiq_query',
  'report_generated',
  'export_csv',
  'watchlist_created',
] as const;
type UsageKind = (typeof VALID_KINDS)[number];

// Preview-era limits. Will be driven by the user's active plan tier
// once subscription state is known (Phase 1).
const PREVIEW_LIMITS: { kind: UsageKind; window: 'day' | 'month'; limit: number }[] = [
  { kind: 'sustainiq_query', window: 'day', limit: 20 },
  { kind: 'report_generated', window: 'month', limit: 10 },
];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function countEvents(userId: string, kind: UsageKind, since: Date): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.userId, userId),
        eq(usageEvents.kind, kind),
        gte(usageEvents.ts, since),
      ),
    );
  return Number(rows[0]?.n ?? 0);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = startOfToday();
  const month = startOfMonth();

  const counts = await Promise.all(
    VALID_KINDS.flatMap(kind => [
      countEvents(userId, kind, today).then(n => ['today', kind, n] as const),
      countEvents(userId, kind, month).then(n => ['month', kind, n] as const),
    ]),
  );

  const summary = { today: {}, month: {} } as {
    today: Record<string, number>;
    month: Record<string, number>;
  };
  for (const [bucket, kind, n] of counts) {
    summary[bucket][kind] = n;
  }

  return NextResponse.json({
    ...summary,
    limits: Object.fromEntries(
      PREVIEW_LIMITS.map(l => [`${l.kind}_${l.window === 'day' ? 'daily' : 'monthly'}`, l.limit]),
    ),
  });
}

interface PostBody {
  kind: UsageKind;
  metadata?: Record<string, unknown>;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: PostBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }

  if (!VALID_KINDS.includes(body.kind)) {
    return NextResponse.json({ error: 'Unknown kind' }, { status: 400 });
  }

  // Quota check before logging — prevents a user from blowing past a
  // hard limit by spamming. Soft limits are enforced at the calling
  // endpoint (the SustainIQ pipeline still returns 429 on its own
  // checks, but logs here are the single source of truth).
  const applicable = PREVIEW_LIMITS.find(l => l.kind === body.kind);
  if (applicable) {
    const since = applicable.window === 'day' ? startOfToday() : startOfMonth();
    const used = await countEvents(userId, body.kind, since);
    if (used >= applicable.limit) {
      return NextResponse.json(
        {
          error: 'quota_exceeded',
          kind: body.kind,
          window: applicable.window,
          limit: applicable.limit,
          used,
        },
        { status: 429 },
      );
    }
  }

  await db.insert(usageEvents).values({
    userId,
    kind: body.kind,
    metadata: body.metadata ? JSON.stringify(body.metadata) : null,
    ts: new Date(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
