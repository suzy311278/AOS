'use client';

import { isStreakActive, hasStudiedToday } from '@/lib/gamification';
import type { StreakData } from '@/lib/types';

interface Props {
  streak: StreakData;
  compact?: boolean;
}

export default function StreakCounter({ streak, compact = false }: Props) {
  const active = isStreakActive(streak.lastStudyDate);
  const studiedToday = hasStudiedToday(streak.lastStudyDate);

  if (compact) {
    return (
      <div
        className="flex items-center gap-1 text-sm"
        title={
          studiedToday
            ? `${streak.currentStreak}-day streak! You've studied today.`
            : active
            ? `${streak.currentStreak}-day streak. Study today to keep it going!`
            : 'Start a streak by studying today!'
        }
      >
        <span className={`text-base ${active ? 'animate-pulse-subtle' : 'opacity-40 grayscale'}`}>
          {active ? '\uD83D\uDD25' : '\uD83D\uDD25'}
        </span>
        <span className={`font-semibold ${active ? 'text-orange-600' : 'text-gray-400'}`}>
          {streak.currentStreak}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
          active ? 'bg-orange-100' : 'bg-gray-100'
        }`}
      >
        {active ? '\uD83D\uDD25' : '\uD83D\uDD25'}
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-semibold ${active ? 'text-gray-800' : 'text-gray-500'}`}>
            {streak.currentStreak}-day streak
          </span>
          {studiedToday && (
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
              today
            </span>
          )}
        </div>
        {!studiedToday && active && (
          <p className="text-[10px] text-orange-500 mt-0.5">Study today to keep your streak!</p>
        )}
        {!active && streak.longestStreak > 0 && (
          <p className="text-[10px] text-gray-400 mt-0.5">Best: {streak.longestStreak} days</p>
        )}
      </div>
    </div>
  );
}
