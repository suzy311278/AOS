/**
 * SectionHeading
 *
 * Large bold headline used at the top of sections. Three size variants:
 * - "hero" (72px) for top-of-page headlines
 * - "section" (56px) for in-page section titles
 * - "sub" (36px) for sub-section showcases
 *
 * Two tones: "light" for dark backgrounds, "dark" for light backgrounds.
 */

import { cn } from '@/components/redesign/lib/cn';

export interface SectionHeadingProps {
  children: React.ReactNode;
  /** Size variant. Defaults to "section". */
  size?: 'hero' | 'section' | 'sub';
  /** Render as a different heading level. Defaults to h2. */
  as?: 'h1' | 'h2' | 'h3';
  /**
   * Text tone. "dark" is default and works on light backgrounds.
   * Use "light" on dark sections.
   */
  tone?: 'dark' | 'light';
  className?: string;
}

export function SectionHeading({
  children,
  size = 'section',
  as: Tag = 'h2',
  tone = 'dark',
  className,
}: SectionHeadingProps) {
  const sizeClasses = {
    hero: 'text-5xl md:text-[72px] leading-[1.05]',
    section: 'text-4xl md:text-[56px] leading-[1.1]',
    sub: 'text-3xl md:text-[36px] leading-[1.15]',
  }[size];

  const toneClasses = tone === 'light' ? 'text-gt-text-light' : 'text-gt-text';

  return (
    <Tag
      className={cn('font-extrabold', sizeClasses, toneClasses, className)}
      style={{ letterSpacing: '-0.03em' }}
    >
      {children}
    </Tag>
  );
}
