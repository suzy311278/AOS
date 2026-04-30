/**
 * RelatedLearningPaths
 *
 * "Continue your path" cross-link section on the course detail page.
 * Auto-derives which curated learning paths include the current
 * course id, then renders a compact card per path showing the
 * role, the path's headline, and the position the current course
 * occupies in the sequence.
 *
 * If no path includes the course, the section renders nothing so
 * the page does not have an empty block.
 *
 * The path data is the shared LEARNING_PATHS source of truth used by
 * the catalogue page, so the cards on this section automatically
 * stay in sync with the catalogue's Learning Paths showcase.
 */

import Link from 'next/link';
import {
  ArrowRight,
  Calculator,
  FileText,
  LineChart,
  Banknote,
  type LucideIcon,
} from 'lucide-react';
import {
  findPathsContainingCourse,
  type LearningPathDef,
} from '@/components/redesign/learning-paths-data';
import type { LearningPathRoleIcon } from '@/components/redesign/LearningPathShowcase';
import { cn } from '@/components/redesign/lib/cn';

const ROLE_ICONS: Record<LearningPathRoleIcon, LucideIcon> = {
  calculator: Calculator,
  'file-text': FileText,
  'line-chart': LineChart,
  banknote: Banknote,
};

export interface RelatedLearningPathsProps {
  courseId: string;
  className?: string;
}

export function RelatedLearningPaths({
  courseId,
  className,
}: RelatedLearningPathsProps) {
  const matches: LearningPathDef[] = findPathsContainingCourse(courseId);
  if (matches.length === 0) return null;

  return (
    <section className={cn('mt-16', className)}>
      <p
        className="text-[10px] font-bold uppercase text-gt-medium mb-2"
        style={{
          letterSpacing: '0.2em',
          fontFamily:
            'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        }}
      >
        Continue your path
      </p>
      <h2 className="text-2xl font-bold text-gt-text leading-snug tracking-tight mb-2">
        This course is part of {matches.length === 1 ? '1 curated path' : `${matches.length} curated paths`}
      </h2>
      <p className="text-[14px] text-gt-text-muted leading-relaxed mb-7 max-w-2xl">
        Each path is a sequence of five courses designed to take a
        practitioner from first principles to defensible output. Pick
        one to see where this course fits.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {matches.map((path) => {
          const Icon = ROLE_ICONS[path.iconName];
          const positionIndex = path.steps.indexOf(courseId);
          const positionLabel =
            positionIndex >= 0
              ? `Course ${positionIndex + 1} of ${path.steps.length}`
              : `Part of ${path.steps.length} courses`;
          return (
            <Link
              key={path.id}
              href={`/courses#${path.id}`}
              className="group relative bg-white border border-gt-border-light rounded-2xl p-6 hover:shadow-gt-card-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ring-1 ring-inset ring-white/[0.06] shadow-[0_4px_14px_-6px_rgba(11,61,46,0.55)]"
                  style={{
                    background:
                      'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
                  }}
                  aria-hidden
                >
                  <Icon className="w-5 h-5 text-gt-leaf" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[10px] font-bold uppercase text-gt-medium mb-1"
                    style={{
                      letterSpacing: '0.16em',
                      fontFamily:
                        'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    }}
                  >
                    {path.navLabel}
                  </p>
                  <h3 className="text-[15px] font-bold text-gt-text leading-snug tracking-tight mb-3 group-hover:text-gt-medium transition-colors">
                    {path.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[11px] text-gt-text-dim"
                      style={{
                        letterSpacing: '0.06em',
                        fontFamily:
                          'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                      }}
                    >
                      {positionLabel}
                    </span>
                    <ArrowRight
                      className="w-4 h-4 text-gt-text-dim group-hover:text-gt-medium group-hover:translate-x-0.5 transition-all"
                      strokeWidth={2}
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
