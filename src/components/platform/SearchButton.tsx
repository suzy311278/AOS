'use client';

import { useState, useCallback } from 'react';
import SearchModal, { useSearchShortcut } from './SearchModal';

export default function SearchButton() {
  const [open, setOpen] = useState(false);
  const handleOpen = useCallback(() => setOpen(true), []);

  useSearchShortcut(handleOpen);

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-1.5 text-sm text-gray-400 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors sm:w-48"
        aria-label="Search lessons (Cmd+K)"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-white rounded border border-gray-200">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  );
}
