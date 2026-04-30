'use client';

import Link from 'next/link';
import type { LessonMeta } from '@/lib/types';
import { lessonIdToUrl } from '@/lib/url-helpers';

interface Props {
  courseId: string;
  prevLesson: LessonMeta | null;
  nextLesson: LessonMeta | null;
  lessonIndex: number;
  moduleLessonCount: number;
}

export default function BottomLessonNav({
  courseId,
  prevLesson,
  nextLesson,
  lessonIndex,
  moduleLessonCount,
}: Props) {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur border-t border-gray-200 pb-safe">
      <div className="flex items-center justify-between h-12 px-4">
        {prevLesson ? (
          <Link
            href={`/courses/${courseId}/${lessonIdToUrl(prevLesson.id)}`}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label={`Previous: ${prevLesson.title}`}
          >
            <span aria-hidden>←</span>
          </Link>
        ) : (
          <div className="w-10" />
        )}

        <span className="text-xs text-gray-500 font-medium">
          {lessonIndex} of {moduleLessonCount}
        </span>

        {nextLesson ? (
          <Link
            href={`/courses/${courseId}/${lessonIdToUrl(nextLesson.id)}`}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label={`Next: ${nextLesson.title}`}
          >
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <div className="w-10" />
        )}
      </div>
    </div>
  );
}
