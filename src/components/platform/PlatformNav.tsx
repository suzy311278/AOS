'use client';

import Link from 'next/link';
import { usePlatformProgress } from '@/lib/progress-cloud';
import { useAuth, UserButton } from '@clerk/nextjs';
import SearchButton from './SearchButton';
import XPBadge from './XPBadge';
import StreakCounter from './StreakCounter';

interface Props {
  lastLessonHref?: string;
}

export default function PlatformNav({ lastLessonHref }: Props) {
  const { mounted, xp, streak } = usePlatformProgress();
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <>
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:shadow-lg focus:text-green-700 focus:font-medium focus:rounded"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold text-gray-900 hover:text-gray-600 transition-colors"
          >
            <span className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-md shadow-sm" aria-hidden />
            <span className="hidden sm:inline">Green Tryst - Sustainability Academy</span>
            <span className="sm:hidden">GT</span>
          </Link>

          {/* Search + Gamification + Nav + Actions */}
          <div className="flex items-center gap-3">
            <SearchButton />

            {mounted && xp > 0 && (
              <div className="hidden sm:block">
                <XPBadge xp={xp} compact />
              </div>
            )}

            {mounted && streak.currentStreak > 0 && (
              <div className="hidden sm:block">
                <StreakCounter streak={streak} compact />
              </div>
            )}

            {lastLessonHref && (
              <Link
                href={lastLessonHref}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm bg-green-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                </svg>
                Continue
              </Link>
            )}

            <Link
              href="/jobs"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors hidden sm:inline"
            >
              Jobs
            </Link>

            {/* Auth */}
            {isLoaded && isSignedIn && (
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors hidden sm:inline"
              >
                Dashboard
              </Link>
            )}
            {isLoaded && isSignedIn && (
              <UserButton afterSignOutUrl="/" />
            )}
            {isLoaded && !isSignedIn && (
              <Link
                href="/sign-in"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

    </>
  );
}
