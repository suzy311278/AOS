# Session Handoff

Status: written 2026-04-13 end of day.
Scope: captures the things that live only in chat memory so the next session (clean or otherwise) can pick up without spelunking.

## 1. Current State

### Committed and done
- Full redesign pass across every locked surface. Specs in `brainstorming/*_LOCKED_SPEC.md` (homepage, courses, jobs, pricing, services, fair-use, lesson, dashboard, guides, sustainiq). Each spec's addendum is authoritative; read those before changing any locked page.
- Strategy docs: `TECH_STRATEGY.md`, `DATA_ARCHITECTURE_PLAN.md`, `BRAND_GUIDELINES.md`, `REDESIGN_CUTOVER_PLAN.md`, `JOBS_MATCHING_BACKEND_PLAN.md`.
- Sentry baseline installed. EU-region DSN wired via `.env.local`. `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`, and `src/app/global-error.tsx` all match the official Sentry Next.js skill. The `/monitoring` tunnel route is excluded from the Clerk middleware matcher.
- LLM Governor: `src/lib/llm-governor.ts`. Single gateway with embedded Groq key rotation + per-user / per-tier caps + exact-match cache + usage hook. Only configured feature: `'sustainiq'`. Not yet consumed by any route.
- Real form submissions: Feedback (`/api/feedback` + `feedback_submissions` table + Resend from `feedback@greentryst.com`) and Services enquiry (`/api/enquiry` + `service_enquiries` table + Resend from `services@greentryst.com`). Both emails notify `prajjwalkaushik08@gmail.com` and auto-respond to the submitter.
- Services catalogue expanded to 20 engagements. Recent price edits not yet reflected in `SERVICES_LOCKED_SPEC.md`: Internal Carbon Pricing **$2,800**, Shadow Water Pricing **$1,200**, Verra Methodology Feasibility **$3,000**. The spec addendum still shows the earlier numbers (6,500 / 6,000); update in the next spec edit.

### Environment
- Dev runs on port 5001, background process id `bvr9agybt` at time of writing. Kill + `npm run dev` to restart if stale.
- `.env.local` contains: Turso, Clerk (live pk_live on localhost, known quirk), Sentry EU DSN + org/project, Resend, Groq keys.

## 2. Open Threads That Live Only in Chat Memory

### 2.1 User Governor / Entitlements (designed, not built)
We discussed a sibling to the LLM Governor: `src/lib/user-governor.ts` (industry-standard name would be `src/lib/entitlements.ts`). One function `entitlementsFor(tier)` returns a fully typed `Entitlements` object with every per-tier rule on the platform: course caps, SustainIQ caps, tool inclusion counts, report format gates, SSO toggle, certificate gate, free Team tier upsell rule, visible match count, saved workspace caps, admin dashboard gate, audit log retention, seat counts, support level.

Purpose: kill all scattered `tier === 'free'` checks. Pricing comparison matrix would render itself by iterating entitlements. LLM Governor's `CAPS` map would read from entitlements instead of duplicating them.

Recommended build order: **before first paying customer**. Not a blocker for anything currently shipped.

### 2.2 Sentry verification pending
The `/api/sentry-test` route exists and deliberately throws a 500. The dashboard never confirmed receiving the event during our session. Someone needs to:
1. Load the Sentry dashboard (EU region, org slug `greentryst`, project `javascript-nextjs`)
2. Hit `http://localhost:5001/api/sentry-test`
3. Confirm the issue appears within 30 seconds
4. Delete `src/app/api/sentry-test/route.ts` once verified

If it does not appear, the most likely causes are: DSN typo in `.env.local`, the dev server not restarted after the env edit, or the `withSentryConfig` wrap not actually firing. Enable `debug: true` temporarily in `sentry.server.config.ts` to see provider activity in the server log.

### 2.3 Old Groq path still live
`src/lib/groq-keys.ts` and `src/app/api/ask-test/route.ts` were left untouched on purpose. They continue to serve the old ask flow. The migration plan is: build the new SustainIQ surface on top of the LLM Governor, cut the ask route over, then delete both old files. Do not edit the old files; migrate off them.

### 2.4 Dashboard Matching Preferences are localStorage-only
On `/redesign/dashboard` the Profile tab's Matching Preferences block (experience level, region, skills) writes to `gt-match-profile-v1` in localStorage. The matching backend (per `JOBS_MATCHING_BACKEND_PLAN.md`) will replace this with Turso-persisted `user_profile` + `user_skills` rows. Do not rip out the localStorage code yet; swap it when the backend lands.

### 2.5 Services spec drift
`SERVICES_LOCKED_SPEC.md` Addendum A lists engagement prices that no longer match the code. The three drifted values:
- Internal Carbon Pricing: spec says $6,500, code says $2,800
- Shadow Water Pricing: spec does not mention it at all (engagement added after the addendum)
- Verra Methodology Feasibility: spec says $6,000, code says $3,000

Catalogue count is now **20** (not 19 as the addendum states). Update in the next spec edit.

### 2.6 SustainIQ rebuild coming
User flagged an intent to restructure SustainIQ as a detailed exercise in a fresh chat. Things to preserve while rebuilding:
- The LLM Governor is the entry point for all LLM calls (do not bypass it)
- Voyage embeddings infrastructure under `scripts/embed-voyage-*` already in place
- 80-90 PDFs indexed, see `brainstorming/SUSTAINIQ_DOCLING_PROGRESS.md`
- Retrieval architecture spec at `brainstorming/RETRIEVAL_ARCHITECTURE.md`
- Existing client UI at `src/app/redesign/ask/` (page.tsx + `_components/` + `_lib/`)
- Locked spec at `brainstorming/SUSTAINIQ_LOCKED_SPEC.md` — worth re-reading before changing the visual surface

## 3. What the Next Session Should Know

1. **Brand rule**: never use em dashes anywhere. Commas, colons, parentheses, periods only. Applies to product copy, code comments, commit messages, every new doc.
2. **All redesign work is local-only** on the `redesign` branch. Never push this branch to a remote. Main keeps deploying to production until the cutover lands (see `REDESIGN_CUTOVER_PLAN.md`).
3. **Scale assumption**: target is up to 4,000 paying users in 24 months. Build for that, not for hyperscale. See `TECH_STRATEGY.md` Section 3 for the calibration.
4. **LLM cost is the dominant cost line at our scale.** Every new AI feature goes through the Governor; no direct provider calls.
5. **Content conventions**: MDX content under `src/content/<course-id>/`, YAML metadata in `course.yaml`, quizzes in `quizzes/<lesson>.yaml`. Source PDFs gitignored in `sources/`. Do not check PDFs into git.

## 4. Immediate To-Do If We Pick Up Here

Priority list at end of session, unchanged:
1. Sentry dashboard verification (5 min, awaits you)
2. Cutover execution per `REDESIGN_CUTOVER_PLAN.md`
3. User Governor / Entitlements build
4. SustainIQ rebuild (deferred, a fresh session's starting point)

Anything else is polish, not blocker.

## 5. Change Log

- 2026-04-13 end of day: first handoff note. Captures the six open threads at the point where the user flagged a SustainIQ rebuild as the next major effort.
