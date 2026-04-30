/**
 * LessonDetailHero
 *
 * Dark forest banner header for /redesign/courses/[courseId]/[lessonId].
 * Same five-layer composition as the catalogue and course detail
 * headers (background image + forest gradient overlay + radial
 * glows + dot grid) so the lesson reads as a continuation of the
 * catalogue → course detail journey.
 *
 * Key differences from CourseDetailHero:
 *   - Slightly shorter (uses py-14 instead of py-20)
 *   - Bottom row of metadata is the lesson position + reading time
 *   - Title is the lesson title, not the course title
 *   - The container is `relative` so a `LessonGlassAudio` can be
 *     positioned absolutely at the bottom edge, straddling the
 *     boundary between the dark hero and the white reading area
 *     below it.
 *   - Bottom padding is generous (pb-24) so the floating audio
 *     player has room to overlap without colliding with the meta
 *     row.
 */

import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, Layers } from 'lucide-react';
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

export interface LessonDetailHeroProps {
  courseId: string;
  courseTitle: string;
  category: string;
  moduleNumber: number;
  moduleTitle: string;
  lessonNumber: number;
  moduleLessonCount: number;
  lessonId: string;
  lessonTitle: string;
  readingMinutes?: number;
  imageUrl?: string;
  /**
   * If true, the hero leaves a tall bottom area so a floating
   * `LessonGlassAudio` can sit at the bottom edge straddling the
   * hero / reading boundary. The audio component is rendered by
   * the page (not by the hero itself) so it can be optional.
   */
  reserveAudioSlot?: boolean;
  className?: string;
}

export function LessonDetailHero({
  courseId,
  courseTitle,
  category,
  moduleNumber,
  moduleTitle,
  lessonNumber,
  moduleLessonCount,
  lessonId,
  lessonTitle,
  readingMinutes,
  imageUrl,
  reserveAudioSlot = false,
  className,
}: LessonDetailHeroProps) {
  const categoryLabel = CATEGORY_LABELS[category] ?? category;
  const bgImage = resolveCourseImage(courseId, category, imageUrl);

  return (
    <section
      className={cn(
        'relative isolate overflow-hidden bg-[#0b1f18]',
        // When an audio player will float across the hero/reading
        // boundary we reserve a tall bottom area for it. The top
        // padding is also bumped so the breadcrumb has breathing
        // room from the sticky nav above. Total hero height stays
        // close to the previous version (4-8px taller at most).
        reserveAudioSlot
          ? 'pt-24 pb-28 lg:pt-28 lg:pb-32'
          : 'pt-20 pb-14 lg:pt-24 lg:pb-20',
        className
      )}
    >
      {/* Layer 1: background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgImage}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover select-none"
        draggable={false}
      />

      {/* Layer 2: forest gradient overlay. Vertical-leaning so the
          top half (where the title sits) stays solidly readable
          and the bottom half (where the audio player floats) gets
          a bit more dark to make the glass card pop. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(11,31,24,0.92) 0%, rgba(11,31,24,0.84) 50%, rgba(11,31,24,0.94) 100%)',
        }}
      />

      {/* Layer 3: radial forest glow upper-left */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(55% 80% at 15% 0%, rgba(45,106,79,0.45) 0%, rgba(45,106,79,0.10) 35%, transparent 70%)',
        }}
      />

      {/* Layer 4: ambient leaf highlight lower-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(50% 70% at 100% 100%, rgba(82,183,136,0.22) 0%, transparent 60%)',
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

      <div className="relative px-8 lg:px-12 max-w-[1200px]">
        {/* Breadcrumb back to course detail */}
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-[12px] text-white/60 hover:text-white transition-colors mb-6"
          style={{
            letterSpacing: '0.08em',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          {courseTitle}
        </Link>

        {/* Top metadata row: category + module + lesson position */}
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] mb-5"
          style={{
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          <span
            className="font-bold uppercase text-gt-mint"
            style={{ letterSpacing: '0.2em' }}
          >
            {categoryLabel}
          </span>
          <span className="text-white/30">/</span>
          <span className="text-white/70 inline-flex items-center gap-1.5">
            <Layers className="w-3 h-3" strokeWidth={2} />
            Module {moduleNumber}: {moduleTitle}
          </span>
          <span className="text-white/30">/</span>
          <span className="text-white/70 inline-flex items-center gap-1.5">
            <BookOpen className="w-3 h-3" strokeWidth={2} />
            Lesson {lessonNumber} of {moduleLessonCount}
          </span>
          {typeof readingMinutes === 'number' && (
            <>
              <span className="text-white/30">/</span>
              <span className="text-white/70 inline-flex items-center gap-1.5">
                <Clock className="w-3 h-3" strokeWidth={2} />
                {readingMinutes} min read
              </span>
            </>
          )}
        </div>

        {/* Lesson title */}
        <h1
          className="text-3xl md:text-4xl lg:text-[44px] font-extrabold text-white leading-[1.1] tracking-tight max-w-4xl"
          style={{ letterSpacing: '-0.02em' }}
        >
          {lessonTitle}
        </h1>

        {/* Lesson id badge underneath the title */}
        <p
          className="mt-4 text-[10px] font-bold uppercase text-gt-mint/70"
          style={{
            letterSpacing: '0.2em',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          Lesson {lessonId}
        </p>
      </div>
    </section>
  );
}
