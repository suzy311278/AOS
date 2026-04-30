/**
 * Allowlist sanitizer for lesson "symbol" strings (equation variables,
 * chemical formulas, etc.) that are later passed to dangerouslySetInnerHTML.
 *
 * The only tags we ever author in symbols are <sub>, <sup>, and <br/>. This
 * escapes everything then re-enables those three — so even if a lesson file
 * is compromised upstream, arbitrary <script>, <img onerror>, or event
 * handlers can't reach the renderer.
 *
 * Not a replacement for dompurify; kept intentionally tiny because the input
 * surface is also intentionally tiny.
 */
export function sanitizeSymbol(raw: string): string {
  if (!raw) return '';
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return escaped
    .replace(/&lt;sub&gt;/gi, '<sub>')
    .replace(/&lt;\/sub&gt;/gi, '</sub>')
    .replace(/&lt;sup&gt;/gi, '<sup>')
    .replace(/&lt;\/sup&gt;/gi, '</sup>')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br/>');
}
