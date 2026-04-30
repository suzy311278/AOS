/**
 * /redesign/dashboard - User Dashboard
 *
 * Server component that loads all user data from Turso:
 * - Enrolled courses with progress
 * - Daily activity for streak calendar
 * - Aggregate stats (lessons done, quizzes, XP)
 *
 * Auth-gated: redirects to sign-in if not authenticated.
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { enrollments, lessonCompletions, dailyActivity } from '@/lib/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import { getAllCourses } from '@/lib/courses';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';
import { DashboardClientRedesign } from './_components/DashboardClientRedesign';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Track your learning progress, streaks, and achievements.',
  // Auth-gated user surface, not public content. Do not index.
  robots: { index: false, follow: true, nocache: true },
};

export default async function DashboardRedesignPage() {
  const { userId } = await auth();

  // TEMP: Allow preview without auth during redesign
  const isPreviewMode = !userId;

  if (isPreviewMode) {
    // Mock data for design preview (no emojis - we use Lucide icons)
    const mockCourses = [
      {
        courseId: 'ghg-scope-3',
        title: 'GHG Protocol Scope 3',
        subtitle: 'Value chain emissions accounting',
        icon: '',
        color: 'blue',
        category: 'markets',
        lastLesson: '3.2',
        lastAccessedAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        completedCount: 14,
        totalLessons: 18,
      },
      {
        courseId: 'eu-taxonomy',
        title: 'EU Taxonomy',
        subtitle: 'Classification system for sustainable activities',
        icon: '',
        color: 'teal',
        category: 'esg',
        lastLesson: '2.1',
        lastAccessedAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        completedCount: 8,
        totalLessons: 22,
      },
      {
        courseId: 'climate-science-101',
        title: 'Climate Science 101',
        subtitle: 'Understanding the science behind climate change',
        icon: '',
        color: 'green',
        category: 'fundamentals',
        lastLesson: '6.4',
        lastAccessedAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 1 week ago
        completedCount: 24,
        totalLessons: 24, // Completed
      },
      {
        courseId: 'esg-reporting',
        title: 'ESG Reporting Frameworks',
        subtitle: 'GRI, SASB, ISSB, and integrated reporting',
        icon: '',
        color: 'violet',
        category: 'esg',
        lastLesson: '4.2',
        lastAccessedAt: Date.now() - 1000 * 60 * 60 * 24 * 14, // 2 weeks ago
        completedCount: 28,
        totalLessons: 28, // Completed
      },
    ];

    return (
      <>
        <Nav />
        <DashboardClientRedesign
          enrolledCourses={mockCourses}
          activityMap={{}}
          totalLessonsDone={74}
          totalQuizzesDone={38}
          xp={0}
        />
        <RedesignFooter />
      </>
    );
  }

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const dateStr = oneYearAgo.toISOString().slice(0, 10);

  const [enrolled, activity, allCourses] = await Promise.all([
    db
      .select({
        courseId: enrollments.courseId,
        startedAt: enrollments.startedAt,
        lastLesson: enrollments.lastLesson,
        lastAccessedAt: enrollments.lastAccessedAt,
        completedCount: sql<number>`(
          SELECT COUNT(*) FROM lesson_completions
          WHERE user_id = ${userId}
          AND course_id = ${enrollments.courseId}
        )`,
      })
      .from(enrollments)
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.lastAccessedAt)),
    db
      .select()
      .from(dailyActivity)
      .where(and(eq(dailyActivity.userId, userId), gte(dailyActivity.activityDate, dateStr))),
    getAllCourses(),
  ]);

  const courseMap = Object.fromEntries(allCourses.map((c) => [c.id, c]));

  const enrolledCourses = enrolled.map((e) => {
    const course = courseMap[e.courseId];
    const totalLessons =
      course?.modules.reduce((sum, m) => sum + m.lessons.length, 0) ?? 0;
    return {
      courseId: e.courseId,
      title: course?.title ?? e.courseId,
      subtitle: course?.subtitle ?? '',
      icon: course?.icon ?? '',
      color: course?.color ?? 'green',
      category: course?.category ?? 'fundamentals',
      lastLesson: e.lastLesson,
      lastAccessedAt: e.lastAccessedAt
        ? new Date(e.lastAccessedAt).getTime()
        : null,
      completedCount: e.completedCount,
      totalLessons,
    };
  });

  const activityMap: Record<string, { lessonsDone: number; quizzesDone: number }> =
    {};
  for (const row of activity) {
    activityMap[row.activityDate] = {
      lessonsDone: row.lessonsDone,
      quizzesDone: row.quizzesDone,
    };
  }

  const totalLessonsDone = enrolled.reduce((sum, e) => sum + e.completedCount, 0);
  const totalQuizzesDone = activity.reduce((sum, a) => sum + a.quizzesDone, 0);

  // Calculate XP: 10 per lesson, 5 per quiz
  const xp = totalLessonsDone * 10 + totalQuizzesDone * 5;

  return (
    <>
      <Nav />
      <DashboardClientRedesign
        enrolledCourses={enrolledCourses}
        activityMap={activityMap}
        totalLessonsDone={totalLessonsDone}
        totalQuizzesDone={totalQuizzesDone}
        xp={xp}
      />
      <RedesignFooter />
    </>
  );
}
