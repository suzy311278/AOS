import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { enrollments, lessonCompletions, dailyActivity } from '@/lib/schema';
import { sql } from 'drizzle-orm';

const bodySchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { courseId, lessonId } = parsed.data;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  await db.batch([
    db.insert(enrollments).values({
      userId,
      courseId,
      startedAt: now,
      lastLesson: lessonId,
      lastAccessedAt: now,
    }).onConflictDoUpdate({
      target: [enrollments.userId, enrollments.courseId],
      set: { lastLesson: lessonId, lastAccessedAt: now },
    }),
    db.insert(lessonCompletions).values({
      userId,
      courseId,
      lessonId,
      completedAt: now,
    }).onConflictDoNothing(),
    db.insert(dailyActivity).values({
      userId,
      activityDate: dateStr,
      lessonsDone: 1,
      quizzesDone: 0,
    }).onConflictDoUpdate({
      target: [dailyActivity.userId, dailyActivity.activityDate],
      set: { lessonsDone: sql`lessons_done + 1` },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
