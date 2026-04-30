'use client';

import Link from 'next/link';
import { getColor } from '@/lib/colors';
import { lessonIdToUrl } from '@/lib/url-helpers';
import type { Course, Module } from '@/lib/types';

interface Props {
  course: Course;
  completedLessons: Record<string, boolean>;
  currentLessonId?: string | null;
}

function getModuleStatus(
  mod: Module,
  completedLessons: Record<string, boolean>,
): 'completed' | 'in-progress' | 'locked' {
  const done = mod.lessons.filter(l => completedLessons[l.id]).length;
  if (done === mod.lessons.length) return 'completed';
  if (done > 0) return 'in-progress';
  return 'locked';
}

export default function CourseRoadmap({ course, completedLessons, currentLessonId }: Props) {
  // Find first incomplete module to determine what's "unlocked"
  let firstIncompleteIdx = course.modules.length;
  for (let i = 0; i < course.modules.length; i++) {
    const done = course.modules[i].lessons.filter(l => completedLessons[l.id]).length;
    if (done < course.modules[i].lessons.length) {
      firstIncompleteIdx = i;
      break;
    }
  }

  return (
    <div className="relative">
      {course.modules.map((mod, idx) => {
        const colors = getColor(mod.color);
        const status = getModuleStatus(mod, completedLessons);
        const doneLessons = mod.lessons.filter(l => completedLessons[l.id]).length;
        const isUnlocked = idx <= firstIncompleteIdx;
        const isCurrent = status === 'in-progress' || (idx === firstIncompleteIdx && status === 'locked');
        const firstLesson = mod.lessons[0];
        const percent = mod.lessons.length > 0 ? (doneLessons / mod.lessons.length) * 100 : 0;

        // Find the current/next lesson in this module
        let resumeLesson = firstLesson;
        if (currentLessonId && mod.lessons.some(l => l.id === currentLessonId)) {
          resumeLesson = mod.lessons.find(l => l.id === currentLessonId) ?? firstLesson;
        } else if (status === 'in-progress') {
          resumeLesson = mod.lessons.find(l => !completedLessons[l.id]) ?? firstLesson;
        }

        return (
          <div key={mod.id} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Vertical connector line */}
            {idx < course.modules.length - 1 && (
              <div
                className={`absolute left-5 top-12 w-0.5 bottom-0 ${
                  status === 'completed' ? 'bg-green-400' : 'bg-gray-200'
                }`}
                aria-hidden
              />
            )}

            {/* Node circle */}
            <div className="relative flex-shrink-0 z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-300 ${
                  status === 'completed'
                    ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-500/25'
                    : isCurrent
                    ? `${colors.bg} border-transparent text-white shadow-lg shadow-current/20 animate-pulse-subtle`
                    : isUnlocked
                    ? 'bg-white border-gray-300 text-gray-400'
                    : 'bg-gray-100 border-gray-200 text-gray-300'
                }`}
              >
                {status === 'completed' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-base">{mod.icon}</span>
                )}
              </div>
            </div>

            {/* Module content card */}
            <div
              className={`flex-1 rounded-xl border transition-all duration-200 ${
                isCurrent
                  ? 'bg-white border-gray-200 shadow-md'
                  : status === 'completed'
                  ? 'bg-green-50/50 border-green-200/60'
                  : 'bg-white border-gray-200/60 opacity-70'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold mb-0.5 ${
                      status === 'completed' ? 'text-green-600' : colors.text
                    }`}>
                      Module {mod.id + 1}
                    </p>
                    <h3 className={`font-bold leading-snug ${
                      isUnlocked ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      <Link
                        href={`/courses/${course.id}/modules/${mod.id}`}
                        className="hover:underline underline-offset-2"
                      >
                        {mod.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">{mod.subtitle}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-medium ${
                      status === 'completed' ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {doneLessons}/{mod.lessons.length}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                {doneLessons > 0 && (
                  <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === 'completed' ? 'bg-green-500' : colors.bg
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}

                {/* Lesson pills (collapsed view) */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {mod.lessons.map(lesson => {
                    const isLessonDone = !!completedLessons[lesson.id];
                    const isActive = lesson.id === currentLessonId;
                    return (
                      <Link
                        key={lesson.id}
                        href={`/courses/${course.id}/${lessonIdToUrl(lesson.id)}`}
                        className={`w-6 h-6 rounded-full text-[10px] font-medium flex items-center justify-center transition-all ${
                          isLessonDone
                            ? 'bg-green-500 text-white'
                            : isActive
                            ? `${colors.bg} text-white ring-2 ring-offset-1 ring-current`
                            : isUnlocked
                            ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            : 'bg-gray-100 text-gray-300'
                        }`}
                        title={lesson.title}
                      >
                        {isLessonDone ? '\u2713' : lesson.id.split('.').pop()}
                      </Link>
                    );
                  })}
                </div>

                {/* CTA */}
                {isUnlocked && (
                  <Link
                    href={`/courses/${course.id}/${lessonIdToUrl(resumeLesson.id)}`}
                    className={`inline-flex items-center gap-1.5 text-sm font-medium mt-3 px-3.5 py-1.5 rounded-lg transition-colors ${
                      status === 'completed'
                        ? 'text-green-700 bg-green-100 hover:bg-green-200'
                        : isCurrent
                        ? `text-white ${colors.btn}`
                        : `${colors.text} ${colors.light} hover:opacity-80`
                    }`}
                  >
                    {status === 'completed' ? 'Review' : doneLessons > 0 ? 'Continue' : 'Start'}
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
