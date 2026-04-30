import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { enrollments, lessonCompletions, quizAttempts } from '@/lib/schema';

const courseProgressSchema = z.object({
  startedAt: z.number(),
  lastAccessedAt: z.number(),
  lastAccessedLesson: z.string().optional(),
  completedLessons: z.record(z.string(), z.number()).optional(),
  quizzes: z
    .record(
      z.string(),
      z.object({
        answers: z.record(z.string(), z.number()).optional(),
        multiSelectAnswers: z.record(z.string(), z.array(z.number())).optional(),
        matchingAnswers: z.record(z.string(), z.record(z.string(), z.string())).optional(),
        submitted: z.record(z.string(), z.boolean()).optional(),
      }),
    )
    .optional(),
});

const bodySchema = z.object({
  courses: z.record(z.string(), courseProgressSchema),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const statements: any[] = [];

  for (const [courseId, course] of Object.entries(parsed.data.courses)) {
    statements.push(
      db.insert(enrollments).values({
        userId,
        courseId,
        startedAt: new Date(course.startedAt),
        lastLesson: course.lastAccessedLesson ?? null,
        lastAccessedAt: new Date(course.lastAccessedAt),
      }).onConflictDoNothing(),
    );

    if (course.completedLessons) {
      for (const [lessonId, ts] of Object.entries(course.completedLessons)) {
        statements.push(
          db.insert(lessonCompletions).values({
            userId,
            courseId,
            lessonId,
            completedAt: new Date(ts),
          }).onConflictDoNothing(),
        );
      }
    }

    if (course.quizzes) {
      for (const [lessonId, quiz] of Object.entries(course.quizzes)) {
        const allIdxs = new Set([
          ...Object.keys(quiz.answers ?? {}),
          ...Object.keys(quiz.multiSelectAnswers ?? {}),
          ...Object.keys(quiz.matchingAnswers ?? {}),
          ...Object.keys(quiz.submitted ?? {}),
        ]);

        for (const idx of allIdxs) {
          const qIdx = parseInt(idx, 10);
          if (isNaN(qIdx)) continue;

          statements.push(
            db.insert(quizAttempts).values({
              userId,
              courseId,
              lessonId,
              questionIdx: qIdx,
              selected: quiz.answers?.[idx] ?? null,
              multiSelected: quiz.multiSelectAnswers?.[idx]
                ? JSON.stringify(quiz.multiSelectAnswers[idx])
                : null,
              matching: quiz.matchingAnswers?.[idx]
                ? JSON.stringify(quiz.matchingAnswers[idx])
                : null,
              submitted: quiz.submitted?.[idx] ?? false,
              answeredAt: new Date(),
            }).onConflictDoNothing(),
          );
        }
      }
    }
  }

  if (statements.length > 0) {
    await db.batch(statements as [any, ...any[]]);
  }

  return NextResponse.json({ ok: true, migrated: statements.length });
}
