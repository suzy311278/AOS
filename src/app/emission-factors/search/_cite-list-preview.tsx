'use client';

/**
 * Small signed-in-only preview on the search results page:
 * "N factors in {most recent list name}" with a link to the list page.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { FileStack, ArrowRight } from 'lucide-react';

interface CiteList {
  id: string;
  name: string;
}

export function EFCiteListPreview() {
  const { isSignedIn, isLoaded } = useUser();
  const [list, setList] = useState<CiteList | null>(null);
  const [itemCount, setItemCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/emission-factors/cite-lists')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.ok) return;
        const lists: CiteList[] = d.lists ?? [];
        if (lists.length > 0) {
          setList(lists[0]);
          setItemCount(0); // real count is deferred; we only teaser here
        }
      })
      .catch(() => {});
  }, [isSignedIn]);

  if (!isLoaded || !isSignedIn || !list) return null;

  return (
    <Link
      href={`/emission-factors/cite-lists/${list.id}`}
      className="inline-flex items-center gap-2 rounded-full border border-gt-border-light bg-white px-3 py-1.5 text-xs font-semibold text-gt-text-muted hover:border-[#95D5B2] hover:text-[#2D6A4F]"
    >
      <FileStack className="h-3.5 w-3.5" aria-hidden />
      <span>
        {itemCount !== null ? `${itemCount} factors in ` : 'Open list '}
        <span className="text-gt-text">{list.name}</span>
      </span>
      <ArrowRight className="h-3 w-3" aria-hidden />
    </Link>
  );
}
