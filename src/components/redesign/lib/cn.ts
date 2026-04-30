/**
 * Tiny className composer for the redesign component library.
 *
 * Keeps us free of runtime dependencies like clsx or classnames. Accepts
 * any mix of strings, undefined, null, false, or numbers and joins the
 * truthy string values with a single space.
 *
 * Usage:
 *   cn('base', isActive && 'active', className)
 */
export function cn(...args: Array<string | number | false | null | undefined>): string {
  return args.filter(Boolean).join(' ');
}
