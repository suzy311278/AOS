/**
 * PATCH /api/ask/log/[id]/feedback
 *
 * Update the thumbs feedback on a logged SustainIQ query. Only the
 * author of the row can change their own feedback. Accepts 'up',
 * 'down', or null (user un-voting a prior thumb).
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { sustainiqQueries } from '@/lib/schema';

export const runtime = 'nodejs';

const BodySchema = z.object({
  feedback: z.enum(['up', 'down']).nullable(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  }

  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: (err as Error).message },
      { status: 400 },
    );
  }

  try {
    const result = await db
      .update(sustainiqQueries)
      .set({ feedback: parsed.feedback })
      .where(
        and(
          eq(sustainiqQueries.id, id),
          eq(sustainiqQueries.userId, userId),
        ),
      );
    const changed = (result as unknown as { rowsAffected?: number }).rowsAffected ?? 0;
    if (changed === 0) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/ask/log/feedback] update failed', err);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }
}
