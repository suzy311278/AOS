import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { quizAttempts, dailyActivity } from '@/lib/schema';
import { sql } from 'drizzle-orm';

const bodySchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  questionIdx: z.number().int().min(0),
  selected: z.number().int().min(0).nullable().optional(),
  multiSelected: z.array(z.number()).nullable().optional(),
  matching: z.record(z.string(), z.string()).nullable().optional(),
  submitted: z.boolean(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { courseId, lessonId, questionIdx, selected, multiSelected, matching, submitted } = parsed.data;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  const upsertQuiz = db.insert(quizAttempts).values({
    userId,
    courseId,
    lessonId,
    questionIdx,
    selected: selected ?? null,
    multiSelected: multiSelected ? JSON.stringify(multiSelected) : null,
    matching: matching ? JSON.stringify(matching) : null,
    submitted,
    answeredAt: now,
  }).onConflictDoUpdate({
    target: [quizAttempts.userId, quizAttempts.courseId, quizAttempts.lessonId, quizAttempts.questionIdx],
    set: {
      selected: selected ?? null,
      multiSelected: multiSelected ? JSON.stringify(multiSelected) : null,
      matching: matching ? JSON.stringify(matching) : null,
      submitted,
      answeredAt: now,
    },
  });

  if (submitted) {
    const upsertActivity = db.insert(dailyActivity).values({
      userId,
      activityDate: dateStr,
      lessonsDone: 0,
      quizzesDone: 1,
    }).onConflictDoUpdate({
      target: [dailyActivity.userId, dailyActivity.activityDate],
      set: { quizzesDone: sql`quizzes_done + 1` },
    });
    await db.batch([upsertQuiz, upsertActivity]);
  } else {
    await upsertQuiz;
  }

  return NextResponse.json({ ok: true });
}
