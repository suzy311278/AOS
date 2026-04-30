'use client';

/**
 * EFAltHeroSearch
 *
 * Austere search input for the brutalist hero. No card, no button - just a
 * thin teal underline with a blinking caret and a press-enter hint.
 */

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CornerDownLeft } from 'lucide-react';

export function EFAltHeroSearch() {
  const router = useRouter();
  const [value, setValue] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(
      q
        ? `/emission-factors/search?q=${encodeURIComponent(q)}`
        : `/emission-factors/search`,
    );
  }

  return (
    <form onSubmit={onSubmit} role="search" className="w-full">
      <div className="flex items-center gap-3 border-b border-[#2D6A4F]/60 pb-2 focus-within:border-[#95D5B2] transition-colors">
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0.207 kgCO2e/kWh is DEFRA 2025. What do you need?"
          aria-label="Search emission factors"
          className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/40 outline-none caret-[#95D5B2]"
        />
        <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-white/50">
          <CornerDownLeft className="h-3 w-3" strokeWidth={2} />
          press enter
        </span>
      </div>
    </form>
  );
}
