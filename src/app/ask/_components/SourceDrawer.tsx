'use client';

import { useEffect, useState } from 'react';
import { X, ExternalLink, FileSearch } from 'lucide-react';
import type { CitationParts, ResolveResult } from '../_lib/pipeline-types';
import { buildHighlightFallbacks } from '../_lib/highlight';

interface SourceDrawerProps {
  citation: CitationParts | null;
  sourceContent?: string;
  claimSentence?: string;
  resolveCache: Map<string, ResolveResult>;
  resolveCitation: (cit: CitationParts) => Promise<ResolveResult>;
  onClose: () => void;
}

export function SourceDrawer({
  citation,
  sourceContent,
  claimSentence,
  resolveCache,
  resolveCitation,
  onClose,
}: SourceDrawerProps) {
  const [resolved, setResolved] = useState<ResolveResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!citation) {
      setResolved(null);
      return;
    }
    const key = citation.docTitle.toLowerCase();
    const cached = resolveCache.get(key);
    if (cached) {
      setResolved(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    setResolved(null);
    resolveCitation(citation)
      .then((data) => setResolved(data))
      .catch(() => setResolved({ available: false, reason: 'fetch_error' }))
      .finally(() => setLoading(false));
  }, [citation, resolveCache, resolveCitation]);

  useEffect(() => {
    if (!citation) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [citation, onClose]);

  if (!citation) return null;

  const fallbacks = buildHighlightFallbacks(sourceContent || '');
  const searchHint = fallbacks[0] || '';
  const page = resolved?.page ?? citation.page;

  let iframeUrl = '';
  if (resolved?.available && resolved.url) {
    const hashParts = [`page=${page}`];
    if (searchHint) {
      hashParts.push(`search=${encodeURIComponent(searchHint)}`);
      hashParts.push(`phrase=true`);
      hashParts.push(`highlightAll=true`);
    }
    iframeUrl = `/pdfjs/web/viewer.html?file=${encodeURIComponent(resolved.url)}#${hashParts.join('&')}`;
  }

  const monoStyle = {
    fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
    letterSpacing: '0.06em',
  } as const;

  return (
    <>
      <div
        className="fixed inset-0 bg-gt-text/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 h-full w-full md:w-[min(720px,55vw)] bg-gt-bg-pale shadow-gt-card z-50 flex flex-col animate-[gtSlideIn_0.25s_ease-out]"
        style={{ animation: 'gtSlideIn 0.25s ease-out' }}
      >
        <header className="border-b border-gt-border-light px-5 py-4 flex items-start justify-between bg-white">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-gt-medium" />
              <span
                className="text-[10px] uppercase text-gt-medium font-bold"
                style={{ ...monoStyle, letterSpacing: '0.2em' }}
              >
                Source preview
              </span>
            </div>
            <h2 className="text-base font-bold text-gt-deepest truncate">
              {citation.docTitle}
            </h2>
            <p className="text-xs text-gt-text-muted mt-0.5 truncate">
              {citation.sectionTitle}
              {citation.pagePart && (
                <>
                  {' · '}<span className="font-mono">{citation.pagePart}</span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 inline-flex items-center justify-center w-8 h-8 rounded-lg text-gt-text-dim hover:text-gt-text hover:bg-gt-medium/[0.06]"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </header>

        {claimSentence && (
          <div className="border-b border-gt-border-light px-5 py-3 bg-gt-leaf/10">
            <div
              className="text-[10px] text-gt-medium font-bold mb-1"
              style={{ ...monoStyle, letterSpacing: '0.18em' }}
            >
              CLAIM BEING VERIFIED
            </div>
            <p className="text-xs text-gt-text leading-relaxed italic">
              &ldquo;{claimSentence}&rdquo;
            </p>
            {searchHint && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gt-text-muted">
                <FileSearch className="w-3 h-3" strokeWidth={2} />
                Searching PDF for:{' '}
                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gt-border-light">
                  {searchHint}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-hidden bg-gt-medium/[0.04]">
          {loading && (
            <div className="h-full flex items-center justify-center text-sm text-gt-text-muted">
              Resolving source...
            </div>
          )}
          {!loading && resolved?.available && iframeUrl && (
            <iframe
              src={iframeUrl}
              className="w-full h-full border-0 bg-white"
              title={`${citation.docTitle} p.${citation.page}`}
            />
          )}
          {!loading && resolved && !resolved.available && (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-3">
              <FileSearch className="w-10 h-10 text-gt-text-dim" strokeWidth={1.5} />
              <div className="text-sm font-semibold text-gt-text">
                PDF not available
              </div>
              <div className="text-xs text-gt-text-muted max-w-md">
                {resolved.reason === 'no_catalog_match'
                  ? `Could not find a document matching "${citation.docTitle}" in the catalog.`
                  : resolved.reason === 'pdf_not_found_on_disk'
                  ? "The catalog has this document but the PDF file isn't on the local disk yet."
                  : 'Source could not be resolved.'}
              </div>
              {sourceContent && (
                <div className="mt-4 max-w-md text-left bg-white border border-gt-border-light rounded-2xl p-4 shadow-gt-card">
                  <div
                    className="text-[10px] text-gt-text-muted mb-2 font-bold"
                    style={{ ...monoStyle, letterSpacing: '0.18em' }}
                  >
                    RETRIEVED CHUNK TEXT
                  </div>
                  <div className="text-xs text-gt-text leading-relaxed">
                    {sourceContent}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {resolved?.available && (
          <footer className="border-t border-gt-border-light px-5 py-2.5 bg-white text-[11px] text-gt-text-muted">
            <div className="flex items-center justify-between">
              <span>
                Page {resolved.page}
                {resolved.total_pages ? ` of ${resolved.total_pages}` : ''}
              </span>
              <a
                href={iframeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-gt-medium hover:text-gt-deepest font-semibold"
                title="Open viewer in new tab"
              >
                Open viewer
                <ExternalLink className="w-3 h-3" strokeWidth={2} />
              </a>
            </div>
            {fallbacks.length > 1 && (
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-gt-text-dim">Other search hints:</span>
                {fallbacks.slice(1).map((f, i) => {
                  const altUrl = `/pdfjs/web/viewer.html?file=${encodeURIComponent(resolved.url!)}#page=${resolved.page}&search=${encodeURIComponent(f)}&phrase=true&highlightAll=true`;
                  return (
                    <a
                      key={i}
                      href={altUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-1.5 py-0.5 rounded bg-gt-medium/[0.06] border border-gt-medium/20 hover:border-gt-medium/50 text-gt-medium font-mono text-[10px]"
                      title={`Try this search instead: ${f}`}
                    >
                      {f.length > 30 ? f.slice(0, 27) + '...' : f}
                    </a>
                  );
                })}
              </div>
            )}
          </footer>
        )}
      </aside>
      <style jsx global>{`
        @keyframes gtSlideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
