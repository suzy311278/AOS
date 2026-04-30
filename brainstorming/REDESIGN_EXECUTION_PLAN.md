# Greentryst Redesign Execution Plan

**Date:** April 2026
**Status:** Planning phase, pre-execution
**Goal:** Ship the Greentryst redesign + Product Blueprint features (SustainIQ v2, Career, Tools layer) without impacting the live site. Cut over to new design only when fully ready.

## 0. Core Principles

1. **The live site never breaks.** Current visitors keep seeing the current site until we explicitly flip the switch.
2. **Work happens on a dedicated branch.** Never directly on main.
3. **Everything is preview-testable.** Vercel preview deployments per PR, so we can review in real browsers at real URLs before any cutover.
4. **Incremental merges, single cutover.** Small PRs merged into the redesign branch throughout. One final merge from redesign to main when ready.
5. **Existing URLs do not move.** All current `/courses/[courseId]/[lessonId]` URLs preserve their SEO and internal links. New sections (/learn hub, /tools, /sustainiq, /dashboard) are additive.
6. **Content stays intact.** We are redesigning the shell and adding new capabilities, not rewriting 470 lessons. MDX content is reused.

## 1. Branch and Deployment Strategy

### 1.1 Branch Structure

```
main                       <- live production, untouched during redesign
  |
  +--- redesign            <- integration branch, receives all redesign work
         |
         +--- redesign/design-system
         +--- redesign/homepage
         +--- redesign/course-pages
         +--- redesign/sustainiq-v2
         +--- redesign/tools-calculator
         +--- redesign/pricing-auth
         +--- redesign/qa-fixes
         (feature branches merged into redesign, not main)
```

**Rule:** Any work session starts with `git checkout redesign` and creates a feature branch off it. Never `git checkout main` for redesign work.

### 1.2 Vercel Preview Setup

- Main branch continues to deploy to **greentryst.com** (production)
- Redesign branch deploys to **redesign-greentryst.vercel.app** (persistent preview, same as production config minus domain)
- Every PR against redesign gets its own preview URL for review
- Use Vercel environment variables to ensure redesign preview uses a **separate Turso database branch** if schema changes are involved, so live user data is not corrupted

### 1.3 Branch Safety Checklist (run before every session)

```bash
git branch --show-current          # must say "redesign" or "redesign/*"
git status                          # must be clean or only expected changes
git fetch academy                   # sync with remote
git log --oneline main..HEAD | head # confirm we are ahead of main
```

## 2. Architectural Strategy: Route Groups

Next.js 14 App Router supports **route groups** `(groupname)` which let us organize routes without affecting URLs. We use this to run new and old UI in parallel inside the same codebase.

```
src/app/
  (current)/                      <- existing site, untouched
    page.tsx                      <- current homepage
    courses/
      [courseId]/
        [lessonId]/
          page.tsx               <- current lesson page
  (redesign)/                    <- new site, additive
    page.tsx                     <- new homepage
    learn/
      page.tsx                   <- new course directory
    sustainiq/
      page.tsx                   <- new SustainIQ page
    tools/
      page.tsx                   <- new tools hub
  layout.tsx                     <- shared layout with env-based routing
```

### Layout Switching

The root layout reads an env var `NEXT_PUBLIC_UI_VERSION`:
- `current` (default, production): shows `(current)` routes
- `redesign` (preview, staging): shows `(redesign)` routes
- `both` (development): renders a toggle in the header to flip between them

This means:
- Production deployments of main see only the current UI
- Redesign preview deployments see only the new UI
- Development sees both, so designers and reviewers can compare side by side

## 3. Phased Execution Plan

Each phase is a batch of work that can be reviewed and merged independently. Phases are roughly sequential but some can overlap.

### Phase 0: Safety Setup (1-2 days)

**Goal:** Create the branch, configure preview deployment, verify nothing broken.

- [ ] Create `redesign` branch off current main
- [ ] Push to academy remote: `git push academy redesign`
- [ ] Configure Vercel to auto-deploy redesign branch to a preview URL
- [ ] Add `NEXT_PUBLIC_UI_VERSION` env var to Vercel (set to `redesign` on preview, `current` on production)
- [ ] Create route group `src/app/(current)/` and move current pages into it (URLs stay the same)
- [ ] Create empty `src/app/(redesign)/` structure
- [ ] Verify live site still works exactly as before
- [ ] Verify preview URL exists and is accessible
- [ ] Document setup in CLAUDE.md so future sessions know the rules

**Exit criteria:** Live site unchanged, redesign preview URL live and showing the old site, `NEXT_PUBLIC_UI_VERSION` switch works locally.

### Phase 1: Design System Foundation (3-5 days)

**Goal:** Extract the approved visual language into reusable components before building any pages.

- [ ] Create `src/components/redesign/` directory (parallel to existing components)
- [ ] Extract shared components from `GREENTRYST_DESIGN_BIBLE.md`:
  - `RedesignNav` (fixed top, Learn/SustainIQ/Career/Tools/Pricing)
  - `RedesignFooter`
  - `DarkSection` wrapper (with dot grid background)
  - `LightSection` wrapper
  - `DarkUICard` (the signature product UI card)
  - `StatBadge` (Live/Coming Soon pills)
  - `Stat` (mono number + label)
  - `CategoryLabel` (uppercase teal section label)
  - `SectionHeading` (large bold headline)
  - `PricingCard` (standard + highlighted variants)
- [ ] Update Tailwind config with the redesign color tokens (additive, does not remove existing colors)
- [ ] Load Inter + JetBrains Mono fonts in redesign layout
- [ ] Build a `/redesign/components` showcase page (only accessible in dev) that renders every component for visual QA

**Exit criteria:** Every component from the Design Bible exists as a React component, with TypeScript props, and renders correctly in isolation.

### Phase 2: New Homepage (3-4 days)

**Goal:** Assemble all six approved homepage sections into a single live page on the redesign branch.

- [ ] Port Hero section from `stitch-output/sections/hero-section.html` to React
- [ ] Port Trust Identity section
- [ ] Port Work Modes section
- [ ] Port Product Showcases section (Learn, SustainIQ, Career)
- [ ] Port Tool Showcases section (GHG Calculator, Report Drafter, BRSR Screener)
- [ ] Port Connected System section (two-row layout with Tools)
- [ ] Port Pricing + CTA section
- [ ] Assemble into `src/app/(redesign)/page.tsx`
- [ ] Add SEO metadata (OG image, description, structured data)
- [ ] Review on preview URL in browser, test responsiveness
- [ ] Iterate on any sections that need refinement

**Exit criteria:** New homepage accessible at the redesign preview URL, visually matches approved Stitch outputs, responsive on desktop/tablet/mobile.

### Phase 3: Course Pages Redesign (7-10 days)

**Goal:** Rebuild the course directory, course overview, and lesson pages with the new design. Lesson page is a FULL rebuild of all interactive components.

- [ ] **Course directory** (`/learn`)
  - Port from `stitch-output/pages/course-directory.html`
  - Wire up to existing `src/lib/courses.ts` (loads real course.yaml files)
  - Add search + category filter logic
  - Show all 22+ courses with real data
  
- [ ] **Course overview** (`/courses/[courseId]`)
  - Port from `stitch-output/pages/course-overview.html`
  - Wire up to existing course.yaml structure
  - Show real module/lesson tree from current content
  - Show real certificate preview
  
- [ ] **Lesson page** (`/courses/[courseId]/[lessonId]`) - FULL REBUILD
  - New page shell with redesign navigation
  - New course sidebar with module/lesson tree (not generic app sidebar)
  - New main content layout with reading-optimized typography
  - New right-margin / on-page anchor navigation
  - **Rebuild every MDX component with new design language:**
    - `HighlightBox` (new color treatment)
    - `AnalogyBox`
    - `ExampleBox`
    - `FormulaBox` (dark card treatment)
    - `CalculationExercise` (interactive with new styling)
    - `DeepDive` (collapsible with new affordances)
    - `RoughChart` (verify new colors work with rough.js)
    - `EquationBreakdown` (new color-coded pills)
    - `ResponsiveTable`
    - `GlossaryTerm` (new tooltip styling)
    - `CaseStudy`
  - **Rebuild platform components:**
    - `AudioPlayer` (orange waveform, play/pause, speed, seek bar - full visual rebuild)
    - `Quiz` (new question card, options, explanation reveal)
    - `LessonMeter` (soft registration wall with new design)
    - `Sidebar` (course navigation with module tree)
    - `LessonNav` (prev/next with new button treatment)
    - `ProgressBar`
  - Ensure `/courses/[courseId]/[lessonId]` URLs still work (canonical, SEO-critical)
  - Preserve all MDX content exactly as-is
  - Progress tracking, scroll position, quiz state all continue to work

**Exit criteria:** All 22+ courses browsable in new design. All 470+ lessons render with full redesign. Every interactive component rebuilt with new design language. No content lost. Existing URLs still work. Progress/quiz functionality preserved.

### Phase 4: All Remaining Pages (8-12 days)

**Goal:** Build every remaining page in the new design language so the entire site is visually complete.

- [ ] **SustainIQ `/ask`** (redesign existing page)
  - Redesign current /ask page with new design language
  - Keep existing Groq backend wired up
  - New search interface, new results display, new citation cards
  - Query history, tier-gated limit indicator
  
- [ ] **Career / Jobs page** (`/jobs`)
  - Apply new design to existing jobs page
  - New filter UI, new job cards
  - Placeholder for match scores (functionality deferred)
  
- [ ] **Dashboard** (`/dashboard`)
  - Full redesign of existing dashboard
  - Streak calendar, course progress, profile section
  - Skills/certs display, match score placeholder
  
- [ ] **Pricing page** (`/pricing`)
  - Full pricing page (display only, no Stripe integration yet)
  - Three tiers: Learn $8, Career $14, Pro $25
  - Annual toggle, regional pricing note, lifetime deal section
  - CTAs route to placeholder "coming soon" flow
  
- [ ] **Tools hub** (`/tools`)
  - Landing page showing all planned tools
  - Each tool gets a "Coming Soon" UI preview card
  - No actual tool functionality
  
- [ ] **Individual tool placeholder pages** (`/tools/ghg-calculator`, `/tools/report-drafter`, `/tools/brsr-screener`)
  - Marketing page showing what the tool will do
  - UI mockup/preview of the tool interface
  - "Notify me when live" email capture
  
- [ ] **Intelligence placeholder pages** (`/intelligence/screener`, `/intelligence/regulations`, `/intelligence/rfp`)
  - Marketing pages showing what will be available
  - "Coming Soon" state
  
- [ ] **Community placeholder** (`/community`)
  - Marketing page showing planned community features
  - "Coming Soon" state
  
- [ ] **Glossary page** (`/glossary`)
  - Apply new design to existing glossary (190+ terms)
  - Search, alphabetical navigation, term detail cards
  
- [ ] **Certificate verification** (`/verify/[certId]`)
  - Public certificate view page with new design
  
- [ ] **Settings / Account** (`/settings`)
  - User profile, preferences, subscription display (no actual subscription yet)
  
- [ ] **Sign in / Sign up** pages (`/sign-in`, `/sign-up`)
  - Apply redesign to Clerk components
  
- [ ] **Auth state variants for every page**
  - Each page has a signed-in and signed-out version
  - Signed-in users see different CTAs, nav items, progress indicators

**Exit criteria:** Every page in the site exists with the new design. Every page has signed-in and signed-out variants where relevant. Placeholder pages clearly marked "Coming Soon." Entire site visually consistent as one cohesive product.

### Phase 5: QA and Cutover (1-2 weeks)

**Goal:** Final testing, content validation, and merge to main. This is where the redesign goes live.

- [ ] **Visual QA**
  - Every page reviewed in browser on desktop, tablet, mobile
  - Dark mode consistency check
  - Typography scale audit
  - Compare against Stitch designs side by side
  - Signed-in and signed-out variants verified on every page
  
- [ ] **Functional QA**
  - Every course loads
  - Every lesson renders with all MDX components working
  - Every quiz works
  - AudioPlayer works on every lesson with audio
  - Progress tracking works end-to-end
  - Auth flow works (sign up, sign in, sign out)
  - /ask still works with Groq backend
  - Dashboard shows correct data
  - Placeholder "Coming Soon" pages clearly marked
  
- [ ] **SEO audit**
  - All existing URLs still work (especially `/courses/[courseId]/[lessonId]`)
  - Meta descriptions, OG images, structured data
  - Sitemap updated with new pages
  
- [ ] **Performance audit**
  - Lighthouse scores on key pages
  - Bundle size check
  - Image optimization
  
- [ ] **Content validation**
  - `npm run validate` passes
  - No broken internal links
  - All source citations present
  
- [ ] **Legacy file archival**
  - Move `VM0042_Learning_Module.html` to `archive/`
  - Move `index.html` to `archive/`
  
- [ ] **Cutover**
  - Merge redesign branch to main via PR
  - Flip `NEXT_PUBLIC_UI_VERSION` to `redesign` on production
  - Monitor error rates and user feedback for 48 hours
  - Rollback plan: flip env var back to `current`, still serves old UI

**Exit criteria:** Merged to main, live on greentryst.com, error rates normal, no critical bugs. Site visually transformed, all existing functionality preserved.

---

## POST-CUTOVER PHASES (Deferred, to execute after visual redesign ships)

The following phases are **DEFERRED** until after the visual redesign cutover is live and stable. They represent the functionality work that brings the blueprint vision online progressively. The UI for all of this is built during Phases 1-5; these phases add the backend/logic behind the UI.

### Phase 6 (Post-Cutover): SustainIQ Retrieval Upgrade (7-10 days)

**Goal:** Upgrade the RAG pipeline per `RETRIEVAL_ARCHITECTURE.md`. UI is already live from Phase 4, this phase upgrades what happens behind it.

- [ ] **Better parsing** (Priority 1)
  - Integrate Docling for layout-aware PDF parsing
  - Re-parse all 80+ source PDFs, output structured JSON
  - Preserve section hierarchy, tables, cross-references
  
- [ ] **Hierarchical chunking** (Priority 2)
  - Implement multi-resolution chunking (document/section/subsection/atomic)
  - Store parent-child relationships in vector DB metadata
  
- [ ] **Hybrid search** (Priority 3)
  - Add BM25 sparse index alongside existing dense vectors
  - Implement Reciprocal Rank Fusion for merging results
  
- [ ] **Cross-encoder re-ranking** (Priority 4)
  - Integrate bge-reranker-v2-m3 or cohere-rerank-v3
  - Re-rank top 30 candidates to top 10
  
- [ ] **Parent chunk expansion**
  - After re-ranking, return parent chunks to the LLM for context
  
- [ ] **Optional model swap**
  - Evaluate Gemma 4 26B MoE locally vs keeping Groq
  - A/B test answer quality before deciding

**Exit criteria:** SustainIQ answer quality measurably improved. Test with 20-30 known queries and compare against current baseline. All answers still sourced and citable.

### Phase 7 (Post-Cutover): Tools Layer Implementation (2-6 weeks)

**Goal:** Bring the tool pages (already built in Phase 4) to life with real functionality. Start with GHG Calculator, then expand.

- [ ] **GHG Inventory Calculator**
  - Wire up to emission factors database (sourced with provenance)
  - Support Scope 1, 2, 3 calculations
  - Auto-generate audit trail / methodology notes
  - Export to PDF/Excel
  - Replace "Coming Soon" state with working tool
  
- [ ] **Report Drafter**
  - BRSR Comprehensive + Core templates
  - GRI, TCFD, CSRD templates
  - Data input from GHG Calculator
  - Section-by-section guided drafting
  - Export to Word/PDF
  
- [ ] **BRSR Company Screener**
  - Index top 1000 BSE-listed company BRSR filings
  - Extract structured ESG data
  - Comparison view, peer benchmarking
  - Sourced data with links to original filings
  
- [ ] **Intelligence Layer (if capacity allows)**
  - Regulation Tracker (jurisdictional database)
  - RFP Aggregator
  - Company ESG Screener expansion

**Exit criteria:** Each tool works end-to-end with real data, every output traceable to source, exportable. Replaces "Coming Soon" states from Phase 4.

### Phase 8 (Post-Cutover): Auth + Pricing + Subscriptions (1-2 weeks)

**Goal:** Enable paid access. Pricing page UI already exists from Phase 4, this phase wires up Stripe and tier enforcement.

- [ ] **Stripe integration**
  - Create products and prices in Stripe
  - Checkout flow for each tier (Learn $8, Career $14, Pro $25)
  - Webhook to update user subscription status in Turso
  - Annual billing (25% discount)
  - Regional pricing via Stripe PPP
  - Lifetime deal for first 500 users
  
- [ ] **Server-side gate enforcement**
  - SustainIQ query limits per tier (10/mo, 6/day, 20/day)
  - Tools access (Pro only)
  - Intelligence access (Pro only)
  - Community posting limits (Learn rate-limited)
  - Middleware-level tier checks on API routes
  
- [ ] **Subscription management UI**
  - Wire up Settings page subscription section
  - Billing portal integration
  - Downgrade/upgrade/cancel flows

**Exit criteria:** User can subscribe, payment processes, access updates, tier limits enforced server-side. Pricing page CTAs now route to Stripe checkout instead of placeholder.

### Phase 9 (Post-Cutover): Community Features (2-4 weeks)

**Goal:** Bring community placeholder pages to life. Embedded, not standalone, per blueprint.

- [ ] **Lesson discussions**
  - Discussion thread on every lesson page
  - Post, reply, upvote, moderation
  - Rate-limited for Learn tier, unlimited for Career+
  
- [ ] **Case studies**
  - Practitioner-submitted case studies
  - Peer review workflow
  - Featured case studies section
  
- [ ] **Public professional profiles**
  - Profile page built from courses completed, tools used, contributions
  - Shareable URL (`/profile/[username]`)
  - Certificates, skills, badges
  
- [ ] **Resume matching (Phase 2 of blueprint)**
  - Resume upload + skills extraction
  - Job matching algorithm (already developed for personal use)
  - Skill gap analysis linked to courses
  - Career profile enhancements

**Exit criteria:** Community features functional. Users can discuss lessons, submit case studies, build public profiles. Resume matching operational for Career+ tier.

**Goal:** Final testing, content validation, and merge to main.

- [ ] **Visual QA**
  - Every page reviewed in browser on desktop, tablet, mobile
  - Dark mode consistency check
  - Typography scale audit
  - Compare against Stitch designs side by side
  
- [ ] **Functional QA**
  - Every course loads
  - Every lesson renders
  - Every quiz works
  - Progress tracking works end-to-end
  - Auth flow works (sign up, sign in, sign out)
  - Subscription flow works
  - Dashboard shows correct data
  
- [ ] **SEO audit**
  - All existing URLs still work
  - Redirects in place if any URLs moved
  - Meta descriptions, OG images, structured data
  - Sitemap updated
  
- [ ] **Performance audit**
  - Lighthouse scores on key pages
  - Bundle size check
  - Image optimization
  
- [ ] **Content validation**
  - `npm run validate` passes
  - No broken internal links
  - All source citations present
  
- [ ] **Content migration** (if any)
  - Glossary
  - Any new pages/content added during redesign

- [ ] **Database migration plan**
  - If Turso schema changed, prepare migration
  - Plan backup and rollback strategy
  
- [ ] **Cutover**
  - Merge redesign branch to main via PR
  - Flip `NEXT_PUBLIC_UI_VERSION` to `redesign` on production
  - Monitor error rates and user feedback for 48 hours
  - Rollback plan: flip env var back to `current`, still serves old UI

**Exit criteria:** Merged to main, live on greentryst.com, error rates normal, no critical bugs.

## 4. Locked Decisions (April 2026)

1. **Course URL structure:** Keep `/courses/[courseId]/[lessonId]` canonical for SEO. `/learn` is the hub/directory only.

2. **Lesson page scope:** **Full rebuild (Level C).** Everything gets redesigned to look cut from the same cloth: reading layout, sidebar structure, AudioPlayer visual, Quiz component, HighlightBox / AnalogyBox / ExampleBox / FormulaBox, CalculationExercise, DeepDive, RoughChart, EquationBreakdown, LessonMeter. Every interactive component is rebuilt with the new design language. MDX content is preserved (it is the core, we are only changing the shell).

3. **SustainIQ scope:** Redesign the current `/ask` page UI with the new design language, keeping the existing Groq/Llama 70B backend. Backend retrieval upgrade (Gemma 4 26B MoE, Docling parsing, hybrid search, re-ranking) is deferred to post-cutover.

4. **Tools layer scope:** Create the UI pages for all planned tools (GHG Calculator, Report Drafter, BRSR Screener) showing what they will do, but defer the actual tool implementations to post-cutover. Pages display "Coming Soon" state with realistic UI previews.

5. **Subscriptions scope:** Build the pricing page UI with all three tiers. Defer actual Stripe integration and paid gating to post-cutover. Launch cut-over in free-only mode.

6. **Community scope:** Create placeholder pages showing what community features will be (discussions, case studies, profiles). Defer actual community functionality to post-cutover per blueprint.

7. **Icons:** Lucide React throughout. No emoji, no Material icons, no illustrations.

8. **Legacy files:** Move `VM0042_Learning_Module.html` and `index.html` to `archive/` folder. Clean up root while preserving history.

9. **Brand:** Typographic exploration for the "Greentryst" wordmark. No pictorial logo. We play with font weight, tracking, and treatment to find a distinctive typographic identity.

10. **Auth states:** Design both signed-in and signed-out variants of every page. Signed-in users see different CTAs, dashboard links, progress indicators. Signed-out users see marketing CTAs and sign-up prompts.

11. **Content preservation:** The 470+ MDX lessons, quiz YAMLs, course.yaml files, and glossary are untouched. Only the rendering layer changes.

12. **Focus:** This is the single priority until cutover. No parallel feature work.

## 5. Scope Boundary

The scope is **pure visual/UI redesign across the entire site** including all new product blueprint pages. Backend and functionality work is deferred to after the visual cutover. This means the site transforms visually as a single coherent unit, then features come online progressively.

### In Scope (Visual / UI)
- Homepage (all sections)
- Course directory page
- Course overview page
- Lesson page (full rebuild, all MDX components)
- SustainIQ `/ask` page (redesign UI, keep Groq backend)
- Career / Jobs page
- Dashboard (progress, streak, profile)
- Pricing page (display only, no Stripe yet)
- Tools layer pages (GHG Calculator, Report Drafter, BRSR Screener) as "Coming Soon" UI previews
- Community placeholder pages
- Intelligence placeholder pages (ESG Screener, Regulation Tracker, RFP Aggregator)
- Glossary page
- Certificate verification page
- Settings / account page
- Sign in / Sign up pages
- Auth state variants for every page (signed-in and signed-out)
- New navigation, footer, shared components
- Typographic brand exploration for "Greentryst" wordmark
- Legacy file cleanup (archive folder)

### Deferred to Post-Cutover
- SustainIQ retrieval pipeline upgrade (Docling, hybrid search, re-ranking, Gemma 4 26B MoE swap)
- GHG Calculator functionality
- Report Drafter functionality
- BRSR Screener functionality
- Intelligence tools functionality
- Community functionality
- Stripe subscription gating
- Paid tier enforcement
- Resume upload / skills extraction
- Mobile app / PWA optimization
- Enterprise pricing
- API access

## 6. Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Working on main by accident | Breaks live site | Branch safety checklist, never checkout main for redesign |
| Route group conflicts | Pages 404 or render wrong version | Test locally with `NEXT_PUBLIC_UI_VERSION` toggle before every merge |
| Turso schema changes breaking prod | User data loss | Separate Turso database branch for redesign preview |
| SustainIQ retrieval changes breaking existing queries | User-visible degradation | A/B test with 20-30 known queries before cutover |
| Stripe misconfiguration | Wrong charges, failed payments | Use Stripe test mode until final QA |
| SEO loss from URL changes | Traffic drop | Keep `/courses/` canonical, verify sitemaps and redirects |
| Large merge conflicts when redesign merges to main | Hours of manual resolution | Keep rebasing redesign onto main regularly during development |
| Content bugs from design-system refactor | Lessons render wrong | Visual QA on all 22 courses, at least 1 lesson per course |
| Feature flag left in wrong state at cutover | Old UI shown after launch | Runbook for cutover, verify env var on production immediately after merge |

## 7. Success Metrics

### At Cutover
- Zero production errors above baseline
- All existing URLs serving correctly
- Lighthouse performance scores within 10% of current
- No broken content

### 1 Week Post-Cutover
- No rollback triggered
- User sign-ups trending normal or up
- No critical bug reports
- SustainIQ answer quality equal or better than baseline

### 1 Month Post-Cutover
- First paid subscribers (Learn tier)
- SustainIQ query volume up
- Lesson completion rate equal or better than pre-redesign
- No SEO traffic drop above 10%

## 8. Team and Ownership

Solo founder build. Claude assists with:
- Component port from Stitch HTML to React
- Boilerplate generation
- Code review
- Copy editing
- Technical architecture decisions
- Testing strategy

Prajjwal owns:
- Branch discipline
- Design approval
- Content accuracy
- Stripe + legal setup
- Cutover decision

## 9. Timeline Estimate

This is a build plan, not a calendar commitment. Actual duration depends on focused time available.

### Pre-Cutover Phases (Visual Redesign)

| Phase | Focus | Estimated Effort |
|-------|-------|-----------------|
| Phase 0 | Safety Setup | 1-2 days |
| Phase 1 | Design System Foundation | 3-5 days |
| Phase 2 | Homepage | 3-4 days |
| Phase 3 | Course Pages (full lesson rebuild) | 7-10 days |
| Phase 4 | All Remaining Pages | 8-12 days |
| Phase 5 | QA + Cutover | 1-2 weeks |

**Total pre-cutover focused effort: approximately 4-6 weeks of full-time work.**

### Post-Cutover Phases (Deferred Functionality)

| Phase | Focus | Estimated Effort |
|-------|-------|-----------------|
| Phase 6 | SustainIQ Retrieval Upgrade | 7-10 days |
| Phase 7 | Tools Layer Implementation | 2-6 weeks |
| Phase 8 | Auth + Pricing + Subscriptions | 1-2 weeks |
| Phase 9 | Community Features | 2-4 weeks |

**Total post-cutover focused effort: approximately 8-14 weeks of additional work, shipped progressively as each feature is ready.**

The key insight: the visual cutover ships a complete-looking product in 4-6 weeks, then features come online individually without visual disruption.

## 10. First Action

When ready to execute, the very first commands are:

```bash
# Verify on main and clean
git branch --show-current          # must say "main"
git status                          # commit or stash any pending work

# Create the redesign branch
git checkout -b redesign
git push -u academy redesign

# Configure Vercel (done via Vercel dashboard):
# 1. Add env var NEXT_PUBLIC_UI_VERSION=redesign for redesign branch only
# 2. Enable auto-deploy for redesign branch to persistent preview URL
# 3. Confirm production continues to deploy from main

# Back in code, start Phase 0
# Create route groups, move current pages into (current), create empty (redesign)

# Commit and push
git add .
git commit -m "Phase 0: Set up redesign branch with route group scaffolding"
git push academy redesign
```

From this point, all redesign work happens on feature branches off redesign, never off main.
