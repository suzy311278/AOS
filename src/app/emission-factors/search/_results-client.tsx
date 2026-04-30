'use client';

/**
 * Client-side results for the Search surface.
 *
 * Lazy behaviour:
 *  - On mount, if the URL carries `?q=` or any filter param, immediately
 *    load the search index.
 *  - Otherwise show an empty-state teaser. The sidebar filters update the
 *    URL via next/navigation, and the search bar navigates with ?q=; both
 *    cases re-trigger this effect and load the index then.
 *
 * The server ships no factors; everything here runs after hydration.
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { FactorSearchRow } from '@/lib/emission-factors/types';
import {
  applyFilters,
  getSearchBackend,
} from '@/lib/emission-factors/search-client';
import { EFResultsTable } from '../_components/EFResultsTable';

export function EFResultsTableClient() {
  const searchParams = useSearchParams();
  const q = searchParams?.get('q') ?? '';

  const filters = useMemo(
    () => ({
      source: searchParams?.getAll('source') ?? [],
      scope: searchParams?.getAll('scope') ?? [],
      category: searchParams?.getAll('category') ?? [],
      vintage: searchParams?.getAll('vintage') ?? [],
      methodology: searchParams?.getAll('methodology') ?? [],
      region: searchParams?.getAll('region') ?? [],
    }),
    [searchParams],
  );

  const [rows, setRows] = useState<FactorSearchRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getSearchBackend()
      .search(q)
      .then((result) => {
        if (alive) setRows(result);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [q]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    return applyFilters(rows, filters);
  }, [rows, filters]);

  if (loading && !filtered) {
    return (
      <div className="rounded-2xl border border-gt-border-light bg-white p-10 text-center text-gt-text-muted">
        Loading index.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gt-border-light bg-white p-8 text-center text-red-700">
        Could not load the search index: {error}
      </div>
    );
  }

  if (!filtered) return null;

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-gt-text-dim">
        {filtered.length} factor{filtered.length === 1 ? '' : 's'} found
      </div>
      <EFResultsTable rows={filtered} query="" />
    </div>
  );
}
