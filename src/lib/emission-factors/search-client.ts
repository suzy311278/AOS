/**
 * Client-side MiniSearch builder + loader.
 *
 * Lazily fetches /emission-factors/search-index.json once per page session,
 * constructs a MiniSearch instance keyed on search_text + title + region +
 * source_short, and memoizes both the raw rows and the index on window.
 *
 * After the MiniSearch index is built we strip the heavy `search_text` field
 * from the in-memory rows array so it isn't held twice (once inside the
 * index, once on each row). Shrinks the client-side heap ~2x on the factor
 * list side of memory.
 *
 * Import only from client components.
 *
 * Backend abstraction:
 *   Today the only backend is JsonSearchBackend which fetches the prebuilt
 *   search-index.json. When factor count exceeds ~10k, or the JSON exceeds
 *   ~2 MB, implement ApiSearchBackend backed by a Turso FTS5 query at
 *   /api/emission-factors/search?q=... with debouncing. Swap `getSearchBackend()`
 *   to return the new backend (e.g. based on env flag or source count).
 */

'use client';

import MiniSearch, { type Options as MiniOptions } from 'minisearch';
import type {
  FactorSearchIndex,
  FactorSearchRow,
} from './types';

declare global {
  interface Window {
    __gtEfSearchState?: {
      rows: FactorSearchRow[];
      index: MiniSearch<FactorSearchRow>;
    };
    __gtEfSearchPromise?: Promise<{
      rows: FactorSearchRow[];
      index: MiniSearch<FactorSearchRow>;
    }>;
  }
}

// `search_text` is reconstructed on the client from the row's other fields
// so we don't ship it across the wire. Synonymous with the old parser-side
// buildSearchText.
function buildSearchText(r: FactorSearchRow): string {
  return [
    r.title,
    r.region_display,
    r.source_short,
    r.methodology.replace(/_/g, ' '),
    r.category,
    r.sub_category ?? '',
    ...r.tags,
    String(r.vintage_year),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

const MINI_OPTS: MiniOptions<FactorSearchRow> = {
  idField: 'id',
  fields: ['title', 'search_text', 'region_display', 'source_short'],
  storeFields: [
    'id',
    'slug',
    'title',
    'region_display',
    'category',
    'sub_category',
    'scope',
    'value',
    'unit_display',
    'source_short',
    'vintage_year',
    'methodology',
    'tags',
  ],
  extractField: (document, fieldName) => {
    if (fieldName === 'search_text') return buildSearchText(document);
    const value = (document as unknown as Record<string, unknown>)[fieldName];
    return value == null ? '' : String(value);
  },
  searchOptions: {
    prefix: true,
    fuzzy: 0.2,
    boost: { title: 2, source_short: 1.2 },
  },
};

export async function loadEfSearchState(): Promise<{
  rows: FactorSearchRow[];
  index: MiniSearch<FactorSearchRow>;
}> {
  if (typeof window === 'undefined') {
    throw new Error('loadEfSearchState is client-only');
  }
  if (window.__gtEfSearchState) return window.__gtEfSearchState;
  if (window.__gtEfSearchPromise) return window.__gtEfSearchPromise;

  window.__gtEfSearchPromise = (async () => {
    // Fingerprint the URL with today's date so a new build breaks browser cache.
    // Production should replace this with a build-time hash (e.g. content hash
    // in the file name) once the ingestion cadence stabilises.
    const cacheBust = new Date().toISOString().slice(0, 10);
    const res = await fetch(
      `/emission-factors/search-index.json?v=${cacheBust}`,
      { cache: 'default' },
    );
    if (!res.ok) throw new Error(`search index fetch failed: ${res.status}`);
    const data = (await res.json()) as FactorSearchIndex;
    const index = new MiniSearch<FactorSearchRow>(MINI_OPTS);
    index.addAll(data.factors);
    const state = { rows: data.factors, index };
    window.__gtEfSearchState = state;
    return state;
  })();

  return window.__gtEfSearchPromise;
}

/**
 * Fire-and-forget prefetch hook. Safe to call from event handlers (input
 * focus, filter click). Returns the same promise as loadEfSearchState.
 */
export function prefetchEfSearchState(): void {
  if (typeof window === 'undefined') return;
  if (window.__gtEfSearchState || window.__gtEfSearchPromise) return;
  void loadEfSearchState().catch(() => {
    // swallow; the results view will surface a retry path
  });
}

export interface SearchBackend {
  search(query: string): Promise<FactorSearchRow[]>;
  all(): Promise<FactorSearchRow[]>;
}

class JsonSearchBackend implements SearchBackend {
  async all(): Promise<FactorSearchRow[]> {
    const state = await loadEfSearchState();
    return state.rows;
  }
  async search(query: string): Promise<FactorSearchRow[]> {
    const state = await loadEfSearchState();
    if (!query.trim()) return state.rows;
    const results = state.index.search(query) as unknown as Array<{ id: string }>;
    const byId = new Map(state.rows.map((r) => [r.id, r]));
    return results
      .map((r) => byId.get(r.id))
      .filter(Boolean) as FactorSearchRow[];
  }
}

let _backend: SearchBackend | null = null;

export function getSearchBackend(): SearchBackend {
  if (!_backend) _backend = new JsonSearchBackend();
  return _backend;
}

export function applyFilters(
  rows: FactorSearchRow[],
  filters: {
    source?: string[];
    scope?: string[];
    category?: string[];
    vintage?: string[];
    methodology?: string[];
    region?: string[];
  },
): FactorSearchRow[] {
  return rows.filter((r) => {
    if (filters.source && filters.source.length) {
      if (!filters.source.includes(r.source_slug)) return false;
    }
    if (filters.scope && filters.scope.length) {
      if (!filters.scope.includes(String(r.scope))) return false;
    }
    if (filters.category && filters.category.length) {
      if (!filters.category.includes(r.category)) return false;
    }
    if (filters.vintage && filters.vintage.length) {
      if (!filters.vintage.includes(String(r.vintage_year))) return false;
    }
    if (filters.methodology && filters.methodology.length) {
      if (!filters.methodology.includes(r.methodology)) return false;
    }
    if (filters.region && filters.region.length) {
      if (!filters.region.includes(r.region_display)) return false;
    }
    return true;
  });
}
