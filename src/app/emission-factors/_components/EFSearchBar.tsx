'use client';

/**
 * EFSearchBar
 *
 * Input + submit button. Navigates to
 * /emission-factors/search?q=... on submit.
 * Accepts an optional initial value (for pre-filling on the results page).
 */

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { prefetchEfSearchState } from '@/lib/emission-factors/search-client';

export interface EFSearchBarProps {
  initialValue?: string;
  autoFocus?: boolean;
  placeholder?: string;
  rotatingPlaceholders?: string[];
  className?: string;
}

const DEFAULT_ROTATING_PLACEHOLDERS = [
  'UK grid electricity',
  'Natural gas combustion',
  'Diesel road transport',
  'Refrigerant R-410A',
  'Indian grid electricity',
  'USEEIO professional services',
  'Air travel long-haul economy',
];

export function EFSearchBar({
  initialValue = '',
  autoFocus = false,
  placeholder,
  rotatingPlaceholders = DEFAULT_ROTATING_PLACEHOLDERS,
  className,
}: EFSearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const phraseIdxRef = useRef(0);
  const charIdxRef = useRef(0);
  const directionRef = useRef<'typing' | 'pausing' | 'deleting'>('typing');

  // Subtle typewriter cycling through example queries.
  // Pauses while the user is typing or focused; resumes otherwise.
  useEffect(() => {
    if (placeholder !== undefined) return; // explicit placeholder wins
    if (isFocused || value.length > 0) return; // do not animate during use

    const TYPE_MS = 60;
    const DELETE_MS = 30;
    const PAUSE_MS = 1400;

    let timeout: ReturnType<typeof setTimeout>;

    function tick() {
      const phrases = rotatingPlaceholders;
      if (phrases.length === 0) return;
      const phrase = phrases[phraseIdxRef.current % phrases.length];

      if (directionRef.current === 'typing') {
        if (charIdxRef.current < phrase.length) {
          charIdxRef.current += 1;
          setAnimatedPlaceholder(phrase.slice(0, charIdxRef.current));
          timeout = setTimeout(tick, TYPE_MS);
        } else {
          directionRef.current = 'pausing';
          timeout = setTimeout(tick, PAUSE_MS);
        }
      } else if (directionRef.current === 'pausing') {
        directionRef.current = 'deleting';
        timeout = setTimeout(tick, DELETE_MS);
      } else {
        if (charIdxRef.current > 0) {
          charIdxRef.current -= 1;
          setAnimatedPlaceholder(phrase.slice(0, charIdxRef.current));
          timeout = setTimeout(tick, DELETE_MS);
        } else {
          phraseIdxRef.current = (phraseIdxRef.current + 1) % phrases.length;
          directionRef.current = 'typing';
          timeout = setTimeout(tick, TYPE_MS);
        }
      }
    }

    timeout = setTimeout(tick, 400);
    return () => clearTimeout(timeout);
  }, [placeholder, rotatingPlaceholders, isFocused, value]);

  const effectivePlaceholder =
    placeholder ?? (animatedPlaceholder ? `Try "${animatedPlaceholder}"` : 'Search emission factors');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    const target = q
      ? `/emission-factors/search?q=${encodeURIComponent(q)}`
      : `/emission-factors/search`;
    router.push(target);
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={
        'flex w-full items-center gap-2 rounded-2xl bg-white shadow-gt-card border border-gt-border-light px-4 py-3 focus-within:shadow-gt-card-hover transition-shadow ' +
        (className ?? '')
      }
    >
      <Search className="h-5 w-5 text-gt-text-dim flex-shrink-0" aria-hidden />
      <input
        type="search"
        name="q"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => {
          setIsFocused(true);
          prefetchEfSearchState();
        }}
        onBlur={() => setIsFocused(false)}
        placeholder={effectivePlaceholder}
        className="flex-1 bg-transparent outline-none text-base text-gt-text placeholder:text-gt-text-dim"
        aria-label="Search emission factors"
      />
      <button
        type="submit"
        className="rounded-full bg-[#2D6A4F] text-white text-sm font-semibold px-4 py-2 hover:bg-[#1B4332] transition-colors"
      >
        Search
      </button>
    </form>
  );
}
