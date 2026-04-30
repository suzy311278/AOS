/**
 * SourceLogoCycle
 *
 * Six rotating "source" logos that sit on the right side of the
 * /redesign/courses dark header band. Cycles through GHG Protocol,
 * GRI, IFRS, Verra, TNFD, and European Union with the same blur
 * + fade rotation pattern used by the homepage hero.
 *
 * The logos are real PNG and SVG files placed in public/logos/
 * with widely varying backgrounds (some transparent, some solid
 * white) and color schemes. Trying to recolor them via CSS filter
 * fails for the white-background PNGs (the entire image flattens
 * to a white block).
 *
 * The treatment used here renders each logo at NATIVE COLOR on a
 * small white rounded "chip" with padding. The chip is the same
 * size for every slot so the rotation feels uniform, and the
 * white background guarantees consistent contrast against the
 * dark forest header regardless of the logo's source format.
 *
 * The animation classes (gt-logo-rotate, gt-logo-1 through gt-logo-6)
 * are defined in src/app/redesign/redesign.css.
 */

import { cn } from '@/components/redesign/lib/cn';

interface Logo {
  /** Public-relative path to the logo file */
  src: string;
  /** Accessible label */
  alt: string;
  /** Max height in pixels for the logo image. Different sources
   *  have different aspect ratios, so each gets its own max-h
   *  to keep the visual weight balanced across the cycle. */
  maxHeightPx: number;
}

/**
 * Six logos drawn from public/logos/. Order = cycle slot 1..6.
 * The cycle rotates one logo every ~3 seconds, so the order
 * controls the visual rhythm: alternate wide wordmarks with
 * compact marks where possible.
 */
const LOGOS: Logo[] = [
  {
    src: '/logos/GHG.png',
    alt: 'Greenhouse Gas Protocol',
    maxHeightPx: 110,
  },
  {
    src: '/logos/GRI.png',
    alt: 'Global Reporting Initiative',
    maxHeightPx: 110,
  },
  {
    src: '/logos/IFRS_Foundation_idRbbNedpP_1.svg',
    alt: 'IFRS Foundation',
    maxHeightPx: 70,
  },
  {
    src: '/logos/Verrra.png',
    alt: 'Verra',
    maxHeightPx: 90,
  },
  {
    src: '/logos/TNFD_idmKzP6Ok3_1.svg',
    alt: 'Taskforce on Nature-related Financial Disclosures',
    maxHeightPx: 80,
  },
  {
    src: '/logos/European_Union_wordmark_en.svg',
    alt: 'European Union',
    maxHeightPx: 110,
  },
];

export interface SourceLogoCycleProps {
  className?: string;
}

export function SourceLogoCycle({ className }: SourceLogoCycleProps) {
  return (
    <div
      className={cn(
        'relative w-full max-w-[460px] mx-auto',
        className
      )}
    >
      {/* Soft ambient glow behind the grid */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 80% at 50% 50%, rgba(82,183,136,0.10) 0%, rgba(82,183,136,0.02) 50%, transparent 80%)',
        }}
        aria-hidden
      />

      {/* 3 x 2 grid of logos. Each chip holds a logo at native color
          on a white background so contrast stays consistent.
          The gt-logo-breathe animation gently pulses each chip's
          opacity from ~0.55 to 1.0 and back, with a staggered delay
          per slot so the six logos never peak at the same time. */}
      <div className="relative grid grid-cols-3 gap-4 p-2">
        {LOGOS.map((logo, i) => (
          <div
            key={logo.src}
            className={cn(
              'gt-logo-breathe',
              `gt-logo-${i + 1}`,
              'aspect-[4/3] bg-white rounded-xl shadow-[0_6px_18px_-8px_rgba(0,0,0,0.35)] flex items-center justify-center'
            )}
            style={{ padding: '14px 18px' }}
          >
            {/*
              Plain <img> intentionally used (not Next.js <Image>)
              because the assets are a mix of PNG and SVG with widely
              varying intrinsic dimensions. We constrain each one by
              its own max-height inside the chip and let object-contain
              handle the aspect ratio.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo.src}
              alt={logo.alt}
              className="w-auto h-auto object-contain select-none"
              style={{
                maxHeight: `${Math.min(logo.maxHeightPx, 56)}px`,
                maxWidth: '100%',
              }}
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
