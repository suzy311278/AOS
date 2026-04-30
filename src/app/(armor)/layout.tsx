/**
 * Shared layout for ArmorInnovate IA routes (Phase 1).
 *
 * The `(armor)` segment is a Next.js route group — the parentheses
 * remove it from the URL path. So:
 *
 *   src/app/(armor)/knowledge/page.tsx     →  /knowledge
 *   src/app/(armor)/labs/page.tsx          →  /labs
 *   src/app/(armor)/certification/page.tsx →  /certification
 *   src/app/(armor)/intel/page.tsx         →  /intel
 *
 * The homepage (src/app/page.tsx) is intentionally NOT inside this
 * group — it owns its own nav rendering so it can use a transparent
 * variant on top of the dark hero.
 *
 * Phase 6 will lift this layout up into the root once every legacy
 * route is archived.
 */

import type { ReactNode } from 'react';
import { ArmorNav, ArmorFooter, SurpriseMe } from '@/components/armor';

export default function ArmorSectionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ai-root min-h-screen bg-ai-bg flex flex-col">
      <ArmorNav tone="light" />
      {/* spacer matching the fixed-nav height (~64px) */}
      <div aria-hidden className="h-[64px]" />

      <main className="flex-1">{children}</main>

      <ArmorFooter />

      {/* Floating Surprise Me — same widget as the homepage. */}
      <SurpriseMe variant="floating" />
    </div>
  );
}
