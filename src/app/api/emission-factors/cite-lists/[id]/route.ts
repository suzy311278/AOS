/**
 * PATCH  /api/emission-factors/cite-lists/[id] - rename { name }
 * DELETE /api/emission-factors/cite-lists/[id] - delete the list (and items)
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import {
  renameCiteList,
  deleteCiteList,
} from '@/lib/emission-factors/cite-lists';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RenameSchema = z.object({ name: z.string().min(1).max(120) });

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });
  let parsed;
  try {
    parsed = RenameSchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad JSON' }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const ok = await renameCiteList(userId, params.id, parsed.data.name);
  if (!ok) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });
  await deleteCiteList(userId, params.id);
  return NextResponse.json({ ok: true });
}
