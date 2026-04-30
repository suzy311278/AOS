'use client';

import { useState, useEffect } from 'react';
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  Calculator,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/components/redesign/lib/cn';
import { RedesignButton } from '@/components/redesign';

const TAGLINES = [
  'Learn any framework.',
  'Find any answer.',
  'Run any calculation.',
  'Land any role.',
];

type Card = {
  label: string;
  Icon: LucideIcon;
  /** 'text': heading sized for prose. 'value': heading is a big value /
   *  short phrase with a caption directly beneath it. */
  variant: 'text' | 'value';
  /** Small lead-in above the heading (text variant only). */
  leadIn?: string;
  heading: string;
  /** Prose body under the heading (text variant only). */
  body?: string;
  /** Short line directly beneath the big heading (value variant only). */
  caption?: string;
  /** Mono green line in the bottom strip. */
  source: string;
};

const CARDS: Card[] = [
  {
    label: 'Learn',
    Icon: BookOpen,
    variant: 'text',
    heading: 'Scope 3 Cat. 6: Business Travel',
    body: 'Air, rail, and bus travel under operational control.',
    source: 'GHG Protocol CVC, Ch. 7, Table 7.1',
  },
  {
    label: 'SustainIQ Answer',
    Icon: Sparkles,
    variant: 'text',
    leadIn: 'What is the baseline period for VM0042?',
    heading: '10 years prior to the project start.',
    source: 'VM0042 v2.2, Sec. 3.1.2, p.14',
  },
  {
    label: 'Emission Factor',
    Icon: Calculator,
    variant: 'value',
    heading: '0.716 tCO₂/MWh',
    caption: 'Grid EF · India · Updated Mar 2024',
    source: 'CEA CO₂ Baseline Database, 2024',
  },
  {
    label: 'Career Match',
    Icon: Briefcase,
    variant: 'value',
    heading: 'Deloitte · London',
    caption: 'Senior ESG Analyst · 87% match',
    source: 'Matches your Scope 3, TCFD, and PCAF work',
  },
];

// Four stack positions arranged as a fan. Index = distance from front.
const STACK_POSITIONS = [
  { x: 0, y: -10, rotate: 0, opacity: 1, scale: 1, z: 40 },
  { x: 130, y: 16, rotate: 9, opacity: 0.85, scale: 0.92, z: 30 },
  { x: -130, y: 16, rotate: -9, opacity: 0.85, scale: 0.92, z: 30 },
  { x: 0, y: 34, rotate: -2, opacity: 0.45, scale: 0.88, z: 10 },
];

export function HeroClient() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((curr) => {
        const next = (curr + 1) % TAGLINES.length;
        setPrevIndex(curr);
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Clear the outgoing tagline after its exit animation finishes
  useEffect(() => {
    if (prevIndex === null) return;
    const t = setTimeout(() => setPrevIndex(null), 1100);
    return () => clearTimeout(t);
  }, [prevIndex, activeIndex]);

  return (
    <div className="pt-8 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      {/* Left column */}
      <div className="z-10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gt-leaf mb-6 font-bold">
          THE SUSTAINABILITY OS
        </p>

        {/* Two taglines share one grid cell during a swap: the outgoing
            one rises and blurs out, the incoming one rises from below and
            sharpens in. Container auto-sizes to the widest tagline. */}
        <style>{`
          @keyframes gt-rise-in {
            0%   { opacity: 0; transform: translateY(36px); filter: blur(16px); }
            40%  { opacity: 0.4;                                                }
            100% { opacity: 1; transform: translateY(0);    filter: blur(0);    }
          }
          @keyframes gt-rise-out {
            0%   { opacity: 1; transform: translateY(0);     filter: blur(0);    }
            60%  { opacity: 0.2;                                                 }
            100% { opacity: 0; transform: translateY(-36px); filter: blur(16px); }
          }
        `}</style>
        <div className="grid">
          {prevIndex !== null && (
            <h1
              key={`exit-${prevIndex}-${activeIndex}`}
              className="[grid-area:1/1] text-4xl md:text-5xl font-extrabold text-white leading-[1.1] tracking-tight whitespace-nowrap"
              style={{ animation: 'gt-rise-out 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards' }}
              aria-hidden
            >
              {TAGLINES[prevIndex]}
            </h1>
          )}
          <h1
            key={`enter-${activeIndex}`}
            className="[grid-area:1/1] text-4xl md:text-5xl font-extrabold text-white leading-[1.1] tracking-tight whitespace-nowrap"
            style={{ animation: 'gt-rise-in 1000ms 300ms cubic-bezier(0.4, 0, 0.2, 1) both' }}
          >
            {TAGLINES[activeIndex]}
          </h1>
        </div>

        <p className="mt-10 text-[14px] md:text-[16px] text-white/70 max-w-lg leading-relaxed">
          Stop toggling between regulation and framework PDFs, Excel
          calculation sheets, and unverified ChatGPT responses. Greentryst is
          the one tab you keep open.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <RedesignButton variant="primary" size="lg" href="/sign-up">
            Start Free
            <ArrowRight className="w-4 h-4" />
          </RedesignButton>
          <RedesignButton variant="secondary-dark" size="lg" href="/courses">
            See How It Works
          </RedesignButton>
        </div>
      </div>

      {/* Right column: three-card fan, shuffle synced to headline */}
      <div className="relative hidden lg:flex items-center justify-center lg:h-[440px]">
        <div className="relative w-[230px] h-[260px]">
          {CARDS.map((card, i) => {
            const distance = (i - activeIndex + CARDS.length) % CARDS.length;
            const pos = STACK_POSITIONS[distance];
            const isFront = distance === 0;
            return (
              <div
                key={card.label}
                className="absolute inset-0 rounded-2xl p-5 flex flex-col will-change-transform transition-all duration-[1300ms]"
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.rotate}deg) scale(${pos.scale})`,
                  opacity: pos.opacity,
                  zIndex: pos.z,
                  background: 'rgba(24, 24, 27, 0.72)',
                  backdropFilter: 'blur(16px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(140%)',
                  border: isFront
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: isFront
                    ? '0 30px 60px -20px rgba(0, 0, 0, 0.65)'
                    : '0 14px 30px -14px rgba(0, 0, 0, 0.5)',
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gt-leaf">
                    {card.label}
                  </span>
                  <card.Icon
                    className="w-4 h-4 text-gt-leaf shrink-0"
                    strokeWidth={2}
                  />
                </div>

                {card.variant === 'text' ? (
                  <>
                    {card.leadIn && (
                      <p className="text-[12px] text-white/55 leading-snug mb-2">
                        {card.leadIn}
                      </p>
                    )}
                    <p className="text-[18px] font-bold text-white leading-snug mb-3">
                      {card.heading}
                    </p>
                    {card.body && (
                      <p className="text-[13px] text-white/60 leading-relaxed flex-1">
                        {card.body}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-[24px] font-extrabold text-white leading-tight tracking-tight mb-1">
                      {card.heading}
                    </p>
                    {card.caption && (
                      <p className="text-[12px] text-white/65 leading-snug flex-1">
                        {card.caption}
                      </p>
                    )}
                  </>
                )}

                <div className="mt-auto pt-4 border-t border-white/10">
                  <p
                    className="text-[10px] text-gt-leaf/85 leading-snug"
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    {card.source}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
