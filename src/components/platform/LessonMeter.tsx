'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

const COOKIE_NAME = 'sa_lessons_read';
const FREE_LIMIT = 3;

function getLessonsRead(): string[] {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
    if (!match) return [];
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return [];
  }
}

function setLessonsRead(slugs: string[]) {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const value = encodeURIComponent(JSON.stringify(slugs));
  document.cookie = `${COOKIE_NAME}=${value}; path=/; expires=${endOfMonth.toUTCString()}; SameSite=Lax`;
}

interface Props {
  lessonSlug: string;
}

export default function LessonMeter({ lessonSlug }: Props) {
  const { isSignedIn, isLoaded } = useAuth();
  const [gated, setGated] = useState(false);

  useEffect(() => {
    if (!isLoaded || isSignedIn) return;

    const read = getLessonsRead();
    if (!read.includes(lessonSlug)) {
      const updated = [...read, lessonSlug];
      setLessonsRead(updated);
      if (updated.length > FREE_LIMIT) {
        setGated(true);
      }
    } else if (read.length > FREE_LIMIT) {
      setGated(true);
    }
  }, [isLoaded, isSignedIn, lessonSlug]);

  if (!gated) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4">
      {/* Restrained wash: lets the article remain softly visible underneath */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/60 to-white/90 backdrop-blur-[3px]" />

      {/* Dark product-UI card — matches homepage dark sections */}
      <div
        className="relative w-full max-w-[420px] bg-[#0a1a1a] rounded-t-2xl sm:rounded-2xl shadow-[0_28px_80px_-24px_rgba(0,0,0,0.45)] overflow-hidden"
      >
        {/* Hairline teal accent along the top edge */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#8cd4ca] to-transparent" />

        <div className="px-7 py-7 sm:py-8">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8cd4ca]"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            Keep Reading
          </p>

          <h2 className="mt-3 text-[19px] sm:text-[20px] font-semibold text-white leading-[1.35]">
            You&apos;ve read your {FREE_LIMIT} free lessons this month.
          </h2>

          <p className="mt-3 text-[13.5px] text-white/65 leading-relaxed">
            A free account opens every lesson, tracks your progress, saves
            your quiz answers, and keeps your reading streak. No credit card.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-white hover:bg-white/90 text-[#0a1a1a] text-[13px] font-semibold rounded-md transition-colors"
            >
              Sign up free
            </Link>
            <Link
              href="/sign-in"
              className="text-[13px] font-medium text-white/60 hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
            <span className="text-white/25" aria-hidden>
              ·
            </span>
            <Link
              href="/"
              className="text-[13px] font-medium text-white/60 hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
