# Greentryst Redesign Cutover Plan

Status: LOCKED on 2026-04-13
Scope: Everything required to move the redesigned site from `/redesign/*` (local-only `redesign` branch) to `/` on production (main branch, `greentryst.com`).

The redesign is complete on the frontend. Before it can replace the live site we need a deliberate, reversible, small-blast-radius cutover. This document captures the plan.

## 1. Cutover Principles

- **One-way-reversible.** Every step either has a documented rollback or is purely additive.
- **No URL silence.** Every existing live URL either continues to serve the same content or 301-redirects to an equivalent. No 404s from inbound traffic.
- **Clerk, Stripe, analytics, SEO.** Every third-party redirect URL and webhook target gets updated in the same window.
- **Cutover is boring.** If the plan cannot be completed in a single two-hour window by one person, the plan is wrong.

## 2. Phases

### Phase 0. Preflight (no production change)

- Run `npm run build` on the redesign branch and fix every TypeScript error, every ESLint error, and every build warning that blocks output.
- Audit the dev-server console for every surface. The known issue: guides has 7 console errors. These must be zero before cutover.
- Confirm `scrollbar-gutter: stable` does not introduce a horizontal scroll on any surface at 320px, 375px, 768px, 1024px, 1280px, 1920px.
- Confirm the `redesign` branch builds cleanly without any environment variable the `main` branch does not have.
- Snapshot the live site: scrape every public URL on `greentryst.com` into a list. This becomes the "nothing should 404" checklist.

### Phase 1. Flatten routes on the redesign branch

Everything today lives under `/redesign/*`. Production should live under `/`.

- Move `src/app/redesign/components/page.tsx` → `src/app/page.tsx` (replaces the old homepage)
- Move every other `src/app/redesign/<route>/` directory up one level, replacing the old platform version where one exists
- Keep the old `index.html` and `VM0042_Learning_Module.html` untouched — they are the legacy single-file app, already referenced in `CLAUDE.md` as reference-only
- Delete `src/app/redesign/` once every sub-route is moved
- Move `src/app/redesign/redesign.css` → `src/app/globals.css` (merge) or keep as a separate import in the root layout

### Phase 2. Update every internal link

Hard rule: no file in the repo may contain the string `/redesign/` after Phase 2 is complete.

- Nav links in `RedesignNav.tsx`: strip the `/redesign` prefix
- Footer links in `RedesignFooter.tsx`: same
- Every page-local `<Link href="/redesign/...">`: strip the prefix
- Every `ClosingCTA`, `PricingSection`, `ActiveShowcase` internal link
- Every Lucide icon link
- Every `router.push("/redesign/...")` call

Run `rg "/redesign/" src/` after this phase. Expected count: 0. Any remaining hit is a bug.

### Phase 3. Update third-party configuration

#### Clerk

- Publishable key: already points to `clerk.greentryst.com`, no change
- In the Clerk dashboard, update these URLs:
  - Sign-in URL: `/sign-in`
  - Sign-up URL: `/sign-up`
  - After sign-in: `/dashboard`
  - After sign-up: `/dashboard`
- Environment variables (`NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`) already reflect the final paths in the main-branch config. Verify before cutover.
- In `src/middleware.ts`: protected routes list keeps `/dashboard(.*)` and `/api/progress(.*)`, `/api/activity(.*)`. Add `/api/resume(.*)` and `/api/me(.*)` if the matching backend ships alongside.

#### Stripe (if it ships)

- Success URL: `/dashboard?upgrade=success`
- Cancel URL: `/pricing`
- Webhook: `/api/stripe/webhook`

#### Analytics

- Google Analytics (GA4, id `G-SGMKCB3SRY`): already loaded globally in `layout.tsx`, no path-specific config
- Verify the `pageview` event fires on every redesigned surface once paths change

### Phase 4. SEO migration

- Update `sitemap.xml` (or the equivalent Next.js dynamic route) to list every new URL
- Update `robots.txt` — remove any `Disallow: /redesign/` if present (it should not be, but verify)
- Per-page metadata: the redesign currently relies on static `metadata` exports; audit every route for a correct `title`, `description`, and canonical URL
- OG images: the old platform had per-page OG; the redesign mostly does not. Before cutover, either:
  - (a) copy the old default OG image to the redesign and accept that it is generic for now, or
  - (b) generate per-page OG via `opengraph-image.tsx` for the homepage, pricing, services, and jobs at minimum
- 301 redirects for URL changes: compare the Phase 0 snapshot list with the new URL list. Every missing URL gets a 301 redirect to its nearest equivalent. Put these in `next.config.mjs` under `redirects()`.

### Phase 5. Data and content

No migration required. The redesign reads from the same content directory, the same Turso tables, and the same xlsx job feed. Verify:

- `src/content/<course-id>/course.yaml` is the source of truth for every course
- `src/jobs/jobs.xlsx` still drives `/jobs`
- `src/content/glossary.yaml` still drives `/glossary`
- Turso schema is unchanged (see `src/lib/schema.ts`); no new tables required pre-cutover. The matching backend plan adds tables post-cutover.

### Phase 6. Visual regression check

Run the full surface set at each breakpoint (320, 375, 768, 1024, 1280, 1920):

- `/` (homepage)
- `/courses`
- `/courses/vm0042` (course detail)
- `/courses/vm0042/0_1` (lesson)
- `/jobs` (All Jobs tab + Matched for you pre-upload + post-upload)
- `/ask` (SustainIQ)
- `/guides` + one individual guide
- `/dashboard` (all three tabs)
- `/pricing`
- `/services`
- `/fair-use`
- `/glossary`
- `/about`, `/feedback`, `/disclaimer`
- `/sign-in`, `/sign-up`
- `/404` and `/500`

Any surface that renders broken at any breakpoint blocks cutover.

### Phase 7. Push

- Merge `redesign` into `main` locally: `git checkout main && git merge redesign --no-ff` (or rebase, depending on your preference; keep the commit history readable)
- Push `main` to Vercel: `git push academy main`
- Wait for Vercel build. If the build fails, roll back locally (`git reset --hard HEAD~1 && git push --force-with-lease academy main`) and fix on a feature branch.
- Production domain `greentryst.com` now serves the redesign.
- Immediately smoke-test the same surface set from Phase 6 on production.

### Phase 8. Post-cutover (same day)

- Watch the error tracker for 60 minutes; any spike above baseline triggers a rollback
- Confirm Google Analytics is recording pageviews on the new URLs
- Confirm Clerk sign-in and sign-up still work end-to-end against the production Clerk instance
- Delete the local `redesign` branch once the main cutover has been stable for a week: `git branch -D redesign`
- Remove every locked spec's `redesign branch (local only)` language and update to reflect production
- Delete `brainstorming/REDESIGN_EXECUTION_PLAN.md` (it described getting here) and keep this cutover plan in its place

## 3. Rollback

Every phase is reversible.

- Phases 1–6 are branch-local. Roll back by reverting the branch or resetting to the last known-good commit.
- Phase 7 rollback: `git revert HEAD` on main and push. Vercel redeploys the previous commit within 90 seconds.
- If a rollback is needed, file an incident note in `brainstorming/` capturing what broke and why, so the next cutover does not repeat it.

## 4. Known Risks

- **Clerk redirect loops.** If the Clerk dashboard still points to `/redesign/sign-in` when the path becomes `/sign-in`, users land in a loop. Verify Phase 3 before Phase 7.
- **Stale internal links.** Missing any `/redesign/` reference in Phase 2 produces a 404 for the user. The `rg` check at the end of Phase 2 is mandatory.
- **MDX content components drift.** The lesson page uses `src/components/redesign/lesson/*` now. After cutover these should move to `src/components/lesson/*` (or stay where they are with imports updated). Pick one, do not leave both.
- **Global CSS merge.** `redesign.css` and `globals.css` both define utility classes. Resolve conflicts before cutover. The newer Inter + JetBrains Mono font setup should win.
- **`src/middleware.ts` location.** Must be in `src/` not project root (per `CLAUDE.md`). Verify after any restructure.
- **Drizzle schema drift.** If the matching backend ships before cutover, the `user_profile`, `user_skills`, `match_scores`, `user_subscriptions` tables must land on the same migration as the cutover. Otherwise skip them; the redesign works without them (preview mode).

## 5. Dependencies on Backend Work

Some cutover items assume the matching backend has shipped. If it has not:

- `/jobs` Matched tab stays in preview mode (localStorage flag)
- Upgrade CTAs link to the pricing page but cannot actually charge
- Resume upload writes a localStorage flag, does not persist
- Dashboard Matching Preferences persist to localStorage, not the database

All of that is acceptable for a frontend-only cutover. Document it explicitly in the cutover commit message so nobody assumes the feature is wired.

## 6. People and Approval

- Engineering lead approves Phases 0, 6, and 7
- Product lead signs off on the per-page metadata and the 301-redirect map (Phase 4)
- Whoever owns the Clerk dashboard executes Phase 3 during the same window as Phase 7

No customer communication required for a like-for-like URL replacement. If any URL changes materially (e.g., a course slug moves), include it in a short changelog post on the blog the same day.

## 7. Files That Must Be Updated

Non-exhaustive, captured for quick grep:

- `src/app/layout.tsx` — root layout metadata + font variables
- `src/app/**/*.tsx` — every page file moved from `src/app/redesign/`
- `src/components/redesign/**` — imports, then consider renaming the directory to `src/components/` + subfolders for `nav`, `footer`, `section`, `card`, etc. (optional Phase 8+ cleanup)
- `src/middleware.ts` — protected route matcher
- `next.config.mjs` — `redirects()` block for the Phase 0 URL snapshot
- `src/app/sitemap.ts` (or equivalent)
- `src/app/robots.ts` (or equivalent)
- `.env.local` + Vercel dashboard env vars — Clerk URLs already set, verify

## 8. Out of Scope

These are not part of the cutover. They are post-cutover initiatives:

- The matching backend (see `JOBS_MATCHING_BACKEND_PLAN.md`)
- The Tools and Regulations product surfaces (live pages, not the current "Soon" placeholders)
- Stripe subscriptions
- SustainIQ production retrieval pipeline
- Mobile polish pass beyond "does not break"

Each of these gets its own plan after the cutover ships.

## 9. Change Log

- 2026-04-13: First locked cutover plan. Written once the redesign frontend pass was complete.
