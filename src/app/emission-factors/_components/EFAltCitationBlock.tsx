'use client';

/**
 * EFAltCitationBlock
 *
 * Dark-surface variant of the citation block for the brutalist factor page.
 * Same 4 formats (Inline / APA / Harvard / Copy value), same attribution
 * toggle on Copy-value, restyled for the dark brutalist aesthetic.
 */

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { Factor, Source } from '@/lib/emission-factors/types';
import { formatCitation, type CitationFormat } from '@/lib/emission-factors/citations';

const TABS: { id: CitationFormat; label: string }[] = [
  { id: 'inline', label: 'Inline' },
  { id: 'apa', label: 'APA' },
  { id: 'harvard', label: 'Harvard' },
  { id: 'copy_value', label: 'Copy value' },
];

export interface EFAltCitationBlockProps {
  factor: Factor;
  source: Source;
}

export function EFAltCitationBlock({ factor, source }: EFAltCitationBlockProps) {
  const [active, setActive] = useState<CitationFormat>('inline');
  const [copied, setCopied] = useState(false);

  const text = formatCitation(factor, source, active, { attribution: true });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-[0.14em] font-mono">
        {TABS.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={
                'px-2.5 py-1 rounded-md transition-colors ' +
                (isActive
                  ? 'bg-[#95D5B2]/10 text-[#95D5B2] ring-1 ring-[#95D5B2]/40'
                  : 'text-white/50 hover:text-white/80')
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-start gap-3">
        <pre className="flex-1 whitespace-pre-wrap break-words rounded-md bg-white/[0.04] px-3 py-2.5 text-[13px] text-white/90 leading-relaxed font-mono">
          {text}
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#95D5B2]/10 hover:bg-[#95D5B2]/20 px-3 py-2 text-[12px] text-[#95D5B2] ring-1 ring-[#95D5B2]/30 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2.25} />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" strokeWidth={2} />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
