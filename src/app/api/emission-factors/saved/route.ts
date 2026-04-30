/**
 * GET  /api/emission-factors/saved - list saved factors for the signed-in user
 * POST /api/emission-factors/saved - toggle save on { factorId, folder? }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import {
  saveFactor,
  unsaveFactor,
  isFactorSaved,
  listSavedFactors,
} from '@/lib/emission-factors/saved';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  factorId: z.string().min(1).max(200),
  folder: z.string().max(120).optional().nullable(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });
  const rows = await listSavedFactors(userId);
  return NextResponse.json({ ok: true, saved: rows });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  let parsed;
  try {
    parsed = BodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad JSON' }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { factorId, folder } = parsed.data;
  const already = await isFactorSaved(userId, factorId);
  if (already) {
    await unsaveFactor(userId, factorId);
    return NextResponse.json({ ok: true, saved: false });
  }
  await saveFactor(userId, factorId, folder ?? null);
  return NextResponse.json({ ok: true, saved: true });
}
