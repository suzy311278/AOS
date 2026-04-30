'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { Course } from '@/lib/types';
import { getColor } from '@/lib/colors';
import { lessonIdToUrl } from '@/lib/url-helpers';

interface Props {
  course: Course;
  currentLessonId: string | null;
  completedLessons: Record<string, boolean>;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ course, currentLessonId, completedLessons, isOpen, onClose }: Props) {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(() => {
    // Initially expand the module containing the current lesson
    if (!currentLessonId) return new Set([0]);
    for (const mod of course.modules) {
      if (mod.lessons.some(l => l.id === currentLessonId)) {
        return new Set([mod.id]);
      }
    }
    return new Set([0]);
  });

  const sidebarRef = useRef<HTMLElement>(null);

  // Auto-expand module when current lesson changes
  useEffect(() => {
    if (!currentLessonId) return;
    for (const mod of course.modules) {
      if (mod.lessons.some(l => l.id === currentLessonId)) {
        setExpandedModules(prev => new Set([...prev, mod.id]));
        break;
      }
    }
  }, [currentLessonId, course.modules]);

  // Focus trap for mobile overlay
  useEffect(() => {
    if (!isOpen) return;
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    const focusableSelectors = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const el = sidebar; // capture for closure — TypeScript loses narrowing inside closures
    const initial = el.querySelectorAll<HTMLElement>(focusableSelectors);
    if (initial.length > 0) initial[0].focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      // Re-query on every Tab so newly-expanded module links are included
      const focusable = el.querySelectorAll<HTMLElement>(focusableSelectors);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleModule = useCallback((moduleId: number) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }, []);

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedCount = Object.keys(completedLessons).length;

  const sidebarContent = (
    <nav
      ref={sidebarRef}
      aria-label="Course navigation"
      className="flex flex-col h-full bg-white"
    >
      {/* Course header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <Link
          href={`/courses/${course.id}`}
          className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-green-700 transition-colors"
        >
          <span className="text-xl" aria-hidden>{course.icon}</span>
          <span className="leading-tight">{course.title}</span>
        </Link>
        <p className="mt-2 text-xs text-gray-500">
          {completedCount}/{totalLessons} lessons complete
        </p>
        {/* Course progress bar */}
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden" aria-hidden>
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((completedCount / totalLessons) * 100)}%` }}
          />
        </div>
      </div>

      {/* Module list */}
      <div className="flex-1 overflow-y-auto p-2">
        {course.modules.map(mod => {
          const colors = getColor(mod.color);
          const isExpanded = expandedModules.has(mod.id);
          const moduleCompleted = mod.lessons.filter(l => completedLessons[l.id]).length;
          const controlId = `module-lessons-${mod.id}`;

          return (
            <div key={mod.id} className="mb-1">
              {/* Module header: link to module page + chevron toggle */}
              <div className="flex items-stretch rounded-lg hover:bg-gray-100 transition-colors group">
                <Link
                  href={`/courses/${course.id}/modules/${mod.id}`}
                  onClick={onClose}
                  className="flex-1 flex items-center gap-2 min-w-0 px-3 py-2.5 min-h-[44px] rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                >
                  <span className="text-base flex-shrink-0" aria-hidden>{mod.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold ${colors.text}`}>
                      Module {mod.id + 1}
                    </p>
                    <p className="text-sm font-medium text-gray-800 leading-snug">
                      {mod.title}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {moduleCompleted}/{mod.lessons.length}
                  </span>
                </Link>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={controlId}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${mod.title} lessons`}
                  onClick={() => toggleModule(mod.id)}
                  className="flex-shrink-0 px-3 flex items-center rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                >
                  <span
                    className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden
                  >
                    ▾
                  </span>
                </button>
              </div>

              {/* Lesson list */}
              <div
                id={controlId}
                hidden={!isExpanded}
                aria-label={`${mod.title} lessons`}
              >
                {mod.lessons.map(lesson => {
                  const isActive = lesson.id === currentLessonId;
                  const isCompleted = !!completedLessons[lesson.id];

                  return (
                    <Link
                      key={lesson.id}
                      href={`/courses/${course.id}/${lessonIdToUrl(lesson.id)}`}
                      onClick={onClose}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-center gap-2 px-3 py-2 min-h-[44px] mx-2 rounded-lg text-sm transition-colors mb-1 ${
                        isActive
                          ? `${colors.active} font-medium shadow-sm`
                          : isCompleted
                          ? 'text-gray-600 bg-gray-50/50 hover:bg-gray-100'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center text-xs ${
                          isCompleted
                            ? 'bg-green-500 border-green-500 text-white'
                            : isActive
                            ? `${colors.border} border-2 bg-white`
                            : 'border-gray-200 bg-gray-50'
                        }`}
                        aria-hidden
                      >
                        {isCompleted ? '✓' : ''}
                      </span>
                      <span className="leading-snug flex-1">{lesson.title}</span>
                      {lesson.readingMinutes && (
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                          {lesson.readingMinutes}m
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-80 flex-shrink-0 h-screen sticky top-0 border-r border-gray-200 overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            aria-hidden
            onClick={onClose}
          />
          {/* Drawer */}
          <aside className="relative w-72 max-w-[80vw] h-full z-50 shadow-xl">
            <div className="absolute top-3 right-3">
              <button
                onClick={onClose}
                aria-label="Close navigation"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                ✕
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
