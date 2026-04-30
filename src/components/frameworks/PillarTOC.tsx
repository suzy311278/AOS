'use client';

/**
 * Pillar page table of contents. Renders a sticky sidebar that lists
 * every disclosure in the pillar, tracks scroll position, and highlights
 * the active entry. Indentation follows parent/child structure so
 * reference numbers like 6(a)(i) nest under 6(a).
 */

import { useEffect, useRef, useState } from 'react';
import type { DisclosureEntry } from '@/lib/frameworks';

interface Props {
  disclosures: DisclosureEntry[];
  pillarName: string;
}

export function PillarTOC({ disclosures, pillarName }: Props) {
  const [activeAnchor, setActiveAnchor] = useState<string | null>(
    disclosures[0]?.anchor ?? null
  );
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const els: HTMLElement[] = disclosures
      .map((d) => document.getElementById(d.anchor))
      .filter((x): x is HTMLElement => !!x);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0 && visible[0].target.id) {
          setActiveAnchor(visible[0].target.id);
        }
      },
      {
        rootMargin: '-120px 0px -70% 0px',
        threshold: 0,
      }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [disclosures]);

  return (
    <nav
      ref={containerRef as React.RefObject<HTMLElement>}
      aria-label={`${pillarName} disclosures`}
      className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto"
    >
      <p
        className="text-[10px] font-bold uppercase text-gt-text-muted mb-3 pl-2"
        style={{ letterSpacing: '0.2em' }}
      >
        In this pillar
      </p>
      <ul className="space-y-0.5">
        {disclosures.map((d) => {
          const isChild = !!d.parent;
          const isActive = activeAnchor === d.anchor;
          return (
            <li key={d.ref}>
              <a
                href={`#${d.anchor}`}
                className={[
                  'block py-1.5 text-[12.5px] leading-snug rounded-md transition-colors',
                  isChild ? 'pl-6 pr-2' : 'pl-2 pr-2',
                  isActive
                    ? 'text-gt-medium font-semibold bg-gt-medium/5'
                    : 'text-gt-text-muted hover:text-gt-text',
                ].join(' ')}
              >
                <span
                  className={[
                    'font-mono tracking-tight',
                    isActive ? 'text-gt-medium' : 'text-gt-text-muted/80',
                  ].join(' ')}
                  style={{
                    fontFamily:
                      'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                  }}
                >
                  {d.ref}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
