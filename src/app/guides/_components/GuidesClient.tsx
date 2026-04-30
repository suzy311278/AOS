/**
 * GuidesClient - Interactive guides listing with topic filtering
 * Features staggered animations and smooth transitions
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { FileText, ArrowRight, Clock, BookOpen, Search, X } from 'lucide-react';
import { cn } from '@/components/redesign/lib/cn';

interface GuideWithTopics {
  slug: string;
  title: string;
  description: string;
  courses: string[];
  readingMinutes: number;
  lastUpdated: string;
  topics: string[];
}

interface Topic {
  id: string;
  label: string;
}

export function GuidesClient({
  guides,
  topics,
}: {
  guides: GuideWithTopics[];
  topics: Topic[];
}) {
  const [activeTopic, setActiveTopic] = useState('all');
  const [search, setSearch] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initial mount animation
  useEffect(() => {
    setMounted(true);
  }, []);

  // Re-trigger animation on filter change
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [activeTopic, search]);

  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      const matchesTopic = activeTopic === 'all' || guide.topics.includes(activeTopic);
      const matchesSearch =
        search === '' ||
        guide.title.toLowerCase().includes(search.toLowerCase()) ||
        guide.description.toLowerCase().includes(search.toLowerCase());
      return matchesTopic && matchesSearch;
    });
  }, [guides, activeTopic, search]);

  return (
    <main className="bg-[#fafbfa] py-10 min-h-[60vh]">
      <div className="max-w-[1100px] mx-auto px-8">
        {/* Search + Topic Capsules */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gt-text-muted" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guides..."
              className="w-full max-w-md pl-11 pr-10 py-3 border border-[#e5e7e5] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-gt-medium focus:border-transparent bg-white"
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

          {/* Topic Capsules */}
          <div className="flex flex-wrap gap-2">
            {topics.map((topic, index) => {
              const count = topic.id === 'all'
                ? guides.length
                : guides.filter(g => g.topics.includes(topic.id)).length;

              return (
                <button
                  key={topic.id}
                  onClick={() => setActiveTopic(topic.id)}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200',
                    activeTopic === topic.id
                      ? 'bg-gt-medium text-white shadow-md scale-105'
                      : 'bg-white border border-[#e5e7e5] text-gt-text hover:border-gt-medium/50 hover:bg-gt-leaf/5 hover:scale-102',
                    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  )}
                  style={{
                    transitionDelay: mounted ? `${index * 50}ms` : '0ms',
                  }}
                >
                  {topic.label}
                  <span
                    className={cn(
                      'text-[11px] px-1.5 py-0.5 rounded-full transition-colors duration-200',
                      activeTopic === topic.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gt-text-muted'
                    )}
                    style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-[13px] text-gt-text-muted">
            Showing{' '}
            <span className="font-semibold text-gt-text" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
              {filteredGuides.length}
            </span>
            {' '}guide{filteredGuides.length !== 1 && 's'}
            {activeTopic !== 'all' && (
              <> in <span className="font-semibold text-gt-text">{topics.find(t => t.id === activeTopic)?.label}</span></>
            )}
          </p>
        </div>

        {/* Guides Grid */}
        {filteredGuides.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-gt-text-muted mx-auto mb-4" strokeWidth={1} />
            <p className="text-[15px] text-gt-text-muted mb-2">No guides found</p>
            <button
              onClick={() => { setActiveTopic('all'); setSearch(''); }}
              className="text-[13px] text-gt-medium hover:text-gt-dark"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredGuides.map((guide, index) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className={cn(
                  'bg-white rounded-xl border border-[#e5e7e5] p-6 hover:border-gt-medium/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group',
                  mounted && !isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                )}
                style={{
                  transitionDelay: mounted ? `${index * 75}ms` : '0ms',
                }}
              >
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-xl bg-gt-leaf/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gt-leaf/20 group-hover:scale-110 transition-all duration-300">
                    <FileText className="w-7 h-7 text-gt-medium" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-[17px] font-bold text-gt-text group-hover:text-gt-medium transition-colors duration-200 mb-2">
                          {guide.title}
                        </h3>
                        <p className="text-[14px] text-gt-text-muted line-clamp-2 mb-4">
                          {guide.description}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gt-medium opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 mt-1" strokeWidth={2} />
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="flex items-center gap-1.5 text-[12px] text-gt-text-muted">
                        <Clock className="w-4 h-4" strokeWidth={2} />
                        {guide.readingMinutes} min read
                      </span>
                      {guide.courses.length > 0 && (
                        <span className="flex items-center gap-1.5 text-[12px] text-gt-text-muted">
                          <BookOpen className="w-4 h-4" strokeWidth={2} />
                          {guide.courses.length} related course{guide.courses.length !== 1 && 's'}
                        </span>
                      )}
                      {guide.lastUpdated && (
                        <span className="text-[11px] text-gt-text-muted">
                          Updated {guide.lastUpdated}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
