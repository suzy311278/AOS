/**
 * url-helpers.ts — Pure URL conversion functions, safe for both server and client.
 *
 * Kept separate from courses.ts (which uses Node.js 'fs') so client components
 * can import these without pulling in server-only modules.
 */

/**
 * Convert a lesson ID (e.g. "0.1", "CAP") to a URL-safe segment.
 * Dots become underscores: "0.1" → "0_1", "CAP" → "CAP"
 */
export function lessonIdToUrl(lessonId: string): string {
  return lessonId.replace('.', '_');
}

/**
 * Convert a URL segment back to a lesson ID.
 * Underscores become dots: "0_1" → "0.1", "CAP" → "CAP"
 */
export function urlToLessonId(urlParam: string): string {
  // Only replace the first underscore (lesson IDs have at most one dot)
  return urlParam.replace('_', '.');
}
