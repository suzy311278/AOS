'use client';

/**
 * EFCitationBlock
 *
 * Tabbed block (Inline / APA / Harvard / Copy-as-value) showing deterministic
 * citation strings. Each tab has a Copy button. Copy-as-value includes a toggle
 * to drop the " - via Greentryst" attribution suffix.
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

export interface EFCitationBlockProps {
  factor: Factor;
  source: Source;
}

export function EFCitationBlock({ factor, source }: EFCitationBlockProps) {
  const [active, setActive] = useState<CitationFormat>('inline');
  const [copied, setCopied] = useState(false);

  const text = formatCitation(factor, source, active, { attribution: true });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // no-op
    }
  }

  return (
    <div className="rounded-2xl border border-gt-border-light bg-white shadow-gt-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-gt-border-light bg-gt-pale px-4 py-2">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors ' +
                (active === t.id
                  ? 'bg-[#2D6A4F] text-white'
                  : 'text-gt-text-muted hover:text-[#2D6A4F]')
              }
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-full border border-gt-border-light bg-white px-3 py-1 text-xs font-semibold text-gt-text hover:border-[#95D5B2] hover:text-[#2D6A4F]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="font-redesign-mono text-sm text-gt-text px-4 py-4 whitespace-pre-wrap break-words">
        {text}
      </pre>
    </div>
  );
}
