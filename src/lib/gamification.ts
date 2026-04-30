'use client';

/**
 * gamification.ts — XP, levels, and streak logic.
 *
 * XP is awarded for:
 *   - Completing a lesson: 50 XP
 *   - Perfect quiz score: 25 XP bonus
 *   - Completing a module (all lessons): 100 XP bonus
 *   - Completing an entire course: 500 XP bonus
 *
 * Levels follow a gentle curve: Level N requires N * 200 XP total.
 * Streak tracks consecutive calendar days with at least one lesson completed.
 */

// ─── XP Constants ────────────────────────────────────────────────────────────

export const XP_LESSON_COMPLETE = 50;
export const XP_PERFECT_QUIZ = 25;
export const XP_MODULE_COMPLETE = 100;
export const XP_COURSE_COMPLETE = 500;

// ─── Level Calculation ───────────────────────────────────────────────────────

export function xpForLevel(level: number): number {
  return level * 200;
}

export function getLevelFromXP(xp: number): number {
  if (xp <= 0) return 1;
  let level = 1;
  let required = 0;
  while (required + xpForLevel(level + 1) <= xp) {
    required += xpForLevel(level + 1);
    level++;
  }
  return level;
}

export function getXPProgress(xp: number): { level: number; currentXP: number; nextLevelXP: number; percent: number } {
  const level = getLevelFromXP(xp);
  let spent = 0;
  for (let l = 2; l <= level; l++) {
    spent += xpForLevel(l);
  }
  const currentXP = xp - spent;
  const nextLevelXP = xpForLevel(level + 1);
  const percent = Math.min((currentXP / nextLevelXP) * 100, 100);
  return { level, currentXP, nextLevelXP, percent };
}

// ─── Streak Logic ────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export interface StreakUpdate {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string;
  isNewDay: boolean;
}

export function updateStreak(
  lastStudyDate: string | null,
  currentStreak: number,
  longestStreak: number,
): StreakUpdate {
  const today = todayStr();

  if (lastStudyDate === today) {
    return { currentStreak, longestStreak, lastStudyDate: today, isNewDay: false };
  }

  let newStreak: number;
  if (lastStudyDate === yesterdayStr()) {
    newStreak = currentStreak + 1;
  } else {
    newStreak = 1;
  }

  return {
    currentStreak: newStreak,
    longestStreak: Math.max(longestStreak, newStreak),
    lastStudyDate: today,
    isNewDay: true,
  };
}

export function isStreakActive(lastStudyDate: string | null): boolean {
  if (!lastStudyDate) return false;
  return lastStudyDate === todayStr() || lastStudyDate === yesterdayStr();
}

export function hasStudiedToday(lastStudyDate: string | null): boolean {
  return lastStudyDate === todayStr();
}

// ─── Level titles ────────────────────────────────────────────────────────────

const LEVEL_TITLES: Record<number, string> = {
  1: 'Seedling',
  2: 'Sprout',
  3: 'Sapling',
  4: 'Green Thumb',
  5: 'Conservationist',
  6: 'Steward',
  7: 'Guardian',
  8: 'Champion',
  9: 'Trailblazer',
  10: 'Visionary',
};

export function getLevelTitle(level: number): string {
  if (level >= 10) return LEVEL_TITLES[10];
  return LEVEL_TITLES[level] ?? `Level ${level}`;
}
