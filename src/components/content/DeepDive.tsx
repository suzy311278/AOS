'use client';

import { useState, useId, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Props {
  /** Button label. Defaults to "Want to go deeper?" */
  title?: string;
  children: ReactNode;
}

export default function DeepDive({ title = 'Want to go deeper?', children }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const contentRef = useRef<HTMLDivElement>(null);

  // Animate max-height open/close
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (open) {
      el.style.maxHeight = el.scrollHeight + 'px';
    } else {
      el.style.maxHeight = '0px';
    }
  }, [open]);

  return (
    <div className="border border-blue-200 rounded-lg my-6 overflow-hidden">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-blue-50 hover:bg-blue-100 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400"
      >
        <div className="flex items-center gap-2">
          <span className="text-blue-600 text-base" aria-hidden>🔬</span>
          <span className="text-sm font-semibold text-blue-800">{title}</span>
        </div>
        <span
          className={`text-blue-500 text-sm transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▼
        </span>
      </button>

      {/* Collapsible panel */}
      <div
        id={panelId}
        ref={contentRef}
        style={{ maxHeight: '0px', overflow: 'hidden', transition: 'max-height 0.25s ease' }}
        role="region"
        aria-label={title}
      >
        <div className="px-5 py-4 bg-white border-t border-blue-100 text-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
}
