'use client';

import { useCallback, useRef } from 'react';
import type { CitationParts, ResolveResult } from './pipeline-types';

export interface ResolverHandle {
  cache: Map<string, ResolveResult>;
  resolveCitation: (cit: CitationParts) => Promise<ResolveResult>;
  handleHover: (cit: CitationParts) => void;
}

export function useResolver(): ResolverHandle {
  const cacheRef = useRef<Map<string, ResolveResult>>(new Map());
  const inflightRef = useRef<Map<string, Promise<ResolveResult>>>(new Map());

  const resolveCitation = useCallback(
    (cit: CitationParts): Promise<ResolveResult> => {
      const key = cit.docTitle.toLowerCase();
      const cached = cacheRef.current.get(key);
      if (cached) return Promise.resolve(cached);
      const existing = inflightRef.current.get(key);
      if (existing) return existing;

      const url = `/api/pdfs/resolve?doc=${encodeURIComponent(cit.docTitle)}&page=${cit.page}`;
      const promise = fetch(url)
        .then((r) => r.json() as Promise<ResolveResult>)
        .then((data) => {
          cacheRef.current.set(key, data);
          inflightRef.current.delete(key);
          if (data.available && data.url) {
            fetch(data.url, { method: 'GET', headers: { Range: 'bytes=0-1023' } }).catch(
              () => {}
            );
          }
          return data;
        })
        .catch(() => {
          inflightRef.current.delete(key);
          const fallback: ResolveResult = { available: false, reason: 'fetch_error' };
          cacheRef.current.set(key, fallback);
          return fallback;
        });
      inflightRef.current.set(key, promise);
      return promise;
    },
    []
  );

  const handleHover = useCallback(
    (cit: CitationParts) => {
      const key = cit.docTitle.toLowerCase();
      if (cacheRef.current.has(key)) return;
      if (inflightRef.current.has(key)) return;
      void resolveCitation(cit);
    },
    [resolveCitation]
  );

  return {
    cache: cacheRef.current,
    resolveCitation,
    handleHover,
  };
}
