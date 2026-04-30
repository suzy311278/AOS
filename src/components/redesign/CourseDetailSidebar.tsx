/**
 * CourseDetailSidebar
 *
 * Persistent left sidebar on /redesign/courses/[courseId]. Shows the
 * course title at the top, then a collapsible list of modules with
 * their lessons. Each module can be expanded or collapsed; clicking
 * a lesson navigates to /courses/[courseId]/[lessonId] (the existing
 * production lesson route).
 *
 * No per-lesson progress states for v1. The reference design used
 * check_circle / play_circle / lock icons to show completed, current,
 * and locked lessons. Auth + cloud progress is deferred to a later
 * phase, so for now every lesson renders in the same neutral state.
 *
 * The first module is expanded by default; the rest start collapsed
 * so a course with 8+ modules does not flood the sidebar on load.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, BookOpen, Check, PlayCircle } from 'lucide-react';
import type { Module } from '@/lib/types';
import { lessonIdToUrl, urlToLessonId } from '@/lib/url-helpers';
import { COURSE_ICON_MAP } from '@/components/redesign/CourseRow';
import { cn } from '@/components/redesign/lib/cn';
import { useProgress } from '@/lib/progress-cloud';

export interface CourseDetailSidebarProps {
  courseId: string;
  courseTitle: string;
  category: string;
  modules: Module[];
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  fundamentals: 'Fundamentals',
  esg: 'ESG',
  markets: 'Carbon Markets',
  'green-finance': 'Green Finance',
  'sustainability-standards': 'Standards',
  methodologies: 'Methodologies',
};

export function CourseDetailSidebar({
  courseId,
  courseTitle,
  category,
  modules,
  className,
}: CourseDetailSidebarProps) {
  const Icon = COURSE_ICON_MAP[courseId] ?? BookOpen;
  const progress = useProgress(courseId);
  const pathname = usePathname();

  // Derive the currently-open lesson from the URL so we can render a
  // "play" indicator distinct from completed ones.
  const currentLessonId = (() => {
    if (!pathname) return null;
    const m = pathname.match(/\/courses\/[^/]+\/([^/?#]+)/);
    return m ? urlToLessonId(m[1]) : null;
  })();

  // First module expanded by default; subsequent modules collapsed
  // so courses with many modules do not overwhelm the rail.
  const [expandedIds, setExpandedIds] = useState<Set<number>>(
    () => new Set(modules.length > 0 ? [modules[0].id] : [])
  );

  const toggleModule = (moduleId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const categoryLabel = CATEGORY_LABELS[category] ?? category;

  return (
    <aside
      className={cn(
        'flex flex-col bg-white border-r border-gt-border-light',
        className
      )}
    >
      {/* Course header inside the sidebar */}
      <div className="p-6 border-b border-gt-border-light">
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.55)]"
            style={{
              background:
                'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
            }}
            aria-hidden
          >
            <Icon className="w-5 h-5 text-gt-leaf" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p
              className="text-[10px] font-bold uppercase text-gt-medium mb-1"
              style={{
                letterSpacing: '0.16em',
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
            >
              {categoryLabel}
            </p>
            <Link
              href={`/courses/${courseId}`}
              className="block text-[14px] font-bold text-gt-text leading-snug hover:text-gt-medium transition-colors"
            >
              {courseTitle}
            </Link>
          </div>
        </div>
      </div>

      {/* Module list */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {modules.map((module) => {
          const isExpanded = expandedIds.has(module.id);
          return (
            <div key={module.id} className="mb-1">
              <button
                type="button"
                onClick={() => toggleModule(module.id)}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left hover:bg-gt-medium/[0.05] transition-colors group"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="text-[10px] font-bold text-gt-text-dim w-5 shrink-0"
                    style={{
                      fontFamily:
                        'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    }}
                  >
                    {String(module.id + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[13px] font-semibold text-gt-text leading-snug">
                    {module.title}
                  </span>
                </span>
                <ChevronRight
                  className={cn(
                    'w-4 h-4 text-gt-text-dim flex-shrink-0 transition-transform',
                    isExpanded ? 'rotate-90' : ''
                  )}
                  strokeWidth={2}
                />
              </button>

              {isExpanded && (
                <ul className="pl-8 pr-2 pt-1 pb-2 space-y-0.5">
                  {module.lessons.map((lesson) => {
                    const done = progress.isCompleted(lesson.id);
                    const current = currentLessonId === lesson.id;
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/courses/${courseId}/${lessonIdToUrl(
                            lesson.id
                          )}`}
                          aria-current={current ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-colors',
                            current
                              ? 'bg-gt-medium/[0.08] text-gt-medium font-semibold'
                              : done
                                ? 'text-gt-text hover:text-gt-text hover:bg-gt-medium/[0.04]'
                                : 'text-gt-text-muted hover:text-gt-text hover:bg-gt-medium/[0.04]'
                          )}
                        >
                          <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                            {done ? (
                              <Check
                                className="w-3.5 h-3.5 text-gt-medium"
                                strokeWidth={2.5}
                              />
                            ) : current ? (
                              <PlayCircle
                                className="w-3.5 h-3.5 text-gt-medium"
                                strokeWidth={2}
                              />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-gt-text-dim/40" aria-hidden />
                            )}
                          </span>
                          <span
                            className="text-gt-text-dim w-7 shrink-0 text-[10px]"
                            style={{
                              fontFamily:
                                'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                            }}
                          >
                            {lesson.id}
                          </span>
                          <span className="leading-snug line-clamp-2">
                            {lesson.title}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
