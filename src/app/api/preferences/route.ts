/**
 * /api/preferences — Phase 3 of the dashboard real-data plan.
 *
 * GET  -> { toolsEnabled: {...}, notificationPrefs: {...} }
 * PATCH { toolsEnabled?, notificationPrefs? } -> merged + saved
 *
 * Both payloads live as JSON strings in Turso to keep the schema
 * flexible — feature toggles and notification channels change more
 * often than schema migrations are worth. Reads / writes are scoped
 * to the authenticated Clerk user.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Default preference shape returned when a user has no row yet.
const DEFAULTS = {
  toolsEnabled: {
    'ghg-calculator': true,
    'report-drafter': false,
    'data-extractor': false,
  } as Record<string, boolean>,
  notificationPrefs: {
    jobAlerts: true,
    courseUpdates: true,
    weeklyDigest: false,
    productNews: true,
  } as Record<string, boolean>,
};

function parseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return NextResponse.json(DEFAULTS);
  }

  return NextResponse.json({
    toolsEnabled: {
      ...DEFAULTS.toolsEnabled,
      ...parseJson(row.toolsEnabled, {}),
    },
    notificationPrefs: {
      ...DEFAULTS.notificationPrefs,
      ...parseJson(row.notificationPrefs, {}),
    },
  });
}

interface PatchBody {
  toolsEnabled?: Record<string, boolean>;
  notificationPrefs?: Record<string, boolean>;
}

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  const current = existing[0];
  const nextTools = {
    ...DEFAULTS.toolsEnabled,
    ...parseJson(current?.toolsEnabled ?? null, {}),
    ...(body.toolsEnabled ?? {}),
  };
  const nextNotif = {
    ...DEFAULTS.notificationPrefs,
    ...parseJson(current?.notificationPrefs ?? null, {}),
    ...(body.notificationPrefs ?? {}),
  };

  if (current) {
    await db
      .update(userPreferences)
      .set({
        toolsEnabled: JSON.stringify(nextTools),
        notificationPrefs: JSON.stringify(nextNotif),
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences).values({
      userId,
      toolsEnabled: JSON.stringify(nextTools),
      notificationPrefs: JSON.stringify(nextNotif),
      updatedAt: new Date(),
    });
  }

  return NextResponse.json({
    toolsEnabled: nextTools,
    notificationPrefs: nextNotif,
  });
}
