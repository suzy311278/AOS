# Greentryst Course Catalogue, Locked Specification

Status: LOCKED on 2026-04-11
Branch: `redesign` (local only, never pushed)
Live at: `/redesign/courses`
Target production route: `/courses` (catalogue index) once the redesign branch is cut over

This document is the single source of truth for the Greentryst course catalogue page. Every section, every component, every line of copy, and every significant design decision is recorded here. If a future agent or contributor wants to change any element, they should start by reading this document in full, and any change must be approved before it lands. The catalogue is the second most important page on the site after the homepage and shares many of its structural conventions, so drift here would compound across the rest of the product.

## 1. Core Vision Reflected on this Page

The catalogue page exists to do two jobs simultaneously:

1. Plant the differentiator that distinguishes Greentryst's courses from a Coursera or YouTube-style learning catalogue. The differentiator is *simplification with fidelity*. Primary sustainability sources (IPCC AR6, IFRS standards, GHG Protocol, Verra methodologies, EU regulations) run to hundreds of pages and are too dense for a practitioner to read end to end. Greentryst reads them and distills them into structured lessons without losing accuracy. Sources are cited where it matters so the teaching is traceable.

2. Give a visitor a clean way to find a course or to follow a curated learning path. The visitor might be a power user who knows exactly what they want (search and category filters serve them) or a cold visitor who does not know where to start (the Learning Paths section serves them).

The page is intentionally dense and reference-like rather than marketing-style. The layout is closer to Stripe API documentation or a Westlaw index than a Coursera marketplace. Every visual choice should reinforce the message that this is a serious professional resource, not an entertainment catalogue.

## 2. Branch and Safety Rules

All catalogue work happens on the `redesign` branch. The branch is deliberately local only and must never be pushed to a remote. Main continues to deploy to greentryst.com during the redesign. Before editing any file referenced in this document, verify the current branch is `redesign` or a feature branch off it.

## 3. Page Structure, In Order

The catalogue flows through six sections in a strict order. Each section has a specific job in the narrative arc of the page, and reordering any section breaks the flow. The sections are:

1. Redesign navigation bar
2. Dark forest header band (positioning copy, stats, rotating source logo cycle on the right)
3. Catalogue index (sticky left filter rail, right column of category sections containing course rows)
4. Learning Paths section (tab row over a crossfading canvas)
5. Closing CTA (reused from the homepage)
6. Footer (reused from the homepage)

The narrative arc is: who you are (nav), what we are and what we promise (header), what we have (catalogue), where to start if you do not know (paths), one final close, then exit.

## 4. Section One. Navigation Bar

Component: `src/components/redesign/RedesignNav.tsx`
Already locked in the homepage spec. The catalogue uses the same nav unchanged.

## 5. Section Two. Dark Forest Header Band

Inline section in `src/app/redesign/courses/page.tsx`.

The header background is a custom forest-tinted dark surface, not the homepage's pure charcoal. It is built from a base color `#0b1f18` plus a 135-degree linear gradient `#0d2a20 to #0b1f18 to #091814`, then layered with two radial gradients: a forest green glow at 15 percent x and 0 percent y, and a leaf green highlight at 100 percent x and 100 percent y. A subtle white dot grid sits on top at 7 percent opacity. This deliberate combination gives the surface a green-tinted dark feel rather than reading as pure black.

The header is laid out as a 2-column grid on large screens, switching to a single column on mobile. The proportions are 1.4 fractional units for the left text column and 1 fractional unit for the right logo cycle column.

### 5.1 Left column

Eyebrow `COURSE CATALOGUE` in mono uppercase mint, then the locked headline split across two lines:

> Simplified for the practitioner.
> Faithful to the source.

Then the supporting paragraph:

> Sustainability practitioners are expected to know the IPCC reports, IFRS standards, GHG Protocol, Verra methodologies, and EU regulations. Most run to hundreds of pages. Greentryst reads them so you can learn the work in evenings instead of months, with sources cited so the teaching is traceable.

Then a 4-stat row using the `Stat` primitive with the `light` tone variant. The stats are:

1. `22 courses live` (actual count from `getAllCourses`)
2. `487+ lessons` (computed total)
3. `107h total content` (computed total)
4. `80+ source documents` (manual constant for now)

### 5.2 Right column. Rotating Source Logo Cycle

Component: `src/components/redesign/SourceLogoCycle.tsx`

A 6-slot logo cycle that rotates through real source logos with a fade plus blur plus translate animation, mirroring the homepage hero text rotation. Each slot is visible for approximately 3 seconds in an 18-second cycle.

The cycle renders each logo as a real image file from `public/logos/` rather than as a styled wordmark. To keep visual contrast consistent across logos with different background treatments (some transparent, some white-backed), each logo sits inside a small white rounded chip with shadow and padding. The white chip approach is the standard pattern for source attribution on professional sites and works regardless of the source file's transparency.

The 6 logos in cycle order are:

1. `public/logos/GHG.png` (Greenhouse Gas Protocol)
2. `public/logos/GRI.png` (Global Reporting Initiative)
3. `public/logos/IFRS_Foundation_idRbbNedpP_1.svg` (IFRS Foundation)
4. `public/logos/Verrra.png` (Verra, note the filename typo)
5. `public/logos/TNFD_idmKzP6Ok3_1.svg` (TNFD, manually edited so its `fill:#fff` becomes `fill:#3F3F3F` to be visible on the white chip)
6. `public/logos/European_Union_wordmark_en.svg` (European Union)

Each logo has its own `maxHeightPx` value so wider wordmarks render at one size and denser marks at another, keeping visual weight balanced across the cycle.

The animation classes (`gt-logo-rotate`, `gt-logo-1` through `gt-logo-6`) and the `gt-logo-cycle` keyframe live in `src/app/redesign/redesign.css`. The keyframe duration is 18 seconds with each slot visible from 3 percent to 14 percent of its own cycle, offset by 3 seconds per slot.

## 6. Section Three. Catalogue Index

Wrapper: `LightSection variant="pale" padding="lg" className="!pt-14 !pb-16"`. The custom top and bottom padding tightens the gap to the dark header above and to the Learning Paths section below.

Client component: `src/app/redesign/courses/_components/CoursesClient.tsx`

The catalogue is a two-column documentation-style index. Layout is `grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-12 lg:gap-16`.

### 6.1 Left rail

A sticky panel containing:

1. A search input that filters by title, subtitle, description, and skill chips
2. A `CATEGORIES` mono uppercase header
3. A vertical list of category links: All courses, Fundamentals, Carbon Markets, ESG, Green Finance, Standards, each showing live counts in mono. The active category is highlighted with a 2px left border and a tinted background, and the count flips to brand green
4. A single inline `Hide coming soon` checkbox below the category list with no labeled section above it (the previous `FILTERS` section header was removed because it was overengineered for one toggle)

### 6.2 Right column

Courses are grouped into 5 category sections, in this order:

1. Fundamentals
2. Carbon Markets
3. ESG
4. Green Finance
5. Standards

Each section has a heading row containing the category name in mono uppercase brand green at 15px (with letter spacing 0.16em) on the left, the course count in mono dim at 12px on the right, and a hairline divider underneath. There is no description sentence under the heading. The previous descriptive sentences were removed because they read as filler.

Below the heading sits a vertical stack of `CourseRow` entries, divided by hairlines.

### 6.3 CourseRow component

Component: `src/components/redesign/CourseRow.tsx`

Each row is a documentation-style horizontal entry, not a card. The row is a 3-column grid: left icon tile, center text content, right arrow only.

Icon tile (left): a 56px square with a forest gradient background (`#0B3D2E to #0d2a20`), a 1px inset white ring at 6 percent opacity, and a soft drop shadow. Inside sits a 22px Lucide icon stroked in `gt-leaf` (`#52B788`). This dark forest tile is the catalogue's signature visual element and is reused throughout the page wherever a brand-on-product moment is needed.

Center content: course title in 17px bold dark text, a one-line subtitle in muted gray, then a row of 3 mono uppercase skill chips in tinted brand green, then an inline mono metadata line `Nh · N modules · N lessons` (hours bolded in dark text).

Right side: a single arrow icon that slides on hover.

Hover state: the row gets a tinted background (`gt-medium/[0.07]`) and a 3px left accent bar fades in, indicating clickability.

The icon assignment per course id lives in `COURSE_ICON_MAP`. The skill chip assignment lives in `SKILL_MAP`. Both are exported from `CourseRow.tsx` so other components (notably `LearningPathShowcase`) can reuse them.

Skill chip examples for a few courses:

- Article 6: `Article 6.2`, `Article 6.4`, `ITMOs`
- Climate Science 101: `IPCC AR6`, `Radiative forcing`, `Carbon cycle`
- Scope 1 and 2: `Stationary combustion`, `Location-based`, `Market-based`
- Verra VM0042: `ALM`, `SOC stocks`, `Net GHG benefit`

The maximum is 3 chips per row. A course with no chips in the map renders without the chip block.

## 7. Section Four. Learning Paths

Wrapper: `LightSection variant="white" padding="lg" className="!pt-16"`. Custom top padding closes the gap to the catalogue section above.

Section heading at the top: `LEARNING PATHS` eyebrow, then the locked heading:

> Curated paths for the work you actually do.

Then a one-paragraph subtitle:

> Each path is a sequence of five courses designed to take a practitioner from first principles to defensible output. Every milestone is a real course you can start today.

Below the heading sits the `LearningPathShowcase` component, which is the centerpiece of this section.

### 7.1 LearningPathShowcase component

Component: `src/components/redesign/LearningPathShowcase.tsx`

This is a single canvas that auto-swaps between curated paths. Layout is a vertical stack of two parts: a horizontal tab row at the top and a single canvas below.

#### Top row: tabs

A horizontal row of role tabs sits above the canvas, divided from the canvas by a hairline border. Each tab contains a small role icon and a mono uppercase role label. The active tab is highlighted in brand green with a 2px solid bottom border indicator. A leaf green progress bar sits just below that indicator and fills over the 5-second auto-advance interval, so the user can see the rotation tick. The inactive tabs are muted dim text with a hover state that shifts to brand text.

Auto-advance fires every 5 seconds (`AUTO_ADVANCE_INTERVAL = 5000`). Mouse over the section pauses auto-advance. Clicking a tab jumps to that path and locks for 15 seconds (`STICKY_DURATION = 15000`).

#### Canvas: shared frame, crossfading content

The canvas is a single white card with rounded corners, a `gt-border-light` border, a subtle drop shadow, and asymmetric padding (`p-10 lg:py-14 lg:pl-16 lg:pr-14`). Inside the canvas sits a 2-column grid: left text content and right winding path.

The content fades between paths via a real crossfade. A `displayedIndex` state lags `activeIndex`. When `activeIndex` changes:

1. `isTransitioning` is set to true and the inner content fades to opacity 0 plus blur 6px plus a small downward translate over 320ms
2. After the fade-out completes, `displayedIndex` swaps to the new path
3. After one macrotask, `isTransitioning` flips back to false and the new content fades back in over 320ms

A generation counter (`transitionGenRef`) ensures stale timeouts become no-ops if a newer transition starts before the previous one completes. This is the bug that broke the original implementation: an earlier version had `displayedIndex` in the effect deps, which caused the cleanup to wipe the inner settle timeout when `displayedIndex` updated, leaving the content invisible after the first transition.

Inner left column: 13px mono uppercase eyebrow `FOR THE [ROLE]`, a 26px bold headline, a list of three outcome bullets with leaf green check marks inside soft circles, then a `Start path` link in brand green and a mono total stat.

Inner right column: a pale green well with a 5:3 aspect ratio, containing:

1. A subtle dot grid at 35 percent opacity for texture
2. A winding SVG bezier path drawn in semi-transparent brand green, 2px stroke
3. Five milestone tiles positioned along the path at fixed percentages (12, 28, 44, 60, 76 horizontally; 58, 30, 65, 32, 60 vertically) so the path snakes naturally up and down
4. Each milestone tile uses the same dark forest gradient treatment as the catalogue rows, sized at 56px square with a 22px Lucide icon, and has a 140-pixel-wide label below or above the tile (alternating to avoid collisions)
5. A larger 72px destination tile at 90 percent x, 50 percent y, filled with brand green and carrying the role icon, with a `DESTINATION` mono label below it

#### Server to client boundary fix

Page is a server component, the showcase is a client component, and Lucide icon components cannot cross that boundary. Each path therefore carries an `iconName` string (one of `calculator`, `file-text`, `line-chart`, `banknote`) and the client component resolves it via an internal `ROLE_ICONS` registry.

### 7.2 Path data

Four paths are defined inline in `src/app/redesign/courses/page.tsx`. Each path has exactly 5 course steps to match the 5-milestone visual layout. Course titles and hours are pulled from real `course.yaml` data at render time so they never drift.

The four paths are:

1. **Carbon Analyst** (icon: `calculator`). Headline: `Measure, verify, and defend a GHG number.`. Outcomes: calculate a defensible Scope 1 and 2 inventory, set a science-based target you can defend in front of an auditor, read a Verra methodology end to end without getting lost. Steps: Climate Science 101, Scope 1 and 2 GHG, Scope 3 GHG, SBTi, VCM 101.

2. **ESG Reporter** (icon: `file-text`). Headline: `Publish a disclosure that holds up to scrutiny.`. Outcomes: run a double materiality assessment aligned to CSRD, map your organization to GRI SASB and ESRS, publish a board-ready sustainability report. Steps: ESG Reporting, Double Materiality, IFRS S2, ESG Benchmarking, Human Rights Due Diligence.

3. **Climate Risk Analyst** (icon: `line-chart`). Headline: `Turn climate scenarios into business decisions.`. Outcomes: build TCFD and IFRS S2 aligned scenario analysis, quantify physical and transition risk for any sector, translate climate models into board disclosures. Steps: Climate Science 101, IFRS S2, Financed Emissions, TNFD Biodiversity, ESG Reporting.

4. **Sustainable Finance** (icon: `banknote`). Headline: `Classify, disclose, and raise capital under EU rules.`. Outcomes: classify activities under the EU Taxonomy with DNSH, disclose under SFDR Article 8 and 9, calculate financed emissions with the PCAF methodology. Steps: EU Taxonomy, EU SFDR, Financed Emissions, ESG Investing, IFRS S2.

## 8. Section Five. Closing CTA

Reused unchanged from the homepage spec. Same dark band, same three promises (`We simplify. We show you the source. We make the work easy for you.`), same `This is the whole deal.` close, same `GREENTRYST` signature, same Start free + See pricing CTAs.

## 9. Section Six. Footer

Reused unchanged from the homepage spec. Five-column footer with brand column, newsletter, socials, and four link columns.

## 10. Design Tokens and Reuse Rules

The catalogue uses the same `gt-` token palette as the homepage. Important reuses and additions:

- Dark forest icon tile recipe: `bg: linear-gradient(135deg, #0B3D2E 0%, #0d2a20 100%)`, `ring: 1px inset white at 6% opacity`, `shadow: 0 4px 14px -6px rgba(11,61,46,0.55)`, icon stroked in `gt-leaf`. This recipe appears in `CourseRow` and in every milestone tile inside `LearningPathShowcase`. If the homepage adopts a different dark tile treatment in the future, both files need to be updated together.
- Pale green well recipe: `linear-gradient(135deg, #F1F8F4 0%, #E9F5EE 100%)` with a 1px brand-green border at 10 percent opacity and a 35 percent opacity dot grid overlay. Used as the canvas background for the winding path inside `LearningPathShowcase`.
- Forest header band recipe: `bg #0b1f18` plus diagonal linear gradient plus two radial gradients (forest top-left and leaf bottom-right) plus a 7 percent dot grid. Used only on the catalogue header today, but should be reused on any future dark "page header" that wants to feel green-tinted instead of pure charcoal.
- Mono uppercase labels with letter spacing 0.16em to 0.20em are the consistent eyebrow and section heading style, reused from the homepage.

## 11. Locked Copy Inventory

Every piece of copy on the catalogue page is recorded below. If any of this needs to change, update this document at the same commit.

1. Header eyebrow: `COURSE CATALOGUE`
2. Header headline line 1: `Simplified for the practitioner.`
3. Header headline line 2: `Faithful to the source.`
4. Header sub paragraph: `Sustainability practitioners are expected to know the IPCC reports, IFRS standards, GHG Protocol, Verra methodologies, and EU regulations. Most run to hundreds of pages. Greentryst reads them so you can learn the work in evenings instead of months, with sources cited so the teaching is traceable.`
5. Stat 1 label: `courses live`
6. Stat 2 label: `lessons`
7. Stat 3 label: `total content`
8. Stat 4 label: `source documents`
9. Catalogue search placeholder: `Search catalogue`
10. Category list label: `CATEGORIES`
11. Filter toggle label: `Hide coming soon`
12. Catalogue category labels: `All courses`, `Fundamentals`, `Carbon Markets`, `ESG`, `Green Finance`, `Standards`
13. CourseRow CTA implicit (no text, only the arrow + hover state)
14. CourseRow metadata format: `Nh · N modules · N lessons`
15. Learning Paths eyebrow: `LEARNING PATHS`
16. Learning Paths heading: `Curated paths for the work you actually do.`
17. Learning Paths subtitle: `Each path is a sequence of five courses designed to take a practitioner from first principles to defensible output. Every milestone is a real course you can start today.`
18. Path tab labels: `CARBON ANALYST`, `ESG REPORTER`, `CLIMATE RISK ANALYST`, `SUSTAINABLE FINANCE`
19. Path eyebrow format: `FOR THE [ROLE]`
20. Path CTA: `Start path`
21. Path stat format: `Nh total · N courses`
22. Destination tile label: `DESTINATION`

## 12. Deferred and Post Cutover Work

1. Difficulty filter (Beginner / Intermediate / Advanced) is intentionally not built. The schema does not currently have a difficulty field. When it is added, the filter UI should sit below the `Hide coming soon` checkbox in the left rail.
2. The skill chips in `SKILL_MAP` are hand-curated. They should ideally be derived from course metadata or generated from lesson titles, but for now they live as a static map in `CourseRow.tsx`.
3. The `LearningPathRow` and `LearningPathCard` components still exist but are no longer used (replaced by `LearningPathShowcase`). They can be deleted in a cleanup pass once the redesign branch is fully cut over.
4. The 80+ source document count is a manual constant. When the SustainIQ pipeline is rebuilt, this should pull a real count from the index.
5. The TNFD SVG fill was edited in place from `#fff` to `#3F3F3F`. If the original is ever re-downloaded from the source, the edit will need to be re-applied.
6. The Verra logo file is named `Verrra.png` (with three r's) due to a typo at upload time. The component references this exact filename. Either rename the file and update the component or leave both as-is.

## 13. Change Control

If you are about to modify any file in `src/app/redesign/courses/` or `src/components/redesign/CourseRow.tsx`, `src/components/redesign/LearningPathShowcase.tsx`, or `src/components/redesign/SourceLogoCycle.tsx`, read this document first. If your change affects any of the following, you must update this document in the same commit:

1. Any locked copy in section 11
2. Any of the four learning path definitions in section 7.2
3. The `COURSE_ICON_MAP` or `SKILL_MAP` in `CourseRow.tsx`
4. The `MILESTONE_POSITIONS`, `PATH_D`, or `ROLE_ICONS` in `LearningPathShowcase.tsx`
5. The `LOGOS` array or animation timing in `SourceLogoCycle.tsx`
6. The dark forest icon tile recipe (which would also require updating `CourseRow.tsx` and `LearningPathShowcase.tsx` together)

Small visual tweaks, spacing adjustments, color refinements within the locked token palette, and internal component refactors that do not alter the rendered output do not require an update to this document.

## 14. File Index

For fast navigation, here is every file that backs the catalogue page:

1. `src/app/redesign/courses/page.tsx` (server component, loads courses, defines learning paths data, renders the page)
2. `src/app/redesign/courses/_components/CoursesClient.tsx` (left rail filter + right column category sections)
3. `src/components/redesign/CourseRow.tsx` (the documentation-style row with `COURSE_ICON_MAP` and `SKILL_MAP`)
4. `src/components/redesign/LearningPathShowcase.tsx` (the tab row plus crossfading canvas, with `ROLE_ICONS`, `MILESTONE_POSITIONS`, and `PATH_D`)
5. `src/components/redesign/SourceLogoCycle.tsx` (the 6-slot rotating logo cycle for the header)
6. `src/components/redesign/index.ts` (barrel exports)
7. `src/app/redesign/redesign.css` (the `gt-logo-cycle` keyframe and `gt-logo-rotate` classes)
8. `public/logos/` (the 6 source logo files used by `SourceLogoCycle`)
9. `src/lib/courses.ts` (`getAllCourses` server-only loader)
10. `tailwind.config.ts` (the `gt-` token palette)
11. `brainstorming/HOMEPAGE_LOCKED_SPEC.md` (the homepage spec, which this catalogue page extends)

End of original locked specification.

---

## Addendum A. 2026-04-13 Update (locked)

Changes that landed after the 2026-04-11 lock. Items below supersede matching language in earlier sections of this spec.

### A.1 Header background (supersedes the forest-tinted header)

The header now uses the same charcoal background as the homepage hero.

- Wrapper: `<section className="relative isolate overflow-hidden pt-20 md:pt-24 pb-10 md:pb-12 bg-gt-text-dark">`
- Overlays: `.gt-dot-grid` at opacity 60, two `.gt-ambient-glow-dark` blobs (top-right and bottom-left)
- The prior forest gradient + radial glows are retired
- Top and bottom padding are asymmetric (`pt-20 md:pt-24 pb-10 md:pb-12`). Do not revert to symmetric `py-20 md:py-24`.

### A.2 Left column typography

- Subtext font size: `text-[15px]` (not `text-lg`)
- Subtext color: `text-white/70` (softer than the prior `white/75`)
- Copy unchanged.

### A.3 Inline stats row

All four `Stat` components render in **white** (both value and label). Implementation: `className="[&>div]:!text-white"` applied to each `<Stat>`.

### A.4 Right column: SourceLogoCycle becomes a breathing grid

The 6-slot rotating cycle is retired. Replaced with a **3 × 2 breathing grid**: all six logos always visible, pulsing to full opacity on a long stagger.

- Component: `src/components/redesign/SourceLogoCycle.tsx`
- Markup: `grid grid-cols-3 gap-4 p-2` of six white chips (`aspect-[4/3] bg-white rounded-xl`); each chip carries `gt-logo-breathe gt-logo-{N}`
- Baseline: 30% opacity + 2px blur. Peak: 100% opacity, 0px blur, 1.04 scale. 12s loop, 2s offset per slot
- Ambient leaf glow remains behind the grid
- CSS (`src/app/redesign/redesign.css`):
  ```css
  .gt-logo-breathe {
    opacity: 0.3;
    filter: blur(2px);
    animation: gt-logo-breathe 12s cubic-bezier(0.4, 0, 0.2, 1) infinite both;
  }
  .gt-logo-1 { animation-delay: 0s; }
  .gt-logo-2 { animation-delay: 2s; }
  .gt-logo-3 { animation-delay: 4s; }
  .gt-logo-4 { animation-delay: 6s; }
  .gt-logo-5 { animation-delay: 8s; }
  .gt-logo-6 { animation-delay: 10s; }
  @keyframes gt-logo-breathe {
    0%, 100% { opacity: 0.3; filter: blur(2px); transform: scale(1);    }
    50%      { opacity: 1;   filter: blur(0);   transform: scale(1.04); }
  }
  ```
- The earlier `gt-logo-rotate` class + `gt-logo-cycle` keyframe are retired. `gt-logo-1..6` names kept (they carry the new stagger delays).
- Image `maxHeightPx` is clamped to `min(logo.maxHeightPx, 56)` since chip sizes are smaller in the grid.

### A.5 Learning Path tab progress bar (locked)

Each active learning-path tab shows a thin leaf-green progress bar that fills over the 5-second auto-advance interval.

- Class: `gt-showcase-progress` on the active tab, re-keyed by `${activeIndex}-${isPaused}-${isSticky}` so it resets on change
- CSS (`src/app/redesign/redesign.css`):
  ```css
  .gt-showcase-progress {
    transform-origin: left;
    animation: gt-showcase-progress 5000ms linear forwards;
  }
  @keyframes gt-showcase-progress {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  ```
- Visible when `progressActive` is true (`!isPaused && !isSticky`). Pauses on hover; hides once a tab is stuck via click for the 15-second sticky window.

### A.6 Logo list (unchanged, reaffirmed)

Same six logos, same order: GHG Protocol, GRI, IFRS Foundation, Verra (filename `Verrra.png`, intentional typo), TNFD, European Union.

### A.7 Related documents

- `HOMEPAGE_LOCKED_SPEC.md` + its Addendum A — the design language inherited here
- `JOBS_LOCKED_SPEC.md` — sister directory surface with the same charcoal header pattern
- `PRICING_LOCKED_SPEC.md`, `SERVICES_LOCKED_SPEC.md`, `FAIR_USE_LOCKED_SPEC.md` — sibling locked specs

### Addendum change log

- 2026-04-13: Addendum A captures charcoal background, breathing logo grid, tab progress bar, and white stats. Original body retained above.

End of addendum.
