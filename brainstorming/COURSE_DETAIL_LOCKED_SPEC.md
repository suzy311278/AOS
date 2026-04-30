# Greentryst Course Detail Page, Locked Specification

Status: LOCKED on 2026-04-11
Branch: `redesign` (local only, never pushed)
Live at: `/redesign/courses/[courseId]`
Target production route: `/courses/[courseId]` once the redesign branch is cut over

This document is the single source of truth for the Greentryst course detail page. Every section, every component, every line of copy, and every significant design decision is recorded here. If a future agent or contributor wants to change any element, they should start by reading this document in full, and any change must be approved before it lands. The detail page is the third major page in the redesign and shares the design language, dark forest tile recipe, and cross-link conventions of the homepage and catalogue.

## 1. Core Vision Reflected on this Page

The course detail page exists to do three jobs:

1. **Confirm the course is right for the visitor.** A practitioner who clicked through from the catalogue or a learning path lands here to confirm "is this the course I need." The header, the description, and the outcomes all serve that confirmation.
2. **Plant the simplification + sourcing narrative one more time.** The dark forest hero echoes the catalogue header. The reading-minutes-per-lesson signals that the content is condensed and learnable in evenings, not hours.
3. **Get the visitor into the curriculum.** The whole page funnels toward two actions: clicking the Start course CTA in the hero, or clicking a specific lesson row in the module timeline. Every decision below is in service of those two clicks.

The page is intentionally dense and reference-like, matching the catalogue's documentation register rather than a marketing course-sales template.

## 2. Branch and Safety Rules

All detail page work happens on the `redesign` branch. The branch is deliberately local only and must never be pushed to a remote. Main continues to deploy to greentryst.com during the redesign. Before editing any file referenced in this document, verify the current branch is `redesign` or a feature branch off it.

## 3. Page Structure, In Order

The detail page flows through six sections in a strict order. The sections are:

1. Redesign navigation bar
2. Two-column body opens: persistent left sidebar plus main content column
3. Main column: dark forest hero banner with background image
4. Main column: paired About + What you will learn block (side by side on desktop)
5. Main column: course content vertical timeline with module cards
6. Main column: Continue your path cross-link section
7. Closing CTA (reused from homepage)
8. Footer (reused from homepage)

The two-column layout collapses to a single column on mobile and hides the sidebar.

## 4. Section One. Navigation Bar

Component: `src/components/redesign/RedesignNav.tsx`. Reused unchanged from the homepage spec.

## 5. Section Two. Persistent Left Sidebar

Component: `src/components/redesign/CourseDetailSidebar.tsx` (`'use client'`)

A 300px-wide sticky panel anchored at `top-16, h-[calc(100vh-64px)]` so it scrolls independently of the main column on desktop. Hidden on screens narrower than `lg`.

The sidebar header contains a small dark forest icon tile (44px square, leaf-green Lucide icon, same recipe as catalogue rows), a category eyebrow in mono uppercase, and the course title. Clicking the title returns to the same detail page.

Below the header sits a vertical list of modules. Each module is a button with a 2-digit mono index, the module title, and a chevron that rotates on expand. Clicking expands or collapses the module's lesson list. The first module is expanded by default; the rest start collapsed so courses with many modules do not flood the rail.

Each lesson row inside an expanded module shows the lesson id (mono, dim, w-7) and the lesson title (truncated to two lines). Clicking navigates to `/courses/[courseId]/[lessonId]` via the `lessonIdToUrl` helper which converts dot-separated lesson ids into underscore-separated URL segments.

No per-lesson progress states for v1. The reference design used check_circle / play_circle / lock icons to show completed, current, and locked lessons; those return when auth and cloud progress are wired up.

### Server to client boundary fix

The sidebar imports `COURSE_ICON_MAP` from `CourseRow.tsx` directly and resolves the course icon from `courseId` internally. This avoids passing a Lucide component prop across the server-to-client boundary.

## 6. Section Three. Dark Forest Hero Banner

Component: `src/components/redesign/CourseDetailHero.tsx` (server component)

The hero is a five-layer composition stacked back to front:

1. **Background image.** A hand-mapped Unsplash photo loaded from `public/images/course-headers/`. The image is rendered with a plain `<img>` tag set to `object-cover` so it fills the entire hero regardless of intrinsic dimensions.
2. **Forest gradient overlay.** A 110-degree linear gradient from `rgba(11,31,24,0.96)` on the left through `rgba(11,31,24,0.92)` at 40 percent through `rgba(11,31,24,0.72)` at 75 percent to `rgba(11,31,24,0.55)` on the right. This keeps the text-heavy left side solidly readable while letting the image breathe through more on the right where there is less content.
3. **Radial forest glow** in the upper-left (45 percent peak opacity, fading to transparent at 70 percent radius).
4. **Ambient leaf highlight** in the lower-right (18 percent peak opacity, smaller radius).
5. **Dot grid** at 6 percent opacity for the brand texture.

The content sits at `relative z-10` above all five layers and contains, in order:

1. Breadcrumb back to `/redesign/courses` in mono uppercase muted white
2. Category eyebrow in mono uppercase mint
3. A horizontal block with a large 80px dark forest icon tile next to the course title (3xl on mobile, up to 44px on large screens)
4. The course subtitle in muted white at 18px max-w-2xl
5. A mono metadata row showing hours, modules, and lessons with mint icons and white-bold values
6. A single primary CTA `Start course →` in leaf green that links to `/courses/[courseId]`

### Background image lookup

The background image is resolved by priority:

1. `imageUrl` prop passed at the call site (per-course override)
2. `COURSE_BG_IMAGES[courseId]` (the hand-curated map below)
3. `CATEGORY_BG_IMAGES[category]` (sensible category fallback)
4. `FALLBACK_BG_IMAGE` (rolling green hills)

The 22 courses are mapped to 13 unique Unsplash photos by topical relevance. The full mapping is locked in section 12 of this document.

## 7. Section Four. Paired About + What You Will Learn

Inline in `src/app/redesign/courses/[courseId]/page.tsx`.

A 2-column grid that stacks on mobile. Items align at the top so any whitespace falls below the shorter column, never in the middle.

Left column heading and subheading:

- Eyebrow `ABOUT THIS COURSE` in mono uppercase brand green
- Section heading `Why this course exists` in 24px bold dark text
- Body paragraph: `course.description` from the YAML

Right column heading and subheading:

- Eyebrow `WHAT YOU WILL LEARN` in mono uppercase brand green
- Section heading `After this course you will be able to` in 24px bold dark text
- A vertical list of 4 outcome bullets, each with a leaf-green check mark inside a soft tinted circle

Outcome bullets are sourced from `COURSE_OUTCOMES_MAP` in `src/components/redesign/course-outcomes.ts`. Every published course has hand-curated outcomes (4 per course) so the section never falls back to the generic line. The full map is the source of truth for these strings; do not change them in the page file.

The grid sits inside `max-w-[1100px]` with `px-8 lg:px-12` and `py-16 lg:py-20`. Bottom margin is `mb-20` to give breathing room before the timeline.

## 8. Section Five. Course Content Timeline

Component: `src/components/redesign/CourseModuleTimeline.tsx`

A vertical connected timeline rendered as full-width entries inside the main column. Each module is one entry with:

1. A 2px vertical line on the left, stretching from the module node down to just below the module card. The line stops on the last module so the timeline does not dangle.
2. A dark forest circular node at the top-left of the entry (32px on mobile, 40px on lg) containing the 2-digit module number in mono leaf-green text. Same dark forest tile recipe as the catalogue rows: linear-gradient `#0B3D2E to #0d2a20`, 1px inset white ring at 6 percent opacity, soft drop shadow.
3. A white card with rounded corners, hairline border, and the standard `shadow-gt-card`. The card has two parts:
   - **Header:** mono uppercase `Module N · N lessons` line, then the module title in 20px bold, then the optional module subtitle in 14px muted text.
   - **Lesson list:** divided by hairlines, each row is a clickable link to `/courses/[courseId]/[lessonId]`. Each row shows the lesson id (mono, dim, w-10), the lesson title in 14px bold, an optional `vmRef` line in mono small text, the reading minutes in mono dim text on the right, and an arrow that slides on hover.

### Reading minutes, not duration

The lesson row displays `lesson.readingMinutes` (computed at build time from the MDX word count via `computeReadingTime` in `src/lib/reading-time.ts`), not the manually authored `lesson.duration` field. Reading minutes update automatically when content changes, so the displayed time never drifts from reality. The format is `N min read`.

### vmRef line

If a lesson has a `vmRef` field in `course.yaml` (the source document reference), it renders as a small mono uppercase line under the lesson title. This is the closest thing to a per-lesson source citation and reinforces the "every lesson has a reference you can defend" promise from the homepage and catalogue. If `vmRef` is absent, the line is omitted.

## 9. Section Six. Continue Your Path

Component: `src/components/redesign/RelatedLearningPaths.tsx`

Auto-derives which curated learning paths include the current course id by calling `findPathsContainingCourse(courseId)` from `learning-paths-data.ts`. If no path includes the course, the section renders nothing.

The section shows:

1. Eyebrow `CONTINUE YOUR PATH` in mono uppercase brand green
2. Heading: `This course is part of N curated path(s)` (singular if 1, plural if more)
3. A short description sentence
4. A 2-column grid of compact path cards

Each path card has a small dark forest icon tile on the left (12 in size, leaf-green role icon resolved from `ROLE_ICONS`), then a stacked text block with a mono role label, the path title, and a `Course N of 5` position label that uses the index of the current course in the path's `steps` array. Cards link to the catalogue page with an anchor for the path id.

Position label format: `Course {index + 1} of {steps.length}`, e.g. `Course 2 of 5`.

## 10. Section Seven. Closing CTA

Reused unchanged from the homepage spec. Same dark band with three promises and signature.

## 11. Section Eight. Footer

Reused unchanged from the homepage spec. Five-column footer with brand column, newsletter, socials, and four link columns.

## 12. Course Background Image Mapping

The 22 courses are mapped to 13 Unsplash photos hosted at `public/images/course-headers/`. Some images are deliberately reused for thematically related courses. The full mapping:

| Course | Image | Why |
|---|---|---|
| article-6 | adam-jang-MLKrf51NV8w | Iceland coast, international scale |
| circular-economy | qingbao-meng-01_igFr7hd4 | Rolling green hills, regenerative |
| climate-science-101 | alexandre-brondino--bi8zhvPhVA | Lightning storm, climate dynamics |
| double-materiality | qingbao-meng-01_igFr7hd4 | Rolling hills (reused) |
| esg-benchmarking | aaron-lefler-ySZdYkPGEbs | Calculator on math notes |
| esg-investing | venti-views-FPKnAO-CF6M | Container ship, global investing |
| esg-reporting | aaron-lefler-ySZdYkPGEbs | Calculator (reused) |
| eu-cbam | venti-views-FPKnAO-CF6M | Container ship border trade |
| eu-sfdr | aaron-lefler-ySZdYkPGEbs | Calculator (reused for finance) |
| eu-taxonomy | adam-jang-MLKrf51NV8w | EU coast (reused) |
| eudr | matt-palmer-K5KmnZHv1Pg | Deforestation landscape |
| financed-emissions | daniel-moqvist-WZw6zs0kKzo | Power plant smokestacks (reused) |
| ghg-scope-1-2 | daniel-moqvist-WZw6zs0kKzo | Power plant smokestacks |
| ghg-scope-3 | jimmy-desplanques-viJErzTznBQ | Aerial industrial facility |
| human-rights-dd | tim-mossholder-xDwEa2kaeJA | Field workers harvesting |
| ifc-performance-standards | jimmy-desplanques-viJErzTznBQ | Aerial industrial (reused) |
| ifrs-s2 | alexandre-brondino--bi8zhvPhVA | Lightning storm (reused) |
| sbti | nicholas-doherty-pONBhDyOFoM | Offshore wind farm |
| tnfd-biodiversity | marina-YmQ0-nmWcV0 | Beach cave / ocean / nature |
| vcm-101 | vlad-hilitanu-QqSIuvz94s8 | Forest road aerial |
| vm0042 | land-o-lakes-inc-iFx1WMvjvpw | Agricultural worker picking fruit |
| vm0044 | matt-palmer-K5KmnZHv1Pg | Forest landscape (reused) |

Per-category fallback images for any future course not in the map:

- fundamentals: alexandre-brondino (lightning)
- markets: vlad-hilitanu (forest road)
- esg: aaron-lefler (calculator)
- green-finance: venti-views (container ship)
- sustainability-standards: matt-palmer (deforestation)
- methodologies: qingbao-meng (rolling hills)

## 13. Locked Copy Inventory

Every piece of copy on the course detail page is recorded below. If any of this needs to change, update this document at the same commit.

1. Hero breadcrumb: `Back to catalogue`
2. Hero CTA: `Start course`
3. Hero metadata format: `Nh total · N modules · N lessons`
4. About eyebrow: `ABOUT THIS COURSE`
5. About heading: `Why this course exists`
6. About body: pulled from `course.description` (varies per course)
7. Outcomes eyebrow: `WHAT YOU WILL LEARN`
8. Outcomes heading: `After this course you will be able to`
9. Outcome bullets: pulled from `COURSE_OUTCOMES_MAP[courseId]` (varies per course, 4 per course, hand-curated)
10. Course content eyebrow: `COURSE CONTENT`
11. Course content heading format: `N modules · N lessons`
12. Course content sub paragraph: `Walk through the modules in order or jump to a specific lesson. Each lesson is a real chapter you can open and start reading immediately.`
13. Module card mono header format: `Module N · N lessons`
14. Lesson row reading time format: `N min read`
15. Continue your path eyebrow: `Continue your path`
16. Continue your path heading format: `This course is part of N curated path(s)`
17. Continue your path sub: `Each path is a sequence of five courses designed to take a practitioner from first principles to defensible output. Pick one to see where this course fits.`
18. Path card position format: `Course N of 5`

## 14. Deferred and Post Cutover Work

1. Progress states (completed/in-progress/locked) on the sidebar lessons and the timeline modules. Returns when auth and cloud progress are wired up.
2. Mobile sidebar drawer. The sidebar is currently `hidden lg:block`. A burger-triggered slide-out drawer for narrow screens is a TODO.
3. Per-course image overrides at the call site (the `imageUrl` prop is wired but not used by the page). When specific courses get their own bespoke imagery, pass the override through the page route.
4. Reading minutes for very short lessons may render as `0 min read` if the MDX is shorter than the algorithm's threshold. A floor of 1 minute may be desirable.
5. The vmRef line under each lesson title is the only "source citation" surface today. When SustainIQ and the source library are rebuilt, lessons should link to the actual source pages.
6. Course-level outcome bullets are hand-curated. Future iterations could compute them from the SKILL_MAP plus a templating step, but the hand-curated versions remain higher quality and should win unless authoring effort becomes a real constraint.

## 15. Change Control

If you are about to modify any file in `src/app/redesign/courses/[courseId]/` or `src/components/redesign/CourseDetailHero.tsx`, `CourseDetailSidebar.tsx`, `CourseModuleTimeline.tsx`, `RelatedLearningPaths.tsx`, or `course-outcomes.ts`, read this document first. If your change affects any of the following, you must update this document in the same commit:

1. Any locked copy in section 13
2. Any entry in `COURSE_BG_IMAGES`, `CATEGORY_BG_IMAGES`, or the fallback in section 12
3. Any entry in `COURSE_OUTCOMES_MAP`
4. The five-layer hero composition in section 6
5. The reading minutes vs duration decision in section 8
6. The auto-derive logic for related paths in section 9
7. The dark forest icon tile recipe (which would also require updating `CourseRow.tsx`, `LearningPathShowcase.tsx`, and `CourseDetailSidebar.tsx` together)

Small visual tweaks, spacing adjustments, color refinements within the locked token palette, and internal component refactors that do not alter the rendered output do not require an update to this document.

## 16. File Index

For fast navigation, here is every file that backs the course detail page:

1. `src/app/redesign/courses/[courseId]/page.tsx` (server route, loads course, renders sidebar + main column)
2. `src/components/redesign/CourseDetailHero.tsx` (server component with five-layer hero and image map)
3. `src/components/redesign/CourseDetailSidebar.tsx` (`'use client'` sticky sidebar with collapsible modules)
4. `src/components/redesign/CourseModuleTimeline.tsx` (vertical connected timeline with module cards and lesson rows)
5. `src/components/redesign/RelatedLearningPaths.tsx` (auto-derived path cards)
6. `src/components/redesign/course-outcomes.ts` (`COURSE_OUTCOMES_MAP` and `DEFAULT_COURSE_OUTCOMES`)
7. `src/components/redesign/learning-paths-data.ts` (`LEARNING_PATHS` and `findPathsContainingCourse`, shared with the catalogue page)
8. `src/components/redesign/CourseRow.tsx` (exports `COURSE_ICON_MAP` reused by the sidebar)
9. `src/components/redesign/index.ts` (barrel exports)
10. `public/images/course-headers/` (13 Unsplash photos used by the hero map)
11. `src/lib/courses.ts` (`getCourse` server-only loader, populates `lesson.readingMinutes` at build time)
12. `src/lib/reading-time.ts` (the word-count to reading-minutes converter)
13. `src/lib/url-helpers.ts` (`lessonIdToUrl` for the lesson links)
14. `brainstorming/HOMEPAGE_LOCKED_SPEC.md` (the homepage spec, which this page extends)
15. `brainstorming/COURSES_LOCKED_SPEC.md` (the catalogue spec, which this page continues from)

End of locked specification.
