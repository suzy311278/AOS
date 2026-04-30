'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function ResponsiveTable({ children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function check() {
      if (!el) return;
      const canScroll = el.scrollWidth > el.clientWidth;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      setShowFade(canScroll && !atEnd);
    }

    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      el.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  return (
    <div className="relative -mx-4 sm:mx-0 my-4">
      <div ref={scrollRef} className="overflow-x-auto">
        <div className="min-w-[480px] px-4 sm:px-0">
          {children}
        </div>
      </div>
      {showFade && (
        <div
          className="pointer-events-none absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white to-transparent"
          aria-hidden
        />
      )}
    </div>
  );
}
