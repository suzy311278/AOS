# Greentryst Jobs Page, Locked Specification

Status: LOCKED on 2026-04-13 (full rewrite; supersedes 2026-04-12 version)
Branch: `redesign` (local only, never pushed)
Live at: `/redesign/jobs`
Target production route: `/jobs` once the redesign branch is cut over

This document is the single source of truth for the Greentryst Career Directory. Every section, every component, every copy line, every behavioural rule lives here. The page's distinctive feature is the managed job search narrative — upload a resume once, we match every live role against your profile continuously — and that narrative must be visible to every visitor regardless of tab or sign-in state.

If a future agent or contributor plans to change any element listed in this document, they must read it in full first, and any change must be approved before it lands.

## 1. Core Vision

Greentryst is not a job board. It is a managed job search for sustainability professionals. The directory exists so practitioners can browse available roles without committing, but the product value arrives when the user uploads a resume: from that point on Greentryst scores every live role against their profile, re-ranks on course completions and skill updates, and shows the top matches to any tier, with the full ranked board unlocked for Individual and above.

The tone throughout is honest and editorial. We never show a fake match score. We never hide a score behind a lock icon on a job the user has not scored themselves. Every number on this page is either real or explicitly absent.

## 2. Branch and Safety Rules

All jobs-page work happens on the `redesign` branch. The branch is deliberately local only and must never be pushed to a remote. Main continues to deploy to `greentryst.com` during the redesign. Before editing any file referenced in this document, verify the current branch is `redesign` or a feature branch off it.

## 3. Page Structure, In Order

The page flows through eight sections in a strict order. Each section has a specific job, and reordering any section breaks the story.

1. Nav (RedesignNav, tone dark)
2. Page hero (managed job search narrative + adaptive upload card + board stats)
3. Split-view tabs (All Jobs · Matched for you), sticky under the nav
4. Match summary strip (only visible on the Matched tab after resume upload)
5. Toolbar (search, inline filters, sliding sort toggle)
6. Profile tabs row (all, climate_risk, sustainable_finance, eu_taxonomy_sfdr, carbon_markets, clean_energy_adjacent)
7. Job table (header row + job rows, responsive)
8. Pagination + per-page selector, then Footer (RedesignFooter)

## 4. Route, Entry Points, and Data Wiring

- Route file: `src/app/redesign/jobs/page.tsx`
- Client component: `src/app/redesign/jobs/_components/JobsClientRedesign.tsx`
- Server data: `getJobsFiltered(filters)` and `getJobsMeta()` from `src/lib/jobs.ts`
- `export const dynamic = 'force-dynamic'` so the Excel read happens per request
- URL search params control the filters: `profile`, `country`, `companyType`, `remote`, `search`, `sort`, `page`, `perPage`
- Job detail is lazy-loaded via `fetchJobDetail(jobUrl)` from `src/app/jobs/actions.ts` and cached in component state

## 5. Section One. Navigation Bar

Component: `src/components/redesign/RedesignNav.tsx`, rendered with `tone="dark"`.

The nav sits on top of the dark hero and must render the wordmark through the shared `Logo` component (dark variant: "Green" in white + "tryst" in leaf green). This page's label in the nav is `Career`.

## 6. Section Two. Page Hero

Layout: an editorial two-column grid inside a full-width dark charcoal band, followed by a full-width board stats strip.

### 6.1 Background
- Base: `bg-gt-text-dark` (#18181B)
- Single restrained radial ambient glow, top-right, leaf-green tint, blur 20px
- Dot grid overlay at opacity 0.22
- A gradient hairline divider across the bottom edge (`via-white/10`)

### 6.2 Left column: narrative + step flow
- Thin-rule eyebrow: `h-px w-8 bg-gt-leaf` followed by the mono label `CAREER DIRECTORY · MANAGED JOB SEARCH` with a mid-dot separator and a white-50 secondary half
- Headline, locked: `We do the job search.` on line one, `You do the interviews.` on line two with leaf-green color. Font size `36px → 52px`, tracking `-0.02em`, leading `1.04`
- Subtext, locked: `Every live role on the board is scored against your profile and re-ranked as you complete courses and add new skills. Upload a resume once, learn continuously, never rewrite your search from scratch.`
- Step flow: two-column grid (single column on mobile), one item per `MATCH_STEPS` entry. Each item has a mono step number left-aligned and a leaf-green vertical rule separating the number from the title + blurb
- `MATCH_STEPS` is locked as:
  1. **Upload your resume** — We parse your skills, roles, and years of experience automatically.
  2. **Update your preferences** — Set your preferred region and experience level in your dashboard.
  3. **See your matches** — Every live job, scored and ranked against your profile.
  4. **Re-match as you grow** — Finish a course and your match scores update across the board.

### 6.3 Right column: adaptive upload card
- Container: glass card with `rgba(255,255,255,0.03)` fill, `1px` white-8 border, 6px backdrop blur, heavy drop shadow
- Persistent 2px leaf-green rule across the top of the card
- Card eyebrow (mono): `START HERE` before upload, `RESUME ON FILE` after
- Pre-upload body:
  - Headline: `Drop your resume.` / `We handle the rest.`
  - Supporting line: `PDF or DOCX, parsed in under five seconds. Your profile stays private and editable in your dashboard.`
  - CTA: **Upload resume** with arrow, rectangular, leaf-green background, hover-to-white
- Post-upload body:
  - Headline: `Your matches are ranked below.`
  - Supporting line: `Re-matching runs continuously as you complete courses and refresh your preferences in the dashboard.`
  - Primary CTA: **Upgrade to Individual** linking to `/redesign/pricing`
  - Secondary text button: **Replace resume** — clears the flag
- Mini spec strip inside the card (always present): three columns — `All / Live jobs scored`, `< 5s / Resume parse`, `Free / Top 2 matches`

### 6.4 Board stats bar (full width of hero)
- Eyebrow mono label `DIRECTORY AT A GLANCE` with a short white-20 rule
- Four stats rendered in a four-column grid with vertical `divide-x divide-white/[0.08]` dividers between items
- Stats: `meta.totalJobCount / Jobs Live`, `meta.totalCompanies / Companies`, `meta.countries.length / Countries`, `meta.totalRemote / Remote`
- Numbers are white mono at 30–36px, labels in mono uppercase with 0.2em tracking (component: `HeroStat`)

The hero is visible to every visitor, on every tab, logged-in or not. This is non-negotiable. It sets the product frame before the user chooses how to browse.

## 7. Section Three. Split-View Tabs

Component: inline in `JobsClientRedesign.tsx`. Sticky with `top-16 z-40`, background white, bottom border `#e5e7e5`.

Two tabs, locked order:
1. **All Jobs** — shows `meta.totalJobCount` as a count pill
2. **Matched for you** — leaf-green Sparkles icon on the left, count shows `strongMatches` (≥80% scores) only after resume upload, else null

Active tab gets a `text-[#081C15]` label and a 2px leaf-green bar under it. Inactive tabs use `text-[#5a6a64]`, hovering to `#081C15`.

Switching tabs is purely a client-side state change. It does not touch URL or server data.

## 8. Section Four. Match Summary Strip

Visible only on the Matched tab after the resume-uploaded flag is true (`viewMode === 'matched' && resumeUploaded`).

- Background `#f5f7f5`, bottom border `#e5e7e5`, padded block with a row flex
- Left: leaf-green Sparkles icon in a circle, two-line summary: `N job(s) match your profile at 80%+` and the mono tagline `Top 2 matches visible on the free tier · Upgrade to Individual to see all`
- Right: a single primary CTA `Upgrade to Individual` linking to `/redesign/pricing`

Pre-upload this strip is not rendered. The hero already carries the upload CTA.

## 9. Section Five. Toolbar

A sticky toolbar below the summary strip (`top-[113px] z-30`) containing all filtering controls in a single row.

### 9.1 Search input
- `flex-1 min-w-[220px] max-w-md`
- Search icon inside at left, clear `X` button at right when a value is present
- Enter submits; `updateFilter('search', value)` rewrites the URL

### 9.2 Inline filters
Three `FilterSelect` components, shown only when the underlying options list is non-empty:
- Country (from `meta.countries`)
- Company type (from `meta.companyTypes`)
- Work mode (static options: `Remote`, `Hybrid`, `On-site`)

If any filter is active, a `Clear all` text button appears after the selects.

### 9.3 Sort toggle switch
Pushed to the far right with `ml-auto`. A rounded pill container holding two buttons: `Relevance` and `Latest`. A green sliding indicator animates between the two halves over 300ms ease-out. Active label text is white; inactive is `#5a6a64`.

There is no separate Filters button and no collapsible filter row. Every filter sits inline on this single row.

## 10. Section Six. Profile Tabs

Horizontal scroll row of category chips below the toolbar. Source of truth: `PROFILE_LABELS` in the client. Clicking sets `filters.profile` in the URL. Counts come from `meta.profileCounts`.

## 11. Section Seven. Job Table

### 11.1 Header row
Desktop only. Column template is one of two:
- All Jobs: `minmax(200px,1.2fr)_minmax(140px,1fr)_minmax(120px,0.9fr)_100px_70px_90px` — Role, Company, Location, Type, Posted, Apply-slot
- Matched tab (always): adds a seventh 90px column for Match, label rendered in leaf green

Header text is mono uppercase at 10px with 0.08em letter-spacing, on the `#f8faf8` pale background.

### 11.2 Job rows
Component: `JobRow`. Renders a clickable row in two layouts:
- **Mobile**: stacked title + `company · location` subline
- **Desktop**: same grid template as the header

Per-column cells:
- Role: title + uppercase domain tag pill (from `formatProfile`, first word only)
- Company, Location: mono truncated text
- Type: Remote / Hybrid / On-site
- Posted: relative date (`today`, `1d`, `3w`, `2mo`, etc.) from `formatDate`
- Match (Matched tab only): leaf-green mono `87%` with a 1.5px leaf-green dot marker. Pre-upload placeholder is `––%` in muted grey with a grey dot and tooltip `Upload your resume to reveal your match`
- Apply: leaf-green rectangle button with `Apply` text that opens `job.jobUrl` in a new tab; followed by a ChevronDown expand indicator that rotates 180° when expanded

Row hover: `bg-[#f5f7f5]`. Expanded row: same background but persistent.

### 11.3 Expanded detail panel
When a row is clicked, it lazily loads `JobDetail` via `fetchJobDetail(jobUrl)` and caches the result in `detailCache`. The panel renders Role Summary, Skills Required, and Domain Context sections when available, plus the course-suggestion block tied to the job's profile (see `COURSE_SUGGESTIONS`).

## 12. Matched-for-you State Machine

This is the most subtle part of the page. Three states, each rendered differently.

### 12.1 Pre-upload
- Match summary strip: not rendered
- Job table: Match column present, every cell shows `––%` placeholder
- Rows 1 to 3 render normally
- Rows 4 onwards are blurred (`blur-[3px] opacity-60 pointer-events-none select-none`)
- A single overlay card is pinned at row index 3 (the first blurred row). Card content, locked:
  - Leaf-green Sparkles icon in a circle
  - Heading: `This is where your matches will appear`
  - Supporting: `Upload your resume to rank every live job against your profile. Free tier shows the top 2 matches with real scores.`
  - CTA: **Upload resume** (triggers `markResumeUploaded`)

### 12.2 Post-upload, free tier
- Match summary strip: rendered (section 8)
- Job table: sorted by score desc, Match column has real scores
- Top 2 rows are fully visible
- Rows 3 onwards are blurred
- A single overlay card is pinned at row index `FREE_TIER_VISIBLE_MATCHES` (2). Card content, locked:
  - Leaf-green Lock icon in a circle
  - Heading: `Unlock the rest of your matches`
  - Supporting: `Free tier shows the top 2 matches. Upgrade to Individual to see every job ranked against your profile, with continuous re-matching as you complete courses.`
  - CTA: **Upgrade** → `/redesign/pricing`

### 12.3 Post-upload, Individual or above
Not yet live on the redesign branch. Contract for the future: all rows render unblurred with real match scores, no overlay, no free-tier cap. Entitlements must be enforced server-side; the `FREE_TIER_VISIBLE_MATCHES` constant on the client is a visual guard only.

## 13. Matching Preview (Frontend Mock)

The current preview is client-side only.

- Score function: `computeMockMatch(job)` returns a deterministic integer in `[52, 97]` derived from `title + company + profile`. It is not a real recommendation, and must not be presented as one. The frontend never applies it outside the Matched tab after upload.
- Resume flag: `localStorage` key `gt-resume-uploaded-v1`, value `'1'` or absent. Helpers: `loadResumeFlag`, `saveResumeFlag`.
- Constant: `FREE_TIER_VISIBLE_MATCHES = 2`.

When the real backend ships (see `brainstorming/JOBS_MATCHING_BACKEND_PLAN.md`):
- `computeMockMatch` is removed
- Scores come from `/api/me/matches`, enforced server-side
- The resume flag is replaced by a real `resumeParsedAt` check on the user profile
- `FREE_TIER_VISIBLE_MATCHES` moves to the entitlements layer

## 14. Data Contracts

Exported from `src/lib/jobs.ts`:

- `JobRow` — full row from the Excel source
- `JobSummary` — `Omit<JobRow, 'roleSummary' | 'skillsRequired' | 'domainContext'>`; what's rendered in rows
- `JobDetail` — `id + roleSummary + skillsRequired + domainContext`; fetched lazily on expand
- `JobsMeta` — `{ totalJobCount, totalCompanies, totalRemote, profileCounts, companyTypes, countries }`
- `JobsResult` — `{ jobs, total, page, perPage, totalPages }`

`PROFILE_LABELS` in the client is the display mapping for the five profile domains plus `all`.

## 15. Copy, Locked

Every headline, subtext, and CTA label on this page is locked to the strings above. Paraphrasing is not permitted without a commit to this document.

Key lines, flagged because they are most likely to drift:
- Hero headline: `We do the job search.` / `You do the interviews.`
- Hero subtext: section 6.2
- Upload card headlines (pre/post): section 6.3
- Pre-upload teaser card: `This is where your matches will appear`
- Free-tier overlay: `Unlock the rest of your matches`
- Summary strip: `Top 2 matches visible on the free tier · Upgrade to Individual to see all`

## 16. Interaction and Behavioural Rules

- The page scroll-locks the header and toolbar via `sticky` positioning. The tabs sit at `top-16`, toolbar at `top-[113px]`.
- Copy, cut, context-menu, and drag-start are blocked on the jobs container via event listeners in `useEffect`. This is anti-scrape; do not remove.
- Filter changes reset `page=1` to avoid stale pagination.
- Sort toggle is client and URL state; changes re-fetch via `router.push`.
- All outbound job links open in a new tab with `rel="noopener noreferrer"`.
- The nav bar uses `tone="dark"` on this page; any change to the page background requires matching the nav tone.

## 17. Reuse and Component Dependencies

Components referenced from `src/components/redesign/`:
- `RedesignNav`, `RedesignFooter`
- `DarkUICard` (not currently used on this page but available)
- Icons via `lucide-react`: `Search, X, ChevronDown, ExternalLink, Briefcase, MapPin, Building2, Clock, ArrowLeft, ArrowRight, BookOpen, TrendingUp, Sparkles, Lock`

Internal to the jobs page:
- `JobRow` — the row renderer, props include `matchScore`, `matchLocked`, `showMatchColumn`
- `FilterSelect` — native select styled for the toolbar
- `HeroStat` — mono stat with vertical divider support
- `UploadStat` — inline stat inside the upload card
- `PagButton` — pagination prev/next
- `MatchProcessBanner` — retained in the file but currently unused; the hero covers the same territory. Keep exported for a possible future secondary banner.

## 18. Files Under Lock

If you are about to modify any of these files, read this document first. Any change that affects an element in sections 3–16 must update this document in the same commit.

- `src/app/redesign/jobs/page.tsx`
- `src/app/redesign/jobs/_components/JobsClientRedesign.tsx`
- `src/components/redesign/RedesignNav.tsx` (the Career link)
- `src/components/redesign/RedesignFooter.tsx` (the Career link)
- `src/lib/jobs.ts` (contract changes only; data updates to `src/jobs/jobs.xlsx` do not require a spec edit)

## 19. Non-Goals and Open Decisions

- There is no "Saved jobs" feature. A later version may add it as a third tab. Not in scope today.
- There is no server-side match score. Today's scores are a preview only. The matching feature becomes real when `brainstorming/JOBS_MATCHING_BACKEND_PLAN.md` ships.
- There is no keyboard navigation story yet for the job list. Add when the lesson page keyboard spec lands.
- Mobile: the split-view tabs, hero, and toolbar already collapse sensibly. A full mobile polish pass has not happened. This is the biggest known open item.

## 20. Change Log

- 2026-04-11: First locked spec (pre-redesign hero, no matching).
- 2026-04-12: Interim updates during redesign branch.
- 2026-04-13: Full rewrite. Hero promoted to full-page header; split-view tabs added; resume-driven matching preview landed; Match column introduced; toolbar consolidated into a single row with sliding sort toggle.
