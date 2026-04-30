# Sustainability Academy: Improvement Plan

Generated from a comprehensive platform review on 15 March 2026.
Platform state: 22 published courses, 462 lessons, 462 quizzes, 190+ glossary terms.

## Priority 1: Course Discovery and Learning Paths

**Problem**
A new learner lands on the homepage and sees 22 equally-weighted course cards in a 3-column grid. Climate Science 101 (the foundational entry point) looks identical to IFC Performance Standards (an advanced niche course). There is no "start here" signal, no difficulty levels, no learning path, and no prerequisite guidance.

At 6 courses this was fine. At 22 it is overwhelming and the #1 reason a new visitor would bounce.

**Why it matters**
Course discovery is the single highest-leverage UX improvement. If a learner cannot figure out where to start in the first 10 seconds, they leave. Every subsequent improvement (better quizzes, glossary, gamification) depends on the learner actually entering a course.

**What to do**

1. Add a `difficulty` field to `course.yaml` schema and all 22 courses:
   ```yaml
   difficulty: beginner    # beginner | intermediate | advanced
   ```

2. Add a `prerequisites` field to `course.yaml`:
   ```yaml
   prerequisites: ["climate-science-101"]
   ```

3. Surface difficulty badges on CourseCard (e.g., green "Beginner", amber "Intermediate", red "Advanced").

4. Build a `/learning-paths` page showing courses as a dependency graph or structured journey. Three suggested paths:
   - **Climate & Carbon**: Climate Science 101 -> GHG Scope 1/2 -> GHG Scope 3 -> SBTi -> Carbon Markets (VCM 101) -> VM0042/VM0044
   - **EU Regulation**: Climate Science 101 -> EU Taxonomy -> Double Materiality -> SFDR -> CSRD (future) -> CBAM -> EUDR
   - **ESG Professional**: Climate Science 101 -> ESG Reporting -> ESG Benchmarking -> ESG Investing -> IFRS S2 -> Financed Emissions -> Human Rights DD

5. Add "Start Here" badges on foundational courses (Climate Science 101, ESG Reporting) on the homepage.

6. Add a "Recommended Next Course" section on the course completion page based on prerequisites.

**Files to modify**
- `src/lib/types.ts` (add `difficulty` and `prerequisites` to Course interface)
- `src/lib/schemas.ts` (add to Zod schema)
- `src/content/*/course.yaml` (add fields to all 22 courses)
- `src/components/platform/CourseCard.tsx` (render difficulty badge)
- `src/app/_components/LandingClient.tsx` (add difficulty filter, "Start Here" badges)
- New file: `src/app/learning-paths/page.tsx`

**Effort:** 6-8 hours
**Impact:** Very high

## Priority 2: Fix Category Filter

**Problem**
`LandingClient.tsx` line 20 hardcodes `CATEGORY_ORDER = ['all', 'fundamentals', 'green-finance', 'esg', 'markets']`. However, courses now use additional categories like `sustainability-standards` (EUDR, EU Taxonomy, IFC Performance Standards). These courses appear under "All" but vanish when any specific filter is selected.

The platform also lacks categories that would logically group newer courses: "Regulation" (CBAM, EUDR, SFDR), "Climate" (Climate Science 101), "Social" (Human Rights DD).

**Why it matters**
A user filtering by category literally cannot find some courses. This is a functional bug, not a cosmetic issue.

**What to do**

Option A (quick fix): Add missing categories to the hardcoded list and recategorize courses.

Option B (better): Derive categories dynamically from course data:
```tsx
const categories = ['all', ...new Set(courseData.map(c => c.course.category))];
```

Consider also renaming/consolidating categories for clarity:
- `fundamentals` -> "Foundations" (Climate Science 101, Circular Economy, TNFD)
- `esg` -> "ESG & Reporting" (ESG Reporting, Benchmarking, Investing, IFRS S2, Double Materiality, Human Rights DD)
- `green-finance` -> "Green Finance" (SFDR, Financed Emissions, EU Taxonomy)
- `markets` -> "Carbon Markets" (VCM 101, VM0042, VM0044, Article 6)
- `sustainability-standards` -> "Regulation" (CBAM, EUDR, IFC PS, SBTi)

**Files to modify**
- `src/app/_components/LandingClient.tsx` (category list and labels)
- `src/content/*/course.yaml` (recategorize where needed)

**Effort:** 1-2 hours
**Impact:** High (fixes a functional bug)

## Priority 3: Wire Quiz XP Awards

**Problem**
`src/lib/gamification.ts` defines `XP_PERFECT_QUIZ = 25` but `Quiz.tsx` never calls any XP award function. Learners complete quizzes and see correct/wrong indicators, but get zero gamification feedback. The confetti animation and XP toast only fire on lesson completion (in `LessonClient.tsx`), not on quiz submission.

**Why it matters**
Quizzes are the most active engagement point on the platform. A learner who gets 3/3 correct should feel rewarded. Not connecting quizzes to the XP system means the gamification loop is broken at its most important touchpoint.

**What to do**

1. Add an `onQuizComplete` callback prop to `Quiz.tsx` that fires when all questions are submitted, passing the score (e.g., `{ correct: 3, total: 3 }`).

2. In `LessonClient.tsx`, handle `onQuizComplete`:
   - If perfect score: award `XP_PERFECT_QUIZ` (25 XP), show a mini XP toast
   - Consider a smaller award for non-perfect completion (e.g., 10 XP for completing the quiz at all)

3. Show a quiz results summary after all questions are answered: "You scored 3/3. +25 XP!"

**Files to modify**
- `src/components/learning/Quiz.tsx` (add callback, detect all-submitted state)
- `src/app/courses/[courseId]/[lessonId]/_components/LessonClient.tsx` (handle callback, award XP)

**Effort:** 2-3 hours
**Impact:** High (unlocks existing but dormant gamification)

## Priority 4: Auto-Link Glossary Terms

**Problem**
The platform has 190+ glossary terms with definitions, but they only appear as tooltips when a lesson author manually wraps text in `<GlossaryTerm term="slug">visible text</GlossaryTerm>`. Most of the 462 lessons do not use this component at all. The 190 carefully written definitions sit largely unused.

**Why it matters**
Glossary terms are one of the platform's differentiators. A learner encountering "additionality" or "DNSH" or "corresponding adjustment" for the first time should get an instant tooltip explanation. Relying on authors to manually tag every occurrence across 462 lessons is not scalable.

**What to do**

Build a remark or rehype plugin that runs during MDX compilation and automatically wraps recognized glossary term text in `<GlossaryTerm>` components.

Implementation approach:
1. At build time, load `glossary.yaml` and extract all term names and slugs
2. Create a rehype plugin that walks text nodes in the MDX AST
3. For each text node, check if it contains any glossary term (case-insensitive)
4. If found, wrap the first occurrence per lesson in `<GlossaryTerm term="slug">matched text</GlossaryTerm>`
5. Skip terms already inside a `<GlossaryTerm>` component (no double-wrapping)
6. Skip terms inside headings, code blocks, and component props

Opt-out: Authors can suppress auto-linking for a specific term by wrapping it in backticks.

**Files to modify**
- New file: `src/lib/remark-glossary.ts` (the plugin)
- `next.config.mjs` (register the remark plugin in the MDX pipeline)
- `src/content/glossary.yaml` (ensure all terms have clean, matchable names)

**Effort:** 4-6 hours
**Impact:** High (compound benefit across all 462 lessons, zero ongoing author effort)

## Priority 5: Unique SEO Meta Descriptions for Lessons

**Problem**
Every lesson page uses the root metadata template. When Google indexes the 462 lesson URLs, they all show the same generic site description in search results. This wastes the platform's biggest organic traffic opportunity: 462 unique, high-quality pages on specific sustainability topics.

**Why it matters**
With 462 pages of original educational content on topics like "CBAM Certificate Pricing," "FPIC and Indigenous Peoples," or "The Keeling Curve," the platform should rank well for long-tail sustainability searches. But identical meta descriptions mean Google cannot differentiate the pages, reducing click-through rates.

**What to do**

In `src/app/courses/[courseId]/[lessonId]/page.tsx`, update `generateMetadata` to produce unique descriptions:

```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = getCourse(params.courseId);
  const lesson = getLessonMeta(params.courseId, params.lessonId);

  return {
    title: `${lesson.title} | ${course.title}`,
    description: `Learn about ${lesson.title} in the ${course.title} course. Module: ${lesson.moduleName}. Free sustainability education.`,
  };
}
```

For even better SEO, extract the first 150 characters of the lesson MDX content (stripped of tags) as the description. The `stripMdx()` function in `src/lib/reading-time.ts` already does this for reading time calculation.

**Files to modify**
- `src/app/courses/[courseId]/[lessonId]/page.tsx` (update generateMetadata)
- Possibly `src/lib/courses.ts` (add a function to extract lesson snippet)

**Effort:** 1-2 hours
**Impact:** High (long-term organic traffic growth, compounding over time)

## Priority 6: Progress Backup Nudge

**Problem**
All learner progress (lesson completion, quiz answers, XP, streaks) is stored exclusively in `localStorage`. If a user clears browser data, switches devices, uses private browsing, or has their browser crash, their entire learning history is permanently lost. The platform offers JSON export/import via `progress-export.ts`, but no user will remember to use it proactively.

**Why it matters**
At 462 lessons across 22 courses, a serious learner invests weeks of study time. Losing that progress with no warning and no recovery path destroys trust.

**What to do**

Short-term (2 hours):
1. Add a nudge banner to `PlatformNav.tsx` that appears when:
   - User has completed 5+ lessons (meaningful investment)
   - AND has never exported their progress
   - AND banner has not been dismissed in the last 7 days
2. Banner text: "Your learning progress is saved locally in this browser only. Back it up now so you don't lose it."
3. One-click "Export Progress" button that triggers `exportProgressJSON()` from `progress-export.ts`
4. Track `lastExportDate` and `nudgeDismissedAt` in localStorage

Long-term (20+ hours, separate project):
- Add optional authentication (Supabase or Firebase)
- Sync progress to cloud on login
- Enable cross-device continuity

**Files to modify**
- `src/components/platform/PlatformNav.tsx` (add nudge banner)
- `src/lib/progress.ts` (add lastExportDate tracking)

**Effort:** 2 hours (nudge), 20+ hours (cloud sync)
**Impact:** Medium-high (protects user investment, builds trust)

## Priority 7: Interactive Data Visualization Component

**Problem**
Climate Science 101, GHG courses, carbon markets, financed emissions, and CBAM lessons contain significant quantitative data (emissions by sector, temperature curves, carbon budgets, market sizes, price trends) but all presented as static HTML tables or inline text. No charts, no graphs, no interactive visualizations.

**Why it matters**
A Keeling Curve chart communicates CO2 growth in 2 seconds. A paragraph describing the same data takes 30 seconds to read and is far less memorable. Data-heavy sustainability content is uniquely suited to visualization, and the platform's competitors (SDG Academy, UNEP FI) use video and charts extensively.

**What to do**

1. Add `recharts` as a dependency (lightweight, React-native, no D3 complexity)
2. Create a `<Chart>` wrapper component in `src/components/content/`:
   ```tsx
   interface ChartProps {
     type: 'line' | 'bar' | 'area' | 'pie';
     data: string; // JSON stringified for MDX compatibility
     xKey: string;
     yKey: string;
     title?: string;
     unit?: string;
   }
   ```
3. Register in `mdx-components.tsx`
4. Add charts to the 10 highest-impact lessons:
   - Climate Science 101: CO2 concentration (Keeling Curve), temperature anomaly, emissions by sector, carbon budget depletion
   - GHG Scope 1/2: emissions by scope pie chart
   - VCM 101: market size over time, price by project type
   - CBAM: EU ETS price history, CBAM sector exposure
   - Financed Emissions: portfolio carbon intensity comparison

**Files to modify**
- `package.json` (add recharts)
- New file: `src/components/content/Chart.tsx`
- `src/components/content/mdx-components.tsx` (register Chart)
- 10 lesson .mdx files (add Chart components)

**Effort:** 8-10 hours
**Impact:** Medium-high (transformative for data-heavy lessons, visual differentiation from competitors)

## Other Notable Findings (Lower Priority)

**Sidebar with 20+ lessons per module**: Currently renders all lesson links. Not a performance issue yet (largest course has 30 lessons), but if courses grow beyond 50 lessons, consider virtualizing the sidebar list.

**Quiz state not archived**: When a learner resets a quiz, previous attempts are overwritten. No "review past attempts" history. Low priority but would improve retention if added.

**Missing ARIA live region on XP toast**: The XPToast component that shows "+50 XP" does not use `aria-live="polite"`. Screen reader users would miss gamification feedback. Quick fix: add `aria-live="polite"` to the toast container.

**Streak timezone sensitivity**: Streaks use UTC midnight as the day boundary. A learner studying at 11:30 PM PST sees their streak break at midnight UTC. Low priority but could frustrate engaged users.

**Search index at 343 KB**: Manageable now but will hit 700 KB+ at 44 courses. If the platform grows beyond 50 courses, consider server-side search (Meilisearch or Algolia).

**No course completion certificates**: Professional learners value shareable credentials. A PDF certificate on course completion (generated client-side with jsPDF or server-side) would increase course completion rates and shareability.
