# Greentryst Fair Use Page, Locked Specification

Status: LOCKED on 2026-04-13
Branch: `redesign` (local only, never pushed)
Live at: `/redesign/fair-use`
Target production route: `/fair-use` once the redesign branch is cut over

Single source of truth for the Fair Use (usage caps + rationale) page. Lives on its own so the pricing page stays focused on tiers.

## 1. Core Vision

A product-spec sheet. Query caps, tool caps, seats, exports, retention. No fine print. An honest explanation of why caps exist (retrieval cost, maintained tools), not a marketing page.

## 2. Route and Entry Points

- Route file: `src/app/redesign/fair-use/page.tsx`
- Linked from the footer under the `Resources` column. Not in the main nav.

## 3. Page Structure, In Order

1. Nav (RedesignNav, tone dark)
2. Hero band (charcoal, eyebrow + heading + intro)
3. Spec table (charcoal, mono, 15 rows)
4. Rationale block (`<LightSection variant="pale">`)
5. Footer

## 4. Hero

- Charcoal with dot grid + a single top-right ambient leaf-green glow
- Eyebrow `Fair Use`
- Headline, locked: `The numbers behind every tier.`
- Subtext, locked: `A product-spec sheet for the limits that actually matter. Query caps, tool caps, seats, exports, and retention — up front, no fine print.`

## 5. Spec Table

- Charcoal band, rounded 2xl container with white-10 border + `bg-black/30`
- Mono font (JetBrains Mono) throughout
- Two columns: metric label (white-55 uppercase, 0.15em tracking) and value (white, right-aligned)
- 15 rows, locked:
  1. SustainIQ queries (Free) → 5 / month
  2. SustainIQ queries (Individual) → 5 / day
  3. SustainIQ queries (Pro) → 25 / day
  4. SustainIQ queries (Team & Enterprise) → Unlimited, fair use
  5. Professional tools (Free) → Trial access
  6. Professional tools (Individual) → 1 active, swap any time
  7. Professional tools (Pro) → 3 active, swap any time
  8. Professional tools (Team & Enterprise) → All included
  9. À la carte extra tools → $15 / month each
  10. Export volume → Unlimited within tier
  11. Seats (Team) → Up to 10 users
  12. Seats (Enterprise) → Up to 50 users · 50+ custom
  13. Data retention → 365 days of workspace history
  14. Learning progress & certificates → Retained permanently
  15. Data residency → EU or US (selectable)
- Row hover: `bg-white/[0.03]` tint

Any change to a row must land in the same commit as an update to this document.

## 6. Rationale Block

- `<LightSection variant="pale" padding="lg" className="!pt-20 !pb-24">`
- Eyebrow `Why we have limits` + heading `Fair use, because honesty beats unlimited.`
- Three paragraphs, locked:
  1. Retrieval cost honesty: the pipeline is the most expensive thing we run; caps keep Individual pricing at $12/$29.
  2. Team / Enterprise: uncapped under fair use; we measure for abusive automation, not heavy human use; we talk before we throttle.
  3. Tool caps: every professional tool is actively maintained against regulation updates; paying for the ones you use keeps the rest affordable.

## 7. Copy, Locked

Every string on this page is locked. The spec-table entries in particular are load-bearing because users and procurement teams will quote them.

## 8. Files Under Lock

- `src/app/redesign/fair-use/page.tsx`
- `src/components/redesign/RedesignFooter.tsx` (the `Fair Use` entry in Resources)

## 9. Related Documents

- `PRICING_LOCKED_SPEC.md` — source of the tier names and inclusions referenced by this page
- `SERVICES_LOCKED_SPEC.md` — sister page for premium engagements

## 10. Change Log

- 2026-04-13: First locked spec.
