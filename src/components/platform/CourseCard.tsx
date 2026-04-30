import Link from 'next/link';
import type { Course } from '@/lib/types';
import { getColor } from '@/lib/colors';
import ProgressBar from '@/components/learning/ProgressBar';

interface Props {
  course: Course;
  completedLessons?: number;
  totalLessons?: number;
  lastLessonId?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  methodologies: 'Methodology',
  markets: 'Carbon Markets',
  esg: 'ESG',
  fundamentals: 'Fundamentals',
  'green-finance': 'Green Finance',
};

export default function CourseCard({ course, completedLessons = 0, totalLessons, lastLessonId }: Props) {
  const colors = getColor(course.color);
  const total = totalLessons ?? course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const percent = total > 0 ? (completedLessons / total) * 100 : 0;
  const hasProgress = completedLessons > 0;

  const resumeHref = lastLessonId
    ? `/courses/${course.id}/${lastLessonId}`
    : `/courses/${course.id}`;

  const statusBadge =
    course.status === 'coming-soon' ? (
      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Coming Soon</span>
    ) : course.status === 'draft' ? (
      <span className="text-xs text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">Draft</span>
    ) : null;

  const categoryLabel = CATEGORY_LABELS[course.category] ?? course.category;

  const isDisabled = course.status !== 'published';

  return (
    <article
      className={`group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${
        isDisabled ? 'opacity-60' : 'hover:shadow-lg hover:-translate-y-1 hover:border-gray-300'
      }`}
    >
      {/* Colored top bar */}
      <div className={`h-1.5 ${colors.bg}`} />

      <div className="p-5">
        {/* Category + status */}
        <div className="flex items-center justify-between mb-3">
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${colors.light}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors.bg}`} aria-hidden />
            <span className={`text-xs font-medium ${colors.text}`}>
              {categoryLabel}
            </span>
          </div>
          {statusBadge}
        </div>

        {/* Title & subtitle */}
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1.5 group-hover:text-gray-700 transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-2">{course.subtitle}</p>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            {total} lessons
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {course.estimatedHours}h
          </span>
          {hasProgress && (
            <>
              <span className="text-gray-300">|</span>
              <span className={`font-medium ${colors.text}`}>{completedLessons} done</span>
            </>
          )}
        </div>

        {/* Progress */}
        {hasProgress && (
          <div className="mb-4">
            <ProgressBar percent={percent} colorClass={colors.bg} />
          </div>
        )}

        {/* CTA */}
        {!isDisabled && (
          <Link
            href={resumeHref}
            className={`inline-flex items-center gap-1.5 text-sm font-medium border ${colors.border} ${colors.text} px-3.5 py-1.5 rounded-lg ${colors.hoverLight} transition-all duration-200`}
          >
            {hasProgress ? (percent >= 100 ? 'Review course' : 'Resume') : 'Start course'}
            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        )}
      </div>
    </article>
  );
}
