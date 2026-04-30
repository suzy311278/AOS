'use client';

/**
 * Compare picker + table, client-side.
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { ResolvedFactor } from '@/lib/emission-factors/types';
import { EFCompareTable } from '../_components/EFCompareTable';
import type { PickerRow } from './page';

export interface EFCompareClientProps {
  factors: ResolvedFactor[];
  picker: PickerRow[];
}

const MAX = 4;

export function EFCompareClient({ factors, picker }: EFCompareClientProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const bySlug = new Map(factors.map((f) => [f.slug, f]));
  const picked = selected
    .map((slug) => bySlug.get(slug))
    .filter((f): f is ResolvedFactor => Boolean(f));

  const remaining = picker.filter((p) => !selected.includes(p.slug));
  const q = query.trim().toLowerCase();
  const filteredPicker = q
    ? remaining.filter(
        (p) =>
          p.activity.toLowerCase().includes(q) ||
          p.region.toLowerCase().includes(q) ||
          p.source.toLowerCase().includes(q)
      )
    : remaining;

  function add(slug: string) {
    if (selected.length >= MAX) return;
    setSelected((s) => [...s, slug]);
  }

  function remove(slug: string) {
    setSelected((s) => s.filter((x) => x !== slug));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-2xl bg-white border border-gt-border-light shadow-gt-card p-5">
        <div className="text-xs uppercase tracking-[0.08em] text-gt-text-dim">
          Picker
        </div>
        <input
          type="search"
          placeholder="Filter factors."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-2 w-full rounded-lg border border-gt-border-light bg-white px-3 py-2 text-sm outline-none focus:border-[#2D6A4F]"
        />
        <div className="mt-3 text-xs text-gt-text-dim">
          {selected.length} / {MAX} picked
        </div>
        <ul className="mt-3 max-h-[480px] overflow-y-auto space-y-1">
          {filteredPicker.map((p) => (
            <li key={p.slug}>
              <button
                type="button"
                onClick={() => add(p.slug)}
                disabled={selected.length >= MAX}
                className="w-full text-left rounded-lg border border-gt-border-light bg-gt-pale px-3 py-2 text-sm hover:border-[#95D5B2] disabled:opacity-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-gt-text">
                      {p.activity}
                    </div>
                    <div className="text-xs text-gt-text-dim">
                      {p.region} - {p.source}
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-[#2D6A4F] flex-shrink-0" aria-hidden />
                </div>
              </button>
            </li>
          ))}
          {filteredPicker.length === 0 && (
            <li className="text-sm text-gt-text-dim">No more factors to pick.</li>
          )}
        </ul>
      </aside>

      <EFCompareTable factors={picked} onRemove={remove} />
    </div>
  );
}
