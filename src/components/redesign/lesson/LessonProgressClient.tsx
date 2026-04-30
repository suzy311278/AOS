'use client';

/**
 * LessonProgressClient
 *
 * Tiny client-side component mounted on every lesson page. Does two
 * jobs tightly coupled to the lesson render:
 *
 *   1. On mount, records this lesson as the user's last accessed
 *      lesson for the course, so the dashboard "Pick up where you
 *      left off" card points at the right place.
 *
 *   2. Owns the "Next lesson" button at the bottom of the article,
 *      intercepting the click to mark the current lesson complete
 *      before navigation. Auto-complete on forward navigation is a
 *      cleaner behavioral proxy than a manual "Mark done" button —
 *      the user has read it and chosen to move on.
 *
 * Both calls are no-ops for anonymous visitors (the `useProgress`
 * hook silently does nothing when Clerk is not signed in), so we can
 * render this on every lesson without extra guards.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useProgress } from '@/lib/progress-cloud';
import { lessonIdToUrl } from '@/lib/url-helpers';

interface Props {
  courseId: string;
  lessonId: string;
  nextLesson?: { id: string; title: string } | null;
  /**
   * Number of quiz questions for this lesson (0 if the lesson has no
   * quiz YAML). When > 0, markComplete only fires once every question
   * has been submitted. Reading without engaging the check shouldn't
   * count as completion.
   */
  quizQuestionCount?: number;
}

export default function LessonProgressClient({
  courseId,
  lessonId,
  nextLesson,
  quizQuestionCount = 0,
}: Props) {
  const progress = useProgress(courseId);

  // Record visit → resume pointer stays accurate.
  useEffect(() => {
    progress.setLastAccessed(lessonId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId]);

  // Live quiz completion check: a lesson is "ready to be marked complete"
  // when it has no quiz, or every question has been submitted. Reading
  // React state from the hook each render is fine — this component
  // re-renders when progress state changes (Next button enabled/disabled).
  const quizState = progress.getQuizState(lessonId);
  const submittedCount = Object.values(quizState.submitted ?? {}).filter(Boolean).length;
  const quizDone = quizQuestionCount === 0 || submittedCount >= quizQuestionCount;

  const complete = () => {
    if (!quizDone) return; // skip mark-complete; quiz still pending
    try {
      progress.markComplete(lessonId);
    } catch {
      /* swallow — navigation should not block on progress sync */
    }
  };

  if (!nextLesson) {
    // Last lesson in the course — still auto-mark on the back-to-course
    // click so finishing the final lesson actually counts.
    return (
      <Link
        href={`/courses/${courseId}`}
        onClick={complete}
        className="group flex items-center justify-center gap-2 p-5 rounded-xl border border-gt-medium/30 bg-gt-medium/[0.05] hover:bg-gt-medium/[0.10] transition-colors text-[14px] font-bold text-gt-medium"
      >
        Back to course overview
        <ArrowRight
          className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
          strokeWidth={2}
        />
      </Link>
    );
  }

  const href = `/courses/${courseId}/${lessonIdToUrl(nextLesson.id)}`;

  return (
    <Link
      href={href}
      onClick={complete}
      className="group flex items-start gap-4 p-5 rounded-xl border border-gt-medium/30 bg-gt-medium/[0.05] hover:bg-gt-medium/[0.10] transition-colors md:text-right md:flex-row-reverse"
    >
      <ArrowRight
        className="w-5 h-5 text-gt-medium mt-0.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
        strokeWidth={2}
      />
      <div className="min-w-0 md:text-right">
        <p
          className="text-[10px] font-bold uppercase text-gt-medium mb-1"
          style={{
            letterSpacing: '0.16em',
            fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          Next lesson
        </p>
        <p className="text-[14px] font-semibold text-gt-text leading-snug">
          {nextLesson.title}
        </p>
      </div>
    </Link>
  );
}
