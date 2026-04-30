'use client';

import { getXPProgress, getLevelTitle } from '@/lib/gamification';

interface Props {
  xp: number;
  compact?: boolean;
}

export default function XPBadge({ xp, compact = false }: Props) {
  const { level, currentXP, nextLevelXP, percent } = getXPProgress(xp);
  const title = getLevelTitle(level);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-sm" title={`${title} - ${xp} XP total`}>
        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
          {level}
        </span>
        <span className="font-semibold text-amber-700">{xp}</span>
        <span className="text-amber-500 text-xs">XP</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold text-white shadow-md">
        {level}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          <span className="text-xs text-amber-600 font-medium">{xp} XP</span>
        </div>
        <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-0.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {currentXP}/{nextLevelXP} to next level
        </p>
      </div>
    </div>
  );
}
