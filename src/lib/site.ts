/**
 * Single source of truth for the canonical production origin.
 *
 * All metadata (canonical URLs, Open Graph URLs, Twitter URLs),
 * all JSON-LD @id / url fields, all sitemap entries, and any
 * non-relative absolute URL emitted by the app must derive from
 * SITE_ORIGIN.
 *
 * Never hardcode `https://greentryst.com` or `https://www.greentryst.com`
 * anywhere else. Import from here.
 *
 * www is the canonical host because production serves www and apex
 * permanently redirects to it. See SEO/baselines/ for the audit history.
 */
export const SITE_ORIGIN = 'https://www.greentryst.com';
