/**
 * reading-time.ts - Pure utility for computing reading time from MDX content.
 * Used at build time by courses.ts and the search index generator.
 */

/**
 * Strip MDX/JSX/Markdown syntax to extract plain text for word counting.
 */
export function stripMdx(raw: string): string {
  let text = raw;

  // Remove MDX comments {/* ... */}
  text = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

  // Remove mermaid code blocks entirely
  text = text.replace(/```mermaid[\s\S]*?```/g, '');

  // Remove other fenced code blocks
  text = text.replace(/```[\s\S]*?```/g, '');

  // Remove JSX/HTML self-closing tags (e.g. <br />, <HighlightBox />)
  text = text.replace(/<[A-Za-z][^>]*\/>/g, '');

  // Remove JSX/HTML opening tags but keep inner text
  text = text.replace(/<[A-Za-z][^>]*>/g, '');

  // Remove closing tags
  text = text.replace(/<\/[A-Za-z][^>]*>/g, '');

  // Remove markdown image syntax ![alt](url)
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');

  // Remove markdown link syntax [text](url) - keep text
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

  // Remove heading markers
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove bold/italic markers
  text = text.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1');
  text = text.replace(/_{1,3}([^_]+)_{1,3}/g, '$1');

  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');

  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Compute reading time from MDX content.
 * Uses 200 WPM for technical content, minimum 1 minute.
 */
export function computeReadingTime(mdxContent: string): { wordCount: number; minutes: number } {
  const plainText = stripMdx(mdxContent);
  const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
  const minutes = Math.max(1, Math.round(wordCount / 200));
  return { wordCount, minutes };
}
