/**
 * TableOfContents - Reading aid sidebar that tracks current heading
 * Extracts headings from content and highlights current section on scroll
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { List, ChevronUp } from 'lucide-react';
import { cn } from '@/components/redesign/lib/cn';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Fade in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Track active heading via IntersectionObserver
  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      // Find the first heading that's in view
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);
      if (visibleEntries.length > 0) {
        // Get the topmost visible heading
        const topEntry = visibleEntries.reduce((top, entry) => {
          const topRect = top.boundingClientRect;
          const entryRect = entry.boundingClientRect;
          return entryRect.top < topRect.top ? entry : top;
        });
        setActiveId(topEntry.target.id);
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: '-80px 0px -70% 0px',
      threshold: 0,
    });

    // Observe all headings
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (headings.length === 0) return null;

  return (
    <aside
      className={cn(
        'sticky top-28 transition-all duration-500',
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      )}
    >
      <div className="bg-white rounded-xl border border-[#e5e7e5] shadow-sm overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-[#fafbfa] border-b border-[#e5e7e5] hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2 text-[12px] font-bold text-gt-text uppercase tracking-wide">
            <List className="w-4 h-4 text-gt-medium" strokeWidth={2} />
            In this guide
          </span>
          <ChevronUp
            className={cn(
              'w-4 h-4 text-gt-text-muted transition-transform duration-200',
              isExpanded ? 'rotate-0' : 'rotate-180'
            )}
            strokeWidth={2}
          />
        </button>

        {/* Headings List */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            isExpanded ? 'opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <nav className="py-3 px-2">
            <ul className="space-y-1">
              {headings.map((heading, index) => (
                <li key={heading.id}>
                  <button
                    onClick={() => scrollToHeading(heading.id)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-lg text-[13px] transition-all duration-200',
                      heading.level === 3 && 'pl-6',
                      heading.level === 4 && 'pl-9',
                      activeId === heading.id
                        ? 'bg-gt-leaf/10 text-gt-medium font-semibold'
                        : 'text-gt-text-muted hover:text-gt-text hover:bg-gray-50'
                    )}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <span className="line-clamp-2">{heading.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Scroll to top */}
          <div className="px-4 pb-3 pt-1 border-t border-[#e5e7e5]">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-[11px] text-gt-text-muted hover:text-gt-medium transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5" strokeWidth={2} />
              Back to top
            </button>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-4 px-4">
        <div className="flex items-center justify-between text-[11px] text-gt-text-muted mb-2">
          <span>Reading progress</span>
          <span
            className="font-semibold text-gt-medium"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            {headings.length > 0
              ? Math.round(
                  ((headings.findIndex((h) => h.id === activeId) + 1) /
                    headings.length) *
                    100
                )
              : 0}
            %
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gt-medium to-gt-leaf rounded-full transition-all duration-300"
            style={{
              width: `${
                headings.length > 0
                  ? ((headings.findIndex((h) => h.id === activeId) + 1) /
                      headings.length) *
                    100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>
    </aside>
  );
}
