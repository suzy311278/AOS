/**
 * GlossaryClient - Interactive glossary with search and filtering
 */

'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/components/redesign/lib/cn';

interface GlossaryTerm {
  term: string;
  slug: string;
  definition: string;
  category: string;
  related?: string[];
}

interface Category {
  id: string;
  label: string;
}

export function GlossaryClient({
  terms,
  categories,
}: {
  terms: GlossaryTerm[];
  categories: Category[];
}) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTerms = useMemo(() => {
    return terms.filter((term) => {
      const matchesSearch =
        search === '' ||
        term.term.toLowerCase().includes(search.toLowerCase()) ||
        term.definition.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'all' || term.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [terms, search, activeCategory]);

  // Group by first letter
  const groupedTerms = useMemo(() => {
    const groups: Record<string, GlossaryTerm[]> = {};
    filteredTerms.forEach((term) => {
      const letter = term.term[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(term);
    });
    return groups;
  }, [filteredTerms]);

  const letters = Object.keys(groupedTerms).sort();

  return (
    <main className="bg-[#fafbfa] min-h-[60vh]">
      <div className="max-w-[1100px] mx-auto px-8 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gt-text-muted" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search terms..."
              className="w-full pl-11 pr-10 py-3 border border-[#e5e7e5] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium focus:border-transparent bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gt-text-muted hover:text-gt-text"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Category filter count */}
          <div className="text-[13px] text-gt-text-muted flex items-center">
            <span
              className="font-semibold text-gt-text"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              {filteredTerms.length}
            </span>
            <span className="ml-1">terms</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors',
                activeCategory === cat.id
                  ? 'bg-gt-medium text-white'
                  : 'bg-white border border-[#e5e7e5] text-gt-text hover:border-gt-medium/50'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Letter Navigation */}
        <div className="flex flex-wrap gap-1 mb-8 pb-4 border-b border-[#e5e7e5]">
          {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((letter) => {
            const hasTerms = groupedTerms[letter]?.length > 0;
            return (
              <a
                key={letter}
                href={hasTerms ? `#letter-${letter}` : undefined}
                className={cn(
                  'w-8 h-8 flex items-center justify-center text-[12px] font-semibold rounded transition-colors',
                  hasTerms
                    ? 'text-gt-text hover:bg-gt-leaf/10 hover:text-gt-medium'
                    : 'text-gt-text-muted/30 cursor-default'
                )}
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                {letter}
              </a>
            );
          })}
        </div>

        {/* Terms List */}
        {letters.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[15px] text-gt-text-muted">No terms found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {letters.map((letter) => (
              <div key={letter} id={`letter-${letter}`}>
                <h2
                  className="text-[24px] font-bold text-gt-text mb-6 sticky top-20 bg-[#fafbfa] py-2"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                >
                  {letter}
                </h2>
                <div className="space-y-4">
                  {groupedTerms[letter].map((term) => (
                    <div
                      key={term.slug}
                      id={`term-${term.slug}`}
                      className="bg-white rounded-xl border border-[#e5e7e5] p-6"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="text-[16px] font-bold text-gt-text">{term.term}</h3>
                        <span className="px-2 py-1 bg-gt-leaf/10 text-gt-medium text-[10px] font-bold uppercase rounded shrink-0">
                          {term.category.replace(/-/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[14px] text-gt-text-muted leading-relaxed">
                        {term.definition}
                      </p>
                      {term.related && term.related.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#e5e7e5]">
                          <p className="text-[11px] font-semibold text-gt-text-muted uppercase mb-2">
                            Related terms
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {term.related.map((rel) => (
                              <a
                                key={rel}
                                href={`#term-${rel}`}
                                className="text-[12px] text-gt-medium hover:text-gt-dark hover:underline"
                              >
                                {rel.replace(/-/g, ' ')}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
