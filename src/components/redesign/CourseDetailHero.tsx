/**
 * CourseDetailHero
 *
 * Dark forest header band for /redesign/courses/[courseId]. Layers:
 *
 *   1. Background image at the bottom (per-category cinematic photo,
 *      defaults to a forest canopy that matches the reference design).
 *   2. A strong forest-green gradient overlay that keeps the text
 *      readable while letting the image breathe through on the right.
 *   3. The same radial green glows and subtle dot grid used by the
 *      catalogue header, so the surface still reads as part of the
 *      Greentryst design language.
 *   4. The content column sits in front of all layers.
 *
 * The image is rendered with a plain <img> tag because the asset is
 * an external URL with unknown intrinsic dimensions. For production,
 * the recommended approach is to host the per-category images in
 * `public/images/course-headers/` and pre-optimize them.
 *
 * Per-category default images live in CATEGORY_BG_IMAGES below. The
 * caller can override with the `imageUrl` prop if a course has a
 * dedicated image of its own.
 */

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Layers, BookOpen, Clock, type LucideIcon } from 'lucide-react';
import { resolveCourseImage } from '@/components/redesign/course-images';
import { cn } from '@/components/redesign/lib/cn';

const CATEGORY_LABELS: Record<string, string> = {
  fundamentals: 'Fundamentals',
  esg: 'ESG',
  markets: 'Carbon Markets',
  'green-finance': 'Green Finance',
  'sustainability-standards': 'Standards',
  methodologies: 'Methodologies',
};

// Per-course background image lookup is centralized in
// `course-images.ts` so the lesson hero (and any future surface)
// can resolve the same imagery from a single source of truth.

export interface CourseDetailHeroProps {
  courseId: string;
  category: string;
  title: string;
  subtitle: string;
  moduleCount: number;
  totalLessons: number;
  estimatedHours: number;
  Icon: LucideIcon;
  /**
   * Optional per-course override for the background image. If not
   * provided, falls back to the category default in CATEGORY_BG_IMAGES.
   */
  imageUrl?: string;
  className?: string;
  /**
   * Destination for the primary CTA. Defaults to the course overview
   * page when not provided.
   */
  ctaHref?: string;
}

export function CourseDetailHero({
  courseId,
  category,
  title,
  subtitle,
  moduleCount,
  totalLessons,
  estimatedHours,
  Icon,
  imageUrl,
  className,
  ctaHref,
}: CourseDetailHeroProps) {
  const categoryLabel = CATEGORY_LABELS[category] ?? category;
  const bgImage = resolveCourseImage(courseId, category, imageUrl);

  return (
    <section
      className={cn(
        'relative isolate overflow-hidden py-16 lg:py-20 bg-[#0b1f18]',
        className
      )}
    >
      {/* Layer 1: background image. Sits behind everything. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgImage}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover select-none"
        draggable={false}
      />

      {/* Layer 2: forest gradient overlay. Strong on the left where
          the text lives, fading toward the right so the image still
          breathes through. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(110deg, rgba(11,31,24,0.96) 0%, rgba(11,31,24,0.92) 40%, rgba(11,31,24,0.72) 75%, rgba(11,31,24,0.55) 100%)',
        }}
      />

      {/* Layer 3: radial forest glow, upper-left */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(55% 80% at 15% 0%, rgba(45,106,79,0.45) 0%, rgba(45,106,79,0.10) 35%, transparent 70%)',
        }}
      />
      {/* Layer 4: ambient leaf highlight, lower-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(50% 70% at 100% 100%, rgba(82,183,136,0.18) 0%, transparent 60%)',
        }}
      />
      {/* Layer 5: subtle dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative px-8 lg:px-12 max-w-[1280px]">
        {/* Breadcrumb */}
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-[12px] text-white/60 hover:text-white transition-colors mb-8"
          style={{
            letterSpacing: '0.08em',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          Back to catalogue
        </Link>

        {/* Eyebrow */}
        <p
          className="text-[11px] font-bold uppercase text-gt-mint mb-6"
          style={{
            letterSpacing: '0.22em',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          {categoryLabel}
        </p>

        {/* Icon + title block */}
        <div className="flex items-start gap-6 mb-6">
          {/* Large dark forest icon tile */}
          <div
            className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center ring-1 ring-inset ring-white/[0.08] shadow-[0_8px_28px_-8px_rgba(11,61,46,0.6)]"
            style={{
              background:
                'linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)',
            }}
            aria-hidden
          >
            <Icon
              className="w-9 h-9 text-gt-leaf"
              strokeWidth={2}
            />
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <h1
              className="text-3xl md:text-4xl lg:text-[44px] font-extrabold text-white leading-[1.1] tracking-tight"
              style={{ letterSpacing: '-0.02em' }}
            >
              {title}
            </h1>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-lg text-white/75 leading-relaxed max-w-2xl mb-8">
          {subtitle}
        </p>

        {/* Metadata row */}
        <div
          className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-white/70 mb-10"
          style={{
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          <span className="inline-flex items-center gap-2">
            <Clock className="w-4 h-4 text-gt-mint" strokeWidth={2} />
            <span className="text-white font-semibold">
              {estimatedHours}h
            </span>
            <span className="text-white/50">total</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <Layers className="w-4 h-4 text-gt-mint" strokeWidth={2} />
            <span className="text-white font-semibold">{moduleCount}</span>
            <span className="text-white/50">modules</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gt-mint" strokeWidth={2} />
            <span className="text-white font-semibold">{totalLessons}</span>
            <span className="text-white/50">lessons</span>
          </span>
        </div>

        {/* CTA */}
        <Link
          href={ctaHref ?? `/courses/${courseId}`}
          className="inline-flex items-center gap-2 rounded-lg px-7 py-4 bg-gt-leaf text-gt-text-dark text-sm font-bold hover:bg-white transition-colors shadow-lg shadow-gt-leaf/20"
        >
          Start course
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
