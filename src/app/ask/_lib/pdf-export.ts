/**
 * Helpers for building the "Download PDF" export data shape.
 *
 * Converts the streaming pipeline output (query, draft/revised answer,
 * sources, grounding) into a structured document model consumed by
 * `AnswerPdfDocument`. Inline citation pills are replaced with
 * numeric markers `[1]`, `[2]`... in the order of first appearance,
 * and each numbered source is paired with a PDF.js viewer URL that
 * matches exactly what SourceDrawer opens.
 */

import { CITATION_RE, isCitationLike, parseCitation } from './citations';
import { extractDistinctivePhrase } from './highlight';
import type { CitationParts, ResolveResult } from './pipeline-types';

export interface PdfSourceEntry {
  n: number;
  raw: string;
  docTitle: string;
  sectionTitle: string;
  page: string;
  pagePart: string;
  sentence: string;
  viewerUrl: string | null;
  reason?: string;
}

export interface PdfExportData {
  query: string;
  answerSegments: AnswerSegment[];
  /**
   * The full answer with inline citations rewritten as plain `[N]`
   * markers that survive markdown parsing. The PDF renderer parses
   * this as markdown (GFM) and renders citation markers as superscript.
   */
  answerMarkdown: string;
  groundingNote: string | null;
  sources: PdfSourceEntry[];
  generatedAt: string;
}

export type AnswerSegment =
  | { type: 'text'; text: string }
  | { type: 'cite'; n: number };

export interface GroundingLike {
  total_claims: number;
  grounded: number;
  partial?: number;
}

function findSentence(answer: string, citationRaw: string): string {
  const idx = answer.indexOf(`[${citationRaw}]`);
  if (idx === -1) return '';
  let start = idx;
  while (start > 0) {
    const ch = answer[start - 1];
    if (ch === '.' || ch === '!' || ch === '?' || ch === '\n') break;
    start--;
  }
  let end = idx + citationRaw.length + 2;
  while (end < answer.length) {
    const ch = answer[end];
    if (ch === '.' || ch === '!' || ch === '?' || ch === '\n') {
      end++;
      break;
    }
    end++;
  }
  return answer
    .slice(start, end)
    .replace(/\s+/g, ' ')
    .replace(/\[([^\]]+)\]/g, '')
    .trim();
}

function buildViewerUrl(
  origin: string,
  resolved: ResolveResult,
  cit: CitationParts,
  sentence: string
): string | null {
  if (!resolved.available || !resolved.url) return null;
  const page = resolved.page || Number(cit.page) || 1;
  const phrase = extractDistinctivePhrase(sentence || cit.docTitle);
  const hashParts = [`page=${page}`];
  if (phrase) {
    hashParts.push(`search=${encodeURIComponent(phrase)}`);
    hashParts.push('phrase=true');
    hashParts.push('highlightAll=true');
  }
  return `${origin}/pdfjs/web/viewer.html?file=${encodeURIComponent(
    resolved.url
  )}#${hashParts.join('&')}`;
}

async function resolveCitation(cit: CitationParts): Promise<ResolveResult> {
  try {
    const url = `/api/pdfs/resolve?doc=${encodeURIComponent(
      cit.docTitle
    )}&page=${cit.page}`;
    const r = await fetch(url);
    return (await r.json()) as ResolveResult;
  } catch {
    return { available: false, reason: 'fetch_error' };
  }
}

/**
 * Build the PDF export data from the current answer state.
 * - Walks the answer string, extracting inline citations in order
 *   of first appearance; duplicates reuse the same number.
 * - Produces answer segments (text runs + numeric markers) ready
 *   to be rendered by react-pdf.
 * - Resolves each unique source to its PDF.js viewer URL using the
 *   same /api/pdfs/resolve endpoint and distinctive-phrase logic
 *   as SourceDrawer.
 */
export async function buildPdfExportData(opts: {
  query: string;
  answer: string;
  origin: string;
  grounding?: GroundingLike | null;
  resolverCache?: Map<string, ResolveResult>;
}): Promise<PdfExportData> {
  const { query, answer, origin, grounding, resolverCache } = opts;

  const segments: AnswerSegment[] = [];
  const sourceOrder: string[] = [];
  const sourceByKey = new Map<string, PdfSourceEntry>();
  const markdownParts: string[] = [];

  CITATION_RE.lastIndex = 0;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let counter = 0;

  const pushText = (s: string) => {
    if (!s) return;
    segments.push({ type: 'text', text: s });
  };

  while ((m = CITATION_RE.exec(answer)) !== null) {
    if (!isCitationLike(m[1])) continue;
    if (m.index > lastIndex) {
      const chunk = answer.slice(lastIndex, m.index);
      pushText(chunk);
      markdownParts.push(chunk);
    }
    const raw = m[1];
    const cit = parseCitation(raw);
    const key = raw.toLowerCase();
    let entry = sourceByKey.get(key);
    if (!entry) {
      counter += 1;
      entry = {
        n: counter,
        raw,
        docTitle: cit.docTitle,
        sectionTitle: cit.sectionTitle,
        page: cit.page,
        pagePart: cit.pagePart,
        sentence: findSentence(answer, raw),
        viewerUrl: null,
      };
      sourceByKey.set(key, entry);
      sourceOrder.push(key);
    }
    segments.push({ type: 'cite', n: entry.n });
    markdownParts.push(`[${entry.n}]`);
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < answer.length) {
    const tail = answer.slice(lastIndex);
    pushText(tail);
    markdownParts.push(tail);
  }
  const answerMarkdown = markdownParts.join('');

  // Resolve viewer URLs in parallel, reusing cache if provided.
  await Promise.all(
    sourceOrder.map(async (key) => {
      const entry = sourceByKey.get(key)!;
      const cit = parseCitation(entry.raw);
      const cacheKey = cit.docTitle.toLowerCase();
      let resolved =
        resolverCache?.get(cacheKey) ??
        (await resolveCitation(cit));
      if (resolverCache && !resolverCache.has(cacheKey)) {
        resolverCache.set(cacheKey, resolved);
      }
      entry.viewerUrl = buildViewerUrl(origin, resolved, cit, entry.sentence);
      if (!resolved.available) entry.reason = resolved.reason;
    })
  );

  let groundingNote: string | null = null;
  if (grounding && grounding.total_claims > 0) {
    const verified = grounding.grounded + (grounding.partial ?? 0);
    groundingNote = `${verified} of ${grounding.total_claims} claims verified by cross-reference`;
  }

  const now = new Date();
  const generatedAt = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    query,
    answerSegments: segments,
    answerMarkdown,
    groundingNote,
    sources: sourceOrder.map((k) => sourceByKey.get(k)!),
    generatedAt,
  };
}

export function slugForFilename(q: string, maxLen = 40): string {
  const base = q
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen)
    .replace(/-+$/g, '');
  return base || 'query';
}

export function todayYYYYMMDD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
