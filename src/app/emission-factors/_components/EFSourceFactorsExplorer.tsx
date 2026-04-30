'use client';

/**
 * EFSourceFactorsExplorer
 *
 * Wraps EFResultsTable with an inline search input + filter chip row for
 * the source detail page. Filter option sets (scopes, fuel types, units)
 * are derived from the incoming rows so new sources automatically pick up
 * relevant filter chips without code changes.
 *
 * Search is client-side substring match across title, sub_category, tags,
 * sector, and fuel_type. Filters combine with AND semantics.
 */

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { FactorSearchRow } from '@/lib/emission-factors/types';
import { EFResultsTable } from './EFResultsTable';

export interface EFSourceFactorsExplorerProps {
  rows: FactorSearchRow[];
  hideSource?: boolean;
}

function uniqueSorted<T>(values: Iterable<T>, sorter?: (a: T, b: T) => number): T[] {
  const set = new Set(values);
  const arr = Array.from(set);
  if (sorter) arr.sort(sorter);
  return arr;
}

const UNIT_ORDER = [
  'kWh (Net CV)',
  'kWh (Gross CV)',
  'kWh',
  'litres',
  'cubic metres',
  'tonnes',
  'kg',
  'km',
  'miles',
  'passenger.km',
  'tonne.km',
  'GJ',
];

function unitSort(a: string, b: string): number {
  const ai = UNIT_ORDER.indexOf(a);
  const bi = UNIT_ORDER.indexOf(b);
  if (ai === -1 && bi === -1) return a.localeCompare(b);
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
}

export function EFSourceFactorsExplorer({
  rows,
  hideSource,
}: EFSourceFactorsExplorerProps) {
  const [query, setQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<Set<number>>(new Set());
  const [fuelTypeFilter, setFuelTypeFilter] = useState<Set<string>>(new Set());
  const [unitFilter, setUnitFilter] = useState<Set<string>>(new Set());

  // Derive filter option sets from the rows.
  const scopeOptions = useMemo(
    () =>
      uniqueSorted(
        rows.map((r) => r.scope),
        (a, b) => a - b,
      ),
    [rows],
  );
  const fuelTypeOptions = useMemo(
    () =>
      uniqueSorted(
        rows
          .map((r) => r.fuel_type)
          .filter((v): v is string => !!v),
        (a, b) => a.localeCompare(b),
      ),
    [rows],
  );
  const unitOptions = useMemo(
    () => uniqueSorted(rows.map((r) => r.unit_denominator), unitSort),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (scopeFilter.size > 0 && !scopeFilter.has(r.scope)) return false;
      if (fuelTypeFilter.size > 0) {
        if (!r.fuel_type || !fuelTypeFilter.has(r.fuel_type)) return false;
      }
      if (unitFilter.size > 0 && !unitFilter.has(r.unit_denominator)) return false;
      if (q) {
        const hay = [
          r.title,
          r.sub_category ?? '',
          r.sector ?? '',
          r.fuel_type ?? '',
          r.region_display,
          r.unit_display,
          ...r.tags,
        ]
          .join(' ')
          .toLowerCase();
        if (!q.split(/\s+/).every((t) => hay.includes(t))) return false;
      }
      return true;
    });
  }, [rows, query, scopeFilter, fuelTypeFilter, unitFilter]);

  const hasAnyFilter =
    scopeFilter.size > 0 ||
    fuelTypeFilter.size > 0 ||
    unitFilter.size > 0 ||
    query.length > 0;

  function resetAll() {
    setQuery('');
    setScopeFilter(new Set());
    setFuelTypeFilter(new Set());
    setUnitFilter(new Set());
  }

  return (
    <div className="space-y-5">
      {/* Search input */}
      <div className="flex w-full items-center gap-2 rounded-2xl bg-white shadow-gt-card border border-gt-border-light px-4 py-3 focus-within:shadow-gt-card-hover transition-shadow">
        <Search className="h-5 w-5 text-gt-text-dim flex-shrink-0" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter factors by fuel, activity, or unit"
          className="flex-1 bg-transparent outline-none text-base text-gt-text placeholder:text-gt-text-dim"
          aria-label="Filter factors"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-gt-text-dim hover:text-gt-text"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter chip rows */}
      <div className="rounded-2xl bg-white border border-gt-border-light p-4 space-y-3">
        {scopeOptions.length > 0 && (
          <ChipRow
            label="Scope"
            options={scopeOptions.map((s) => ({
              key: String(s),
              label: s === 0 ? 'n/a' : `Scope ${s}`,
              active: scopeFilter.has(s),
              onClick: () =>
                setScopeFilter((prev) => {
                  const next = new Set(prev);
                  if (next.has(s)) next.delete(s);
                  else next.add(s);
                  return next;
                }),
            }))}
          />
        )}

        {fuelTypeOptions.length > 0 && (
          <ChipRow
            label="Fuel type"
            options={fuelTypeOptions.map((ft) => ({
              key: ft,
              label: ft,
              active: fuelTypeFilter.has(ft),
              onClick: () =>
                setFuelTypeFilter((prev) => {
                  const next = new Set(prev);
                  if (next.has(ft)) next.delete(ft);
                  else next.add(ft);
                  return next;
                }),
            }))}
          />
        )}

        {unitOptions.length > 0 && (
          <ChipRow
            label="Unit"
            options={unitOptions.map((u) => ({
              key: u,
              label: u,
              active: unitFilter.has(u),
              onClick: () =>
                setUnitFilter((prev) => {
                  const next = new Set(prev);
                  if (next.has(u)) next.delete(u);
                  else next.add(u);
                  return next;
                }),
            }))}
          />
        )}

        {hasAnyFilter && (
          <div className="pt-2 flex items-center justify-between border-t border-gt-border-light">
            <span className="text-xs text-gt-text-dim">
              {filtered.length} of {rows.length} factors match
            </span>
            <button
              type="button"
              onClick={resetAll}
              className="text-xs font-semibold text-[#2D6A4F] hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Results table */}
      <EFResultsTable rows={filtered} hideSource={hideSource} />
    </div>
  );
}

interface ChipRowOption {
  key: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

function ChipRow({ label, options }: { label: string; options: ChipRowOption[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gt-text-dim mr-1 min-w-[72px]">
        {label}
      </span>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={o.onClick}
          aria-pressed={o.active}
          className={
            'inline-flex items-center rounded-full px-3 py-1 text-xs font-mono transition-colors cursor-pointer ' +
            (o.active
              ? 'bg-[#2D6A4F] text-white border border-[#2D6A4F]'
              : 'bg-white text-gt-text-muted border border-gt-border-light hover:border-[#2D6A4F] hover:text-[#2D6A4F]')
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
