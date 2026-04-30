/**
 * LearningPathCard
 *
 * Curated sequence of courses that maps to a real sustainability
 * role. Used on /redesign/courses to give a cold visitor a clear
 * "where should I start" answer for the 22-course catalogue.
 *
 * Each path has:
 *   - An eyebrow role label ("for the carbon analyst")
 *   - A one-line headline
 *   - A short sub explaining the outcome
 *   - An ordered list of 4-6 courses with duration totals
 *   - A total hours stat
 *   - A CTA that links to the first course in the path
 *
 * Paths are defined as data on the /redesign/courses page and fed
 * into this component as props. This keeps the card presentational
 * and the path definitions centralized for easy review.
 */

import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/components/redesign/lib/cn';

export interface LearningPathStep {
  /** Step number shown in the sequence */
  index: number;
  /** Course id, used to resolve the link */
  courseId: string;
  /** Display title */
  title: string;
  /** Estimated hours for this step */
  hours: number;
}

export interface LearningPathCardProps {
  /** Small eyebrow, e.g. "FOR THE CARBON ANALYST" */
  role: string;
  /** Path headline, e.g. "Learn to measure, verify, and defend a Scope 3 number." */
  title: string;
  /** One-line outcome statement */
  outcome: string;
  /** Ordered steps */
  steps: LearningPathStep[];
  /** Color accent name (uses colorMap keys) */
  accent?: 'teal' | 'blue' | 'violet' | 'emerald' | 'rose';
  className?: string;
}

/**
 * Pre-computed Tailwind classes for each supported accent color so
 * Tailwind's JIT picks them up statically. Do not inline class names
 * with dynamic interpolation.
 */
const ACCENT_CLASSES = {
  teal: {
    eyebrow: 'text-gt-medium',
    bullet: 'bg-gt-medium',
    cta: 'text-gt-medium hover:text-gt-deepest',
  },
  blue: {
    eyebrow: 'text-blue-700',
    bullet: 'bg-blue-600',
    cta: 'text-blue-700 hover:text-blue-900',
  },
  violet: {
    eyebrow: 'text-violet-700',
    bullet: 'bg-violet-600',
    cta: 'text-violet-700 hover:text-violet-900',
  },
  emerald: {
    eyebrow: 'text-emerald-700',
    bullet: 'bg-emerald-600',
    cta: 'text-emerald-700 hover:text-emerald-900',
  },
  rose: {
    eyebrow: 'text-rose-700',
    bullet: 'bg-rose-600',
    cta: 'text-rose-700 hover:text-rose-900',
  },
};

export function LearningPathCard({
  role,
  title,
  outcome,
  steps,
  accent = 'teal',
  className,
}: LearningPathCardProps) {
  const totalHours = steps.reduce((sum, s) => sum + s.hours, 0);
  const firstCourseId = steps[0]?.courseId;
  const classes = ACCENT_CLASSES[accent];

  return (
    <div
      className={cn(
        'flex flex-col bg-white border border-gt-border-light rounded-2xl p-7 hover:shadow-gt-card-lg transition-shadow',
        className
      )}
    >
      {/* Eyebrow */}
      <p
        className={cn('text-[11px] font-bold uppercase mb-4', classes.eyebrow)}
        style={{ letterSpacing: '0.2em' }}
      >
        {role}
      </p>

      {/* Headline */}
      <h3 className="text-xl font-bold text-gt-text leading-snug tracking-tight mb-3">
        {title}
      </h3>

      {/* Outcome */}
      <p className="text-sm text-gt-text-muted leading-relaxed mb-6">
        {outcome}
      </p>

      {/* Steps list */}
      <ol className="space-y-3 mb-6 flex-1">
        {steps.map((step) => (
          <li key={step.courseId} className="flex items-start gap-3">
            <span
              className={cn(
                'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white',
                classes.bullet
              )}
              style={{
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              }}
            >
              {step.index}
            </span>
            <div className="flex-1 min-w-0 pt-0.5">
              <Link
                href={`/courses/${step.courseId}`}
                className="text-sm font-semibold text-gt-text hover:text-gt-medium transition-colors leading-snug block"
              >
                {step.title}
              </Link>
              <p
                className="text-[11px] text-gt-text-dim mt-0.5"
                style={{
                  fontFamily:
                    'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                }}
              >
                {step.hours}h
              </p>
            </div>
          </li>
        ))}
      </ol>

      {/* Stats + CTA */}
      <div className="flex items-center justify-between pt-5 border-t border-gt-border-light">
        <span
          className="inline-flex items-center gap-1.5 text-xs text-gt-text-dim"
          style={{
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          <Clock className="w-3.5 h-3.5" strokeWidth={2} />
          {totalHours}h total · {steps.length} courses
        </span>
        {firstCourseId && (
          <Link
            href={`/courses/${firstCourseId}`}
            className={cn(
              'inline-flex items-center gap-1.5 text-sm font-bold transition-colors',
              classes.cta
            )}
          >
            Start path
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
