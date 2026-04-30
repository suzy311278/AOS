/**
 * CourseModuleTimeline
 *
 * Vertical timeline of modules used in the main column of the
 * course detail page. Each module renders as a node connected by a
 * thin vertical line, with a card to the right containing the
 * module heading, subtitle, and a list of clickable lesson rows.
 *
 * No progress states for v1 (per the spec). Every module renders in
 * the same neutral state. The reference design used emerald
 * "completed", blue "in progress", and gray "locked" badges; those
 * will return when auth and cloud progress are wired up.
 *
 * Each lesson row navigates to the existing production lesson
 * route at /courses/[courseId]/[lessonId] (with the dot-to-underscore
 * URL conversion handled by lessonIdToUrl).
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Module } from '@/lib/types';
import { lessonIdToUrl } from '@/lib/url-helpers';
import { cn } from '@/components/redesign/lib/cn';

export interface CourseModuleTimelineProps {
  courseId: string;
  modules: Module[];
  className?: string;
}

export function CourseModuleTimeline({
  courseId,
  modules,
  className,
}: CourseModuleTimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {modules.map((module, index) => {
        const isLast = index === modules.length - 1;
        return (
          <div key={module.id} className="relative pl-12 lg:pl-14">
            {/* Vertical connector line. Stops on the last node. */}
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[15px] lg:left-[19px] top-9 bottom-[-32px] w-[2px] bg-gt-border-light"
              />
            )}

            {/* Timeline node */}
            <div
              className="absolute left-0 top-1 w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.55)]"
              style={{
                background:
                  'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
              }}
              aria-hidden
            >
              <span
                className="text-[11px] lg:text-[12px] font-bold text-gt-leaf"
                style={{
                  fontFamily:
                    'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                }}
              >
                {String(module.id + 1).padStart(2, '0')}
              </span>
            </div>

            {/* Module card */}
            <div className="bg-white border border-gt-border-light rounded-2xl shadow-gt-card mb-8">
              {/* Card header */}
              <div className="px-7 py-6 border-b border-gt-border-light">
                <p
                  className="text-[10px] font-bold uppercase text-gt-medium mb-2"
                  style={{
                    letterSpacing: '0.18em',
                    fontFamily:
                      'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                  }}
                >
                  Module {module.id + 1}
                  <span className="mx-2 text-gt-text-dim">·</span>
                  {module.lessons.length} lessons
                </p>
                <h3 className="text-xl font-bold text-gt-text leading-snug tracking-tight mb-1">
                  {module.title}
                </h3>
                {module.subtitle && (
                  <p className="text-[14px] text-gt-text-muted leading-snug">
                    {module.subtitle}
                  </p>
                )}
              </div>

              {/* Lesson rows */}
              <ul className="divide-y divide-gt-border-light">
                {module.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                      href={`/courses/${courseId}/${lessonIdToUrl(
                        lesson.id
                      )}`}
                      className="flex items-center gap-4 px-7 py-4 transition-colors hover:bg-gt-medium/[0.04] group"
                    >
                      <span
                        className="text-[11px] text-gt-text-dim w-10 shrink-0"
                        style={{
                          fontFamily:
                            'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                        }}
                      >
                        {lesson.id}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-gt-text leading-snug group-hover:text-gt-medium transition-colors">
                          {lesson.title}
                        </p>
                        {lesson.vmRef && (
                          <p
                            className="text-[10px] text-gt-text-dim mt-1 truncate"
                            style={{
                              fontFamily:
                                'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                            }}
                          >
                            {lesson.vmRef}
                          </p>
                        )}
                      </div>
                      {typeof lesson.readingMinutes === 'number' && (
                        <span
                          className="text-[11px] text-gt-text-dim shrink-0"
                          style={{
                            fontFamily:
                              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                          }}
                        >
                          {lesson.readingMinutes} min read
                        </span>
                      )}
                      <ArrowRight
                        className="w-4 h-4 text-gt-text-dim group-hover:text-gt-medium group-hover:translate-x-0.5 transition-all shrink-0"
                        strokeWidth={2}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
