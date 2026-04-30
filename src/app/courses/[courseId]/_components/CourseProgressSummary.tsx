'use client';

/**
 * CourseProgressSummary
 *
 * Small progress summary shown on the course overview page. Renders
 * "N of M complete" + a thin progress bar + a "Resume lesson X"
 * CTA when the user has a recorded lastAccessedLesson.
 *
 * Silently renders nothing for anonymous users (no data to show) so
 * the strip doesn't nag people into signing in before they've seen
 * the course. That conversation happens in-lesson.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useProgress } from '@/lib/progress-cloud';
import { lessonIdToUrl } from '@/lib/url-helpers';
import type { Module } from '@/lib/types';

interface Props {
  courseId: string;
  modules: Module[];
}

function findLessonTitle(modules: Module[], lessonId: string): string | null {
  for (const m of modules) {
    const l = m.lessons.find(x => x.id === lessonId);
    if (l) return l.title;
  }
  return null;
}

function findFirstIncomplete(
  modules: Module[],
  isDone: (id: string) => boolean,
): { id: string; title: string } | null {
  for (const m of modules) {
    for (const l of m.lessons) {
      if (!isDone(l.id)) return { id: l.id, title: l.title };
    }
  }
  return null;
}

export default function CourseProgressSummary({ courseId, modules }: Props) {
  const progress = useProgress(courseId);

  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0);
  const completed = progress.completedCount;

  // Anonymous users get no progress state. The progress-cloud hook
  // returns safe defaults (completedCount = 0, lastAccessedLesson null)
  // for them; we still skip the strip to avoid a "0 of 42" shame tile.
  const hasAnyProgress = completed > 0 || !!progress.lastAccessedLesson;
  if (!hasAnyProgress) return null;

  const pct = totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100);

  // Prefer resuming exactly where they left off; fall back to the first
  // lesson they haven't completed; else the start of the course.
  const lastId = progress.lastAccessedLesson;
  const lastTitle = lastId ? findLessonTitle(modules, lastId) : null;
  const resumeTarget = lastId && lastTitle
    ? { id: lastId, title: lastTitle, label: 'Resume' }
    : (() => {
        const firstOpen = findFirstIncomplete(modules, id => progress.isCompleted(id));
        return firstOpen
          ? { id: firstOpen.id, title: firstOpen.title, label: 'Continue' }
          : null;
      })();

  return (
    <section
      aria-label="Your course progress"
      className="max-w-[1280px] mx-auto px-6 md:px-8 mt-6 md:mt-8"
    >
      <div className="bg-white border border-gt-border-light rounded-2xl shadow-gt-card p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-5 md:gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-4 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gt-text-dim">
              Your progress
            </p>
            <p className="font-['JetBrains_Mono'] text-[12px] text-gt-text-muted">
              {completed.toLocaleString('en-US')} of {totalLessons.toLocaleString('en-US')} lessons
              {' · '}
              <span className="font-semibold text-gt-text">{pct}%</span>
            </p>
          </div>
          <div className="h-2 w-full rounded-full bg-gt-pale overflow-hidden">
            <div
              className="h-full bg-gt-medium rounded-full transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {resumeTarget ? (
          <Link
            href={`/courses/${courseId}/${lessonIdToUrl(resumeTarget.id)}`}
            className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gt-medium text-white text-sm font-semibold hover:bg-gt-dark transition-colors shrink-0"
          >
            {resumeTarget.label}
            <span className="truncate max-w-[180px] font-normal opacity-80">
              {resumeTarget.title}
            </span>
            <ArrowRight
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform shrink-0"
              strokeWidth={2}
            />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
