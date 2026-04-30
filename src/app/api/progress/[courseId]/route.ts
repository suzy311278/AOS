import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enrollments, lessonCompletions, quizAttempts } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { courseId } = await params;

  const [enrollment, completions, quizzes] = await Promise.all([
    db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(lessonCompletions)
      .where(and(eq(lessonCompletions.userId, userId), eq(lessonCompletions.courseId, courseId))),
    db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.courseId, courseId))),
  ]);

  return NextResponse.json({ enrollment, completions, quizzes });
}
