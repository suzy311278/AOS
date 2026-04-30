'use client';

/**
 * EFHeroPreviewCardFlip
 *
 * Two-face flip card. Front face types a user-style question; when typing
 * completes, the card flips 3D to reveal the matching factor on the back.
 * Cycles through an array of examples, one per flip.
 */

import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Search } from 'lucide-react';

export interface FlipExample {
  question: string;
  activity: string;
  displayValue: string;
  sourceShort: string;      // e.g. "DEFRA 2025"
  scope: string;            // e.g. "Scope 2"
  methodology: string;      // e.g. "Location-based"
  vintageYear: number;
  citation: string;         // inline format, e.g. "(DEFRA, 2025)"
}

export interface EFHeroPreviewCardFlipProps {
  examples: FlipExample[];
}

type Phase = 'typing' | 'pauseAfterType' | 'flipped' | 'pauseAfterAnswer' | 'reset';

const TYPE_MS = 48;
const PAUSE_AFTER_TYPE_MS = 800;
const SHOW_ANSWER_MS = 5200;
const PAUSE_AFTER_ANSWER_MS = 500;

export function EFHeroPreviewCardFlip({ examples }: EFHeroPreviewCardFlipProps) {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [typedLen, setTypedLen] = useState(0);
  const [phase, setPhase] = useState<Phase>('typing');
  // Back face content lags one cycle behind so the face still shows the
  // previous answer while the card flips back out of view.
  const [backIdx, setBackIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = examples[exampleIdx];
  const back = examples[backIdx];

  useEffect(() => {
    function clear() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    if (phase === 'typing') {
      if (typedLen < current.question.length) {
        timerRef.current = setTimeout(() => setTypedLen((n) => n + 1), TYPE_MS);
      } else {
        setPhase('pauseAfterType');
      }
    } else if (phase === 'pauseAfterType') {
      // Update the back face to match the current question right before the flip.
      setBackIdx(exampleIdx);
      timerRef.current = setTimeout(() => setPhase('flipped'), PAUSE_AFTER_TYPE_MS);
    } else if (phase === 'flipped') {
      timerRef.current = setTimeout(() => setPhase('pauseAfterAnswer'), SHOW_ANSWER_MS);
    } else if (phase === 'pauseAfterAnswer') {
      timerRef.current = setTimeout(() => setPhase('reset'), PAUSE_AFTER_ANSWER_MS);
    } else if (phase === 'reset') {
      setExampleIdx((i) => (i + 1) % examples.length);
      setTypedLen(0);
      setPhase('typing');
    }

    return clear;
  }, [phase, typedLen, current.question.length, exampleIdx, examples.length]);

  const isFlipped = phase === 'flipped' || phase === 'pauseAfterAnswer';

  return (
    <div className="relative w-[240px]">
      {/* Soft teal halo behind the card */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 blur-3xl opacity-60"
        aria-hidden
        style={{
          background:
            'radial-gradient(60% 60% at 50% 50%, rgba(140,212,202,0.55) 0%, rgba(140,212,202,0) 70%)',
        }}
      />

      <div className="[perspective:1400px]">
        <div className="gt-card-float">
          <div
            className="relative h-[184px] w-full [transform-style:preserve-3d] transition-transform duration-[1100ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
            style={{
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* FRONT face - question typewriter */}
            <div className="absolute inset-0 rounded-xl bg-white border border-[#95D5B2]/40 shadow-gt-card-hover p-4 text-left [backface-visibility:hidden]">
              <div className="flex items-center gap-1.5 text-[10px] text-gt-text-dim">
                <Search className="h-3 w-3" strokeWidth={2} />
                <span className="uppercase tracking-[0.14em]">Ask</span>
              </div>

              <div className="mt-3 text-[13px] font-medium text-gt-text leading-snug min-h-[3.5rem]">
                {current.question.slice(0, typedLen)}
                <span
                  aria-hidden
                  className="inline-block w-[1px] h-[1em] translate-y-[2px] bg-[#2D6A4F] ml-0.5 animate-pulse"
                />
              </div>

              <div className="absolute inset-x-4 bottom-3 text-[9px] uppercase tracking-[0.14em] text-gt-text-dim">
                Greentryst emission factors
              </div>
            </div>

            {/* BACK face - factor preview */}
            <div className="absolute inset-0 rounded-xl bg-white border border-[#95D5B2]/40 shadow-gt-card-hover p-4 text-left [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div className="flex items-center gap-1 text-[10px]">
                <span className="inline-flex items-center gap-1 rounded-full bg-gt-pale px-1.5 py-0.5 font-semibold text-gt-text">
                  {back.sourceShort}
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-[#DCEEE4] px-1.5 py-0.5 text-[#2D6A4F]">
                  <BadgeCheck className="h-2.5 w-2.5" strokeWidth={2.5} />
                  Verified
                </span>
              </div>

              <h3 className="mt-2.5 text-[12px] font-semibold text-gt-text leading-tight line-clamp-2">
                {back.activity}
              </h3>

              <div
                className="mt-1.5 text-[18px] font-semibold text-[#2D6A4F] leading-tight"
                style={{ fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace' }}
              >
                {back.displayValue}
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1 text-[9px]">
                <span className="rounded-full border border-gt-border-light px-1.5 py-0.5 text-gt-text-muted">
                  {back.scope}
                </span>
                <span className="rounded-full border border-gt-border-light px-1.5 py-0.5 text-gt-text-muted">
                  {back.methodology}
                </span>
                <span className="rounded-full border border-gt-border-light px-1.5 py-0.5 text-gt-text-muted">
                  {back.vintageYear}
                </span>
              </div>

              <div className="mt-3 border-t border-gt-border-light pt-2 flex items-center justify-between gap-2">
                <span className="text-[8px] uppercase tracking-[0.14em] text-gt-text-dim whitespace-nowrap">
                  Citation
                </span>
                <span
                  className="rounded-md bg-gt-pale px-2 py-0.5 text-[10px] text-gt-text truncate"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace' }}
                >
                  {back.citation}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
