/**
 * EFSourceCard
 *
 * Shows publisher + document-type + license + direct PDF link.
 * Used on the single-factor page and as the header block on source pages.
 */

import Link from 'next/link';
import { ExternalLink, FileText, Scale } from 'lucide-react';
import type { Source } from '@/lib/emission-factors/types';
import { licenseUrl } from '@/lib/emission-factors/license';

export interface EFSourceCardProps {
  source: Source;
  /** When true, renders a link to the source page (used on factor pages). */
  linkToSource?: boolean;
}

export function EFSourceCard({ source, linkToSource = true }: EFSourceCardProps) {
  return (
    <div className="rounded-2xl bg-white border border-gt-border-light shadow-gt-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gt-text-dim">
            Source
          </div>
          <div className="mt-1 font-semibold text-gt-text">{source.publisher_short}</div>
          <div className="text-sm text-gt-text-muted">{source.publisher}</div>
          <div className="mt-3 text-sm text-gt-text">{source.name}</div>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-[0.08em] text-gt-text-dim">
            Document type
          </dt>
          <dd className="text-gt-text capitalize">{source.document_type.replace(/_/g, ' ')}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.08em] text-gt-text-dim">Vintage</dt>
          <dd className="text-gt-text">{source.vintage_year}</dd>
        </div>
        <div className="sm:col-span-2 flex items-start gap-2">
          <Scale className="h-4 w-4 mt-0.5 text-[#2D6A4F]" aria-hidden />
          <div>
            <dt className="sr-only">License</dt>
            <dd className="text-sm text-gt-text">
              {(() => {
                const url = licenseUrl(source.license);
                return url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-gt-border-light hover:decoration-[#2D6A4F] hover:text-[#2D6A4F] transition-colors"
                  >
                    {source.license}
                  </a>
                ) : (
                  source.license
                );
              })()}
            </dd>
          </div>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-3">
        {source.source_pdf_url && (
          <a
            href={source.source_pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-gt-border-light bg-gt-pale px-3 py-1.5 text-xs font-semibold text-gt-text hover:border-[#95D5B2] hover:text-[#2D6A4F]"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Source document
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        )}
        <a
          href={source.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-gt-border-light bg-gt-pale px-3 py-1.5 text-xs font-semibold text-gt-text hover:border-[#95D5B2] hover:text-[#2D6A4F]"
        >
          Publisher page
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
        {linkToSource && (
          <Link
            href={`/emission-factors/sources/${source.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#2D6A4F] text-white px-3 py-1.5 text-xs font-semibold hover:bg-[#1B4332]"
          >
            View all factors from this source
          </Link>
        )}
      </div>
    </div>
  );
}
