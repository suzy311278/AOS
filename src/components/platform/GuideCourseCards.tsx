import Link from 'next/link';
import type { Course } from '@/lib/types';
import { getColor } from '@/lib/colors';

interface Props {
  courses: Course[];
}

export default function GuideCourseCards({ courses }: Props) {
  if (courses.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Go deeper with our courses</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map(course => {
          const colors = getColor(course.color);
          const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
          return (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300 transition-all duration-200 no-underline"
            >
              <div className={`h-1.5 ${colors.bg}`} />
              <div className="p-4">
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${colors.light} mb-2`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors.bg}`} aria-hidden />
                  <span className={`text-xs font-medium ${colors.text}`}>{course.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{course.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{course.subtitle}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{totalLessons} lessons</span>
                  <span className="text-gray-300">|</span>
                  <span>{course.estimatedHours}h</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
