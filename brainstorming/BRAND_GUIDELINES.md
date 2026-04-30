# Greentryst Brand Guidelines

Status: LOCKED on 2026-04-13
Scope: Logo, colour, typography, iconography, surfaces, voice, motion. Everything needed to produce on-brand work without having to look at a live page.

This is a working brand book, not a style guide for marketing. It captures the identity that lives across the redesigned product today (`/redesign/*`). Any new surface — web, slide, PDF, invoice, landing page — references this document.

If a future contributor wants to change any item below, they must read this document first. Changes land in the same commit as the spec edit.

## 1. Voice

Greentryst is the professional operating system for sustainability practitioners. The voice reflects that positioning.

- **Authoritative, not loud.** We know the material. We do not shout about it.
- **Peer, not prospect.** We speak to practitioners as colleagues. Never "enterprise buyer" language, never "discover your potential" motivational copy.
- **Sourced, not vague.** Every claim has a receipt. If we cannot cite it, we do not state it.
- **Calm confidence.** Bloomberg Terminal meets modern SaaS. No urgency marketing, no exclamation marks, no countdown timers.
- **Fewer words.** Short lines. Complete sentences. Avoid adjective soup.

### 1.1 Words we use

Precise, domain-native: `audit trail`, `citation`, `disclosure`, `framework`, `methodology`, `emission factor`, `ranked`, `scored`, `defensible`.

### 1.2 Words we avoid

Marketing boilerplate: `revolutionary`, `game-changing`, `unleash`, `supercharge`, `democratize`, `empower`, `journey`, `seamless`, `cutting-edge`, `leverage`.

### 1.3 Core message spine

Three sentences the whole brand compresses down to:

1. **Learn the framework.**
2. **Verify the answer.**
3. **Execute the work.**

Every headline, tagline, or pitch deck ladders back to these.

## 2. Wordmark

Greentryst has no pictorial logo. The identity is typographic.

### 2.1 Construction

- Word: `Greentryst` (one word, capital G).
- Two-span split: `Green` + `tryst`, styled separately.
- Canonical font: **Manrope** when available, **Inter extrabold** as the in-product fallback.
- Weight: `font-extrabold` (800).
- Tracking: `-0.02em`.
- Never kerned, never italic, never underlined, never letter-spaced open.

### 2.2 Color rules

| Variant | `Green` | `tryst` |
|---|---|---|
| Dark background | white (#FFFFFF) | leaf green (#52B788) |
| Light background | charcoal (`gt-text`, #18181B) | medium green (#2D6A4F) |

No other colour combinations are permitted. The wordmark never renders in a single colour.

### 2.3 Sizes

In product:
- `sm` — 20px (nav, dense contexts)
- `md` — 24px (default)
- `lg` — 28px (footer hero)

Outside product (slides, documents, print): scale freely but preserve proportions.

### 2.4 Clear space

Maintain whitespace around the wordmark equal to the x-height of the `G`. Do not crowd. Do not place on busy imagery.

### 2.5 Wrong uses

- Do not render in any colour outside the four defined
- Do not apply a drop shadow, stroke, glow, or gradient
- Do not place on a colour that does not pass contrast
- Do not animate the wordmark itself (even on hover — it is a brand, not a control)
- Do not add a symbol, icon, or byline

### 2.6 Implementation

Canonical component: `src/components/redesign/Logo.tsx`. The `Logo` component must be used for every rendering of the wordmark in product. Manual two-span fallback is only permitted on the sign-in / sign-up pages (historical) and will be migrated.

## 3. Colour Palette

All colours are defined in `tailwind.config.ts` under `colors.gt.*`. Never hand-pick a new hex. If the exact colour you want is not in the palette, that is a signal to reuse an existing one, not to add a new one.

### 3.1 Core brand greens

| Token | Hex | Use |
|---|---|---|
| `gt-text-dark` | `#18181B` | Primary dark surface — hero, footer, dark cards base |
| `gt-deep` | `#23232A` | Dark card background (the signature element) |
| `gt-dark` | `#1B4332` | Dark-green alt, hover states on CTAs |
| `gt-medium` | `#2D6A4F` | Primary CTAs on light surfaces, active toggles, brand green on light |
| `gt-leaf` | `#52B788` | Accents on dark (headlines, rules, icons, hover), live badges, success |
| `gt-mint` | `#95D5B2` | Subtle accent on dark surfaces, used sparingly |

### 3.2 Neutrals

| Token | Hex | Use |
|---|---|---|
| `gt-pale` | `#F8FAF9` | Primary light-section background |
| `gt-pale-warm` | `#F4F7F5` | Alternating light band, very subtle warm tint |
| `gt-text-light` | `#F0FFF4` | Off-white text on dark |

### 3.3 Text

| Token | Hex | Use |
|---|---|---|
| `gt-text` | `#18181B` | Primary body text on light |
| `gt-text-muted` | `#3A4A44` | Secondary body text on light |
| `gt-text-dim` | `#6B7870` | Mono labels, captions on light |
| `gt-text-on-dark` | `#F0FFF4` | Primary body text on dark |
| `gt-text-on-dark-muted` | `#95D5B2` | Secondary body text on dark |

### 3.4 Borders

| Token | Hex | Use |
|---|---|---|
| `gt-border-light` | `#E5EAE7` | Default border on light surfaces |
| `gt-border-dark` | `#40916C` | Green border on dark surfaces (used rarely) |

### 3.5 Rules of thumb

- Leaf green (`#52B788`) is reserved for dark surfaces. On light surfaces, prefer the darker brand greens (`gt-medium`).
- Gradients are not brand. Occasional subtle radial glows on dark surfaces are permitted (hero ambients).
- Never use pure `#000` or `#FFF` as text. Use the defined tokens so contrast and warmth stay consistent.
- Every coloured accent on the page should resolve to a brand token. If it does not, either add it to `tailwind.config.ts` with a new `gt-` token (rare, requires a commit to this document) or drop it.

## 4. Typography

Greentryst uses exactly two typefaces. Everything renders in one of them. No decorative, serif, or script fonts.

### 4.1 Inter (sans)

- Weights: 400, 500, 600, 700, 800
- Use for: body text, headlines, paragraphs, navigation, buttons, card titles, UI labels
- CSS variable: `--font-inter`

### 4.2 JetBrains Mono

- Weights: 400, 500, 700
- Use for: eyebrows, category labels, source citations, mono numbers (stats, prices, match scores), dividers between metadata, code-like fragments
- CSS variable: `--font-jetbrains-mono`

### 4.3 Hierarchy

| Role | Family | Size (desktop) | Weight | Tracking |
|---|---|---|---|---|
| Page title (hero) | Inter | 44–52px | 800 | `-0.02em` |
| Section heading | Inter | 28–36px | 800 | `-0.02em` |
| Card title | Inter | 18–22px | 700 | tight |
| Body | Inter | 14–16px | 400–500 | default |
| Micro-body / caption | Inter | 12–13px | 500 | default |
| Eyebrow / category label | JetBrains Mono | 10–11px | 700 (uppercase) | `0.20–0.28em` |
| Big number / stat | JetBrains Mono | 24–36px | 800 | `-0.02em` |
| Source / citation | JetBrains Mono | 10–11px | 400 | default |

### 4.4 Tracking conventions

- Any uppercase mono label uses `0.2em` letter-spacing minimum
- Premium editorial eyebrows stretch to `0.28em`
- Inter body never goes wider than default tracking
- Inter headlines use `-0.02em` tracking (tight) for weight

### 4.5 Line-height

- Hero headlines: 1.04–1.10
- Section headings: 1.10–1.15
- Body: 1.55–1.70
- Mono captions: 1.30–1.45

### 4.6 Anti-patterns

- No italic on headlines
- No all-caps Inter (only mono)
- No double-space after period
- Never use an em dash for separators — use a mid-dot (`·`) in mono contexts or a comma in prose

### 4.7 Punctuation rule (enforced)

- **Never use em dashes (—) in any product copy, code comment, or commit message.** Use hyphens, commas, parentheses, or colons instead. This is a hard brand rule.

## 5. Iconography

Exactly one library: **Lucide Icons** (`lucide-react`).

- Never use emoji in product UI (permitted only in informal developer docs at most)
- Never use Material Symbols, Font Awesome, or any other icon set
- Never use illustrations or stock photography

### 5.1 Stroke weight

- Default: `strokeWidth={2}`
- Emphasised (check marks, arrows on CTAs, dots): `strokeWidth={2.5}`
- Rarely: `strokeWidth={2.2}` for arrows-in-pills that should feel slightly thinner

### 5.2 Sizes

- Inline with body: 14–16px (`w-4 h-4`)
- In a tile (circular or rounded square): 18–24px (`w-5 h-5` / `w-6 h-6`)
- In a hero icon tile: 28–32px

### 5.3 Colour

Icons inherit `currentColor` from the parent. Use brand tokens, never custom hex.

### 5.4 Icon tile conventions

When wrapping an icon in a background tile:
- Rounded full (circle) or rounded-xl (squircle, 12px radius)
- Tinted background at 10–15% of the brand token
- On hover, invert: solid brand-token background, icon in a contrasting colour
- Standard size: 40–44px square for tile, 18–20px for icon inside

## 6. Surfaces

Three canonical surfaces. Everything else is a variation.

### 6.1 Dark charcoal (signature)

- Background: `gt-text-dark` (#18181B)
- Optional overlay: `.gt-dot-grid` at opacity 22–60%
- Optional: one or two subtle radial `.gt-ambient-glow-dark` blobs
- Text: `text-white/70` for body, `text-white` for headlines, `text-gt-leaf` for eyebrows and accents
- Used for: hero sections, ticker bands, footer, dark product cards, the Matched-for-you upload card

### 6.2 Pale neutral (default light)

- Background: `gt-pale` (#F8FAF9)
- Optional: `gt-pale-warm` for alternating bands
- Text: `gt-text` for headlines, `gt-text-muted` for body, `gt-text-dim` for captions
- Used for: content pages, provenance sections, FAQs, toolbars, dashboards

### 6.3 White

- Background: pure white
- Used for: card interiors, expanded detail panels, modals, forms

### 6.4 Dark UI card (signature element)

The single most recognisable visual element of Greentryst. A small `gt-deep` rectangle with a real product UI inside: a label, a short content block, and a mono source citation.

- Background: `gt-deep` (#23232A) or `rgba(24,24,27,0.72)` for glass variant
- Border: none or `rgba(140,212,202,0.12)` for a subtle mint edge
- Radius: 16px (`rounded-2xl`)
- Padding: 20–28px
- Anatomy (top to bottom):
  1. Category label (mono uppercase) top-left + optional icon top-right
  2. Heading or big value
  3. Body paragraph (optional)
  4. Thin divider
  5. Mono source citation in `text-gt-leaf/85` or `text-gt-mint/60`
- Hover (when interactive): slight translate-up, deeper shadow, border brightens to `gt-leaf/40`

Reference implementation: `src/components/redesign/DarkUICard.tsx`.

### 6.5 Signature radii

- 4px (small inputs, badges)
- 8px (buttons, inputs by default)
- 12px — `rounded-xl`
- 16px — `rounded-2xl` (cards, panels, dark cards)
- 9999 — `rounded-full` (pills, eyebrows, icon tiles, CTA pills)

Do not use 20–24px radii. Skip straight from 16 to full pill.

## 7. Layout

### 7.1 Container

- Max width: 1280px
- Horizontal padding: `px-8` (32px)
- Centered with `mx-auto`
- `scrollbar-gutter: stable` on `<html>` so fixed elements align with in-flow content

### 7.2 Vertical rhythm

- Section padding (dark or light): `py-16` small, `py-24` default, `py-32` large
- Between sections: rely on the section's own padding; avoid margin stacking
- Between blocks in a section: `space-y-6` to `space-y-12` depending on density

### 7.3 Grids

- Editorial two-column: `grid-cols-1 lg:grid-cols-[1.25fr_0.85fr]` for hero splits
- Card grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` is the default
- Stat bars: `grid-cols-2 md:grid-cols-4` with thin vertical dividers between
- Services / provenance cards: `md:grid-cols-6` or `md:grid-cols-12` for asymmetric layouts with varied `col-span`

### 7.4 Dividers

- Light on light: `border-gt-border-light` (1px)
- White on dark: `border-white/[0.08]` for subtle, `border-white/10` for slightly more present
- Accent rules: `h-px w-6 bg-gt-leaf` above section eyebrows
- Vertical grid dividers: `divide-x divide-white/[0.08]`

## 8. Motion

Motion is restrained and purposeful. We do not decorate with motion.

### 8.1 Durations

- Micro (hover state changes): 150ms
- UI transitions (toggle, slide, accordion): 300ms
- Editorial reveals (hero shuffle): 550–1000ms
- Ambient (logo breathing cycle): 12s loop

### 8.2 Easings

- Default: `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard)
- Premium / editorial: `cubic-bezier(0.22, 1, 0.36, 1)` (gentle tail-off)
- Linear only for progress bars and marquee tickers

### 8.3 Signature motions

- **Rise + blur cross-fade** (hero taglines, sign-in/up taglines): outgoing element translateY(0 → -28px), blur(0 → 14px), opacity(1 → 0), 900ms. Incoming starts 300ms delayed, translateY(36px → 0), blur(14px → 0), opacity(0 → 1), 1000ms.
- **Card stack shuffle** (homepage hero cards): transition-all 700–1300ms, ease-out, rotate + translate per position.
- **Ticker marquee** (`.gt-ticker-track`): 60s linear infinite, hover-pauses.
- **Logo breathing grid** (courses header): 12s loop, opacity(0.3 → 1), blur(2px → 0), scale(1 → 1.04), staggered 2s per slot.
- **Tab progress bar** (`gt-showcase-progress`): 5000ms linear, scaleX(0 → 1), transform-origin left.
- **Icon-in-pill nudge** (on CTA hover): `translate-x-0.5 -translate-y-0.5`, 150ms.

### 8.4 Reduced motion

Every signature motion above should respect `prefers-reduced-motion`. Today this is not enforced in CSS. Adding `@media (prefers-reduced-motion: reduce) { ... }` rules is on the open-items list.

## 9. Components and Primitives

All reusable brand primitives live in `src/components/redesign/`.

- `RedesignNav` — the navigation bar, tone-aware (dark / light)
- `RedesignFooter` — the five-column premium footer
- `Logo` — the wordmark (canonical)
- `DarkSection`, `LightSection` — section wrappers with tokenised padding and max-width
- `DarkUICard` — the signature dark product card
- `SectionHeading`, `CategoryLabel` — typographic primitives
- `RedesignButton` — the single CTA component (variants: primary, secondary, secondary-dark, ghost)
- `Stat`, `StatBadge` — metric primitives
- `Ticker` — the continuous marquee band
- `ClosingCTA` — the standard closing section for most pages
- `PricingSection`, `PricingCard` — pricing tier cards
- `ActiveShowcase` — the four-work-modes canvas (homepage only)
- `LearningPathShowcase` — the curated-paths showcase (courses only)
- `SourceLogoCycle` — the breathing logo grid (courses header only)
- `TryItDemo` — the homepage provenance input
- `lesson/*` — MDX component pack for lesson pages

Any new primitive must follow the brand rules above and live in this directory. Do not inline one-off versions in page files when a reusable primitive already exists.

## 10. Product Narrative (on-brand vs off-brand)

Quick check for whether a piece of work is on-brand:

| On-brand | Off-brand |
|---|---|
| Every claim sourced, cited, or labelled as preview | "Trust us" claims without a source line |
| Leaf-green accent on charcoal, or medium-green on pale | Red, orange, gold, or more than two greens in one view |
| Short mono label over a prose headline | A stacked emoji row above the headline |
| "Ranked against your profile" | "Powered by AI" |
| A thin rule above a category eyebrow | A gradient button with a badge saying NEW |
| Four Lucide icons in a process row | Four illustrated mascots or stock photos |
| Dark product card with a real calculation | A blurred dashboard screenshot |
| Fixed prices, visible up front | "Contact us for pricing" on anything except Enterprise |

## 11. Imagery and Illustration

- No stock photography
- No illustrations of people
- No 3D renders or Mondrian-style shapes
- Real product screenshots are permitted when they are legible and include a caption citing the exact screen (e.g., "SustainIQ, VM0042 baseline query, Mar 2026")
- Source logos (GHG Protocol, GRI, IFRS, Verra, TNFD, European Union) appear only inside white chips on dark surfaces. Treatment is defined by `SourceLogoCycle.tsx`.

## 12. Accessibility

Brand choices that carry a11y weight:

- Minimum body text contrast on dark surfaces is `text-white/70`. Anything dimmer than this is decorative only, never body copy.
- Mono captions on dark can go to `text-white/50`; below that must be labelled decorative.
- Focus rings must use `ring-2 ring-gt-leaf` on dark surfaces, `ring-gt-medium` on light. Never use the browser default.
- Icon-only buttons always carry an `aria-label`.
- Animations respect `prefers-reduced-motion` (see §8.4; work in progress).

## 13. Writing Mechanics

- Sentences end with a period unless the label is a fragment (eyebrow, button).
- Lists use `·` (mid-dot) as a separator in mono contexts. Never ` - ` with spaces.
- Numbers: thin-space thousands (`1 000`), not comma, in mono contexts — except for currency where a comma is canonical (`$1,200`).
- Currency: always `$` prefix without a space, two-digit cents only when non-zero. Preferred `$12 / month` or `$12/mo`; never `USD 12`.
- Dates: mono `YYYY-MM-DD` for machine-looking contexts; `Jan 1, 2026` for prose.
- Time ranges: `3 to 5 weeks`, not `3-5 weeks` (the em-dash / hyphen rule again).

## 14. Files Under Lock

Any change that alters the brand identity must touch this document in the same commit. Related canonical files:

- `src/components/redesign/Logo.tsx`
- `tailwind.config.ts` (the `gt-` token palette)
- `src/app/redesign/redesign.css` (signature keyframes)
- `src/components/redesign/index.ts` (primitives barrel)

## 15. Related Documents

- `HOMEPAGE_LOCKED_SPEC.md` + Addendum A — the reference implementation of the brand at its most concentrated
- `COURSES_LOCKED_SPEC.md` + Addendum A — directory surface using the brand
- `JOBS_LOCKED_SPEC.md` — editorial split-view surface
- `PRICING_LOCKED_SPEC.md`, `SERVICES_LOCKED_SPEC.md`, `FAIR_USE_LOCKED_SPEC.md` — commerce surfaces
- `JOBS_MATCHING_BACKEND_PLAN.md` — backend plan, referenced for terminology

## 16. Change Log

- 2026-04-13: First locked brand book. Pulled from the in-product identity established across the redesign session.
