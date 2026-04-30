/**
 * LearningPathShowcase
 *
 * The Learning Paths section on /redesign/courses. A single canvas
 * that auto-swaps between curated paths. Layout:
 *
 *   1. A horizontal row of role tabs at the top (one per path).
 *      The active tab is highlighted in brand green and auto-rotates
 *      every 5 seconds. Clicking a tab jumps to that path and locks
 *      auto-advance for 15 seconds.
 *   2. A single full-width canvas below the tabs. Inside the canvas
 *      is the original two-column layout: left text (role label,
 *      headline, three outcome bullets, total stat, Start path
 *      link), right winding path with 5 dark-forest milestone tiles
 *      and a brand-green destination tile.
 *
 * Mouse over the section pauses auto-advance. All paths share the
 * brand-green palette; differentiation comes from role labels,
 * icons, and milestone composition.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Calculator,
  FileText,
  LineChart,
  Banknote,
  type LucideIcon,
} from 'lucide-react';
import { COURSE_ICON_MAP } from '@/components/redesign/CourseRow';
import { cn } from '@/components/redesign/lib/cn';

/**
 * Role icon registry. The page (a server component) cannot pass
 * function/component values across the server→client boundary, so it
 * passes a string key instead and we resolve the actual Lucide
 * component here.
 */
const ROLE_ICONS = {
  calculator: Calculator,
  'file-text': FileText,
  'line-chart': LineChart,
  banknote: Banknote,
} as const satisfies Record<string, LucideIcon>;

export type LearningPathRoleIcon = keyof typeof ROLE_ICONS;

const AUTO_ADVANCE_INTERVAL = 5000;
const STICKY_DURATION = 15000;

export interface LearningPathShowcaseStep {
  courseId: string;
  title: string;
  hours: number;
}

export interface LearningPathShowcasePath {
  /** Stable identifier */
  id: string;
  /** Eyebrow label, e.g. "FOR THE CARBON ANALYST" */
  role: string;
  /** Short label used in the left nav, e.g. "Carbon Analyst" */
  navLabel: string;
  /** Path headline shown in the canvas */
  title: string;
  /** Three outcome bullets shown beneath the headline */
  outcomes: string[];
  /** Exactly five course steps (the canvas is tuned for 5 milestones) */
  steps: LearningPathShowcaseStep[];
  /**
   * Icon key used to look up the Lucide component inside the client.
   * String (not a component) so the page can pass it across the
   * server→client boundary.
   */
  iconName: LearningPathRoleIcon;
}

export interface LearningPathShowcaseProps {
  paths: LearningPathShowcasePath[];
  className?: string;
}

/**
 * Hard-coded milestone positions inside the canvas. Five points form
 * a gentle S-curve. Labels alternate above and below to avoid
 * collisions when course titles wrap.
 */
const MILESTONE_POSITIONS: Array<{
  x: number;
  y: number;
  labelAbove: boolean;
}> = [
  { x: 12, y: 58, labelAbove: false },
  { x: 28, y: 30, labelAbove: true  },
  { x: 44, y: 65, labelAbove: false },
  { x: 60, y: 32, labelAbove: true  },
  { x: 76, y: 60, labelAbove: false },
];

/**
 * Single SVG path that traces the 5 milestone positions and ends at
 * the destination tile. Drawn as a sequence of cubic beziers so the
 * curve flows smoothly between every pair of consecutive points.
 */
const PATH_D =
  'M 84 174 C 130 174, 160 90, 196 90 C 250 90, 280 195, 308 195 C 350 195, 380 96, 420 96 C 470 96, 500 180, 532 180 C 580 180, 610 150, 630 150';

/**
 * Crossfade timing. The active index can change at any time (auto
 * advance, click). When it does, the canvas fades the old content
 * out, swaps `displayedIndex` after FADE_OUT_MS, then fades the new
 * content in. Total perceived transition is ~640ms.
 */
const FADE_OUT_MS = 320;
const FADE_IN_MS = 320;

export function LearningPathShowcase({
  paths,
  className,
}: LearningPathShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  // displayedIndex lags activeIndex during the fade-out half of the
  // crossfade so the canvas keeps rendering the old path until the
  // fade-out completes, then swaps to the new one.
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const stickyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Each transition gets a unique generation id so stale inner
   * timeouts become no-ops if a newer transition has started.
   */
  const transitionGenRef = useRef(0);
  const prevActiveRef = useRef(0);

  // Auto-advance interval. Pauses on mouse-over or when an item is
  // sticky (the user clicked it within the last STICKY_DURATION ms).
  useEffect(() => {
    if (isPaused || isSticky) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % paths.length);
    }, AUTO_ADVANCE_INTERVAL);
    return () => clearInterval(id);
  }, [isPaused, isSticky, paths.length]);

  // Crossfade choreography. Only triggers when activeIndex actually
  // changes (skips initial mount). The effect deps deliberately do
  // NOT include displayedIndex - if they did, the cleanup would
  // wipe the inner settle timeout when displayedIndex updated and
  // the fade-in would never fire.
  useEffect(() => {
    if (prevActiveRef.current === activeIndex) return;
    prevActiveRef.current = activeIndex;

    const myGen = ++transitionGenRef.current;
    setIsTransitioning(true);

    const swapId = setTimeout(() => {
      // Bail if a newer transition has already started.
      if (transitionGenRef.current !== myGen) return;
      setDisplayedIndex(activeIndex);
      // One macrotask later, fade the new content back in.
      setTimeout(() => {
        if (transitionGenRef.current !== myGen) return;
        setIsTransitioning(false);
      }, 30);
    }, FADE_OUT_MS);

    return () => clearTimeout(swapId);
  }, [activeIndex]);

  // Clean up the sticky timer on unmount.
  useEffect(() => {
    return () => {
      if (stickyTimeoutRef.current) clearTimeout(stickyTimeoutRef.current);
    };
  }, []);

  const handleNavClick = (index: number) => {
    // Clicking the already-active item resumes auto-advance.
    if (index === activeIndex && isSticky) {
      setIsSticky(false);
      if (stickyTimeoutRef.current) clearTimeout(stickyTimeoutRef.current);
      return;
    }
    setActiveIndex(index);
    setIsSticky(true);
    if (stickyTimeoutRef.current) clearTimeout(stickyTimeoutRef.current);
    stickyTimeoutRef.current = setTimeout(() => {
      setIsSticky(false);
    }, STICKY_DURATION);
  };

  // The canvas always renders displayedIndex, not activeIndex, so the
  // old content stays mounted during the fade-out.
  const active = paths[displayedIndex];
  const ActiveIcon = ROLE_ICONS[active.iconName];
  const totalHours = active.steps.reduce((sum, s) => sum + s.hours, 0);
  const firstCourseId = active.steps[0]?.courseId;
  const progressActive = !isPaused && !isSticky;

  return (
    <div
      className={cn('flex flex-col', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ============================================================
          TAB ROW — horizontal role labels above the canvas. The
          active tab is highlighted in brand green and auto-rotates.
          Clicking a tab jumps to that path and locks for 15s.
          ============================================================ */}
      <nav
        role="tablist"
        aria-label="Learning paths"
        className="flex flex-wrap items-center gap-x-2 gap-y-3 mb-8 border-b border-gt-border-light pb-0"
      >
        {paths.map((path, index) => {
          const isActive = index === activeIndex;
          const Icon = ROLE_ICONS[path.iconName];
          return (
            <button
              key={path.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => handleNavClick(index)}
              className={cn(
                'relative inline-flex items-center gap-2 px-4 py-3 -mb-px transition-colors group',
                isActive
                  ? 'text-gt-medium'
                  : 'text-gt-text-dim hover:text-gt-text'
              )}
            >
              <Icon
                className={cn(
                  'w-[16px] h-[16px] transition-colors',
                  isActive
                    ? 'text-gt-medium'
                    : 'text-gt-text-dim group-hover:text-gt-medium'
                )}
                strokeWidth={2}
              />
              <span
                className="text-[12px] font-bold uppercase"
                style={{
                  letterSpacing: '0.18em',
                  fontFamily:
                    'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                }}
              >
                {path.navLabel}
              </span>

              {/* Static bottom indicator on active tab */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-gt-medium"
                  aria-hidden
                />
              )}

              {/* Progress bar that fills over the auto-advance interval,
                  sitting just above the static indicator. Only shown
                  when auto-advance is running. */}
              {isActive && progressActive && (
                <span
                  key={`${activeIndex}-${isPaused}-${isSticky}`}
                  className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gt-leaf gt-showcase-progress"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ============================================================
          CANVAS — single persistent frame. The inner content does
          NOT remount on activeIndex change. Instead, displayedIndex
          lags activeIndex and the inner content fades out, swaps,
          then fades in.
          ============================================================ */}
      <div className="relative bg-white border border-gt-border-light rounded-2xl p-10 lg:py-14 lg:pl-16 lg:pr-14 shadow-gt-card overflow-hidden">
        <div
          className="grid grid-cols-1 lg:grid-cols-[minmax(300px,380px)_1fr] gap-12 lg:gap-16 items-center"
          style={{
            opacity: isTransitioning ? 0 : 1,
            filter: isTransitioning ? 'blur(6px)' : 'blur(0)',
            transform: isTransitioning ? 'translateY(8px)' : 'translateY(0)',
            transition: `opacity ${
              isTransitioning ? FADE_OUT_MS : FADE_IN_MS
            }ms cubic-bezier(0.4, 0, 0.2, 1), filter ${
              isTransitioning ? FADE_OUT_MS : FADE_IN_MS
            }ms cubic-bezier(0.4, 0, 0.2, 1), transform ${
              isTransitioning ? FADE_OUT_MS : FADE_IN_MS
            }ms cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        >
          {/* Inner left: text content */}
          <div>
            <p
              className="text-[13px] font-bold uppercase text-gt-medium mb-4"
              style={{
                letterSpacing: '0.2em',
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
            >
              {active.role}
            </p>
            <h3 className="text-2xl lg:text-[26px] font-extrabold text-gt-text leading-tight tracking-tight mb-5">
              {active.title}
            </h3>
            <ul className="space-y-2.5 mb-7">
              {active.outcomes.map((outcome) => (
                <li
                  key={outcome}
                  className="flex items-start gap-2.5 text-[14px] text-gt-text-muted leading-snug"
                >
                  <span
                    className="flex-shrink-0 w-4 h-4 rounded-full bg-gt-medium/[0.10] flex items-center justify-center mt-0.5"
                    aria-hidden
                  >
                    <Check
                      className="w-2.5 h-2.5 text-gt-medium"
                      strokeWidth={3}
                    />
                  </span>
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-4">
              {firstCourseId && (
                <Link
                  href={`/courses/${firstCourseId}`}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-gt-medium hover:text-gt-deepest transition-colors"
                >
                  Start path
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <span
                className="text-[11px] text-gt-text-dim"
                style={{
                  letterSpacing: '0.08em',
                  fontFamily:
                    'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                }}
              >
                {totalHours}h total · {active.steps.length} courses
              </span>
            </div>
          </div>

          {/* Inner right: pale-green well with winding path + milestones.
              Aspect ratio is 5:3 so milestones get more vertical
              breathing room and labels never collide with the
              container edges. */}
          <div
            className="relative w-full aspect-[5/3] rounded-2xl overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, #F1F8F4 0%, #E9F5EE 100%)',
              border: '1px solid rgba(45,106,79,0.10)',
            }}
          >
            {/* Subtle dot grid behind the path */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.35] pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(45,106,79,0.18) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Winding SVG bezier */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 700 300"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d={PATH_D}
                fill="none"
                stroke="rgba(45,106,79,0.35)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            {/* Milestones */}
            {active.steps.slice(0, 5).map((step, i) => {
              const Icon = COURSE_ICON_MAP[step.courseId];
              const pos = MILESTONE_POSITIONS[i];
              if (!pos) return null;
              return (
                <Link
                  key={step.courseId}
                  href={`/courses/${step.courseId}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group/milestone"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.55)] mx-auto group-hover/milestone:scale-105 transition-transform"
                    style={{
                      background:
                        'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
                    }}
                    aria-hidden
                  >
                    {Icon ? (
                      <Icon
                        className="w-[22px] h-[22px] text-gt-leaf"
                        strokeWidth={2}
                      />
                    ) : null}
                  </div>
                  <div
                    className={cn(
                      'absolute left-1/2 -translate-x-1/2 w-[140px] text-center',
                      pos.labelAbove ? 'bottom-[72px]' : 'top-[68px]'
                    )}
                  >
                    <p className="text-[12px] font-bold text-gt-text leading-tight tracking-tight line-clamp-2">
                      {step.title}
                    </p>
                    <p
                      className="text-[10px] text-gt-text-dim mt-1"
                      style={{
                        fontFamily:
                          'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                      }}
                    >
                      {step.hours}h
                    </p>
                  </div>
                </Link>
              );
            })}

            {/* Destination tile */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: '90%', top: '50%' }}
            >
              <div
                className="w-[72px] h-[72px] rounded-xl flex items-center justify-center ring-1 ring-inset ring-white/10 shadow-[0_8px_24px_-8px_rgba(45,106,79,0.55)]"
                style={{
                  background:
                    'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
                }}
                aria-hidden
              >
                <ActiveIcon
                  className="w-7 h-7 text-white"
                  strokeWidth={2}
                />
              </div>
              <p
                className="absolute left-1/2 -translate-x-1/2 top-[80px] text-center text-[10px] font-bold uppercase text-gt-medium whitespace-nowrap"
                style={{
                  letterSpacing: '0.16em',
                  fontFamily:
                    'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                }}
              >
                Destination
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
