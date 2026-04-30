/**
 * Tiny class-name joiner. Mirrors the redesign helper so armor components
 * have no dependency on the legacy redesign folder.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
