/**
 * POST /api/emission-factors/cite-lists/[id]/items - add a factor { factorId, note? }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { addFactorToCiteList } from '@/lib/emission-factors/cite-lists';
import { loadAllFactors } from '@/lib/emission-factors/loader';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  factorId: z.string().min(1).max(200),
  note: z.string().max(1000).optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
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

  const known = loadAllFactors().some((f) => f.id === parsed.data.factorId);
  if (!known) {
    return NextResponse.json(
      { ok: false, error: 'Unknown factorId' },
      { status: 400 },
    );
  }

  const ok = await addFactorToCiteList(
    userId,
    params.id,
    parsed.data.factorId,
    parsed.data.note ?? null,
  );
  if (!ok) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
