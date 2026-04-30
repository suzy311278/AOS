/**
 * course-images
 *
 * Shared per-course background image map. Lives outside any single
 * component so the course detail page hero, the lesson page hero,
 * and any future surface that wants the same imagery can all
 * resolve from a single source of truth.
 *
 * Lookup priority used by callers:
 *   1. caller-supplied override (e.g. an `imageUrl` prop)
 *   2. COURSE_BG_IMAGES[courseId]
 *   3. CATEGORY_BG_IMAGES[category]
 *   4. FALLBACK_BG_IMAGE
 *
 * The 22 published courses are mapped to 13 Unsplash photos in
 * `public/images/course-headers/` by topical relevance, with some
 * deliberate reuse for thematically related courses.
 */

const HEADERS = '/images/course-headers';

export const COURSE_BG_IMAGES: Record<string, string> = {
  // Markets (carbon)
  'article-6': `${HEADERS}/adam-jang-MLKrf51NV8w-unsplash.webp`,
  'vcm-101': `${HEADERS}/vlad-hilitanu-QqSIuvz94s8-unsplash.webp`,
  'vm0042': `${HEADERS}/land-o-lakes-inc-iFx1WMvjvpw-unsplash.webp`,
  'vm0044': `${HEADERS}/matt-palmer-K5KmnZHv1Pg-unsplash.webp`,
  'eu-cbam': `${HEADERS}/venti-views-FPKnAO-CF6M-unsplash.webp`,

  // Fundamentals
  'climate-science-101': `${HEADERS}/alexandre-brondino--bi8zhvPhVA-unsplash.webp`,
  'circular-economy': `${HEADERS}/qingbao-meng-01_igFr7hd4-unsplash.webp`,
  'ghg-scope-1-2': `${HEADERS}/daniel-moqvist-WZw6zs0kKzo-unsplash.webp`,
  'ghg-scope-3': `${HEADERS}/jimmy-desplanques-viJErzTznBQ-unsplash.webp`,
  'sbti': `${HEADERS}/nicholas-doherty-pONBhDyOFoM-unsplash.webp`,
  'tnfd-biodiversity': `${HEADERS}/marina-YmQ0-nmWcV0-unsplash.webp`,

  // ESG
  'esg-reporting': `${HEADERS}/aaron-lefler-ySZdYkPGEbs-unsplash.webp`,
  'double-materiality': `${HEADERS}/qingbao-meng-01_igFr7hd4-unsplash.webp`,
  'esg-benchmarking': `${HEADERS}/aaron-lefler-ySZdYkPGEbs-unsplash.webp`,
  'human-rights-dd': `${HEADERS}/tim-mossholder-xDwEa2kaeJA-unsplash.webp`,
  'ifc-performance-standards': `${HEADERS}/jimmy-desplanques-viJErzTznBQ-unsplash.webp`,
  'ifrs-s2': `${HEADERS}/alexandre-brondino--bi8zhvPhVA-unsplash.webp`,

  // Green finance
  'esg-investing': `${HEADERS}/venti-views-FPKnAO-CF6M-unsplash.webp`,
  'eu-sfdr': `${HEADERS}/aaron-lefler-ySZdYkPGEbs-unsplash.webp`,
  'eu-taxonomy': `${HEADERS}/adam-jang-MLKrf51NV8w-unsplash.webp`,
  'financed-emissions': `${HEADERS}/daniel-moqvist-WZw6zs0kKzo-unsplash.webp`,

  // Standards
  'eudr': `${HEADERS}/matt-palmer-K5KmnZHv1Pg-unsplash.webp`,
};

/** Per-category fallback image used when a course id is not in
 *  COURSE_BG_IMAGES. */
export const CATEGORY_BG_IMAGES: Record<string, string> = {
  fundamentals: `${HEADERS}/alexandre-brondino--bi8zhvPhVA-unsplash.webp`,
  markets: `${HEADERS}/vlad-hilitanu-QqSIuvz94s8-unsplash.webp`,
  esg: `${HEADERS}/aaron-lefler-ySZdYkPGEbs-unsplash.webp`,
  'green-finance': `${HEADERS}/venti-views-FPKnAO-CF6M-unsplash.webp`,
  'sustainability-standards': `${HEADERS}/matt-palmer-K5KmnZHv1Pg-unsplash.webp`,
  methodologies: `${HEADERS}/qingbao-meng-01_igFr7hd4-unsplash.webp`,
};

/** Used when neither a course-id mapping nor a category mapping is
 *  found. Currently the rolling green hills photo. */
export const FALLBACK_BG_IMAGE = `${HEADERS}/qingbao-meng-01_igFr7hd4-unsplash.webp`;

/** Resolve the right background image for a course given an optional
 *  override and the course's category. */
export function resolveCourseImage(
  courseId: string,
  category: string,
  override?: string
): string {
  return (
    override ??
    COURSE_BG_IMAGES[courseId] ??
    CATEGORY_BG_IMAGES[category] ??
    FALLBACK_BG_IMAGE
  );
}
