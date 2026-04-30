/**
 * Central metadata factory. Every page should call this from its
 * `generateMetadata` (or assign the result to `export const metadata`)
 * to guarantee:
 *   - self-referential canonical under metadataBase
 *   - Open Graph `url` that matches canonical
 *   - titles that do NOT include ` | Greentryst` or ` - Greentryst`
 *     suffixes (the root layout's title.template appends them)
 *
 * Usage:
 *   export const metadata = buildPageMetadata({
 *     path: '/tools',
 *     title: 'Tools',
 *     description: 'Practitioner tools for sustainability reporting.',
 *   });
 *
 * Dynamic routes call from inside `generateMetadata({ params })`:
 *   return buildPageMetadata({
 *     path: `/courses/${params.courseId}`,
 *     title: course.title,
 *     description: course.description,
 *   });
 */
import type { Metadata } from 'next';

interface BuildPageMetadataInput {
  /** Path starting with a slash, e.g. '/tools' or '/courses/ghg-scope-3'. */
  path: string;
  /** Bare title. Do not append ' | Greentryst' — the root title.template handles it. */
  title: string;
  /** Meta description. Should be 120-160 chars for best SERP rendering. */
  description: string;
  /** Optional override for OG type. Defaults to 'website'. */
  ogType?: 'website' | 'article';
  /**
   * Optional OG image URL. Can be relative (resolved under metadataBase)
   * or absolute. Falls back to the site-wide default if omitted.
   */
  ogImage?: string;
  /** Optional noindex flag for auth-gated or draft pages. */
  noindex?: boolean;
}

export function buildPageMetadata({
  path,
  title,
  description,
  ogType = 'website',
  ogImage,
  noindex,
}: BuildPageMetadataInput): Metadata {
  if (!path.startsWith('/')) {
    throw new Error(`buildPageMetadata: path must start with "/" (got: ${path})`);
  }
  // Strip trailing suffix defensively if a caller accidentally includes it.
  // The root layout's title.template appends ' | Greentryst' — adding it
  // here again is the exact bug we are fixing.
  const cleanTitle = title
    .replace(/\s*[|\-–]\s*Greentryst\s*(\|\s*Greentryst)?\s*$/i, '')
    .trim();

  const meta: Metadata = {
    title: cleanTitle,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: ogType,
      url: path,
      title: cleanTitle,
      description,
      siteName: 'Greentryst',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanTitle,
      description,
    },
  };

  if (noindex) {
    meta.robots = { index: false, follow: true };
  }

  return meta;
}
