'use client';

/**
 * EFFilterSidebar
 *
 * Collapsible filter groups that read and write URL search params. Phase B:
 * only the Source, Scope, and Category filters are wired visually; the
 * search results table currently only applies the `q` text filter. Extending
 * to these params is a trivial Phase C change in EFResultsTable.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import type { Source, Category, Scope } from '@/lib/emission-factors/types';
import { CATEGORY_META, ALL_CATEGORIES } from '@/lib/emission-factors/categories';

export interface EFFilterSidebarProps {
  sources: Source[];
  categories?: Category[];
}

const SCOPES: Scope[] = [1, 2, 3];

export function EFFilterSidebar({
  sources,
  categories = ALL_CATEGORIES,
}: EFFilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      const current = params.getAll(key);
      if (current.includes(value)) {
        params.delete(key);
        for (const v of current.filter((c) => c !== value)) params.append(key, v);
      } else {
        params.append(key, value);
      }
      router.push(`/emission-factors/search?${params.toString()}`);
    },
    [router, searchParams]
  );

  const has = (key: string, value: string) =>
    (searchParams?.getAll(key) ?? []).includes(value);

  return (
    <aside className="rounded-2xl bg-white border border-gt-border-light shadow-gt-card p-5 text-sm">
      <Group title="Source">
        {sources.map((s) => (
          <Check
            key={s.id}
            label={`${s.publisher_short} ${s.vintage_year}`}
            checked={has('source', s.id)}
            onChange={() => toggleParam('source', s.id)}
          />
        ))}
      </Group>

      <Group title="Scope">
        {SCOPES.map((s) => (
          <Check
            key={s}
            label={`Scope ${s}`}
            checked={has('scope', String(s))}
            onChange={() => toggleParam('scope', String(s))}
          />
        ))}
      </Group>

      <Group title="Category">
        {categories.map((c) => (
          <Check
            key={c}
            label={CATEGORY_META[c].shortLabel}
            checked={has('category', c)}
            onChange={() => toggleParam('category', c)}
          />
        ))}
      </Group>
    </aside>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gt-border-light py-3 last:border-b-0">
      <div className="text-xs uppercase tracking-[0.08em] text-gt-text-dim mb-2">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-gt-text">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 accent-[#2D6A4F]"
      />
      <span>{label}</span>
    </label>
  );
}
