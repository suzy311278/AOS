# Auth + Cloud Progress: Decision Log

All decisions made during the brainstorming session for adding authentication and cloud-persisted user progress to the Sustainability Academy.

## 1. Authentication Provider

**Decision**: Clerk

**Why**: Managed auth service with prebuilt Next.js SDK, supports Google + Email/Password, handles session management, provides middleware for route protection, and offers `<UserButton />` / `<SignIn />` components out of the box. Eliminates the need to build auth infrastructure from scratch.

**Sign-in methods**: Google (one-tap) + Email/Password

## 2. Database

**Decision**: Turso (libSQL, edge SQLite)

**Why**: Evaluated across three AI models (Claude, Gemini, Codex). All three independently recommended Turso over Neon, Cloudflare D1, Firestore, and Upstash Redis.

Key factors:
- **Supabase is banned in India** (primary audience), ruling out the most popular BaaS
- **Mumbai/Chennai region** (`maa`): Turso supports Indian regions. Neon's nearest is Singapore.
- **Right-sized**: Small per-user data (~200 completions, ~500 quiz rows, ~365 activity rows per power user). Full Postgres (Neon) is heavier than needed.
- **Read-heavy**: Dashboard loads, progress checks on every page. Turso's SQLite excels at reads.
- **Generous free tier**: 9GB storage, 500M reads/month
- **Vercel integration**: Native marketplace integration, works in serverless functions

**Runner-up**: Neon (Serverless Postgres). Migration path if analytics or complex joins are ever needed.

**Rejected**:
- Cloudflare D1: Requires Cloudflare Workers runtime, awkward from Vercel
- Firestore: Vendor lock-in, unpredictable read billing for dashboards
- Upstash Redis: Wrong primary model for relational progress data
- MongoDB Atlas: Overkill for this data shape

## 3. ORM

**Decision**: Drizzle ORM

**Why**: Lightweight (~50KB vs Prisma's ~10MB), works in Vercel edge functions, first-class Turso support, type-safe TypeScript schema definitions. All three AI models recommended this pairing.

## 4. Hosting

**Decision**: Vercel (existing deployment, project `sa`)

**Why**: Already deployed there. Removing `output: 'export'` from `next.config.mjs` enables hybrid mode (static pages + serverless API routes + middleware). No new project needed, just add env vars.

**What changes**: Vercel switches from serving flat static files to deploying serverless functions alongside static pages. Content pages are still statically generated at build time (no performance regression).

## 5. Access Model

**Decision**: Soft Registration Wall + Metered Free Access (3 lessons/month)

**How it works**:
- All pages fully rendered and crawlable (100% SEO preserved)
- Anonymous visitors can read 3 full lessons per month (tracked via client cookie)
- On the 4th lesson: soft overlay dims content below the fold, shows sign-up CTA
- Registration is free (no paywall, ever)
- Signed-in users: unlimited reading + progress tracking, quizzes, streaks, dashboard

**Why this model** (evaluated 20+ access models with input from Gemini and Codex):
- Preserves full SEO value of 34 lessons, 190+ glossary terms, and JSON-LD structured data
- Establishes content value before asking for commitment
- Free registration removes friction (not a paywall, just an identity gate)
- 3 lessons is enough to sample quality but creates conversion pressure

**Rejected models**:
- Everything behind auth: Zero SEO, too much friction for first-time visitors
- Homepage-only public: Loses long-tail keyword value of individual lessons
- Everything public, auth for state only: No conversion pressure, no reason to sign up
- Metered with hard redirect: Too aggressive, poor UX
- Content blur/paywall: Perceived as deceptive

**Meter behavior**: Soft overlay (content visible but dimmed below fold, centered card with Sign Up / Sign In buttons). Not a hard redirect.

## 6. Post-Login Landing Page

**Decision**: Homepage (course catalog)

**Why**: User sees all available courses after signing in. Discovery-first approach. Dashboard is accessible via nav link.

## 7. Database Schema Design

**Decision**: Four normalized tables (not a JSON blob)

Tables:
- `enrollments`: When a user starts a course (userId + courseId PK)
- `lessonCompletions`: Individual lesson completions with timestamps (userId + courseId + lessonId PK)
- `quizAttempts`: Per-question quiz answers (userId + courseId + lessonId + questionIdx PK)
- `dailyActivity`: One row per user per active day (userId + activityDate PK), for streak calendar

**Why normalized over JSON blob**: The GitHub-style streak calendar needs fast "was this user active on date X?" queries over 365 days. Scanning a JSON column is wasteful. Individual completion rows enable accurate progress counts without parsing.

## 8. Progress Architecture

**Decision**: Cloud-first with localStorage as read cache

- **Source of truth**: Turso database (via API routes)
- **localStorage**: Fast cache for instant page loads (read on mount, then reconcile with cloud)
- **Writes**: Optimistic update to React state + localStorage, then POST to API in background
- **Anonymous users**: localStorage-only (no cloud persistence until sign-in)
- **Scroll positions**: localStorage-only (not worth cloud storage)
- **XP/streak**: Derived from cloud data (lesson count for XP, dailyActivity for streak)

## 9. Migration Strategy

**Decision**: One-time client-side migration with banner prompt

When a returning user (with localStorage progress) signs in:
- Banner detects localStorage data + empty cloud state
- User clicks "Import": POSTs localStorage to `/api/progress/migrate`
- Migration endpoint is idempotent (`ON CONFLICT DO NOTHING`)
- After success, banner is permanently dismissed

## 10. Dashboard Features

**Decision**: Enrolled courses + GitHub-style streak calendar + stats

Components:
- Course cards with progress bars and "Continue" buttons
- 52-week x 7-day streak calendar (green intensity by activity level)
- Stats row: current streak, longest streak, total lessons done, total courses started
- Accessible at `/dashboard`, requires sign-in
