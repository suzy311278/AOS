# Greentryst Redesign Implementation Plan

Last updated: 2026-03-21 (v3, reviewed by Gemini + Codex, phased rollout)

## CRITICAL: Branch Rules

```
LIVE PRODUCTION = main branch (remote: academy)
  - NEVER push directly to main during implementation
  - NEVER run implementation commands while on main
  - Production deploys ONLY via PR merge after full QA

ALL IMPLEMENTATION WORK = redesign/greentryst-v2 branch
  - ALWAYS verify branch before ANY edit: git branch --show-current
  - If it says "main", STOP. Switch first: git checkout redesign/greentryst-v2
  - Every session starts with: git checkout redesign/greentryst-v2
```

## Prototype Reference

Prototype location: `stitch_sustainability_glossary/experiment-1/`
Serve locally: `python3 -m http.server 8888 --directory stitch_sustainability_glossary/experiment-1`
Pages: index.html, course.html, lesson.html, lesson-components.html, dashboard.html, glossary.html, signin.html, feedback.html, disclaimer.html

## Branch Strategy

**Two-stage approach: Build everything on branch first, then push to production in phases.**

```
STAGE 1: BUILD (all on feature branch, main untouched)
──────────────────────────────────────────────────────
main (live, protected, no direct push)
  └── redesign/greentryst-v2 (ALL work happens here)
        ├── Phase 0-4 built sequentially with build checks
        ├── Vercel preview URL for testing (NOT production)
        ├── Full QA gate must pass on preview URL
        └── Nothing merges to main until EVERYTHING works

STAGE 2: PRODUCTION ROLLOUT (phased merge from branch to main)
──────────────────────────────────────────────────────
Once Stage 1 is fully tested, create cherry-pick PRs to main:

  PR 1: Foundation + Shell (Phase 0 + Phase 1)
    → Merge, monitor 24h, confirm stable
    → Rollback point: Vercel instant rollback

  PR 2: Content Components (Phase 2)
    → Merge, monitor 24h, confirm all lessons render
    → Rollback point: revert PR 2 only

  PR 3: Pages (Phase 3 + Phase 4)
    → Merge, monitor 24h, full production verification
    → Rollback point: revert PR 3 only

Each PR only merges after the previous one is confirmed stable for 24h.
If any PR breaks production, revert ONLY that PR. Earlier PRs stay.
```

**Safety rails:**
- Vercel production branch locked to `main` only
- No wildcard branch promotion
- Feature branch never auto-deploys to production
- Preview URL sign-off checklist required before each PR
- 24h monitoring window between each production PR
- Each PR is independently revertable

## Design System (New Tokens)

**Colors:**
- primary: `#00433d` (DEFAULT), `#005c55` (light), `#006a63` (container), `#a7f0e6` (fixed), `#8cd4ca` (dim)
- surface: `#f8faf9` (DEFAULT), `#d8dada` (dim), `#eceeed` (container), `#f2f4f3` (container-low), `#e6e9e8` (container-high), `#e1e3e2` (container-highest), `#ffffff` (container-lowest)
- on-surface: `#191c1c`, on-surface-variant: `#3f4947`, on-primary: `#ffffff`
- outline: `#6f7977`, outline-variant: `#bec9c6`

**Fonts:**
- Display/Headlines: Manrope (400-800)
- Body/Labels: Inter (400-700)
- Icons: Material Symbols Outlined

**Shape:**
- Cards: `rounded-2xl`
- Buttons: `rounded-full`
- No 1px borders, tonal layering only

**Z-Index Scale (define in globals.css):**
- Sidebar: `z-10`
- Banner (sticky): `z-20`
- Nav: `z-30`
- Search modal: `z-[100]`
- Lesson meter overlay: `z-[110]`

**Utility Classes:**
- `.vines-gradient`: `linear-gradient(135deg, #00433d 0%, #006a63 100%)`
- `.hero-gradient`: `linear-gradient(135deg, #00433d 0%, #005c55 40%, #006a63 100%)`
- `.glass`: `rgba(255,255,255,0.08) + backdrop-blur(16px) + 1px solid rgba(255,255,255,0.12)`
- `.glass-light`: `rgba(255,255,255,0.8) + backdrop-blur(20px)`
- `.card-lift`: `translateY(-4px) + box-shadow on hover`

## Phase 0: Design Foundation (1 commit)

Files changed: 3 files. Risk: LOW (not zero, font loading can cause CLS)

| File | Change |
|------|--------|
| `tailwind.config.ts` | Add custom colors (primary, surface, on-surface, outline tokens). Keep all existing Tailwind defaults. |
| `src/app/layout.tsx` | Add Google Fonts link (Manrope + Inter + Material Symbols). Keep existing font as fallback. |
| `src/app/globals.css` | Add utility classes + z-index scale. Keep all existing styles. |

Verification: `npm run build && npm run start`, check 3 lesson pages for no CLS or hydration errors.

## Phase 1: Shell Components (6 commits)

| Commit | Component | What changes | What stays |
|--------|-----------|-------------|------------|
| 1a | `PlatformNav.tsx` | Glass nav, new layout (logo + search + XP/streak + Continue + Dashboard + avatar), hamburger on mobile | All prop interfaces, auth hooks, search trigger behavior |
| 1b | `SearchButton.tsx` + `SearchModal.tsx` | Glass modal, updated result styling, new typography | Fuse.js indexing, keyboard navigation, result linking logic |
| 1c | `Footer.tsx` | Dark 4-column footer with newsletter input | All link targets, copyright |
| 1d | `Sidebar.tsx` + `ProgressBar.tsx` | Tonal surface background, rounded-2xl active states, module collapse, fixed positioning with `hidden lg:flex` | All data flow (course.yaml loading, lesson list), progress display |
| 1e | `LessonNav.tsx` + `Breadcrumb.tsx` | Card-style prev/next, updated breadcrumb typography | Link generation logic |
| 1f | `CourseCard.tsx` + `MigrationBanner.tsx` | New card design with tonal layering, updated banner styling | Props, data flow, cookie logic |

Verification per commit: `npm run build`, open 3 lesson pages in dev server, check mobile and desktop.

## Phase 2: Content Components (6 commits)

| Commit | Components | Visual change |
|--------|-----------|---------------|
| 2a | `HighlightBox`, `AnalogyBox`, `ExampleBox` | New callout box styles (rounded-2xl, left border, icon + label header) |
| 2b | `FormulaBox`, `EquationBreakdown` | Dark bg formula, colored equation pills |
| 2c | `DeepDive`, `CalculationExercise`, `CaseStudy` | New collapsible style, violet exercise card, updated case study |
| 2d | `AudioPlayer.tsx` | Glass waveform style matching prototype |
| 2e | `Quiz.tsx` + `LessonMeter.tsx` | New quiz card UI, updated paywall overlay (z-index safe) |
| 2f | `mdx-components.tsx` (both root + src) + `Flowchart.tsx` + `GlossaryTerm.tsx` + `RoughChart.tsx` + `ResponsiveTable.tsx` | Updated h2/h3/h4/table/p overrides, Mermaid hex colors updated to new palette, tooltip + chart + table styling |

Verification: Load VM0042 lesson 3.1 (equations + formulas + tables), Article 6 lesson 1.3 (all callout types), a lesson with Mermaid flowchart, a lesson with audio. Check signed-in + signed-out flows.

## Phase 3: Page Components (4 commits)

| Commit | Page | Components touched |
|--------|------|--------------------|
| 3a | Homepage | `page.tsx`, `LandingClient.tsx` - hero with image bleed, stats bar, course grid with filters, social proof bento, CTA |
| 3b | Course Overview | `CourseShell.tsx`, `CourseOverviewClient.tsx`, `CourseRoadmap.tsx` - hero banner with background image, stats cards, module timeline |
| 3c | Lesson Page | `LessonClient.tsx` - banner with image + overlapping glass audio, sticky collapse, updated quiz/nav integration |
| 3d | Dashboard | `DashboardClient.tsx`, `StreakCalendar.tsx` - welcome header, stat cards, heatmap colors |

Verification: Full `npm run build`. All 100+ pages must generate via `generateStaticParams`. Run `npm run validate` for content.

## Phase 4: Supporting Pages (2 commits)

| Commit | Pages |
|--------|-------|
| 4a | Sign-in page + Sign-up page (both use Clerk `appearance` prop for new tokens) |
| 4b | Glossary page, Feedback page, Disclaimer page |

## Phase 5: QA Gate

**Build checks:**
- [ ] `npm run build` passes with 0 errors
- [ ] `npm run validate` passes (content validation)
- [ ] `npm run start` serves locally without hydration warnings in console
- [ ] All static pages generate (check build output count matches current production)

**Functional checks:**
- [ ] Auth flow: sign in with Google, sign out, dashboard access
- [ ] Auth flow: sign up, verify email flow renders correctly
- [ ] Progress: mark lesson complete, refresh, verify persistence in cloud
- [ ] Quiz: answer question, submit, see explanation + confetti + XP toast
- [ ] Audio: play, pause, seek, speed change on lesson with audio
- [ ] Search: Cmd+K, type query, click lesson result and glossary result
- [ ] LessonMeter: anonymous user hits 3-lesson limit, overlay appears with correct z-index
- [ ] MigrationBanner: appears for users with localStorage data, doesn't clip under nav

**Visual checks:**
- [ ] Mobile responsive: 375px, 768px, 1024px, 1440px (all page types)
- [ ] Sticky banner: scroll lesson page, banner collapses smoothly
- [ ] Sidebar: navigate between lessons, module collapse/expand, mobile hamburger toggle
- [ ] Mermaid flowcharts render with new color palette
- [ ] RoughChart renders with correct container backgrounds
- [ ] GlossaryTerm tooltips render with new styling
- [ ] Lighthouse: performance > 90, accessibility > 90, SEO > 90

**Content spot-checks (most complex lessons):**
- [ ] VM0042 lesson 3.1 (EquationBreakdown, FormulaBox, tables)
- [ ] Article 6 lesson 1.3 (HighlightBox, AnalogyBox, ExampleBox)
- [ ] Any lesson with Mermaid flowchart
- [ ] Any lesson with RoughChart
- [ ] Any lesson with AudioPlayer
- [ ] Any lesson with CaseStudy
- [ ] Any lesson with CalculationExercise

## Do NOT Touch (Zero Changes)

- `src/lib/db.ts`, `schema.ts`, `progress-cloud.ts` - database layer
- `src/lib/colors.ts` - keep existing color sets as fallback (remove only after Phase 5)
- `src/middleware.ts` - auth middleware
- `src/lib/courses.ts` - course loading logic (uses Node.js fs)
- `src/lib/url-helpers.ts` - URL conversion functions
- `src/content/**` - all MDX/YAML content files (100+ lessons, quizzes, course.yaml)
- API routes (`src/app/api/**`) - progress CRUD endpoints
- `scripts/**` - build/validation scripts
- `drizzle.config.ts`, `next.config.mjs` - build config
- Any `generateStaticParams` or `generateMetadata` functions
- `src/lib/progress.ts` - legacy localStorage hooks (kept for reference)

## Rollback Plan

Since production rollout is phased (3 separate PRs), rollback is granular:

**If PR 1 (Foundation + Shell) breaks:**
1. Vercel dashboard > Promote previous deployment (< 30 seconds)
2. Then `git revert` the PR 1 merge commit on main
3. Impact: nav/footer/sidebar reverts, content untouched

**If PR 2 (Content Components) breaks:**
1. Vercel dashboard > Promote pre-PR2 deployment
2. Then `git revert` PR 2 merge commit only (PR 1 stays)
3. Impact: callout boxes/quiz/audio revert, shell stays new

**If PR 3 (Pages) breaks:**
1. Vercel dashboard > Promote pre-PR3 deployment
2. Then `git revert` PR 3 merge commit only (PR 1 + PR 2 stay)
3. Impact: page layouts revert, components stay new

**Post-deploy verification (run after EACH PR merge):**
- [ ] Homepage loads, course cards visible
- [ ] Sign in with Google works
- [ ] Dashboard loads with progress data
- [ ] Open a lesson, content renders
- [ ] Cmd+K search returns results
- [ ] `/api/progress` returns 200 for authenticated user
- [ ] `/api/activity` returns data
- [ ] Anonymous user sees lesson meter after 3 lessons
- [ ] No console errors in browser DevTools

## Key Safety Rules

0. **BRANCH CHECK FIRST. ALWAYS.** Before any edit, run `git branch --show-current`. If it says `main`, run `git checkout redesign/greentryst-v2`. Never edit on main. Never commit on main. Never push to main directly.
1. One component at a time. Edit, build, verify. Never batch 5 component changes without a build check.
2. Feature branch only. All Phase 0-4 work happens on `redesign/greentryst-v2`. Production PRs only after full QA.
3. Vercel preview URL. Every push to the feature branch generates a preview. Test on real devices.
4. No structural changes. Keep same file structure, same prop interfaces, same data flow. Only change CSS classes and JSX structure within components.
5. Test with real content. Use the specific lessons listed in Phase 5 content spot-checks.
6. Keep `src/lib/colors.ts` untouched as fallback. Clean up only after QA passes.
7. Use git history as fallback for old styles. Don't comment out old classes in code.
8. Use `next build && next start` for local testing, not just `next dev`.
9. Test both signed-in and signed-out user flows after every phase.
10. Define all z-index values in globals.css to prevent overlay conflicts.

## Review Notes

This plan was reviewed by Gemini CLI (v0.34.0) and Codex CLI (v0.106.0) as senior software architects. Key additions from their review:
- 12 missing components added to phases (SearchModal, Quiz, LessonMeter, MigrationBanner, Flowchart, GlossaryTerm, CaseStudy, RoughChart, ResponsiveTable, ProgressBar, CourseCard, sign-up page)
- Z-index scale added to prevent overlay conflicts
- Rollback plan strengthened (Vercel dashboard as primary, git revert as secondary)
- CourseCard moved to Phase 1 (shared by Homepage + Dashboard)
- Quiz + LessonMeter moved to Phase 2 (must be done before Lesson page in Phase 3)
- Post-deploy verification checks added
- "0 risk" label removed from Phase 0
