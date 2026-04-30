/**
 * Smart highlight-phrase extraction for the PDF.js viewer.
 * Extracted verbatim from src/app/ask-test/AskTestClient.tsx.
 */

export const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'of', 'in',
  'on', 'at', 'to', 'for', 'with', 'by', 'from', 'as', 'this', 'that', 'these',
  'those', 'it', 'its', 'or', 'and', 'but', 'if', 'then', 'when', 'where', 'how',
  'what', 'which', 'who', 'why', 'while', 'also', 'may', 'can', 'shall', 'must',
  'should', 'would', 'could', 'have', 'has', 'had', 'do', 'does', 'did', 'not',
  'no', 'yes', 'than', 'such', 'each', 'every', 'any', 'all', 'some',
]);

export function extractDistinctivePhrase(text: string): string {
  if (!text) return '';
  const cleaned = text
    .replace(/^[\-*•]\s+/, '')
    .replace(/[\n\r\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';

  const tokens = cleaned.split(' ').filter(Boolean);
  if (tokens.length === 0) return '';

  const tokenScore = (raw: string): number => {
    const lower = raw.toLowerCase().replace(/[^a-z0-9]/gi, '');
    if (!lower) return -2;
    let s = 0;
    if (/\d/.test(raw)) s += 5;
    if (/[%$£€]/.test(raw)) s += 4;
    if (/^[A-Z]{2,}/.test(raw)) s += 3;
    if (/^[A-Z]/.test(raw) && !STOPWORDS.has(lower)) s += 2;
    if (lower.length >= 8 && !STOPWORDS.has(lower)) s += 1;
    if (STOPWORDS.has(lower)) s -= 1;
    return s;
  };

  const candidateLengths = [5, 4, 6];
  let bestScore = -Infinity;
  let bestPhrase = '';

  for (const len of candidateLengths) {
    if (tokens.length < len) continue;
    for (let i = 0; i + len <= tokens.length; i++) {
      const window = tokens.slice(i, i + len);
      let score = window.reduce((a, t) => a + tokenScore(t), 0);
      const hasNum = window.some((t) => /\d/.test(t));
      const hasProper = window.some((t) => /^[A-Z]/.test(t));
      if (hasNum && hasProper) score += 4;
      const firstLower = window[0].toLowerCase().replace(/[^a-z0-9]/gi, '');
      if (STOPWORDS.has(firstLower)) score -= 2;
      if (window.some((t) => /-$/.test(t))) score -= 3;
      if (window.some((t) => /[\(\)\[\]]/.test(t))) score -= 1;
      if (len === 5) score += 0.5;
      if (score > bestScore) {
        bestScore = score;
        bestPhrase = window.join(' ');
      }
    }
  }

  if (!bestPhrase) bestPhrase = tokens.slice(0, 5).join(' ');
  bestPhrase = bestPhrase.replace(/[.,;:!?]+$/, '').trim();
  return bestPhrase.slice(0, 80);
}

export function buildHighlightFallbacks(content: string): string[] {
  if (!content) return [];
  const candidates: string[] = [];
  const distinct = extractDistinctivePhrase(content);
  if (distinct) candidates.push(distinct);

  const sentences = content.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 20);
  if (sentences.length) {
    const first = sentences[0].slice(0, 80).replace(/[^\w\s%$£€]/g, '').trim();
    if (first && !candidates.includes(first)) candidates.push(first);
  }
  const firstWords = content
    .replace(/[\n\r]+/g, ' ')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .join(' ');
  if (firstWords && !candidates.includes(firstWords)) candidates.push(firstWords);
  return candidates.filter(Boolean);
}
