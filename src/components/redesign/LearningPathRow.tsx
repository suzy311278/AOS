/**
 * LearningPathRow
 *
 * One full-width row in the Learning Paths section of /redesign/courses.
 * Each row represents a single curated curriculum (Carbon Analyst, ESG
 * Reporter, Climate Risk Analyst, Sustainable Finance Specialist) and is
 * a hybrid of two earlier design directions:
 *
 *   - Layout: stacked horizontal rows (so all paths are visible at once,
 *     no tab switcher needed).
 *   - Visual treatment: a wide pale-green canvas on the right with a
 *     winding SVG bezier path running through 5 milestone tiles, each
 *     rendered with the same dark forest tile treatment as CourseRow.
 *     A larger destination tile sits at the right end with the role icon.
 *
 * The left column carries the role label, headline, three outcome bullets,
 * and a mono total stat. The right column is the visual journey.
 *
 * Per the brand discipline locked into the homepage spec, all rows use
 * the same brand green palette. Differentiation between paths comes from
 * the icons, the role label, and the milestone composition, not from
 * per-card accent colors.
 */

import Link from 'next/link';
import { ArrowRight, Check, type LucideIcon } from 'lucide-react';
import { COURSE_ICON_MAP } from '@/components/redesign/CourseRow';
import { cn } from '@/components/redesign/lib/cn';

export interface LearningPathRowStep {
  /** Course id, used for the link and the icon lookup */
  courseId: string;
  /** Display title shown under the milestone tile */
  title: string;
  /** Estimated hours, shown in mono under the title */
  hours: number;
}

export interface LearningPathRowProps {
  /** Eyebrow label, e.g. "FOR THE CARBON ANALYST" */
  role: string;
  /** Path headline, e.g. "Measure, verify, defend a GHG number." */
  title: string;
  /**
   * Three outcome bullets that describe what the practitioner will be
   * able to do after finishing the path.
   */
  outcomes: string[];
  /** Ordered course steps. The component is tuned for exactly 5 steps. */
  steps: LearningPathRowStep[];
  /**
   * The Lucide icon used for the destination tile at the right end of
   * the canvas. Represents the role outcome.
   */
  destinationIcon: LucideIcon;
  className?: string;
}

/**
 * Hard-coded milestone positions across the canvas (percentages of
 * the right column's pale-green well). Five points form a gentle
 * S-curve and the destination sits at 92% on the centerline.
 *
 * The labels alternate above/below to avoid collisions when course
 * titles are long.
 */
const MILESTONE_POSITIONS: Array<{
  x: number;
  y: number;
  labelAbove: boolean;
}> = [
  { x: 8,  y: 58, labelAbove: false },
  { x: 24, y: 30, labelAbove: true  },
  { x: 42, y: 65, labelAbove: false },
  { x: 60, y: 32, labelAbove: true  },
  { x: 78, y: 60, labelAbove: false },
];

/** SVG viewBox path that traces the 5 milestone positions and ends
 *  at the destination tile. Drawn as a single sequence of cubic
 *  beziers so the curve flows smoothly between every pair of
 *  consecutive points. */
const PATH_D =
  'M 56 174 C 100 174, 130 90, 168 90 C 220 90, 260 195, 294 195 C 340 195, 380 96, 420 96 C 470 96, 510 180, 546 180 C 590 180, 620 150, 644 150';

export function LearningPathRow({
  role,
  title,
  outcomes,
  steps,
  destinationIcon: DestinationIcon,
  className,
}: LearningPathRowProps) {
  const totalHours = steps.reduce((sum, s) => sum + s.hours, 0);
  const firstCourseId = steps[0]?.courseId;

  return (
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-[minmax(280px,340px)_1fr] gap-10 lg:gap-14 items-center',
        className
      )}
    >
      {/* ============================================================
          Left column: role label, headline, outcomes, stat
          ============================================================ */}
      <div>
        <p
          className="text-[10px] font-bold uppercase text-gt-medium mb-3"
          style={{
            letterSpacing: '0.2em',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          {role}
        </p>

        <h3 className="text-2xl md:text-[26px] font-extrabold text-gt-text leading-tight tracking-tight mb-5">
          {title}
        </h3>

        <ul className="space-y-2.5 mb-7">
          {outcomes.map((outcome) => (
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
            {totalHours}h total · {steps.length} courses
          </span>
        </div>
      </div>

      {/* ============================================================
          Right column: pale canvas with winding path + milestones
          ============================================================ */}
      <div
        className="relative w-full aspect-[7/3] rounded-2xl overflow-hidden"
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

        {/* The winding path itself, drawn in viewBox 0..700 x 0..300
            so the milestone math stays simple. preserveAspectRatio
            none means it stretches to fill any container width. */}
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
            strokeDasharray="0"
          />
        </svg>

        {/* 5 milestones positioned along the path */}
        {steps.slice(0, 5).map((step, i) => {
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
              {/* Milestone tile (matches CourseRow icon treatment) */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.55)] mx-auto group-hover/milestone:scale-105 transition-transform"
                style={{
                  background:
                    'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
                }}
                aria-hidden
              >
                {Icon ? (
                  <Icon
                    className="w-[18px] h-[18px] text-gt-leaf"
                    strokeWidth={2}
                  />
                ) : null}
              </div>

              {/* Step label */}
              <div
                className={cn(
                  'absolute left-1/2 -translate-x-1/2 w-[120px] text-center',
                  pos.labelAbove ? 'bottom-[64px]' : 'top-[60px]'
                )}
              >
                <p className="text-[11px] font-bold text-gt-text leading-tight tracking-tight line-clamp-2">
                  {step.title}
                </p>
                <p
                  className="text-[10px] text-gt-text-dim mt-0.5"
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

        {/* Destination tile: larger, brand-green filled with role icon */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: '92%', top: '50%' }}
        >
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center ring-1 ring-inset ring-white/10 shadow-[0_8px_24px_-8px_rgba(45,106,79,0.55)]"
            style={{
              background:
                'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
            }}
            aria-hidden
          >
            <DestinationIcon
              className="w-6 h-6 text-white"
              strokeWidth={2}
            />
          </div>
          <p
            className="absolute left-1/2 -translate-x-1/2 top-[72px] text-center text-[10px] font-bold uppercase text-gt-medium whitespace-nowrap"
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
  );
}
