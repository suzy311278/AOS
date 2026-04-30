/**
 * GET  /api/emission-factors/cite-lists - list the signed-in user's cite lists
 * POST /api/emission-factors/cite-lists - create a new list { name }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import {
  listUserCiteLists,
  createCiteList,
} from '@/lib/emission-factors/cite-lists';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({ name: z.string().min(1).max(120) });

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });
  const lists = await listUserCiteLists(userId);
  return NextResponse.json({ ok: true, lists });
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
  const id = await createCiteList(userId, parsed.data.name);
  return NextResponse.json({ ok: true, id }, { status: 201 });
}
