import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enrollments, lessonCompletions } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select({
      courseId: enrollments.courseId,
      startedAt: enrollments.startedAt,
      lastLesson: enrollments.lastLesson,
      lastAccessedAt: enrollments.lastAccessedAt,
      completedCount: sql<number>`(
        SELECT COUNT(*) FROM lesson_completions
        WHERE user_id = ${enrollments.userId}
        AND course_id = ${enrollments.courseId}
      )`,
    })
    .from(enrollments)
    .where(eq(enrollments.userId, userId));

  return NextResponse.json(rows);
}
