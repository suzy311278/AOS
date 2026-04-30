# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sustainability Academy** — a multi-course sustainability learning platform built with Next.js 14 (App Router, hybrid SSG + serverless).
Covers climate science, carbon markets, ESG, clean energy, biodiversity, circular economy, and more.

**Dev server:** `npm run dev` → http://localhost:5001
**Framework:** Next.js 14.2.29, TypeScript, Tailwind CSS, MDX content, YAML quizzes
**Auth:** Clerk (v6.39.0, Google + Email/Password)
**Database:** Turso (libSQL, Chennai `maa` region) + Drizzle ORM
**Hosting:** Vercel (hybrid mode, function region `bom1` Mumbai)

> The `VM0042_Learning_Module.html` and `index.html` files in the root are the **legacy single-file app** — kept for reference only. Do not edit them.

## Redesign In Progress (April 2026)

**A major visual redesign + Product Blueprint expansion is currently in progress.** See `brainstorming/REDESIGN_EXECUTION_PLAN.md` for the full plan and `stitch-output/GREENTRYST_DESIGN_BIBLE.md` for the design language specification.

### Branch Discipline (CRITICAL)

- **All redesign work happens on the `redesign` branch.** Never on main.
- **The `redesign` branch is LOCAL-ONLY.** It exists only on this machine. It is deliberately NOT pushed to any remote to prevent accidental production deployment via Vercel.
- **Main is production.** Main must not be touched for redesign work. Main continues to deploy to greentryst.com.
- **Before starting any session**, verify the branch: `git branch --show-current` must return `redesign` (or a feature branch off redesign like `redesign/homepage`).
- **If the current branch is main and the task is redesign-related**, STOP and switch to the redesign branch first. Do not proceed.
- **When comparing current vs redesigned UI**, use git: `git stash && git checkout main` to see current, `git checkout redesign` to see new. Do NOT create route groups or parallel file structures for this purpose.
- **CRITICAL: NEVER clean, reset, rebase, or remove redesign-related commits from the main branch.** Even if redesign work is primarily on the redesign branch, commits on main may contain component files, dependencies, or references needed for recovery. Cleaning main branch history caused major data loss on 2026-04-12, requiring extensive rework. If redesign commits exist on main, leave them there.

### Redesign Branch Session Checklist

```bash
git branch --show-current          # must say "redesign" or "redesign/*"
git status                          # review pending changes
git log --oneline -5               # confirm recent commits
```

### Scope of the Redesign

**Pre-cutover (visual only, deferred backend):**
- All page UI gets the new Greentryst design language
- New pages for SustainIQ, Tools, Intelligence, Community (UI only, no backend changes)
- All MDX lesson components rebuilt with new design (HighlightBox, AudioPlayer, Quiz, etc.)
- Content (470+ MDX lessons, YAML, glossary) is NOT touched. Only the rendering layer changes.

**Post-cutover (deferred to Phases 6-9):**
- SustainIQ retrieval pipeline upgrade (Docling, hybrid search, re-ranking)
- Tool functionality (GHG Calculator, Report Drafter, BRSR Screener)
- Stripe subscriptions + tier gating
- Community features

### Design Language

See `stitch-output/GREENTRYST_DESIGN_BIBLE.md` for the complete design specification. Key points:
- Inter + JetBrains Mono fonts only
- Lucide icons throughout (no emoji, no Material, no illustrations)
- Teal accents `#005c55` / `#8cd4ca` on dark `#0a1a1a` or light `#f8faf9` backgrounds
- Dark product UI cards (`#0e1e1e`) as the signature visual element
- Rounded-2xl (16px) corners, subtle shadows, no borders
- Every data point in designs uses real sustainability content (VM0042 Section 3.1.2, DEFRA 2024, etc.)

## Repository Structure

```
LearningPlatform/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Root layout + ClerkProvider + MigrationBanner
│   │   ├── page.tsx                  # Homepage (server component)
│   │   ├── globals.css               # Tailwind + lesson content box styles
│   │   ├── _components/
│   │   │   └── LandingClient.tsx     # Homepage client component
│   │   ├── sign-in/[[...sign-in]]/   # Clerk sign-in page
│   │   ├── sign-up/[[...sign-up]]/   # Clerk sign-up page
│   │   ├── dashboard/                # User dashboard (auth-protected)
│   │   │   ├── page.tsx              # Server component (auth + Drizzle queries)
│   │   │   └── _components/
│   │   │       ├── DashboardClient.tsx    # Course cards + stats
│   │   │       └── StreakCalendar.tsx     # GitHub-style 52-week grid
│   │   ├── api/                      # API routes (auth-protected)
│   │   │   ├── progress/             # Progress CRUD
│   │   │   │   ├── route.ts          # GET all enrollments
│   │   │   │   ├── [courseId]/route.ts # GET course detail
│   │   │   │   ├── lesson-complete/  # POST mark lesson done
│   │   │   │   ├── quiz-answer/      # POST save quiz answer
│   │   │   │   └── migrate/          # POST localStorage migration
│   │   │   └── activity/route.ts     # GET daily activity (365 days)
│   │   └── courses/
│   │       └── [courseId]/
│   │           ├── layout.tsx        # Course layout (loads course.yaml)
│   │           ├── page.tsx          # Course overview page
│   │           ├── _components/
│   │           │   ├── CourseShell.tsx       # Sidebar + mobile nav wrapper
│   │           │   └── CourseOverviewClient.tsx
│   │           └── [lessonId]/
│   │               ├── page.tsx              # Lesson page (renders MDX)
│   │               └── _components/
│   │                   └── LessonClient.tsx  # Quiz, progress, nav, LessonMeter
│   │
│   ├── components/
│   │   ├── content/                  # MDX content components
│   │   │   ├── mdx-components.tsx    # getMDXComponents() — h2, p, table overrides
│   │   │   ├── HighlightBox.tsx      # Green left-border callout
│   │   │   ├── AnalogyBox.tsx        # Blue left-border analogy
│   │   │   ├── ExampleBox.tsx        # Amber left-border worked example
│   │   │   ├── FormulaBox.tsx        # Dark background formula block
│   │   │   ├── Flowchart.tsx         # Mermaid flowchart renderer (client-side)
│   │   │   ├── EquationBreakdown.tsx # Interactive color-coded equation explainer
│   │   │   ├── ResponsiveTable.tsx   # Horizontal-scroll table wrapper
│   │   │   ├── AudioPlayer.tsx      # Waveform audio player (R2-hosted or Spotify)
│   │   │   ├── GlossaryTerm.tsx     # Inline tooltip for glossary terms
│   │   │   └── CaseStudy.tsx        # Multi-step decision scenario
│   │   ├── learning/
│   │   │   ├── Sidebar.tsx           # Course navigation sidebar (+ reading time)
│   │   │   ├── Quiz.tsx              # Interactive quiz component
│   │   │   ├── LessonNav.tsx         # Prev / Next lesson buttons
│   │   │   └── ProgressBar.tsx
│   │   └── platform/
│   │       ├── PlatformNav.tsx       # Top nav bar (search, auth, dashboard link)
│   │       ├── SearchButton.tsx     # Cmd+K search trigger
│   │       ├── SearchModal.tsx      # Fuzzy search modal (Fuse.js)
│   │       ├── CourseCard.tsx        # Homepage course card
│   │       ├── LessonMeter.tsx      # Soft registration wall (3 free/month)
│   │       ├── MigrationBanner.tsx  # localStorage-to-cloud migration prompt
│   │       ├── Breadcrumb.tsx
│   │       └── Footer.tsx
│   │
│   ├── lib/
│   │   ├── types.ts                  # All TypeScript interfaces
│   │   ├── courses.ts                # Server-only: loads course.yaml + quizzes via fs
│   │   ├── url-helpers.ts            # Client-safe URL helpers (no fs)
│   │   ├── db.ts                     # Turso database connection singleton
│   │   ├── schema.ts                 # Drizzle schema (4 tables)
│   │   ├── progress-cloud.ts         # Cloud-first progress hooks (active)
│   │   ├── progress.ts               # Legacy localStorage-only hooks (kept for reference)
│   │   ├── progress-export.ts        # Export/import progress as JSON
│   │   ├── colors.ts                 # colorMap (11 colors)
│   │   ├── schemas.ts                # Zod validation schemas
│   │   ├── reading-time.ts           # stripMdx() + computeReadingTime() utility
│   │   └── glossary.ts               # Server-only: loads glossary.yaml
│   │
│   └── content/                      # All course content lives here
│       ├── glossary.yaml             # Platform-wide glossary (190+ terms)
│       └── <course-id>/              # One folder per course
│           ├── course.yaml           # Course + module + lesson metadata
│           ├── SOURCES.md            # Which PDFs informed which modules
│           ├── sources/              # Source PDFs (gitignored, kept locally)
│           │   └── *.pdf
│           ├── lessons/              # One .mdx file per lesson
│           │   └── <lessonId>.mdx
│           └── quizzes/              # One .yaml file per lesson (optional)
│               └── <lessonId>.yaml
│
├── scripts/
│   ├── migrate-content.ts            # One-time: HTML → MDX migration
│   ├── validate-content.ts           # Validates all content against Zod schemas
│   └── audio-pipeline.ts             # Audio generation pipeline CLI helper
│
├── src/middleware.ts                  # Clerk middleware (route protection)
├── mdx-components.tsx                # Root MDX component map (Next.js convention)
├── next.config.mjs                   # Hybrid SSG + serverless, MDX support
├── drizzle.config.ts                 # Drizzle Kit config for Turso migrations
├── tailwind.config.ts
└── tsconfig.json                     # target: ES2017, excludes scripts/
```

## Development Commands

```bash
npm run dev        # Dev server on http://localhost:5001
npm run build      # Production build (hybrid SSG + serverless), also regenerates search-index.json + glossary.json
npm run validate   # Validate all course content against Zod schemas
npx tsx scripts/generate-search-index.ts   # Regenerate search index + glossary JSON manually

# Database migrations (must load env vars first)
export $(grep -v '^#' .env.local | xargs) && npx drizzle-kit generate   # Generate migration SQL
export $(grep -v '^#' .env.local | xargs) && npx drizzle-kit push      # Push schema to Turso

# Audio pipeline (generates podcast-style lesson audio via NotebookLM)
npx tsx scripts/audio-pipeline.ts status                    # Dashboard: audio coverage per course + daily usage
npx tsx scripts/audio-pipeline.ts next-batch [--limit N]    # JSON list of next lessons needing audio
npx tsx scripts/audio-pipeline.ts extract <course> <lesson> # Strip MDX to plain text for NotebookLM
npx tsx scripts/audio-pipeline.ts insert <course> <lesson> <r2Url>  # Insert AudioPlayer tag into MDX
npx tsx scripts/audio-pipeline.ts log <course> <lesson>     # Record generation in daily log
/generate-audio [--limit N] [--course X] [status]           # Full pipeline skill (uses NotebookLM MCP)
```

## Git Remotes

Always push to the `academy` remote (`https://github.com/questofprajjwal/sustainabilityacademy.git`). The `origin` remote points to the old VM0042-Learning-Module repo and should never be pushed to.

```bash
git push academy main
```

## Adding a New Course

### 1. Create the content folder

```
src/content/<course-id>/
├── course.yaml
├── SOURCES.md
├── sources/          ← put your source PDFs here
├── lessons/
└── quizzes/
```

### 2. Write `course.yaml`

```yaml
id: esg-fundamentals
title: "ESG Fundamentals"
subtitle: "Understanding Environmental, Social & Governance reporting"
description: "A comprehensive introduction to ESG frameworks, disclosure standards, and corporate sustainability reporting."
icon: "📊"
color: blue            # must exist in src/lib/colors.ts colorMap
status: published      # published | draft | coming-soon
category: esg          # fundamentals | esg | markets | green-finance | sustainability-standards
estimatedHours: 12
modules:
  - id: 0
    title: "What is ESG?"
    subtitle: "Origins, frameworks, and why it matters"
    icon: "🌍"
    color: blue
    lessons:
      - id: "0.1"
        title: "History and Origins of ESG"
        duration: "45 min"
        vmRef: "GRI Standards 2021, Introduction"   # source document reference
      - id: "0.2"
        title: "The Three Pillars"
        duration: "50 min"
        vmRef: "GRI Standards 2021, Section 2"
```

### 3. Write lesson MDX files

`src/content/esg-fundamentals/lessons/0.1.mdx`:

```mdx
{/* source: GRI Standards 2021, Introduction */}

ESG stands for **Environmental, Social, and Governance**...

<HighlightBox>
Key takeaway: ESG is not just about ethics — it's about long-term risk management.
</HighlightBox>

<AnalogyBox>
Think of ESG like a car's dashboard...
</AnalogyBox>

<ExampleBox>
**Example:** A company with high water usage in a drought-prone region...
</ExampleBox>

<FormulaBox>
Carbon Intensity = Total GHG Emissions (tCO₂e) ÷ Revenue ($ million)
</FormulaBox>
```

Available MDX components:

| Component | Appearance | Use for |
|-----------|-----------|---------|
| `<HighlightBox>` | Green left border | Key takeaways |
| `<AnalogyBox>` | Blue left border | Real-world analogies |
| `<ExampleBox>` | Amber left border | Worked examples |
| `<FormulaBox>` | Dark background | Formulas and equations |
| `<ResponsiveTable>` + `<table>` | Scrollable on mobile | Data tables |
| `<CalculationExercise>` | Violet card, interactive | Practice calculations with hints |
| `<DeepDive>` | Blue collapsible section | Optional deep-dive content |
| `<EquationBreakdown>` | Interactive color-coded equation | Visual formula explainers with hover |
| `![alt](/images/...)` | Draw.io exported diagram | Process flows, decision trees, org charts |
| `<RoughChart>` | Hand-drawn interactive chart (rough.js) | Data visualizations: pie, bar, horizontal-bar, line |
| `<AudioPlayer>` | Orange waveform player | Podcast-style lesson audio (hosted on Cloudflare R2) |

**RoughChart (Hand-Drawn Data Visualization):**

Renders interactive charts with a hand-drawn aesthetic using rough.js. Lazy-loaded via `next/dynamic` (zero bundle cost for pages without charts). Supports hover tooltips and annotations.

- **Props are strings** for MDX compatibility. Data is a JSON string.
- **`type`**: `pie` | `bar` | `horizontal-bar` | `line`
- **`data`**: JSON stringified array, e.g. `'[{"name":"A","value":10},{"name":"B","value":20}]'`
- **`xKey`**: Key for labels/x-axis
- **`yKey`**: Key for values/y-axis
- **`unit`**: Unit label (e.g. `"%"`, `"Gt"`, `"°C"`)
- **`height`**: Chart height in pixels (default `"380"`)
- **`annotations`**: JSON string for callouts. Bar: `'[{"target":"barName","text":"label"}]'`. Connector: `'[{"from":"bar1","to":"bar2","text":"label"}]'`. Pie: `'[{"targets":"slice1,slice2","text":"label"}]'`
- **`seriesKeys`** / **`seriesLabels`**: For multi-series line charts. Comma-separated keys and labels.
- **Do NOT use `~` in data** (triggers MDX strikethrough). Use "approx." instead.

```mdx
<RoughChart
  type="pie"
  title="Global GHG Emissions by Sector"
  data='[{"name":"Energy (34%)","value":20},{"name":"Industry (24%)","value":14},{"name":"AFOLU (22%)","value":13}]'
  xKey="name"
  yKey="value"
  unit="Gt"
  height="380"
/>
```

```mdx
<RoughChart
  type="line"
  title="Projected Warming Under SSP Scenarios"
  data='[{"year":"2020","ssp1":1.1,"ssp5":1.1},{"year":"2060","ssp1":1.3,"ssp5":3.1},{"year":"2100","ssp1":1.4,"ssp5":4.4}]'
  xKey="year"
  yKey="ssp1"
  seriesKeys="ssp1,ssp5"
  seriesLabels="SSP1-1.9,SSP5-8.5"
  unit="°C"
  height="400"
/>
```

Key file: `src/components/content/RoughChart.tsx`

**CalculationExercise props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `question` | string | ✅ | Problem statement shown to the learner |
| `answer` | number | ✅ | Correct numeric answer |
| `tolerance` | number | — | Acceptable absolute deviation (default `0`) |
| `unit` | string | — | Unit label shown after input (e.g. `"tCO₂e"`) |
| `hints` | string[] | — | Progressive hints revealed after each wrong attempt |
| `solution` | string | — | Explanation shown once answer is correct or revealed |

```mdx
<CalculationExercise
  question="A project avoids 10 tonnes of CH₄. What is the CO₂e equivalent? (GWP₁₀₀ = 28)"
  answer={280}
  unit="tCO₂e"
  hints={["Multiply the mass of CH₄ by its GWP.", "10 × 28 = ?"]}
  solution="10 t CH₄ × 28 (GWP₁₀₀) = 280 tCO₂e"
/>
```

**DeepDive props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | — | Button label (default `"Want to go deeper?"`) |
| `children` | ReactNode | ✅ | Content revealed on expand |

```mdx
<DeepDive title="How is GWP calculated?">
  Global Warming Potential compares the heat absorbed by a greenhouse gas...
</DeepDive>
```

**Diagrams (via `/drawio` skill only, no Mermaid):**

All diagrams must be created using the `/drawio` skill to produce professional `.drawio` files and export them as PNG images. Do not use Mermaid code blocks. The Mermaid/Flowchart component exists in the codebase for legacy content only; all new diagrams must use Draw.io.
- **Workflow:** Use the `/drawio` skill to create the `.drawio` file in the project root, export to PNG, then place the PNG in `public/images/<course-id>/`.
- **File convention:** Save exported PNGs to `public/images/<course-id>/<descriptive-name>.png` (e.g., `public/images/ghg-scope-3/six-step-accounting-process.png`).
- **In MDX:** Reference with a standard Markdown image: `![Alt text](/images/<course-id>/<descriptive-name>.png)`
- **When to create diagrams:** Proactively create Draw.io diagrams for multi-step processes, frameworks, hierarchies, and visual overviews that help learners grasp structure at a glance - especially in introductory or summary lessons.
- **No HTML tags in draw.io labels:** Never use `<br>`, `<b>`, `<i>`, `<font>` in node `value` attributes. They render as literal tag text in exported PNGs. Use `&#10;` for line breaks and `fontStyle=1` (bold) / `fontStyle=2` (italic) in the `style` attribute instead.
- **Avoid arrow/label overlaps:** When routing edges between nodes, verify that the arrow path and its label do not pass through or overlap any box. Use explicit entry/exit points (`entryX`, `entryY`, `exitX`, `exitY`) and waypoints to route arrows around boxes, not through them. For example, if two nodes are at the same vertical center, connect them side-to-side (`exitX=1;exitY=0.5` to `entryX=0;entryY=0.5`) rather than routing through intermediate coordinates that land inside another node. After export, visually inspect the PNG for overlaps before committing.

```mdx
![The Six-Step Scope 3 Accounting Process](/images/ghg-scope-3/six-step-accounting-process.png)
```

**EquationBreakdown (Visual Equation Explainer):**

Renders equations as interactive, color-coded visual breakdowns. Each variable gets a colored pill in the equation row and a matching explanation card below. Hovering any pill or card highlights the pair and fades the rest.

- **Props are strings** (not objects/arrays) because MDX cannot reliably parse nested objects or arrays in JSX props.
- **`result`**: pipe-delimited string - `"symbol | label | description | color"`
- **`inputs`**: multiple inputs separated by `;;` - each is `"symbol | label | description | color"`
- **Available colors**: `blue`, `green`, `amber`, `violet`, `rose`, `cyan`, `orange`
- **HTML in symbols**: Use `<sub>` for subscripts (e.g. `EF<sub>CO₂</sub>`). Safe because these are rendered via `dangerouslySetInnerHTML`.
- **`operator`**: defaults to `×`. Set to `+` or other operators as needed.

```mdx
<EquationBreakdown
  title="Equation 6 - Fossil Fuel CO₂"
  result="EFF<sub>j</sub> | Fossil Fuel Emissions | Total CO₂ from fuel, tCO₂/ha/yr | blue"
  inputs="FFC<sub>j</sub> | Fuel Consumption | Litres of fuel burned per hectare per year | green ;; EF<sub>CO₂</sub> | Emission Factor | tCO₂ per litre of fuel burned | amber"
/>
```

Key file: `src/components/content/EquationBreakdown.tsx`

**AudioPlayer (Lesson Audio Narration):**

Custom audio player with animated waveform visualization, play/pause, skip 15s forward/back, speed control (0.5x to 2x), and clickable seek bar. Supports two modes: self-hosted audio via `src` prop, or Spotify embed via `spotifyId` prop.

Audio files are hosted on **Cloudflare R2** (zero egress cost). Bucket: `greentryst-audios`, public URL: `https://pub-033ee478bfa542229216e3781c99cb96.r2.dev`.

- **`src`**: URL to audio file (MP3 on R2)
- **`spotifyId`**: Spotify episode ID (renders Spotify iframe embed instead)
- **`title`**: Label shown above the player (default: "Listen to this lesson")
- **File naming**: `/<course-id>/<lesson_id>.mp3` (e.g., `/vm0042/0_1.mp3`)

```mdx
<AudioPlayer src="https://pub-033ee478bfa542229216e3781c99cb96.r2.dev/vm0042/0_1.mp3" title="Listen to this lesson (podcast-style overview)" />
```

**Audio generation pipeline:**
1. Strip lesson MDX to plain text
2. Create NotebookLM notebook and add text as source (via NotebookLM MCP)
3. Generate audio: `studio_create` with `artifact_type="audio"`, `audio_format="deep_dive"`, `audio_length="short"`
4. Download the generated file (comes as MP4)
5. Convert to MP3: `ffmpeg -i input.mp4 -codec:a libmp3lame -b:a 128k output.mp3`
6. Upload to R2: `wrangler r2 object put greentryst-audios/<course-id>/<lesson_id>.mp3 --file <local-file> --remote`
7. Add `<AudioPlayer>` tag at the top of the lesson MDX (before the h2 title)

Key file: `src/components/content/AudioPlayer.tsx`

### 4. Write quiz YAML files (optional per lesson)

`src/content/esg-fundamentals/quizzes/0.1.yaml`:

```yaml
- question: "What does the 'E' in ESG stand for?"
  options:
    - "Economic"
    - "Environmental"
    - "Equity"
    - "Ethical"
  answer: 1          # 0-based index into options
  explanation: "The E stands for Environmental, covering climate, water, and biodiversity impacts."

- question: "Which year were the GRI Standards first published?"
  options:
    - "1997"
    - "2000"
    - "2006"
    - "2016"
  answer: 0
  # explanation is optional
```

### 5. Create `SOURCES.md`

Document which PDF (or other source) informed each module. See `src/content/vm0042/SOURCES.md` as a template.

### 6. Validate and run

```bash
npm run validate   # should report 0 errors
npm run dev        # check at http://localhost:5001
```

## Available Colors

Defined in `src/lib/colors.ts`. Each color has `bg`, `text`, `border`, `btn`, `active`, `light` Tailwind classes.

| Name | Hue |
|------|-----|
| `green` | Green |
| `emerald` | Emerald |
| `teal` | Teal |
| `blue` | Blue |
| `violet` | Violet |
| `orange` | Orange |
| `red` | Red |
| `purple` | Purple |
| `cyan` | Cyan |
| `rose` | Rose |
| `indigo` | Indigo |

To add a new color, add it to `colorMap` in `src/lib/colors.ts` with all six keys.

## Content Verification Workflow

After writing or editing lessons against source PDFs, verify accuracy:

```bash
# Gemini — factual accuracy vs PDF
gemini -p "Review src/content/vm0042/lessons/3.1.mdx against src/content/vm0042/sources/VM0042v2.2.pdf Section 8.1. Check all formulas, thresholds, and tables. Rate depth 1–10."

# Codex — line-by-line accuracy + clarity improvements
codex exec -c 'sandbox_permissions=["disk-full-read-access"]' "Review src/content/vm0042/lessons/3.1.mdx against src/content/vm0042/sources/VM0042v2.2.pdf Section 8.1. Check all values and suggest wording improvements."
```

Both CLIs can read PDFs directly from the `sources/` path.

## Auth + Cloud Progress Architecture

**Access model:** Soft Registration Wall. All lesson pages are fully rendered and crawlable (SEO preserved). Anonymous visitors can read 3 lessons/month (cookie-tracked). After 3: soft overlay dims content with sign-up CTA. Registration is free. Signed-in users get unlimited access + cloud progress.

**Progress data flow (signed-in users):**
1. On mount: read localStorage cache for instant render
2. Fetch from cloud API, reconcile state
3. Writes: optimistic update to React state + localStorage cache, then POST to API in background
4. Scroll positions stay localStorage-only

**Progress data flow (anonymous users):** localStorage-only, no API calls.

**Database tables** (Drizzle schema in `src/lib/schema.ts`):
- `enrollments` - userId + courseId composite PK, tracks when user started a course
- `lesson_completions` - userId + courseId + lessonId composite PK
- `quiz_attempts` - userId + courseId + lessonId + questionIdx composite PK
- `daily_activity` - userId + activityDate composite PK, for streak calendar

**API routes** (all auth-protected via Clerk):
- `GET /api/progress` - all enrollments with completion counts
- `GET /api/progress/[courseId]` - full course detail (completions + quizzes)
- `POST /api/progress/lesson-complete` - mark lesson done + upsert daily activity
- `POST /api/progress/quiz-answer` - save/submit quiz answer
- `GET /api/activity` - daily activity for last 365 days
- `POST /api/progress/migrate` - one-time localStorage to cloud migration

**Middleware** (`src/middleware.ts`): Must be in `src/` directory (not project root). Protects `/dashboard` and `/api/*` routes. All content routes are public.

**Key constraint:** `@clerk/nextjs@6.39.0` is pinned because Clerk v7 requires Next.js 15+.

## Key Architectural Rules

- **`src/lib/courses.ts` uses Node.js `fs`** — never import it in client components. Use `src/lib/url-helpers.ts` for URL functions in client code.
- **`src/lib/db.ts` is server-only** — never import it in client components.
- **Progress hooks live in `src/lib/progress-cloud.ts`** — all 5 consumer files import from here (not `progress.ts`). The old `progress.ts` is kept for reference only.
- **`'use client'` components** must defer all localStorage reads to after mount via `useEffect` (hydration safety).
- **Lesson IDs are strings** (`"0.1"`, `"CAP"`). URL params replace `.` with `_` (`0.1` → `0_1`). See `lessonIdToUrl` / `urlToLessonId` in `url-helpers.ts`.
- **`dynamicParams = false`** is set on both `[courseId]` and `[lessonId]` routes — all paths must be returned by `generateStaticParams`.
- **Quiz `answer` is 0-based** index into the `options` array.
- **`explanation` is optional** in quiz YAML — omit the field entirely if not needed.
- **MDX self-closing tags required** — use `<br />` not `<br>`. Unescaped `<` before numbers must be `&lt;`.
- **Source PDFs** live in `src/content/<course-id>/sources/` and are gitignored. Never commit PDFs to git.
- **SEO structured data** is auto-generated per page: `LearningResource` + `FAQPage` (from quiz Q&As) + `BreadcrumbList` JSON-LD on lesson pages; `Course` + `BreadcrumbList` on course overview pages. Unique meta descriptions are extracted from lesson content via `stripMdx()`.
- **Search modal** (Cmd+K) searches both lessons (`search-index.json`) and glossary terms (`glossary.json`). Glossary results appear first, linking to `/glossary#term-{slug}`.
- **Never use em dashes** in any content, code, or commit messages. Use hyphens (-) instead.
- **Never use `~` in MDX content** (triggers strikethrough parsing). Use "approx." or "approximately" instead.

## Jobs Directory

Route: `/jobs`. Dynamically reads `src/jobs/jobs.xlsx` (first sheet, "Climate Risk Jobs") on every request via `/api/jobs`. No build-time static generation; the Excel can be updated and changes appear on next page load.

**Architecture:**
- `src/app/api/jobs/route.ts` - reads Excel with `xlsx` (SheetJS), returns sorted JSON (relevance DESC, then date posted DESC). The relevance score is used for sorting only, never displayed.
- `src/app/jobs/_components/JobsClient.tsx` - table UI with filters (profile category tabs, country, company type, remote/on-site, search). Expandable detail rows show Role Summary, Skills Required, Domain Context.
- Country extraction from messy location data is handled client-side via city/state-to-country mapping in `JobsClient.tsx`.

**Columns shown:** Title, Company, Location, Category (profile), Date Posted, Apply button. Job Level, Experience, Job Type shown only in expanded details and only when values exist.

**Columns hidden (internal):** Date Scraped, Site, Relevance, Rel. Method, Company URL.

## localStorage Schema

Key: `sustainability_academy` (used as a **read cache** for signed-in users; Turso is the source of truth)

```json
{
  "version": 2,
  "courses": {
    "<courseId>": {
      "startedAt": 1234567890,
      "lastAccessedAt": 1234567890,
      "lastAccessedLesson": "3.2",
      "completedLessons": { "0.1": 1234567890 },
      "quizzes": {
        "0.1": { "answers": { "0": 2 }, "submitted": { "0": true } }
      },
      "scrollPositions": { "0.1": 450 }
    }
  },
  "xp": 500,
  "streak": { "currentStreak": 3, "longestStreak": 7, "lastStudyDate": "2026-03-20" }
}
```

Other localStorage keys:
- `sa_lessons_read` - cookie tracking anonymous lesson reads for the metered wall
- `sa_cloud_migrated` - flag indicating localStorage data was imported to cloud

Legacy keys `vm0042_progress` and `vm0042_quiz_*` are auto-migrated on first load.

## Environment Variables

Required in `.env.local` (and Vercel dashboard for production):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=eyJ...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

See `AUTH_SETUP_REFERENCE.md` (gitignored, local only) for full setup details including DNS, Google OAuth, and Vercel configuration.
