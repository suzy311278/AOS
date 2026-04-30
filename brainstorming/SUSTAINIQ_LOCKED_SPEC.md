# Greentryst SustainIQ Page, Locked Specification

Status: LOCKED on 2026-04-12
Branch: `redesign` (local only, never pushed)
Live at: `/redesign/ask`
Target production route: `/ask` once the redesign branch is cut over

This document is the single source of truth for the Greentryst SustainIQ page. The SustainIQ page is the most "tool-like" surface on the platform and intentionally has NO dark forest hero band. It is a product page, not a content page, so the user lands directly in the workspace.

## 1. Core Vision Reflected on this Page

SustainIQ exists to prove the core Greentryst trust contract: "Every answer can be traced to its source." The page is a real query interface where a practitioner types a question and gets a defensible answer sourced from primary sustainability documents.

## 2. Page Structure

The page has three structural elements:

1. RedesignNav (sticky top)
2. Two-column workspace: persistent history sidebar (left) + main query/result area (right)
3. RedesignFooter (below workspace)

No dark hero band, no closing CTA. This is a tool, not a marketing page.

## 3. API and Protocol

The page reuses the production `/api/ask` SSE endpoint unchanged. The streaming protocol, the Source/LessonLink/Message data shapes, and the request format (`{ query, history: [] }`) are all preserved from the production AskClient. Each query is standalone (no conversation follow-up); history is always sent as an empty array.

## 4. History Sidebar

Component: inline in `AskClientRedesign.tsx`
Storage module: `src/app/redesign/ask/_lib/history.ts`

Always visible on desktop (280px wide, sticky at `top-16`). On mobile, a slide-out drawer triggered by a hamburger button in the workspace header.

Contents top to bottom:

1. Header with History icon + count badge + close button (mobile only)
2. "New query" primary CTA button (brand green, full width)
3. Search input to filter history by query text (case-insensitive substring match)
4. Scrollable list of history items, newest first. Each item shows the query text (truncated to 2 lines), relative timestamp (e.g., "3h ago"), and feedback emoji if given. Active item is highlighted. Hover reveals an X button to remove.
5. "Clear all history" footer link (visible only when history exists)

Storage: localStorage key `greentryst_sustainiq_history`, array of `HistoryEntry` objects (id, query, answer, sources, lessons, timestamp, feedback), max 100 entries, oldest dropped when over.

Click a history item: restores the query + answer + sources into the main workspace. The sidebar closes automatically on mobile.

## 5. Empty State

Shown when no query has been submitted. Contains:

1. Large dark forest icon tile with sparkles icon, centered
2. Mono "SUSTAINIQ" eyebrow
3. Headline: "Ask anything. Get a defensible answer."
4. Sub: "Every answer is traced back to its source document. No hallucinations, no plausible-sounding guesses, no claims you cannot defend in front of an auditor."
5. "TRY A QUESTION" mono label
6. 2-column grid of 6 featured query cards. Each card has a dark forest icon tile (category icon), mono category eyebrow, and the query text.
7. "Browse more topics" toggle that expands a categorized library of 24 additional starter queries organized into 6 categories (Climate Science, GHG Accounting, ESG Reporting, Carbon Markets, Targets and Strategy, EU Regulation).

Featured queries and the expanded library are defined in `src/app/redesign/ask/_lib/query-library.ts`.

## 6. Result State

Shown after a query is submitted. Contains:

1. Prominent result header: dark forest icon tile + "SUSTAINIQ" mono eyebrow + "Result" heading + hairline divider underneath. "New query" filled brand-green CTA on the right.
2. User message: brand-green bubble on the right with rounded corners and forest-tinted shadow.
3. Assistant message: dark forest avatar tile on the left + white answer card with rounded corners and hairline border.
4. Loading state (while streaming): a 4-step progression with checkmarks (READING QUERY, SEARCHING 530+ DOCUMENTS, RANKING SOURCES, DRAFTING ANSWER). Steps advance on a 900ms interval. When the first token arrives, the progression skips to the final step.
5. Streaming cursor: a pulsing brand-green bar after the last character of the answer.
6. Error state: rose-tinted card with alert icon.

### 6.1 Answer Body Rendering

The answer body is parsed LINE BY LINE (mirroring the production AskClient strategy). Each line is checked against:

- `### ` heading (14px bold brand-green)
- `## ` heading (16px bold brand-green)
- `# ` heading (17px extrabold brand-green)
- `- ` or `* ` bullet list items (grouped into a single `<ul>`, brand-green dot markers)
- `N.` or `N)` numbered list items (grouped into a single `<ol>`, brand-green numbered circles)
- Empty line (small vertical spacer)
- Default: paragraph (14px near-black)

Inline parsing handles three patterns:

- `**bold**` renders as `<strong>` in the same near-black color (`text-gt-text`), bold weight only, no color change, so runaway bold wrapping cannot dominate the visual
- `` `code` `` renders as inline mono on a subtle brand-tinted chip
- Parenthetical source citations matching `(... p. NN ...)` or `(... pp. NN ...)` render as small inline mono pills with a FileText icon and brand-green tinting

### 6.2 Action Bar

Below the answer text (only on completed non-error answers), separated by a hairline:

- "Copy answer" button (copies plain text to clipboard, shows toast confirmation)
- "Share" button (copies a URL like `/redesign/ask?q=...` to clipboard, shows toast)
- Spacer
- "HELPFUL?" mono label + thumbs up / thumbs down buttons. Feedback is stored on the history entry in localStorage.

### 6.3 Sources Grid

Below the answer card, a 2-column grid of compact dark forest source cards. Each card shows: mono mint course label, white document title, muted white section, leaf-green page reference. Cards use `rounded-lg p-3` sizing.

### 6.4 Lesson Cross-Links

Below the sources, a horizontal row of small white pills linking to related lessons. Each pill shows the lesson title, the course title in mono, and an arrow.

## 7. Floating Input Bar

Always visible, whether in empty state or viewing a result. Sticky at the bottom of the viewport with glass-like treatment (`bg-white/95 backdrop-blur-md`) and upward/downward shadow for a floating effect. The wrapper uses `pointer-events-none` with `pointer-events-auto` on the form so the shadow area does not block content clicks behind it.

Placeholder: "Ask anything about sustainability frameworks, standards, or methodologies..."
Below the input: `ENTER TO SEARCH · SHIFT+ENTER FOR NEW LINE` hint + a word/character counter (visible only when input has content).

Width: `max-w-4xl` (896px), matching the content area.

## 8. URL Auto-Fire (Share Link Support)

When the page loads with a `?q=...` URL parameter, the query is automatically fired on mount. This supports the Share button's clipboard URL.

## 9. Scroll Behavior

Auto-scroll fires ONLY when `messages.length` changes (a new message is added), NOT on every streaming token update. Scroll behavior is `'auto'` (not `'smooth'`) to prevent stacking multiple scroll animations.

## 10. Locked Copy Inventory

1. Empty state eyebrow: `SUSTAINIQ`
2. Empty state heading: `Ask anything. Get a defensible answer.`
3. Empty state sub: `Every answer is traced back to its source document. No hallucinations, no plausible-sounding guesses, no claims you cannot defend in front of an auditor.`
4. Empty state featured label: `TRY A QUESTION`
5. Empty state library toggle: `Browse more topics` / `Hide topic library`
6. Result header eyebrow: `SUSTAINIQ`
7. Result header heading: `Result`
8. New query button: `New query`
9. Loading steps: `READING QUERY`, `SEARCHING 530+ DOCUMENTS`, `RANKING SOURCES`, `DRAFTING ANSWER`
10. Sources header format: `Referenced sources · N`
11. Lessons header: `Related lessons`
12. Copy button: `Copy answer`
13. Share button: `Share`
14. Feedback label: `HELPFUL?`
15. Input hint: `ENTER TO SEARCH · SHIFT+ENTER FOR NEW LINE`
16. History header: `History · N`
17. History new query button: `New query`
18. History search placeholder: `Search history`
19. History empty text: `Your past queries will appear here.`
20. History clear button: `Clear all history`
21. Toast (copy): `Answer copied to clipboard`
22. Toast (share): `Share link copied to clipboard`

## 11. Deferred Work

1. Backend-persisted history (currently localStorage-only, deferred to auth cutover)
2. Source card click-through (cards have hover states but do not link to a source viewer yet)
3. "You might also ask" related query block (proposed but not built in this phase)
4. Mobile sidebar drawer animation (currently uses CSS transform only, no gesture swipe)
5. Full mobile layout audit at 375px and 640px
6. Richer inline markdown parsing (only bold, code, and citations are handled; italics, links, and images are passed through as plain text)

## 12. Change Control

Before modifying any file under `src/app/redesign/ask/`, read this document. Update this spec in the same commit if changes touch:

1. Any locked copy in section 10
2. The SSE protocol or the API endpoint
3. The history storage shape or localStorage key
4. The answer body line-by-line parsing rules in section 6.1
5. The loading progression steps
6. The URL auto-fire mechanism

## 13. File Index

1. `src/app/redesign/ask/page.tsx` (server route)
2. `src/app/redesign/ask/_components/AskClientRedesign.tsx` (client component, all UI + state)
3. `src/app/redesign/ask/_lib/history.ts` (localStorage history helpers)
4. `src/app/redesign/ask/_lib/query-library.ts` (curated starter queries organized by category)
5. `src/components/redesign/RedesignNav.tsx` (reused)
6. `src/components/redesign/RedesignFooter.tsx` (reused)
7. `src/app/api/ask/route.ts` (production API endpoint, NOT modified)

End of locked specification.
