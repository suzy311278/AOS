'use client';

import { useState, useEffect } from 'react';

interface Props {
  color: string; // Tailwind bg class like "bg-green-500"
}

export default function ReadingProgress({ color }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setProgress(100);
        return;
      }
      setProgress(Math.min(100, Math.round((scrollTop / docHeight) * 100)));
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px]" aria-hidden>
      <div
        className={`h-full transition-[width] duration-150 ${color}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
