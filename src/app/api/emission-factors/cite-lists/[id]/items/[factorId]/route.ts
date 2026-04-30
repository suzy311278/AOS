/**
 * DELETE /api/emission-factors/cite-lists/[id]/items/[factorId]
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { removeFactorFromCiteList } from '@/lib/emission-factors/cite-lists';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; factorId: string } },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });
  const ok = await removeFactorFromCiteList(userId, params.id, params.factorId);
  if (!ok) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true });
}
