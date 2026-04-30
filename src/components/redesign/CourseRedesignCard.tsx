/**
 * CourseRedesignCard
 *
 * Catalogue card for /redesign/courses. No gradient, no pattern —
 * a clean white card with a thin colored accent bar at the top,
 * a Lucide icon in an accent-tinted circle, and a typographic
 * hierarchy that matches the homepage design language.
 *
 * Each course id is mapped to a Lucide icon chosen to reflect
 * the subject matter. The accent color comes from course.yaml
 * and drives the top bar, the icon wash, and the CTA.
 *
 * This component was rewritten from its first iteration (which
 * used gradient headers with pattern fills) because the gradient
 * approach was visually noisy and did not match the Bloomberg
 * Terminal voice of the rest of the product. The new layout is
 * calmer, more professional, and scales cleanly to 22 courses.
 */

import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Layers,
  Clock,
  Globe,
  Recycle,
  Thermometer,
  Scale,
  BarChart3,
  TrendingUp,
  FileText,
  Ship,
  Landmark,
  ListTree,
  TreePine,
  Banknote,
  Factory,
  Network,
  Users,
  ShieldCheck,
  FileBarChart,
  Target,
  Leaf,
  Coins,
  Sprout,
  Flame,
  BookOpen as DefaultIcon,
  type LucideIcon,
} from 'lucide-react';
import type { Course } from '@/lib/types';
import { cn } from '@/components/redesign/lib/cn';

/**
 * Accent hex pairs keyed off the course.yaml color name. The
 * "bar" hex is the top accent bar; "icon" is the icon and CTA
 * color; "wash" is the 8% background tint for the icon circle.
 */
const ACCENT_MAP: Record<
  string,
  { bar: string; icon: string; wash: string }
> = {
  green:    { bar: '#16a34a', icon: '#16a34a', wash: 'rgba(22,163,74,0.10)' },
  emerald:  { bar: '#059669', icon: '#059669', wash: 'rgba(5,150,105,0.10)' },
  teal:     { bar: '#0d9488', icon: '#0d9488', wash: 'rgba(13,148,136,0.10)' },
  blue:     { bar: '#2563eb', icon: '#2563eb', wash: 'rgba(37,99,235,0.10)' },
  violet:   { bar: '#7c3aed', icon: '#7c3aed', wash: 'rgba(124,58,237,0.10)' },
  orange:   { bar: '#ea580c', icon: '#ea580c', wash: 'rgba(234,88,12,0.10)' },
  red:      { bar: '#dc2626', icon: '#dc2626', wash: 'rgba(220,38,38,0.10)' },
  purple:   { bar: '#9333ea', icon: '#9333ea', wash: 'rgba(147,51,234,0.10)' },
  cyan:     { bar: '#0891b2', icon: '#0891b2', wash: 'rgba(8,145,178,0.10)' },
  rose:     { bar: '#e11d48', icon: '#e11d48', wash: 'rgba(225,29,72,0.10)' },
  indigo:   { bar: '#4f46e5', icon: '#4f46e5', wash: 'rgba(79,70,229,0.10)' },
};

/**
 * Human labels for the course category enum. Keeps the card chip
 * legible instead of showing raw slugs.
 */
const CATEGORY_LABELS: Record<Course['category'], string> = {
  fundamentals: 'Fundamentals',
  esg: 'ESG',
  markets: 'Carbon Markets',
  'green-finance': 'Green Finance',
  'sustainability-standards': 'Standards',
  methodologies: 'Methodologies',
};

/**
 * Lucide icon chosen per course id. Icons are picked to reflect
 * the domain: thermometer for climate science, factory for Scope
 * 1 and 2, recycle for circular economy, and so on. A sensible
 * default (BookOpen) is used for any course not in the map so a
 * new course will never break the card.
 */
const COURSE_ICON_MAP: Record<string, LucideIcon> = {
  'article-6': Globe,
  'circular-economy': Recycle,
  'climate-science-101': Thermometer,
  'double-materiality': Scale,
  'esg-benchmarking': BarChart3,
  'esg-investing': TrendingUp,
  'esg-reporting': FileText,
  'eu-cbam': Ship,
  'eu-sfdr': Landmark,
  'eu-taxonomy': ListTree,
  'eudr': TreePine,
  'financed-emissions': Banknote,
  'ghg-scope-1-2': Factory,
  'ghg-scope-3': Network,
  'human-rights-dd': Users,
  'ifc-performance-standards': ShieldCheck,
  'ifrs-s2': FileBarChart,
  'sbti': Target,
  'tnfd-biodiversity': Leaf,
  'vcm-101': Coins,
  'vm0042': Sprout,
  'vm0044': Flame,
};

export interface CourseRedesignCardProps {
  course: Course;
  /** Total lessons across all modules, pre-computed server-side */
  totalLessons: number;
  /** Module count, pre-computed server-side */
  moduleCount: number;
  className?: string;
}

export function CourseRedesignCard({
  course,
  totalLessons,
  moduleCount,
  className,
}: CourseRedesignCardProps) {
  const accent = ACCENT_MAP[course.color] ?? ACCENT_MAP.green;
  const categoryLabel = CATEGORY_LABELS[course.category] ?? course.category;
  const Icon = COURSE_ICON_MAP[course.id] ?? DefaultIcon;
  const isComingSoon = course.status === 'coming-soon';
  const isDraft = course.status === 'draft';
  const isMuted = isComingSoon || isDraft;

  return (
    <Link
      href={isMuted ? '#' : `/courses/${course.id}`}
      aria-disabled={isMuted}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-gt-border-light transition-all',
        isMuted
          ? 'opacity-60 pointer-events-none'
          : 'hover:shadow-gt-card-lg hover:border-gt-border-light/80 hover:-translate-y-0.5',
        className
      )}
    >
      {/* Thin colored accent bar at the top */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: accent.bar }}
        aria-hidden
      />

      {/* ============================================================
          Card body
          ============================================================ */}
      <div className="flex-1 flex flex-col p-7">
        {/* Top row: icon + category/status chips */}
        <div className="flex items-start justify-between mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: accent.wash }}
            aria-hidden
          >
            <Icon
              className="w-5 h-5"
              style={{ color: accent.icon }}
              strokeWidth={2}
            />
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span
              className="inline-block px-2.5 py-1 rounded-full bg-gt-border-light/60 text-[10px] font-bold uppercase text-gt-text-muted"
              style={{ letterSpacing: '0.12em' }}
            >
              {categoryLabel}
            </span>
            {isComingSoon && (
              <span
                className="inline-block px-2.5 py-1 rounded-full bg-amber-50 text-[10px] font-bold uppercase text-amber-700 border border-amber-200"
                style={{ letterSpacing: '0.12em' }}
              >
                Coming soon
              </span>
            )}
            {isDraft && (
              <span
                className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-bold uppercase text-slate-600"
                style={{ letterSpacing: '0.12em' }}
              >
                Draft
              </span>
            )}
          </div>
        </div>

        {/* Title + subtitle */}
        <h3 className="text-lg font-bold text-gt-text leading-snug tracking-tight mb-2">
          {course.title}
        </h3>
        <p className="text-sm text-gt-text-muted leading-snug mb-6 line-clamp-2">
          {course.subtitle}
        </p>

        {/* Metadata row */}
        <div
          className="mt-auto flex items-center gap-4 text-[12px] text-gt-text-dim pt-5 border-t border-gt-border-light"
          style={{
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" strokeWidth={2} />
            {moduleCount} modules
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
            {totalLessons} lessons
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" strokeWidth={2} />
            {course.estimatedHours}h
          </span>
        </div>

        {/* CTA row */}
        <div className="mt-5 flex items-center justify-between">
          <span
            className="text-sm font-bold"
            style={{ color: isMuted ? undefined : accent.icon }}
          >
            {isMuted ? 'Coming soon' : 'View course'}
          </span>
          {!isMuted && (
            <ArrowRight
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              style={{ color: accent.icon }}
            />
          )}
        </div>
      </div>
    </Link>
  );
}
