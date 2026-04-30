import Link from 'next/link';
import type { LessonMeta } from '@/lib/types';
import { lessonIdToUrl } from '@/lib/url-helpers';

interface Props {
  courseId: string;
  prevLesson: LessonMeta | null;
  nextLesson: LessonMeta | null;
}

export default function LessonNav({ courseId, prevLesson, nextLesson }: Props) {
  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
      {prevLesson ? (
        <Link
          href={`/courses/${courseId}/${lessonIdToUrl(prevLesson.id)}`}
          className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span aria-hidden>←</span>
          <span className="max-w-[160px] truncate">{prevLesson.title}</span>
        </Link>
      ) : (
        <div />
      )}

      {nextLesson ? (
        <Link
          href={`/courses/${courseId}/${lessonIdToUrl(nextLesson.id)}`}
          className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          <span className="max-w-[160px] truncate">{nextLesson.title}</span>
          <span aria-hidden>→</span>
        </Link>
      ) : (
        <Link
          href={`/courses/${courseId}`}
          className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          Back to Course Overview
          <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}
