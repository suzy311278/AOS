/**
 * License-name to canonical URL map for emission-factor sources.
 *
 * Used in two places:
 *   1. JSON-LD Dataset/DataCatalog `license` field (Google requires URL or
 *      CreativeWork, not a plain string).
 *   2. On-page attribution rendering, so "Open Government Licence v3.0"
 *      links to the licence terms as OGL v3.0 compliance requires.
 *
 * Extend this map as new sources are onboarded.
 */

const LICENSE_URLS: Record<string, string> = {
  'Open Government Licence v3.0':
    'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'CC BY-NC 4.0': 'https://creativecommons.org/licenses/by-nc/4.0/',
  'CC BY-ND 4.0': 'https://creativecommons.org/licenses/by-nd/4.0/',
  'CC0 1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
};

/** Returns the canonical URL for a known license name, or null. */
export function licenseUrl(name: string): string | null {
  return LICENSE_URLS[name] ?? null;
}
