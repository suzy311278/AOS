# Clerk Auth + Turso Database + Dashboard Implementation Plan

## Context

The Sustainability Academy currently stores all user progress in browser localStorage, making it device-locked and vulnerable to data loss. This plan adds Clerk authentication, Turso database (Mumbai/Chennai region) with Drizzle ORM for cloud-persisted progress, a metered soft registration wall for anonymous visitors, and a user dashboard with GitHub-style streak calendar.

## Decisions Locked In

- **Auth provider**: Clerk (Google + Email/Password sign-in)
- **Database**: Turso (libSQL, Chennai `maa` region) + Drizzle ORM
- **Hosting**: Vercel (drop static export)
- **Post-login landing**: Homepage (course catalog)
- **Access model**: Soft Registration Wall + Metered Free Access
  - All lesson pages fully rendered and crawlable (full SEO preserved)
  - Anonymous visitors can read **3 lessons per month** (tracked via cookie)
  - After 3 lessons: soft overlay dims content below the fold with sign-up CTA
  - Registration is **free** (no paywall)
  - Signed-in users: unlimited access + progress tracking, quizzes, streaks, dashboard
  - Googlebot always sees full content (no gating for crawlers)

## What You Need to Do First (Phase 0)

Before any code is written, set up three services:

1. **Clerk** (clerk.com): Create an application. Enable Google + Email/Password sign-in. Copy the publishable key and secret key.
2. **Turso**: Install CLI (`brew install tursodatabase/tap/turso`), sign up (`turso auth signup`), create a database: `turso db create sustainability-academy --location maa`. Get the URL (`turso db show sustainability-academy --url`) and auth token (`turso db tokens create sustainability-academy`).
3. **Vercel**: Add new env vars to the existing Vercel project (Clerk keys, Turso URL/token).

Then create `.env.local` in the project root:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

## Phase 1: Infrastructure (drop static export, add deps, define schema)

**Goal**: The app can use server features but still works identically (no auth, no cloud progress yet).

### Install packages
```bash
npm install @clerk/nextjs @libsql/client drizzle-orm
npm install -D drizzle-kit
```

### Modify: `next.config.mjs`
- Remove `output: 'export'`
- Everything else stays (MDX, pageExtensions). Content pages are still statically generated via `generateStaticParams`.

### Create: `src/lib/db.ts`
- Database connection singleton using `@libsql/client` + `drizzle-orm/libsql`
- Reads `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` from env
- `globalThis` caching for HMR survival in dev

### Create: `src/lib/schema.ts`
- Drizzle schema with four tables:
  - `enrollments` (userId, courseId, startedAt, lastLesson, lastAccessedAt)
  - `lessonCompletions` (userId, courseId, lessonId, completedAt)
  - `quizAttempts` (userId, courseId, lessonId, questionIdx, selected, multiSelected, matching, submitted, answeredAt)
  - `dailyActivity` (userId, activityDate, lessonsDone, quizzesDone)
- All composite primary keys, SQLite integer timestamps
- **Add single-column indexes on `userId` for all four tables** (composite PKs don't cover dashboard queries)

### Create: `drizzle.config.ts`
- Points to `src/lib/schema.ts`, driver `turso`, output `./drizzle`

### Run migrations
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

### Verify
- `npm run build` succeeds
- `npm run dev` works, all pages render as before

## Phase 2: Clerk Auth + Soft Registration Wall

**Goal**: Clerk auth available throughout the app. Anonymous visitors can read 3 lessons/month. Signed-in users have unlimited access.

### Create: `middleware.ts` (project root)
- `clerkMiddleware()` with `createRouteMatcher` from `@clerk/nextjs/server`
- **Public routes**: `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/glossary`, `/courses/(.*)` (all course and lesson pages are publicly accessible)
- **Protected routes**: `/dashboard`, `/api/progress/(.*)`, `/api/activity`
- Static assets excluded (`/_next/static`, `/images`, etc.)
- The middleware does NOT block anonymous access to lesson pages. The metering logic lives client-side.

### Modify: `src/app/layout.tsx`
- Wrap children with `<ClerkProvider>`

### Create: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Clerk `<SignIn />` component, centered, branded

### Create: `src/app/sign-up/[[...sign-up]]/page.tsx`
- Clerk `<SignUp />` component, centered, branded

### Create: `src/components/platform/LessonMeter.tsx`
- Client component rendered on lesson pages
- Checks `useAuth()` from Clerk: if signed in, render nothing
- If anonymous: read a cookie (`sa_lessons_read`) containing a JSON array of lesson slugs read this month
- If count < 3: silently increment (add current lesson to cookie, set expiry to end of current month)
- If count >= 3: render a soft overlay that dims content below the first ~30% of the page, shows a centered card: "You've read your 3 free lessons this month. Sign up free to continue learning." with Sign Up and Sign In buttons
- Cookie is `HttpOnly: false` (client-readable), `SameSite: Lax`, expires end of calendar month
- **Flash fix**: Use CSS to blur/dim content by default when meter cookie indicates >= 3, so overlay is visible before JS hydrates

### Modify: `src/app/courses/[courseId]/[lessonId]/_components/LessonClient.tsx`
- Render `<LessonMeter />` at the top of the lesson content area

### Modify: `src/components/platform/PlatformNav.tsx`
- Add `<UserButton />` from Clerk (shown when signed in)
- Add "Sign In" link (shown when signed out)

### Verify
- Anonymous: can read 3 lessons, 4th shows overlay (no flash of ungated content)
- Signed in: no overlay, unlimited access
- Googlebot: sees full content (no JS-based overlay in SSR output)
- `/sign-in` and `/sign-up` work with Google and email/password

## Phase 3: API Routes

**Goal**: Server-side endpoints for all progress CRUD, protected by Clerk auth. Strictly append-only (never accept full state blobs).

### Create 6 API route files under `src/app/api/`:

| Route | Method | Purpose |
|-------|--------|---------|
| `progress/route.ts` | GET | All enrollments + completion counts (for dashboard) |
| `progress/[courseId]/route.ts` | GET | Full course detail (completions + quiz state) |
| `progress/lesson-complete/route.ts` | POST | Mark lesson done, upsert daily activity (atomic increment) |
| `progress/quiz-answer/route.ts` | POST | Save/submit quiz answer |
| `activity/route.ts` | GET | Daily activity for last 365 days (streak calendar) |
| `progress/migrate/route.ts` | POST | One-time localStorage to cloud migration |

Every route:
- `auth()` for Clerk userId, 401 if missing
- **Zod validation** on all POST request bodies (validate courseId/lessonId exist in content manifest)
- **Rate limiting**: max 1 lesson completion per 10 seconds per user (prevents XP farming)
- Drizzle queries against Turso
- dailyActivity uses atomic `INSERT ... ON CONFLICT DO UPDATE SET lessonsDone = lessonsDone + 1`

### Verify
- Test each endpoint via curl or REST client with Clerk session cookie
- Confirm data appears in Turso shell

## Phase 4: Cloud-First Progress Hooks

**Goal**: Replace localStorage hooks with cloud-first hooks. This is the critical phase.

### Create: `src/lib/progress-cloud.ts`

New `useProgress(courseId)` and `usePlatformProgress()` hooks with **identical return types** to current hooks. Strategy:

- **Auth-aware**: Uses `useAuth()` from Clerk. If not signed in, falls back to localStorage-only (anonymous reading mode).
- **On mount (signed in)**: Read localStorage cache for instant render, then fetch from API, update state + cache
- **Writes** (markComplete, saveAnswer, etc.): Only available when signed in. Optimistic update to React state + localStorage, then POST individual event to API in background. **Never send full state blob.**
- **Writes (anonymous)**: No-op or show "sign in to save progress" prompt
- **401 handling**: On expired session, trigger sign-in redirect or "session expired" toast, queue failed write
- **syncQueue**: Maintain a queue in localStorage for offline/failure recovery. Flush pending writes on page load before making new ones.
- **Hydration safety**: Same pattern (return defaults until mounted)
- **scrollPositions**: Stay localStorage-only (no cloud storage needed)
- **XP/streak**: Derived from cloud data (lesson count for XP, dailyActivity for streak)

### Modify imports in exactly 5 files:
1. `src/app/_components/LandingClient.tsx`
2. `src/app/courses/[courseId]/_components/CourseShell.tsx`
3. `src/app/courses/[courseId]/_components/CourseOverviewClient.tsx`
4. `src/app/courses/[courseId]/[lessonId]/_components/LessonClient.tsx`
5. `src/components/platform/PlatformNav.tsx`

Change: `from '@/lib/progress'` to `from '@/lib/progress-cloud'`

No other changes needed in these files (return types are identical).

### Verify
- Sign in, complete a lesson, answer quiz questions
- Check Turso shell for data
- Open incognito, sign in with same account, verify progress appears
- Anonymous user: can read lessons, progress features show "sign in" prompts
- Test on a different device
- Test offline: complete a lesson while disconnected, reconnect, verify sync

## Phase 5: Dashboard + Streak Calendar

**Goal**: `/dashboard` page showing enrolled courses, progress, and GitHub-style streak calendar. Requires sign-in.

### Create: `src/app/dashboard/page.tsx`
- Server component: `auth()` for userId, redirect to `/sign-in` if not authenticated
- Direct Drizzle queries (no API hop): enrollments with completion counts + daily activity for 365 days

### Create: `src/app/dashboard/_components/DashboardClient.tsx`
- Course cards with progress bars, "Continue" buttons
- Stats row: current streak, longest streak, total lessons done, total courses

### Create: `src/app/dashboard/_components/StreakCalendar.tsx`
- 52-week x 7-day grid (GitHub contribution style)
- Green color intensity by daily activity level (0, 1, 2-3, 4+)
- Hover tooltip with date + lesson/quiz count

### Modify: `src/components/platform/PlatformNav.tsx`
- Add "Dashboard" link (shown when signed in)

### Verify
- `/dashboard` shows enrolled courses with correct progress %
- Streak calendar shows activity for days with completions
- Stats are accurate
- Anonymous users redirected to sign-in

## Phase 6: Migration + Cleanup (parallel with Phase 5)

### Create: `src/components/platform/MigrationBanner.tsx`
- Client component, rendered in layout
- Detects: user is signed in + localStorage has progress data + cloud has no enrollments
- Shows banner: "We found local progress from a previous session. Import to your account?"
- On click: POSTs localStorage data to `/api/progress/migrate`
- On success: **clear `sustainability_academy` localStorage key entirely** + hide banner
- Idempotent (migration endpoint uses `ON CONFLICT DO NOTHING`)

### Modify: `src/app/layout.tsx`
- Render `<MigrationBanner />` inside ClerkProvider

### Cleanup
- Rename old `progress.ts` to `progress-local.ts` (keep as reference) or delete
- Update `progress-export.ts` to export from cloud data
- Update CLAUDE.md with new architecture, API routes, schema, commands
- Verify `.env.local` is in `.gitignore`

## Deployment Config

- Set Vercel function region to `bom1` (Mumbai) to minimize function-to-Turso latency
- Verify `next/image` behavior after removing `output: 'export'` (image optimization auto-enables)
- Check trailing slash behavior in internal links post-switch

## File Change Summary

| Action | File | Phase |
|--------|------|-------|
| Modify | `next.config.mjs` | 1 |
| Create | `src/lib/db.ts` | 1 |
| Create | `src/lib/schema.ts` | 1 |
| Create | `drizzle.config.ts` | 1 |
| Create | `middleware.ts` | 2 |
| Modify | `src/app/layout.tsx` | 2, 6 |
| Create | `src/app/sign-in/[[...sign-in]]/page.tsx` | 2 |
| Create | `src/app/sign-up/[[...sign-up]]/page.tsx` | 2 |
| Create | `src/components/platform/LessonMeter.tsx` | 2 |
| Modify | `src/components/platform/PlatformNav.tsx` | 2, 5 |
| Modify | `src/app/courses/[courseId]/[lessonId]/_components/LessonClient.tsx` | 2, 4 |
| Create | `src/app/api/progress/route.ts` | 3 |
| Create | `src/app/api/progress/[courseId]/route.ts` | 3 |
| Create | `src/app/api/progress/lesson-complete/route.ts` | 3 |
| Create | `src/app/api/progress/quiz-answer/route.ts` | 3 |
| Create | `src/app/api/activity/route.ts` | 3 |
| Create | `src/app/api/progress/migrate/route.ts` | 3 |
| Create | `src/lib/progress-cloud.ts` | 4 |
| Modify | `src/app/_components/LandingClient.tsx` | 4 |
| Modify | `src/app/courses/[courseId]/_components/CourseShell.tsx` | 4 |
| Modify | `src/app/courses/[courseId]/_components/CourseOverviewClient.tsx` | 4 |
| Create | `src/app/dashboard/page.tsx` | 5 |
| Create | `src/app/dashboard/_components/DashboardClient.tsx` | 5 |
| Create | `src/app/dashboard/_components/StreakCalendar.tsx` | 5 |
| Create | `src/components/platform/MigrationBanner.tsx` | 6 |

## Verification (end-to-end)

1. `npm run build` succeeds (content pages still statically generated)
2. Anonymous visitor: can browse homepage, course overviews, read 3 lessons
3. 4th lesson: soft overlay with sign-up CTA appears (no flash)
4. Googlebot: sees full content on all pages (verified via `curl` without cookies)
5. Sign up with Google or email: lands on homepage
6. Browse a course, complete a lesson, answer quiz: data in Turso
7. Open incognito/different device, sign in: same progress appears
8. `/dashboard`: shows enrolled course, streak calendar, stats
9. Existing localStorage user: sees migration banner, clicks import, cloud has their data
10. Offline test: complete lesson while disconnected, reconnect, verify sync queue flushes
