# Greentryst Lesson Page, Locked Specification

Status: LOCKED on 2026-04-11
Branch: `redesign` (local only, never pushed)
Live at: `/redesign/courses/[courseId]/[lessonId]`
Target production route: `/courses/[courseId]/[lessonId]` once the redesign branch is cut over

This document is the single source of truth for the Greentryst lesson page. Every section, every component, every visual decision is recorded here. The lesson page is the highest-stakes page in the system because it is where actual learning happens, and it is the page that has to gracefully wrap a long list of MDX components used across 470+ lessons.

## 1. Core Vision Reflected on this Page

The lesson page does three jobs:

1. **Render the lesson content with the right typography rhythm.** The reading column is the main payload of the page. Generous line height, Inter base, JetBrains Mono for code and labels, brand-green strong text. Headings use a tight tracking and a hairline forest divider.

2. **Apply the new design system to every MDX component used in lessons.** All 13 active MDX components (HighlightBox, AnalogyBox, ExampleBox, KeyTakeaways, AudioPlayer, DeepDive, ResponsiveTable, FormulaBox, EquationBreakdown, CalculationExercise, Chart, RoughChart, Flowchart) have redesigned counterparts in `src/components/redesign/lesson/`. Two components (GlossaryTerm and CaseStudy) are deferred because no lesson uses them today.

3. **Bridge the dark Greentryst hero language to the white reading area.** The lesson opens with a forest-tinted dark banner image carrying the lesson title, breadcrumb, and meta row, with a floating glass audio player straddling the bottom edge of the hero so the hero and the article feel like one continuous canvas instead of two separate pages.

The lesson page is intentionally less marketing-shaped than the homepage. It is shaped like a serious reference article with a working tool surface at the top.

## 2. Branch and Safety Rules

All lesson page work happens on the `redesign` branch. Local only, never pushed. Main continues to deploy to greentryst.com. Verify the current branch is `redesign` before editing.

## 3. Page Structure, In Order

The lesson page flows through six elements in a strict order:

1. Redesign navigation bar
2. Two-column body opens: persistent left sidebar plus main reading column
3. Main column: dark forest LessonDetailHero with background image, breadcrumb, meta row, lesson title, lesson id badge
4. Main column: (conditional) floating LessonGlassAudio straddling the hero/reading boundary
5. Main column: article reading column rendering the MDX through the redesigned component map, followed by the QuizRedesign block if a quiz YAML exists, followed by the bottom prev/next nav
6. Closing CTA (reused from homepage)
7. Footer (reused from homepage)

## 4. Section One. Persistent Left Sidebar

Component: `src/components/redesign/CourseDetailSidebar.tsx`. Reused unchanged from the course detail page spec.

The sidebar is sticky at `top-16, h-[calc(100vh-64px)]`, hidden on screens narrower than `lg`, and shows the course title with collapsible module sections. The sidebar imports `COURSE_ICON_MAP` directly to avoid passing a Lucide component prop across the server-to-client boundary.

## 5. Section Two. Dark Forest Hero Banner

Component: `src/components/redesign/LessonDetailHero.tsx`

Five-layer composition stacked back to front:

1. Background image, resolved from `resolveCourseImage(courseId, category)` in `src/components/redesign/course-images.ts`. The lesson uses the same per-course image as the course detail page so a course's lessons share visual identity.
2. Forest gradient overlay, vertical-leaning. Top half of the hero stays dark to keep the title readable. Middle area is slightly lighter. Bottom area returns to dark to give the floating glass audio a frame to land on.
3. Radial forest glow upper-left, 45 percent peak opacity.
4. Ambient leaf highlight lower-right, 22 percent peak opacity.
5. Subtle dot grid at 6 percent opacity.

Padding: when `reserveAudioSlot=true` (a leading AudioPlayer is detected in the MDX), padding is `pt-24 pb-28 lg:pt-28 lg:pb-32`. When false, padding is `pt-20 pb-14 lg:pt-24 lg:pb-20`. The asymmetric pt/pb when reserving audio slot ensures the breadcrumb sits well below the sticky nav while the bottom area stays tall enough for the floating audio to overlap.

Content layered over the surface, in order:

1. Breadcrumb back to course detail in mono uppercase muted white
2. Top metadata row: category eyebrow in mono mint, then `Module N: Title` and `Lesson N of M` and `N min read` separated by `/` dividers, all in mono
3. Lesson title in 3xl-44px extrabold white with tight tracking
4. Lesson id badge underneath the title in mono mint at 70 percent opacity

## 6. Section Three. Floating Glass Audio Player

Component: `src/components/redesign/lesson/LessonGlassAudio.tsx`

Conditionally rendered. The lesson route detects a leading `<AudioPlayer ... />` tag in the first 600 characters of the MDX source via regex, extracts the `src`, `title`, and `spotifyId` attributes, strips the tag from the MDX (so it does not render twice), and renders the glass variant in an absolutely-positioned wrapper at `bottom-0 left-0 right-0 translate-y-1/2` so it straddles the boundary between the dark hero and the white reading area.

Visual treatment: rounded-2xl, semi-transparent dark forest background `rgba(11,31,24,0.78)` with 18px backdrop blur, 1px inset white ring at 15 percent opacity, soft drop shadow tinted with the deep forest hex. White play button on a brand-forest tile with a leaf-green icon. Mint waveform that splits into played (white) and unplayed (white at 25 percent opacity) at the playhead. Mono speed pill in the top right.

Functionally identical to `AudioPlayerRedesign`: play/pause, skip 15s back/forward, seek by clicking the waveform, cycle through 6 playback speeds (0.5/0.75/1/1.25/1.5/2), Spotify embed mode if `spotifyId` is passed.

Any AudioPlayer that appears mid-content (not at the top of the MDX) renders inline through the redesigned MDX component map using the standard `AudioPlayerRedesign` block.

## 7. Section Four. Article Reading Column

Inline in `src/app/redesign/courses/[courseId]/[lessonId]/page.tsx`.

The article uses `max-w-[760px] mx-auto px-6 lg:px-10`. When the floating glass audio is present, top padding is `pt-28 lg:pt-32` so the audio has clearance. When absent, top padding is `pt-12 lg:pt-16`.

The MDX body is rendered through `MDXRemote` from `next-mdx-remote/rsc` with `getRedesignMDXComponents()` as the component map. `remarkGfm` is enabled for markdown table support.

### 7.1 Typography scale

Defined in `src/components/redesign/lesson/mdx-components-redesign.tsx`:

- `h2`: 2xl-28px extrabold, mt-14, mb-5, brand-green hairline bottom border
- `h3`: xl-22px bold, mt-10, mb-4
- `h4`: 17px bold, mt-7, mb-3
- `p`: 16px gt-text, leading-1.75, mb-5
- `ul / ol`: brand-green markers, leading-relaxed, mb-6
- `code` (inline): mono, gt-deepest text on a `gt-medium/[0.07]` chip with a 1px brand-green border
- `strong`: bold, gt-deepest
- `blockquote`: 3px brand-green left border, italic, gt-text-muted
- `a`: brand-green semibold underlined

### 7.2 Tables

Tables are styled via descendant selectors on the wrapper rather than via component overrides, because many lessons author tables as raw HTML inside `<ResponsiveTable>` and raw HTML inside a JSX component bypasses MDX's components map. Both `ResponsiveTableRedesign` and the bare `table` override apply identical descendant selectors so the styling is consistent regardless of which path the table takes through MDX.

Recipe (applied to both wrappers):

- Outer wrapper: rounded-2xl, white background, 1px brand-border-light border, soft shadow, overflow-x-auto for scrolling
- `[&_thead]`: subtle `gt-medium/[0.06]` tinted background
- `[&_th]`: 11px mono bold uppercase, gt-deepest text, hairline brand-green bottom border, generous padding, first/last cells get extra horizontal padding
- `[&_tr]`: subtle `gt-medium/[0.03]` hover tint
- `[&_td]`: 14px gt-text, hairline brand-border bottom border, top alignment, generous padding
- `[&_tr:has(th)]`: subtle tinted background for rows that contain th cells (catches lessons that author headers as `<tr><th>` without an explicit `<thead>`)
- `[&_tr:last-child td]`: bottom border stripped so the table closes cleanly into the rounded wrapper
- `[&_td_strong]`: gt-deepest, font-bold

## 8. Section Five. MDX Component Inventory

All 13 active MDX components have redesigned counterparts in `src/components/redesign/lesson/`. They share three structural conventions:

1. **Dark forest icon tile** at the top-left of every component. Same recipe as the catalogue rows: 40px square, `linear-gradient(135deg, #0B3D2E, #0d2a20)`, 1px inset white ring at 6 percent, soft drop shadow, leaf-green Lucide icon.
2. **Mono uppercase eyebrow** in brand green with 0.18em letter spacing.
3. **Generous my-7 vertical rhythm** between blocks.

### 8.1 Phase A: Callouts and Audio

File: `src/components/redesign/lesson/CalloutBoxes.tsx` and `AudioPlayerRedesign.tsx`

- `HighlightBoxRedesign`: leaf-green accent, lightbulb icon, "Key takeaway" eyebrow
- `AnalogyBoxRedesign`: forest accent, compass icon, "Analogy" eyebrow
- `ExampleBoxRedesign`: warm amber accent, pen-square icon, "Worked example" eyebrow (or override via `title` prop). Amber is the only non-forest accent in the lesson system; it stays because worked examples have always been amber and the convention is sticky.
- `KeyTakeawaysRedesign`: numbered list parsed from a `;;` delimited string prop, top accent bar in brand green
- `AudioPlayerRedesign`: forest tile, leaf-green icon, brand-green waveform, mono speed pill. Used for any AudioPlayer that does not sit at the top of the MDX (the leading AudioPlayer is lifted into the floating glass variant)

### 8.2 Phase B: Structural Blocks

File: `src/components/redesign/lesson/StructuralBlocks.tsx`

- `DeepDiveRedesign`: collapsible "Want to go deeper?" panel with a microscope icon and chevron rotation. Uses max-height transition.
- `ResponsiveTableRedesign`: scroll wrapper with descendant-selector table styling (see section 7.2)
- `FormulaBoxRedesign`: dark forest tile with sigma icon, mono leaf-green eyebrow `FORMULA`, body text in `text-white/90` (NOT mint, mint was too dim), bold text in pure white, inline code in leaf-green on `bg-white/10`
- `EquationBreakdownRedesign`: white card with mono eyebrow, equation row of pills + operator, then a grid of legend cards. 7-color palette so authors can still tag inputs visually. Hover/click on a pill or card highlights the matching item and fades the rest.

### 8.3 Phase C: Interactive Blocks

File: `src/components/redesign/lesson/InteractiveBlocks.tsx`

- `CalculationExerciseRedesign`: forest accent bar, calculator icon, "Practice calculation" eyebrow, brand-green Check button, leaf-green correct feedback, gt-border revealed-answer state, lightbulb hints
- `ChartRedesign`: recharts wrapper with brand-green palette (`#2D6A4F`, `#52B788`, `#0B3D2E`, `#95D5B2`, plus warmer forest tones for differentiation). Custom mono tooltip in brand chrome.
- `RoughChartRedesign`: thin wrapper around the original `RoughChart` component (which uses rough.js to draw hand-drawn canvas charts). Adds the new outer card chrome and "Hand-drawn chart" eyebrow but leaves the canvas drawing logic untouched.
- `FlowchartRedesign`: mermaid renderer with a brand-green theme. Overrides `themeVariables` so nodes use forest fills and edges use brand green. Same structural functionality as the original but reskinned.

### 8.4 Skipped components

- `GlossaryTerm`: never used in any lesson MDX, skipped for v1
- `CaseStudy`: never used in any lesson MDX, skipped for v1
- `GoDeeper`: only used in guides (not lessons), skipped for v1

## 9. Section Six. Quiz

Component: `src/components/redesign/lesson/QuizRedesign.tsx`

Self-contained client component. Owns its own state via `useState` so the lesson route stays a server component and just hands down the parsed `questions` array from `getQuiz(courseId, lessonId)`.

### 9.1 Quiz header

Mirrors the borrowed reference pattern: dark forest icon tile with brain icon, "KNOWLEDGE CHECK" mono eyebrow in brand green, "Test what you just learned" 20px bold heading, question count subtitle. On the right: "N of M answered" mono badge in `gt-medium/[0.08]` with a sparkles icon, plus a Reset link below it.

### 9.2 Question types

All four types preserved from the production Quiz with full logic:

- **Multiple choice**: lettered radio rows (A, B, C, D...). Selected state is brand-green border + tinted background. Letter badge flips from gt-border-light to brand-green-on-white when selected.
- **True/False**: 2-column grid with the same radio row treatment. Position 0 is True, position 1 is False (matches production).
- **Multi-select**: checkbox rows with a "Select all that apply" mono caption. Letter badges use rounded-md squares instead of circles to signal multi-select. Toggle add/remove on click.
- **Matching**: each left item gets a select dropdown. The right column is shuffled with a deterministic seed based on `lessonId + questionIndex` so the same question always renders the same shuffle. Correct mapping is computed against the seeded shuffle.

### 9.3 Per-question card

White card with rounded-2xl, hairline brand-border-light border, soft shadow. Numbered circular badge in mono brand green at the top-left. Question text in 16px semibold gt-text. Body indented to align with the question text.

Below the body: a brand-green Check button (disabled until an answer is selected) OR a feedback block once submitted. Feedback block is a horizontal row with an icon + bold heading + optional explanation in muted text. Correct uses leaf-green tint with a check icon, incorrect uses rose tint with a cross icon.

### 9.4 Final score band

Renders only when every question has been submitted. Leaf-green tinted card if all correct ("Perfect score"), forest-tinted card otherwise ("N of M correct"). Includes a friendly note about resetting or moving on.

### 9.5 Reset button

Top-right of the quiz section, sits below the answered badge. Visible whenever any answer state exists. Clears the entire state map.

## 10. Section Seven. Bottom Lesson Nav

Two-column grid below the article. Left column is the previous lesson card (or empty if at the start of the course). Right column is either the next lesson card OR a "Back to course overview" link if at the end of the course.

Both cards use the same recipe: rounded-xl, padded, mono uppercase "Previous lesson" / "Next lesson" eyebrow, lesson title in 14px semibold. The next-lesson card uses a brand-green tinted background and a brand-green border so it visually leads the eye forward.

## 11. Section Eight. Closing CTA and Footer

Reused unchanged from the homepage spec.

## 12. Server-Side Logic in the Route

`src/app/redesign/courses/[courseId]/[lessonId]/page.tsx`

1. `generateStaticParams` returns all lesson static params from `getLessonStaticParams`
2. `generateMetadata` returns a per-lesson title using `getCourse` and lesson lookup
3. `LessonRedesignPage` server component:
   - Loads the course via `getCourse(courseId)` and finds the lesson by id
   - Loads `getLessonNavContext` for prev/next navigation
   - Reads the MDX file from disk via `readFileSync`
   - Strips the leading MDX comment header
   - Calls `extractLeadingAudio(mdxSource)` to detect a leading AudioPlayer tag, extract its props, and strip it from the source
   - Calls `getQuiz(courseId, lessonId)` to load any quiz YAML
   - Renders the page

`extractLeadingAudio` regex matches a self-closing or paired AudioPlayer tag within the first 600 characters of the source, extracts `src`, `title`, and `spotifyId`, and returns the source with that tag removed.

## 13. Locked Copy Inventory

Most lesson content is dynamic (MDX from disk), so the locked copy is limited to the chrome:

1. Hero breadcrumb: `Back to {course title}` (course title pulled from `course.title`)
2. Lesson id badge: `Lesson N.M` (computed)
3. Hero meta row format: `Module N: Title / Lesson N of M / N min read`
4. Quiz eyebrow: `KNOWLEDGE CHECK`
5. Quiz heading: `Test what you just learned`
6. Quiz subtitle: `N questions · check each one as you go`
7. Quiz answered badge format: `N of M answered`
8. Quiz Check button: `Check answer`
9. Quiz correct feedback heading: `Correct`
10. Quiz incorrect feedback heading: `Not quite`
11. Quiz final perfect score heading: `Perfect score`
12. Quiz final partial score format: `N of M correct`
13. Quiz partial score sub: `Reset and try again, or move on and revisit this lesson later.`
14. Quiz multi-select caption: `Select all that apply`
15. Quiz matching caption: `Match each item to its pair`
16. Bottom nav previous eyebrow: `PREVIOUS LESSON`
17. Bottom nav next eyebrow: `NEXT LESSON`
18. Bottom nav final state: `Back to course overview`

## 14. Deferred and Post Cutover Work

1. Progress states (completed/in-progress/locked) on sidebar lessons. Returns when auth and cloud progress are wired up.
2. Mobile sidebar drawer. The sidebar is currently `hidden lg:block`. A burger-triggered slide-out drawer for narrow screens is a TODO.
3. Per-course audio detection currently uses a regex that captures any AudioPlayer in the first 600 characters. If a lesson author puts a non-leading AudioPlayer within the first 600 characters but with content above it, the regex still hoists it. Edge case; revisit when we see a real lesson that breaks it.
4. GlossaryTerm and CaseStudy MDX components are deferred. Build when an actual lesson uses them.
5. The redesigned Quiz does not persist state to localStorage or cloud. Production Quiz does. When auth lands, plumb the quiz state through the same mechanism.
6. Reading minutes for very short lessons may render as `0 min read` if the MDX is shorter than the algorithm's threshold. A floor of 1 minute may be desirable.
7. Sticky-shrinking hero on scroll (option 4 from the reference inventory) is deferred. The static dark hero already covers the user's needs and adding the sticky behavior would require a scroll listener and layout shim.

## 15. Change Control

If you are about to modify any file in `src/app/redesign/courses/[courseId]/[lessonId]/` or `src/components/redesign/lesson/`, read this document first. If your change affects any of the following, you must update this document in the same commit:

1. Any locked copy in section 13
2. The five-layer hero composition in section 5
3. The reading column typography in section 7.1
4. The descendant-selector table recipe in section 7.2
5. The dark forest icon tile recipe (which would also require updating the catalogue, course detail, and homepage components together)
6. The audio detection regex or its 600-character window in section 12
7. Any of the four quiz question type behaviors in section 9.2
8. The Phase A/B/C component file structure in section 8

Small visual tweaks, spacing adjustments, and color refinements within the locked token palette do not require an update to this document.

## 16. File Index

For fast navigation, here is every file that backs the lesson page:

1. `src/app/redesign/courses/[courseId]/[lessonId]/page.tsx` (server route)
2. `src/components/redesign/LessonDetailHero.tsx` (server component, dark forest banner)
3. `src/components/redesign/lesson/LessonGlassAudio.tsx` (client component, floating glass audio)
4. `src/components/redesign/lesson/QuizRedesign.tsx` (client component, knowledge check)
5. `src/components/redesign/lesson/CalloutBoxes.tsx` (Phase A callouts)
6. `src/components/redesign/lesson/AudioPlayerRedesign.tsx` (Phase A inline audio)
7. `src/components/redesign/lesson/StructuralBlocks.tsx` (Phase B structural)
8. `src/components/redesign/lesson/InteractiveBlocks.tsx` (Phase C interactive)
9. `src/components/redesign/lesson/mdx-components-redesign.tsx` (MDX component map and HTML element overrides)
10. `src/components/redesign/CourseDetailSidebar.tsx` (sidebar reused from course detail)
11. `src/components/redesign/course-images.ts` (per-course background image map)
12. `src/lib/courses.ts` (`getCourse`, `getLessonNavContext`, `getQuiz`, `getLessonStaticParams`)
13. `src/lib/types.ts` (QuizQuestion union type)
14. `src/lib/url-helpers.ts` (`urlToLessonId`, `lessonIdToUrl`)
15. `brainstorming/HOMEPAGE_LOCKED_SPEC.md`
16. `brainstorming/COURSES_LOCKED_SPEC.md`
17. `brainstorming/COURSE_DETAIL_LOCKED_SPEC.md`

End of locked specification.
