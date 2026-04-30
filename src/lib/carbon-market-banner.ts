/**
 * carbon-market-banner
 *
 * Server-side MDX preprocessor that injects a <LiveProjectsCard /> tag
 * inline within carbon-markets lessons. Runs once per lesson render
 * (the lesson page is statically generated, so this is effectively
 * build-time work).
 *
 * Placement rule:
 *   - 2nd h2 if the lesson has 2 or more
 *   - 1st h2 if the lesson has exactly 1
 *   - No injection if the lesson has 0 h2s or already contains a
 *     manual <LiveProjectsCard ... /> tag
 *
 * Whitelist:
 *   Only vcm-101, vm0042, and vm0044 are eligible. Expanding the
 *   whitelist is a one-line change. When we add new methodology
 *   courses, add their courseId to WHITELIST and add a config entry
 *   in LiveProjectsCard.tsx.
 */

const WHITELIST = new Set<string>(['vcm-101', 'vm0042', 'vm0044']);

export function shouldInjectBanner(courseId: string): boolean {
  return WHITELIST.has(courseId);
}

/**
 * Inject <LiveProjectsCard courseId="..." lessonId="..." /> into the MDX
 * source after the 2nd top-level h2 (or 1st if only one exists).
 * Returns the original source unchanged when:
 *   - the course is not whitelisted
 *   - the source already contains a manual <LiveProjectsCard tag
 *   - the source has no h2s
 */
export function injectCarbonMarketBanner(
  mdxSource: string,
  courseId: string,
  lessonId: string
): string {
  if (!shouldInjectBanner(courseId)) return mdxSource;

  // Manual override: author already placed the card somewhere in the
  // lesson MDX. Don't add a second.
  if (/<LiveProjectsCard[\s/>]/.test(mdxSource)) return mdxSource;

  // Find top-level h2 headings. Some lessons author headings as markdown
  // `## Heading`, others (notably older vm0042 content) use raw HTML
  // `<h2 ...>...</h2>`. We match both, anchored at column 0 so code
  // fences and nested JSX don't trigger false positives.
  const h2Regex = /^(?:## .+|<h2\b[^>]*>[\s\S]*?<\/h2>)/gm;
  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = h2Regex.exec(mdxSource)) !== null) {
    matches.push(m);
    if (m.index === h2Regex.lastIndex) h2Regex.lastIndex++;
  }

  if (matches.length === 0) return mdxSource;

  const target = matches.length >= 2 ? matches[1] : matches[0];
  // Insert after the full match (end of `## line` or end of `</h2>`)
  const matchEnd = target.index + target[0].length;
  // Walk to the end of the current line so we land on a blank line rather
  // than splitting the middle of a heading.
  const nextNewline = mdxSource.indexOf('\n', matchEnd);
  const insertAt = nextNewline === -1 ? mdxSource.length : nextNewline;

  const tag = `\n\n<LiveProjectsCard courseId="${courseId}" lessonId="${lessonId}" />\n`;

  return mdxSource.slice(0, insertAt) + tag + mdxSource.slice(insertAt);
}
