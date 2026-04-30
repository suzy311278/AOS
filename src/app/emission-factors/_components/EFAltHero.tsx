/**
 * EFAltHero
 *
 * Brutalist single-number hero. One emission factor value at absurd scale
 * carries the composition; everything else sits in its shadow as metadata.
 * Uses the redesign teal palette, not the Stitch-generated tokens.
 */

import { EFAltHeroSearch } from './EFAltHeroSearch';

export function EFAltHero() {
  return (
    <section className="relative w-full text-white">
      {/* Thin hairline at the very bottom of the hero band */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-[#2D6A4F]/40" aria-hidden />

      <div className="mx-auto max-w-6xl px-6 pt-16 pb-14 md:pt-24 md:pb-20">
        {/* Top eyebrow */}
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/40">
          <span>Emission factor · featured today</span>
          <span className="font-mono">2026-04-15</span>
        </div>

        {/* The number + metadata spine */}
        <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-center md:gap-10">
          <div
            className="font-mono font-semibold tracking-[-0.04em] leading-[0.9] text-[#95D5B2] whitespace-nowrap"
            style={{ fontSize: 'clamp(96px, 18vw, 220px)' }}
          >
            0.207
          </div>
          <div className="min-w-0">
            <div className="font-mono text-base md:text-lg text-white">kgCO₂e / kWh</div>
            <div className="mt-3 text-xl md:text-2xl font-semibold text-white leading-tight">
              UK grid electricity
            </div>
            <div className="mt-1 text-sm text-white/60">
              DEFRA · 2025 · Scope 2
            </div>
            <div className="text-sm text-white/50">
              Location-based
            </div>
          </div>
        </div>

        {/* Austere search + right-aligned metadata */}
        <div className="mt-16 grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-2">
              Search
            </div>
            <EFAltHeroSearch />
          </div>

          <div className="text-right">
            <div className="font-mono text-[11px] text-white/40">
              211,651 records · 41 sources · updated 2026-04-15
            </div>
            <div className="mt-2 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[#95D5B2]/80">
              <span className="h-1.5 w-1.5 rounded-full bg-[#95D5B2] animate-pulse" aria-hidden />
              Verified · dual-editor
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
