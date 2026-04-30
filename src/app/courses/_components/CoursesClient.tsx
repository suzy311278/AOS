/**
 * CoursesClient
 *
 * Documentation-style catalogue. Two-column layout:
 *   - Sticky LEFT RAIL (280px): search input, an "ALL COURSES (N)"
 *     header, then a list of category links with live counts. The
 *     active category is highlighted with a left border and tinted
 *     background. A "Hide coming soon" toggle sits at the bottom.
 *   - Right column (flex-1): the catalogue itself rendered as a
 *     series of category SECTIONS. Each section has a mono uppercase
 *     heading like "FUNDAMENTALS / 6 COURSES" followed by a vertical
 *     stack of CourseRow entries.
 *
 * Search filtering:
 *   - Searches title, subtitle, description, and skill chips
 *   - When the user is searching or filtering by category, sections
 *     with zero matches are hidden entirely
 *
 * Drafts are always hidden. Coming-soon courses are shown by
 * default (with muted styling) and can be hidden via the toggle.
 */

'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Course } from '@/lib/types';
import { CourseRow, SKILL_MAP } from '@/components/redesign/CourseRow';
import { cn } from '@/components/redesign/lib/cn';

/**
 * Shape passed from the server. Includes pre-computed lesson and
 * module counts so the client does not have to re-derive them.
 */
export interface CatalogueCourse {
  course: Course;
  totalLessons: number;
  moduleCount: number;
}

/**
 * Display order and human labels for category sections. Order
 * matters: this controls how the sections appear in the right
 * column AND how categories appear in the left rail.
 */
const CATEGORY_ORDER: {
  id: Course['category'];
  label: string;
}[] = [
  { id: 'fundamentals', label: 'Fundamentals' },
  { id: 'markets', label: 'Carbon Markets' },
  { id: 'esg', label: 'ESG' },
  { id: 'green-finance', label: 'Green Finance' },
  { id: 'sustainability-standards', label: 'Standards' },
];

export interface CoursesClientProps {
  catalogue: CatalogueCourse[];
}

export function CoursesClient({ catalogue }: CoursesClientProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | Course['category']>(
    'all'
  );
  const [query, setQuery] = useState('');
  const [hideComingSoon, setHideComingSoon] = useState(false);

  /**
   * Per-category counts for the left rail. Drafts are excluded
   * because they are never displayed in the catalogue.
   */
  const counts = useMemo(() => {
    const total = catalogue.filter(
      (c) => c.course.status !== 'draft'
    ).length;
    const map: Record<string, number> = { all: total };
    for (const { course } of catalogue) {
      if (course.status === 'draft') continue;
      map[course.category] = (map[course.category] ?? 0) + 1;
    }
    return map;
  }, [catalogue]);

  /**
   * Filtered catalogue. Drafts always hidden, coming-soon hidden
   * if the toggle is on, query matches against title, subtitle,
   * description, and skill chips.
   */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogue.filter(({ course }) => {
      if (course.status === 'draft') return false;
      if (hideComingSoon && course.status === 'coming-soon') return false;
      if (activeCategory !== 'all' && course.category !== activeCategory)
        return false;
      if (q) {
        const skills = (SKILL_MAP[course.id] ?? []).join(' ').toLowerCase();
        const haystack = (
          course.title +
          ' ' +
          course.subtitle +
          ' ' +
          course.description +
          ' ' +
          skills
        ).toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [catalogue, activeCategory, query, hideComingSoon]);

  /**
   * Group the filtered catalogue by category, preserving the
   * CATEGORY_ORDER. Sections with zero matches are dropped.
   */
  const sections = useMemo(() => {
    return CATEGORY_ORDER.map((cat) => {
      const items = filtered.filter(({ course }) => course.category === cat.id);
      return { ...cat, items };
    }).filter((s) => s.items.length > 0);
  }, [filtered]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-12 lg:gap-16">
      {/* ============================================================
          Sticky left rail
          ============================================================ */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        {/* Search */}
        <div className="relative mb-8">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gt-text-dim pointer-events-none"
            strokeWidth={2}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search catalogue"
            className="w-full pl-10 pr-9 py-2.5 rounded-lg bg-white border border-gt-border-light focus:border-gt-medium focus:outline-none text-sm text-gt-text placeholder:text-gt-text-dim transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gt-text-dim hover:text-gt-text rounded"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Categories */}
        <p
          className="text-[10px] font-bold uppercase text-gt-text-dim mb-3 px-3"
          style={{
            letterSpacing: '0.18em',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          }}
        >
          Categories
        </p>
        <nav className="flex flex-col mb-8">
          <CategoryLink
            label="All courses"
            count={counts.all ?? 0}
            isActive={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          />
          {CATEGORY_ORDER.map((cat) => (
            <CategoryLink
              key={cat.id}
              label={cat.label}
              count={counts[cat.id] ?? 0}
              isActive={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            />
          ))}
        </nav>

        {/* Single inline filter, no header label */}
        <label className="flex items-center gap-2.5 px-3 py-1.5 mt-2 cursor-pointer select-none text-[13px] text-gt-text-muted hover:text-gt-text transition-colors">
          <input
            type="checkbox"
            checked={hideComingSoon}
            onChange={(e) => setHideComingSoon(e.target.checked)}
            className="w-3.5 h-3.5 accent-gt-medium"
          />
          Hide coming soon
        </label>
      </aside>

      {/* ============================================================
          Right column: category sections
          ============================================================ */}
      <main>
        {/* Result count line (only when filtering or searching) */}
        {(query || activeCategory !== 'all') && (
          <p
            className="text-[11px] text-gt-text-dim uppercase mb-8"
            style={{
              letterSpacing: '0.14em',
              fontFamily:
                'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            }}
          >
            Showing {filtered.length}
            {filtered.length === 1 ? ' course' : ' courses'}
            {query && ` matching "${query}"`}
          </p>
        )}

        {sections.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-gt-text-muted">
              No courses match your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setActiveCategory('all');
                setHideComingSoon(false);
              }}
              className="mt-4 text-sm font-semibold text-gt-medium hover:text-gt-deepest"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            {sections.map((section) => (
              <section key={section.id} id={section.id}>
                <div className="mb-2 flex items-baseline justify-between gap-4 pb-4 border-b border-gt-border-light">
                  <h2
                    className="text-[15px] font-bold uppercase text-gt-medium"
                    style={{
                      letterSpacing: '0.16em',
                      fontFamily:
                        'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    }}
                  >
                    {section.label}
                  </h2>
                  <span
                    className="text-[12px] text-gt-text-dim"
                    style={{
                      letterSpacing: '0.12em',
                      fontFamily:
                        'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                    }}
                  >
                    {section.items.length}
                    {section.items.length === 1 ? ' course' : ' courses'}
                  </span>
                </div>
                <div className="divide-y divide-gt-border-light">
                  {section.items.map((item) => (
                    <CourseRow
                      key={item.course.id}
                      course={item.course}
                      totalLessons={item.totalLessons}
                      moduleCount={item.moduleCount}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * One row in the left rail's category navigation.
 */
function CategoryLink({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-left',
        isActive
          ? 'bg-gt-medium/[0.08] text-gt-deepest font-bold border-l-2 border-gt-medium pl-[10px]'
          : 'text-gt-text-muted hover:text-gt-text hover:bg-gt-border-light/40'
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          'text-[11px]',
          isActive ? 'text-gt-medium' : 'text-gt-text-dim'
        )}
        style={{
          fontFamily:
            'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        }}
      >
        {count}
      </span>
    </button>
  );
}
