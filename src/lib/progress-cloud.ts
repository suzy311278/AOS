'use client';

/**
 * progress-cloud.ts — Cloud-first progress hooks.
 *
 * Signed-in users: reads from localStorage cache for instant render,
 * reconciles with cloud API, writes optimistically to state + cache + API.
 * Anonymous users: falls back to localStorage-only (original progress.ts logic).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import type { CourseProgress, QuizState, StreakData } from './types';
import {
  XP_LESSON_COMPLETE,
  updateStreak,
} from './gamification';

// Re-export for consumers that import from this module
export type { CourseProgress, QuizState, StreakData };

// ─── localStorage cache helpers ──────────────────────────────────────────────

const STORAGE_KEY = 'sustainability_academy';
const SCHEMA_VERSION = 2;

interface CachedPlatform {
  version: 2;
  courses: Record<string, CourseProgress>;
  xp?: number;
  streak?: StreakData;
}

function loadCache(): CachedPlatform {
  if (typeof window === 'undefined') return { version: 2, courses: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === SCHEMA_VERSION) return parsed;
    }
  } catch {}
  return { version: 2, courses: {} };
}

function saveCache(data: CachedPlatform) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
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

const emptyQuizState: QuizState = { answers: {}, multiSelectAnswers: {}, matchingAnswers: {}, submitted: {} };
const emptyStreak: StreakData = { currentStreak: 0, longestStreak: 0, lastStudyDate: null };

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function apiPost(url: string, body: unknown) {
  return apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ─── useProgress hook (cloud-first) ──────────────────────────────────────────

export function useProgress(courseId: string) {
  const { isSignedIn, isLoaded } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [courseProgress, setCourseProgress] = useState<CourseProgress>(emptyCourseProgress);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState<StreakData>(emptyStreak);
  const courseProgressRef = useRef(courseProgress);
  courseProgressRef.current = courseProgress;

  // Load from cache immediately, then reconcile with cloud
  useEffect(() => {
    const cache = loadCache();
    const cached = cache.courses[courseId];
    if (cached) setCourseProgress(cached);
    setXp(cache.xp ?? 0);
    setStreak(cache.streak ?? emptyStreak);
    setMounted(true);

    if (!isLoaded || !isSignedIn) return;

    // Fetch cloud data and reconcile
    apiFetch(`/api/progress/${courseId}`)
      .then((data: { enrollment: any; completions: any[]; quizzes: any[] }) => {
        if (!data.enrollment) return;

        const completedLessons: Record<string, number> = {};
        for (const c of data.completions) {
          completedLessons[c.lessonId] = new Date(c.completedAt).getTime();
        }

        const quizzes: Record<string, QuizState> = {};
        for (const q of data.quizzes) {
          if (!quizzes[q.lessonId]) {
            quizzes[q.lessonId] = { answers: {}, multiSelectAnswers: {}, matchingAnswers: {}, submitted: {} };
          }
          const qs = quizzes[q.lessonId];
          if (q.selected !== null) qs.answers[q.questionIdx] = q.selected;
          if (q.multiSelected) qs.multiSelectAnswers[q.questionIdx] = JSON.parse(q.multiSelected);
          if (q.matching) qs.matchingAnswers[q.questionIdx] = JSON.parse(q.matching);
          if (q.submitted) qs.submitted[q.questionIdx] = true;
        }

        const cloudProgress: CourseProgress = {
          startedAt: new Date(data.enrollment.startedAt).getTime(),
          lastAccessedAt: new Date(data.enrollment.lastAccessedAt).getTime(),
          lastAccessedLesson: data.enrollment.lastLesson,
          completedLessons,
          quizzes,
          scrollPositions: cached?.scrollPositions,
        };

        setCourseProgress(cloudProgress);

        // Update cache
        const freshCache = loadCache();
        freshCache.courses[courseId] = cloudProgress;
        saveCache(freshCache);
      })
      .catch(() => {});
  }, [courseId, isSignedIn, isLoaded]);

  const updateLocal = useCallback((updater: (cp: CourseProgress) => CourseProgress) => {
    setCourseProgress(prev => {
      const updated = updater(prev);
      const cache = loadCache();
      cache.courses[courseId] = updated;
      saveCache(cache);
      return updated;
    });
  }, [courseId]);

  if (!mounted) {
    return {
      mounted: false,
      isCompleted: () => false,
      markComplete: () => ({ xpAwarded: 0, streakUpdated: false }),
      completedCount: 0,
      totalLessons: 0,
      percentComplete: 0,
      getQuizState: () => emptyQuizState,
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
      streak: emptyStreak,
    };
  }

  return {
    mounted: true,

    isCompleted(lessonId: string): boolean {
      return !!courseProgress.completedLessons[lessonId];
    },

    markComplete(lessonId: string): { xpAwarded: number; streakUpdated: boolean } {
      if (courseProgress.completedLessons[lessonId]) {
        return { xpAwarded: 0, streakUpdated: false };
      }

      const xpGained = XP_LESSON_COMPLETE;

      // Optimistic local update
      updateLocal(prev => ({
        ...prev,
        lastAccessedAt: Date.now(),
        completedLessons: { ...prev.completedLessons, [lessonId]: Date.now() },
      }));

      const streakResult = updateStreak(streak.lastStudyDate, streak.currentStreak, streak.longestStreak);
      const newStreak = {
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        lastStudyDate: streakResult.lastStudyDate,
      };

      setXp(prev => prev + xpGained);
      setStreak(newStreak);

      // Update platform-level cache
      const cache = loadCache();
      cache.xp = (cache.xp ?? 0) + xpGained;
      cache.streak = newStreak;
      saveCache(cache);

      // Fire API call if signed in
      if (isSignedIn) {
        apiPost('/api/progress/lesson-complete', { courseId, lessonId }).catch(() => {});
      }

      return { xpAwarded: xpGained, streakUpdated: streakResult.isNewDay };
    },

    completedCount: Object.keys(courseProgress.completedLessons).length,
    totalLessons: 0,
    percentComplete: 0,

    getQuizState(lessonId: string): QuizState {
      return courseProgress.quizzes[lessonId] ?? emptyQuizState;
    },

    saveAnswer(lessonId: string, qIndex: number, answer: number): void {
      updateLocal(prev => ({
        ...prev,
        quizzes: {
          ...prev.quizzes,
          [lessonId]: {
            ...(prev.quizzes[lessonId] ?? emptyQuizState),
            answers: { ...(prev.quizzes[lessonId]?.answers ?? {}), [qIndex]: answer },
          },
        },
      }));

      if (isSignedIn) {
        apiPost('/api/progress/quiz-answer', {
          courseId, lessonId, questionIdx: qIndex,
          selected: answer, submitted: false,
        }).catch(() => {});
      }
    },

    saveMultiSelectAnswer(lessonId: string, qIndex: number, selected: number[]): void {
      updateLocal(prev => ({
        ...prev,
        quizzes: {
          ...prev.quizzes,
          [lessonId]: {
            ...(prev.quizzes[lessonId] ?? emptyQuizState),
            multiSelectAnswers: { ...(prev.quizzes[lessonId]?.multiSelectAnswers ?? {}), [qIndex]: selected },
          },
        },
      }));

      if (isSignedIn) {
        apiPost('/api/progress/quiz-answer', {
          courseId, lessonId, questionIdx: qIndex,
          multiSelected: selected, submitted: false,
        }).catch(() => {});
      }
    },

    saveMatchingAnswer(lessonId: string, qIndex: number, mapping: number[]): void {
      updateLocal(prev => ({
        ...prev,
        quizzes: {
          ...prev.quizzes,
          [lessonId]: {
            ...(prev.quizzes[lessonId] ?? emptyQuizState),
            matchingAnswers: { ...(prev.quizzes[lessonId]?.matchingAnswers ?? {}), [qIndex]: mapping },
          },
        },
      }));

      if (isSignedIn) {
        apiPost('/api/progress/quiz-answer', {
          courseId, lessonId, questionIdx: qIndex,
          matching: Object.fromEntries(mapping.map((v, i) => [String(i), String(v)])),
          submitted: false,
        }).catch(() => {});
      }
    },

    submitAnswer(lessonId: string, qIndex: number): void {
      const qs = courseProgress.quizzes[lessonId] ?? emptyQuizState;
      updateLocal(prev => ({
        ...prev,
        quizzes: {
          ...prev.quizzes,
          [lessonId]: {
            ...(prev.quizzes[lessonId] ?? emptyQuizState),
            submitted: { ...(prev.quizzes[lessonId]?.submitted ?? {}), [qIndex]: true },
          },
        },
      }));

      if (isSignedIn) {
        apiPost('/api/progress/quiz-answer', {
          courseId, lessonId, questionIdx: qIndex,
          selected: qs.answers[qIndex] ?? null,
          multiSelected: qs.multiSelectAnswers[qIndex] ?? null,
          matching: qs.matchingAnswers[qIndex]
            ? Object.fromEntries(qs.matchingAnswers[qIndex].map((v, i) => [String(i), String(v)]))
            : null,
          submitted: true,
        }).catch(() => {});
      }
    },

    lastAccessedLesson: courseProgress.lastAccessedLesson,

    setLastAccessed(lessonId: string): void {
      updateLocal(prev => ({
        ...prev,
        lastAccessedAt: Date.now(),
        lastAccessedLesson: lessonId,
      }));
    },

    // Scroll positions stay localStorage-only
    getScrollPosition(lessonId: string): number {
      return courseProgress.scrollPositions?.[lessonId] ?? 0;
    },

    saveScrollPosition(lessonId: string, y: number): void {
      updateLocal(prev => ({
        ...prev,
        scrollPositions: { ...(prev.scrollPositions ?? {}), [lessonId]: y },
      }));
    },

    clearScrollPosition(lessonId: string): void {
      updateLocal(prev => {
        const positions = { ...(prev.scrollPositions ?? {}) };
        delete positions[lessonId];
        return { ...prev, scrollPositions: positions };
      });
    },

    resetCourse(): void {
      updateLocal(() => emptyCourseProgress());
    },

    resetQuiz(lessonId: string): void {
      updateLocal(prev => {
        const quizzes = { ...prev.quizzes };
        delete quizzes[lessonId];
        return { ...prev, quizzes };
      });
    },

    addXP(amount: number): void {
      setXp(prev => {
        const newXp = prev + amount;
        const cache = loadCache();
        cache.xp = newXp;
        saveCache(cache);
        return newXp;
      });
    },

    xp,
    streak,
  };
}

// ─── usePlatformProgress hook (cloud-first) ──────────────────────────────────

export function usePlatformProgress() {
  const { isSignedIn, isLoaded } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [cache, setCache] = useState<CachedPlatform>({ version: 2, courses: {} });

  useEffect(() => {
    const loaded = loadCache();
    setCache(loaded);
    setMounted(true);

    if (!isLoaded || !isSignedIn) return;

    // Fetch enrolled courses from cloud
    apiFetch('/api/progress')
      .then((rows: Array<{ courseId: string; startedAt: any; lastLesson: string | null; lastAccessedAt: any; completedCount: number }>) => {
        if (rows.length === 0) return;

        setCache(prev => {
          const updated = { ...prev, courses: { ...prev.courses } };
          for (const row of rows) {
            const existing = updated.courses[row.courseId] ?? emptyCourseProgress();
            updated.courses[row.courseId] = {
              ...existing,
              startedAt: new Date(row.startedAt).getTime(),
              lastAccessedAt: new Date(row.lastAccessedAt).getTime(),
              lastAccessedLesson: row.lastLesson,
            };
          }
          saveCache(updated);
          return updated;
        });
      })
      .catch(() => {});
  }, [isSignedIn, isLoaded]);

  if (!mounted) {
    return {
      mounted: false,
      coursesStarted: [] as string[],
      getCourseProgress: (_courseId: string) => null as CourseProgress | null,
      overallStats: { coursesStarted: 0, totalLessonsCompleted: 0, totalLessons: 0 },
      lastAccessedCourse: null as string | null,
      xp: 0,
      streak: emptyStreak,
    };
  }

  const coursesStarted = Object.keys(cache.courses);

  return {
    mounted: true,
    coursesStarted,
    getCourseProgress(courseId: string): CourseProgress | null {
      return cache.courses[courseId] ?? null;
    },
    lastAccessedCourse: coursesStarted.reduce<string | null>((best, id) => {
      const cp = cache.courses[id];
      if (!best) return id;
      const bestAt = cache.courses[best]?.lastAccessedAt ?? 0;
      return cp.lastAccessedAt > bestAt ? id : best;
    }, null),
    xp: cache.xp ?? 0,
    streak: cache.streak ?? emptyStreak,
  };
}
