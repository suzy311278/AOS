'use client';

/**
 * progress.ts — localStorage-backed progress hooks with hydration safety.
 *
 * localStorage is client-only; Next.js SSG renders on the server.
 * All hooks defer reading until after mount to prevent hydration mismatches.
 *
 * Storage key: "sustainability_academy"
 * Schema version: 2
 */

import { useState, useEffect, useCallback } from 'react';
import type { PlatformProgress, CourseProgress, QuizState, StreakData } from './types';
import {
  XP_LESSON_COMPLETE,
  XP_PERFECT_QUIZ,
  XP_MODULE_COMPLETE,
  XP_COURSE_COMPLETE,
  updateStreak,
} from './gamification';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sustainability_academy';
const SCHEMA_VERSION = 2;

// Legacy keys from the single-file app (v1)
const LEGACY_PROGRESS_KEY = 'vm0042_progress';
const LEGACY_QUIZ_PREFIX = 'vm0042_quiz_';

// ─── Defaults ─────────────────────────────────────────────────────────────────

function emptyProgress(): PlatformProgress {
  return { version: 2, courses: {} };
}

function emptyCourseProgress(): CourseProgress {
  return {
    startedAt: Date.now(),
    lastAccessedAt: Date.now(),
    lastAccessedLesson: null,
    completedLessons: {},
    quizzes: {},
  };
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadPlatformProgress(): PlatformProgress {
  if (typeof window === 'undefined') return emptyProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlatformProgress;
      if (parsed.version === SCHEMA_VERSION) return parsed;
    }
    // Migrate legacy keys if present
    return migrateLegacy();
  } catch {
    return emptyProgress();
  }
}

function savePlatformProgress(progress: PlatformProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage errors (e.g., private browsing)
  }
}

function migrateLegacy(): PlatformProgress {
  const platform = emptyProgress();
  try {
    const legacyCompleted = localStorage.getItem(LEGACY_PROGRESS_KEY);
    if (!legacyCompleted) return platform;

    const completedLessons: Record<string, number> = {};
    const parsed = JSON.parse(legacyCompleted) as Record<string, boolean>;
    const now = Date.now();
    for (const [lessonId, done] of Object.entries(parsed)) {
      if (done) completedLessons[lessonId] = now;
    }

    const quizzes: Record<string, QuizState> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LEGACY_QUIZ_PREFIX)) {
        const lessonId = key.slice(LEGACY_QUIZ_PREFIX.length);
        try {
          const quizRaw = localStorage.getItem(key);
          if (quizRaw) {
            const quizData = JSON.parse(quizRaw) as { answers?: Record<number, number>; submitted?: Record<number, boolean> };
            quizzes[lessonId] = {
              answers: quizData.answers ?? {},
              multiSelectAnswers: {},
              matchingAnswers: {},
              submitted: quizData.submitted ?? {},
            };
          }
        } catch { /* skip */ }
      }
    }

    platform.courses['vm0042'] = {
      startedAt: now,
      lastAccessedAt: now,
      lastAccessedLesson: null,
      completedLessons,
      quizzes,
    };

    // Save migrated data and remove legacy keys
    savePlatformProgress(platform);
    localStorage.removeItem(LEGACY_PROGRESS_KEY);
    const legacyQuizKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LEGACY_QUIZ_PREFIX)) legacyQuizKeys.push(key);
    }
    legacyQuizKeys.forEach(k => localStorage.removeItem(k));
  } catch { /* ignore migration errors */ }
  return platform;
}

// ─── useProgress hook ─────────────────────────────────────────────────────────

export function useProgress(courseId: string) {
  const [mounted, setMounted] = useState(false);
  const [platform, setPlatform] = useState<PlatformProgress>(emptyProgress);

  useEffect(() => {
    const loaded = loadPlatformProgress();
    setPlatform(loaded);
    setMounted(true);

    // Multi-tab sync: reload state if another tab writes to localStorage
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setPlatform(loadPlatformProgress());
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const getCourseProgress = useCallback((): CourseProgress => {
    return platform.courses[courseId] ?? emptyCourseProgress();
  }, [platform, courseId]);

  const updateCourse = useCallback((updater: (cp: CourseProgress) => CourseProgress) => {
    setPlatform(prev => {
      const existing = prev.courses[courseId] ?? emptyCourseProgress();
      const updated: PlatformProgress = {
        ...prev,
        courses: {
          ...prev.courses,
          [courseId]: updater(existing),
        },
      };
      savePlatformProgress(updated);
      return updated;
    });
  }, [courseId]);

  const updatePlatformData = useCallback((updater: (p: PlatformProgress) => PlatformProgress) => {
    setPlatform(prev => {
      const updated = updater(prev);
      savePlatformProgress(updated);
      return updated;
    });
  }, []);

  // Return safe defaults until mounted
  if (!mounted) {
    return {
      mounted: false,
      isCompleted: () => false,
      markComplete: () => ({ xpAwarded: 0, streakUpdated: false }),
      completedCount: 0,
      totalLessons: 0,
      percentComplete: 0,
      getQuizState: () => ({ answers: {}, multiSelectAnswers: {}, matchingAnswers: {}, submitted: {} }),
      saveAnswer: () => {},
      saveMultiSelectAnswer: () => {},
      saveMatchingAnswer: () => {},
      submitAnswer: () => {},
      lastAccessedLesson: null,
      setLastAccessed: () => {},
      getScrollPosition: () => 0,
      saveScrollPosition: () => {},
      clearScrollPosition: () => {},
      resetCourse: () => {},
      resetQuiz: () => {},
      addXP: () => {},
      xp: 0,
      streak: { currentStreak: 0, longestStreak: 0, lastStudyDate: null } as StreakData,
    };
  }

  const cp = getCourseProgress();

  return {
    mounted: true,

    isCompleted(lessonId: string): boolean {
      return !!cp.completedLessons[lessonId];
    },

    markComplete(lessonId: string): { xpAwarded: number; streakUpdated: boolean } {
      // Skip if already completed
      if (cp.completedLessons[lessonId]) {
        return { xpAwarded: 0, streakUpdated: false };
      }

      let xpGained = XP_LESSON_COMPLETE;

      updateCourse(prev => ({
        ...prev,
        lastAccessedAt: Date.now(),
        completedLessons: {
          ...prev.completedLessons,
          [lessonId]: Date.now(),
        },
      }));

      // Update XP and streak at platform level
      const streak = platform.streak ?? { currentStreak: 0, longestStreak: 0, lastStudyDate: null };
      const streakResult = updateStreak(streak.lastStudyDate, streak.currentStreak, streak.longestStreak);

      updatePlatformData(prev => ({
        ...prev,
        xp: (prev.xp ?? 0) + xpGained,
        streak: {
          currentStreak: streakResult.currentStreak,
          longestStreak: streakResult.longestStreak,
          lastStudyDate: streakResult.lastStudyDate,
        },
      }));

      return { xpAwarded: xpGained, streakUpdated: streakResult.isNewDay };
    },

    completedCount: Object.keys(cp.completedLessons).length,
    totalLessons: 0, // caller passes total from course data

    percentComplete: 0, // computed by caller with totalLessons

    getQuizState(lessonId: string): QuizState {
      return cp.quizzes[lessonId] ?? { answers: {}, multiSelectAnswers: {}, matchingAnswers: {}, submitted: {} };
    },

    saveAnswer(lessonId: string, qIndex: number, answer: number): void {
      updateCourse(prev => ({
        ...prev,
        quizzes: {
          ...prev.quizzes,
          [lessonId]: {
            ...(prev.quizzes[lessonId] ?? { answers: {}, multiSelectAnswers: {}, matchingAnswers: {}, submitted: {} }),
            answers: {
              ...(prev.quizzes[lessonId]?.answers ?? {}),
              [qIndex]: answer,
            },
          },
        },
      }));
    },

    saveMultiSelectAnswer(lessonId: string, qIndex: number, selected: number[]): void {
      updateCourse(prev => ({
        ...prev,
        quizzes: {
          ...prev.quizzes,
          [lessonId]: {
            ...(prev.quizzes[lessonId] ?? { answers: {}, multiSelectAnswers: {}, matchingAnswers: {}, submitted: {} }),
            multiSelectAnswers: {
              ...(prev.quizzes[lessonId]?.multiSelectAnswers ?? {}),
              [qIndex]: selected,
            },
          },
        },
      }));
    },

    saveMatchingAnswer(lessonId: string, qIndex: number, mapping: number[]): void {
      updateCourse(prev => ({
        ...prev,
        quizzes: {
          ...prev.quizzes,
          [lessonId]: {
            ...(prev.quizzes[lessonId] ?? { answers: {}, multiSelectAnswers: {}, matchingAnswers: {}, submitted: {} }),
            matchingAnswers: {
              ...(prev.quizzes[lessonId]?.matchingAnswers ?? {}),
              [qIndex]: mapping,
            },
          },
        },
      }));
    },

    submitAnswer(lessonId: string, qIndex: number): void {
      updateCourse(prev => ({
        ...prev,
        quizzes: {
          ...prev.quizzes,
          [lessonId]: {
            ...(prev.quizzes[lessonId] ?? { answers: {}, multiSelectAnswers: {}, matchingAnswers: {}, submitted: {} }),
            submitted: {
              ...(prev.quizzes[lessonId]?.submitted ?? {}),
              [qIndex]: true,
            },
          },
        },
      }));
    },

    lastAccessedLesson: cp.lastAccessedLesson,

    setLastAccessed(lessonId: string): void {
      updateCourse(prev => ({
        ...prev,
        lastAccessedAt: Date.now(),
        lastAccessedLesson: lessonId,
      }));
    },

    getScrollPosition(lessonId: string): number {
      return cp.scrollPositions?.[lessonId] ?? 0;
    },

    saveScrollPosition(lessonId: string, y: number): void {
      updateCourse(prev => ({
        ...prev,
        scrollPositions: {
          ...(prev.scrollPositions ?? {}),
          [lessonId]: y,
        },
      }));
    },

    clearScrollPosition(lessonId: string): void {
      updateCourse(prev => {
        const positions = { ...(prev.scrollPositions ?? {}) };
        delete positions[lessonId];
        return { ...prev, scrollPositions: positions };
      });
    },

    resetCourse(): void {
      updateCourse(() => emptyCourseProgress());
    },

    resetQuiz(lessonId: string): void {
      updateCourse(prev => {
        const quizzes = { ...prev.quizzes };
        delete quizzes[lessonId];
        return { ...prev, quizzes };
      });
    },

    addXP(amount: number): void {
      updatePlatformData(prev => ({
        ...prev,
        xp: (prev.xp ?? 0) + amount,
      }));
    },

    xp: platform.xp ?? 0,
    streak: platform.streak ?? { currentStreak: 0, longestStreak: 0, lastStudyDate: null },
  };
}

// ─── usePlatformProgress hook ─────────────────────────────────────────────────

export function usePlatformProgress() {
  const [mounted, setMounted] = useState(false);
  const [platform, setPlatform] = useState<PlatformProgress>(emptyProgress);

  useEffect(() => {
    setPlatform(loadPlatformProgress());
    setMounted(true);
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setPlatform(loadPlatformProgress());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (!mounted) {
    return {
      mounted: false,
      coursesStarted: [] as string[],
      getCourseProgress: (_courseId: string) => null as CourseProgress | null,
      overallStats: { coursesStarted: 0, totalLessonsCompleted: 0, totalLessons: 0 },
      lastAccessedCourse: null as string | null,
      xp: 0,
      streak: { currentStreak: 0, longestStreak: 0, lastStudyDate: null } as StreakData,
    };
  }

  const coursesStarted = Object.keys(platform.courses);

  return {
    mounted: true,
    coursesStarted: coursesStarted as string[],
    getCourseProgress(courseId: string): CourseProgress | null {
      return platform.courses[courseId] ?? null;
    },
    lastAccessedCourse: coursesStarted.reduce<string | null>((best, id) => {
      const cp = platform.courses[id];
      if (!best) return id;
      const bestAt = platform.courses[best]?.lastAccessedAt ?? 0;
      return cp.lastAccessedAt > bestAt ? id : best;
    }, null),
    xp: platform.xp ?? 0,
    streak: platform.streak ?? { currentStreak: 0, longestStreak: 0, lastStudyDate: null },
  };
}
