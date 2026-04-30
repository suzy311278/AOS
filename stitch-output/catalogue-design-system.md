# Greentryst Design System (Course Catalogue Context)

Compressed design brief for generating course catalogue page variants via Stitch. This is a DESKTOP WEBSITE, never a mobile app.

## Brand

Greentryst is the professional operating system for sustainability practitioners. Analogies: Bloomberg for finance, Westlaw for law, GitHub for software. Tone is authoritative, trustworthy, premium, and quietly confident. Never playful, never academic, never EdTech. If it looks like a Coursera page, it is wrong. If it looks like a Bloomberg terminal page, it is closer.

## Color palette

Forest green, not teal. Unified with LinkedIn presence.

- Deep forest: #0B3D2E (dark product UI, deep accents)
- Dark green: #1B4332 (secondary dark, hover)
- Medium green: #2D6A4F (primary CTAs, active states, key accent)
- Forest: #40916C (secondary buttons, mid-tone accents)
- Leaf: #52B788 (live badges, highlights)
- Mint: #95D5B2 (accents on dark backgrounds)
- Pale green: #D8F3DC (primary light section background)
- White: #FFFFFF (cards on light sections)
- Dark text: #081C15 (primary text on light backgrounds)
- Light text: #F0FFF4 (text on dark backgrounds)
- Border light: #E8E8EA (hairline borders on light cards)

The site is predominantly light (about 60 percent). Dark sections are used strategically. The default page background is pale green #D8F3DC with white cards sitting on top.

## Typography

- Headings and body: Inter (400, 500, 600, 700, 800). Tight tracking, negative letter-spacing on large headings.
- Mono: JetBrains Mono (400, 500, 700). Used for small uppercase eyebrows, numbers, timestamps, metadata, and any "data" feel.
- Never use Serif fonts. Never use decorative fonts.

Typical sizes: section heading 40 to 56px, card title 18 to 22px, body 15 to 17px, metadata 11 to 13px.

## Iconography

Lucide icons only. No emoji, no Material icons, no cartoon illustrations, no hand drawn graphics. Icons are typically 16 to 24px, stroke width 2, rendered in brand green (#2D6A4F) on light backgrounds or in white/mint on dark backgrounds.

## Visual language rules

1. Rounded corners: 16px (rounded-2xl) for cards, 8px for buttons and small chips, 9999px for pill chips.
2. No 1px borders on cards in light mode. Use subtle shadow for elevation instead. Borders are acceptable on dark product cards.
3. Shadows are subtle. Use a soft drop shadow on cards, never a heavy material-style elevation.
4. Whitespace is generous. Cards and sections breathe. Never cram content.
5. Every data point should feel real and specific. Use concrete sustainability terms (VM0042 Section 3.1.2, DEFRA 2024, CBAM, TCFD, IFRS S2, SBTi, Scope 3, GHG, CSRD) rather than lorem ipsum.
6. Never use gradients to fill large areas. Radial glows are acceptable for ambient lighting on dark sections. Subtle two-color gradients are acceptable on tiny accent elements.
7. Mono uppercase small labels are a signature: eyebrows, category chips, timestamps, and status indicators all use JetBrains Mono at 10 to 12px with 0.12 to 0.2em letter spacing.
8. Buttons: solid medium-green primary (#2D6A4F, white text), ghost secondary (transparent with medium-green text and border). Arrow icon after label. No rounded pill buttons.

## Context for this catalogue page

The catalogue lists 22 sustainability courses. Each card needs to show:
- Course title (e.g., "Climate Science 101", "EU Carbon Border Adjustment Mechanism", "Voluntary Carbon Markets 101")
- One-line subtitle (e.g., "The physical science of climate change and why it matters")
- Category (Fundamentals, Carbon Markets, ESG, Green Finance, Standards)
- A Lucide icon (e.g., Thermometer for Climate Science, Ship for CBAM, Coins for carbon markets)
- Metadata: number of modules, number of lessons, total hours (e.g., "6 modules, 24 lessons, 8h")
- Status: live (default), coming soon, or draft
- A view course CTA

Above the grid sits a sticky filter bar with a search input and category chips. Above that is a header band with a large heading, stats row, and supporting text.

The current design suffers from per-course color proliferation (too many accent colors in one grid) and gratuitous gradient headers. The goal of the new variants is to look like one Bloomberg-style product with 22 features, not a rainbow marketing catalogue.
