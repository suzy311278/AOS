'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface GlossaryEntry {
  term: string;
  slug: string;
  definition: string;
  category: string;
  related: string[];
}

interface Props {
  term: string; // slug of the glossary term
  children: ReactNode;
}

let glossaryCache: GlossaryEntry[] | null = null;
let fetchPromise: Promise<GlossaryEntry[]> | null = null;

function loadGlossary(): Promise<GlossaryEntry[]> {
  if (glossaryCache) return Promise.resolve(glossaryCache);
  if (!fetchPromise) {
    fetchPromise = fetch('/glossary.json')
      .then(r => r.json())
      .then((data: GlossaryEntry[]) => {
        glossaryCache = data;
        return data;
      })
      .catch(() => {
        glossaryCache = [];
        return [];
      });
  }
  return fetchPromise;
}

export default function GlossaryTerm({ term, children }: Props) {
  const [definition, setDefinition] = useState<string | null>(null);

  useEffect(() => {
    loadGlossary().then(entries => {
      const entry = entries.find(e => e.slug === term);
      if (entry) setDefinition(entry.definition);
    });
  }, [term]);

  if (!definition) {
    return <span className="border-b border-dotted border-gray-400">{children}</span>;
  }

  return (
    <span className="relative inline-block group">
      <span
        className="border-b border-dotted border-green-500 text-green-700 cursor-help"
        tabIndex={0}
        role="button"
        aria-describedby={`glossary-${term}`}
      >
        {children}
      </span>
      <span
        id={`glossary-${term}`}
        role="tooltip"
        className="invisible group-hover:visible group-focus-within:visible absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg leading-relaxed pointer-events-none"
      >
        {definition}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" aria-hidden />
      </span>
    </span>
  );
}
