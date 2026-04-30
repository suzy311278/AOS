'use client';

import {
  Children,
  useRef,
  type ReactNode,
} from 'react';
import type { CitationParts } from './pipeline-types';

// Matches `[citation-like text]` but NOT a markdown link `[text](url)`.
//
// The inner group allows either:
//   - a non-bracket char, OR
//   - one level of nested `[...]` (e.g. "Scope3 Calculation Guidance 0[1]")
// Without the nested-pair allowance, any source title containing a
// footnote marker like `[1]` would fail to match, leaving the whole
// citation as raw text in the rendered answer.
export const CITATION_RE =
  /\[((?:[^\[\]]|\[[^\[\]]*\]){3,250}?)\](?!\()/g;

export function isCitationLike(content: string): boolean {
  const trimmed = content.trim();
  if (trimmed.startsWith('^')) return false;
  if (/^\d{1,3}$/.test(trimmed)) return false;
  if (trimmed.length <= 1) return false;
  if (/\bp\.\s*\d/i.test(trimmed)) return true;
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((p) => p.trim());
    return parts.length >= 2 && parts.some((p) => p.length >= 3);
  }
  if (/\s/.test(trimmed) && !trimmed.startsWith('http') && trimmed.split(/\s+/).length >= 2) {
    return /[A-Z]/.test(trimmed) || /v\d/.test(trimmed);
  }
  return false;
}

// Strip footnote-style markers like "0[1]" or " [3]" that sometimes ride
// along in LLM-emitted citation titles. They confuse both the visual
// pill and the /api/pdfs/resolve catalog match, and they carry no
// semantic value.
function cleanTitle(s: string): string {
  return s
    .replace(/\s*\d*\[\d+\]\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function parseCitation(raw: string): CitationParts {
  const parts = raw.split(',').map((p) => p.trim());
  const pagePart = parts.find((p) => /^p\./i.test(p)) || '';
  const titleParts = parts.filter((p) => !/^p\./i.test(p));
  const docTitle = cleanTitle(titleParts[0] || raw);
  const sectionTitle = cleanTitle(titleParts.slice(1).join(', '));
  const pageMatch = pagePart.match(/(\d+)/);
  const page = pageMatch ? pageMatch[1] : '1';
  return { raw, docTitle, sectionTitle, page, pagePart };
}

export function findSentenceForCitation(answer: string, citationRaw: string): string {
  if (!answer || !citationRaw) return '';
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

export type CitationVariant = 'redesign' | 'emerald';

interface CitationButtonProps {
  text: string;
  onClick: (citation: CitationParts) => void;
  onPrefetch?: (citation: CitationParts) => void;
  variant?: CitationVariant;
}

export function CitationButton({
  text,
  onClick,
  onPrefetch,
  variant = 'redesign',
}: CitationButtonProps) {
  const cit = parseCitation(text);
  const hoverTimer = useRef<number | null>(null);

  const handleEnter = () => {
    if (!onPrefetch) return;
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => onPrefetch(cit), 200);
  };
  const handleLeave = () => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  // max-w on the pill itself caps how wide a single citation can ever
  // get on a narrow viewport. Without this the pill (with its two 140/120
  // inner truncations) can hit ~300px and overflow a 375px phone. The
  // pill's internal truncation still handles longer texts by …ellipsing.
  const base =
    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold mx-0.5 align-baseline whitespace-nowrap transition-colors cursor-pointer border max-w-full';
  const styles =
    variant === 'emerald'
      ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
      : 'border-gt-medium/25 bg-gt-medium/[0.08] hover:bg-gt-medium/[0.14] hover:border-gt-medium/50 text-gt-deepest';

  const dot =
    variant === 'emerald'
      ? 'bg-emerald-500'
      : 'bg-gt-medium';
  const divider = variant === 'emerald' ? 'text-emerald-400' : 'text-gt-medium/50';
  const pageColor = variant === 'emerald' ? 'text-emerald-700' : 'text-gt-medium';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(cit);
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`${base} ${styles}`}
      title={`Open: ${text}`}
      style={{
        fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        letterSpacing: '0.02em',
      }}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      <span className="font-bold truncate max-w-[90px] sm:max-w-[140px]">{cit.docTitle}</span>
      {cit.sectionTitle && (
        <>
          <span className={`${divider} shrink-0`}>·</span>
          <span className="truncate max-w-[70px] sm:max-w-[120px]">{cit.sectionTitle}</span>
        </>
      )}
      {cit.pagePart && (
        <>
          <span className={`${divider} shrink-0`}>·</span>
          <span className={`${pageColor} font-mono shrink-0`}>{cit.pagePart}</span>
        </>
      )}
    </button>
  );
}

export function renderWithCitations(
  children: ReactNode,
  onCitationClick: (cit: CitationParts) => void,
  onCitationHover?: (cit: CitationParts) => void,
  variant: CitationVariant = 'redesign'
): ReactNode {
  return Children.map(children, (child, i) => {
    if (typeof child === 'string') {
      const parts: ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      CITATION_RE.lastIndex = 0;
      let pillsAdded = 0;
      while ((match = CITATION_RE.exec(child)) !== null) {
        if (!isCitationLike(match[1])) continue;
        if (match.index > lastIndex) parts.push(child.slice(lastIndex, match.index));
        parts.push(
          <CitationButton
            key={`${i}-${match.index}`}
            text={match[1]}
            onClick={onCitationClick}
            onPrefetch={onCitationHover}
            variant={variant}
          />
        );
        lastIndex = match.index + match[0].length;
        pillsAdded++;
      }
      if (lastIndex < child.length) parts.push(child.slice(lastIndex));
      return pillsAdded > 0 ? parts : child;
    }
    return child;
  });
}
