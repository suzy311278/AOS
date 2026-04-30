# Redesign → Main Merger Plan

**Created:** 2026-04-16
**Refined:** 2026-04-17 (senior-engineer review + sed correction, preview-deploy reinstated, drizzle-kit migrate reinstated)
**Status:** Approved for execution.

**Branch state:** `redesign` has 23 local-only commits + 51 uncommitted working-tree changes; `main` has 6 commits redesign doesn't.

## Goal

Swap the redesigned implementation in at the same public URLs (`/`, `/courses`, `/dashboard`, `/jobs`, `/guides`, `/ask`), add the new pages (`/pricing`, `/services`, `/fair-use`, `/about`), keep users and SEO uninterrupted.

## Deferred to a second merge (1-2 weeks after cutover)

Emission-factors surface (`/tools/emission-factors/*` and `/dashboard/emission-factors`). Spec isn't locked; carries a fresh DB migration. Ship after the shell is stable.

## Core safety mandates

1. **Atomic commits.** Every route group is its own commit, so a broken group can be surgically reverted without unwinding the whole cutover.
2. **Build at every step.** `npx tsc --noEmit` after every folder move — don't wait until Phase 7.
3. **DB integrity.** Use `drizzle-kit migrate` (declarative, audit-tracked), never `push` (speculative) or raw `turso shell` (bypasses the migrations table).
4. **Clerk synchronicity.** Clerk dashboard URL change must happen in the same window as the Vercel deploy to minimise the "auth black hole".
5. **Never `git reset --hard`.** Only revert forward. This has cost hours before.

## Backups already taken (2026-04-16 21:42)

- Tags: `redesign-preserved-20260416-2142` (pins `c5c8ef7`), `main-preserved-20260416-2142` (pins `f492f26`)
- Bundles: `~/backups/greentryst/redesign-20260416-2142.bundle` (407 MB, complete history), `~/backups/greentryst/main-20260416-2142.bundle` (28 MB, complete history)
- Tarball: `~/backups/greentryst/working-tree-20260416-2145.tar.gz` (962 MB, all 51 uncommitted files)

Recovery: `git branch <name> <tag>` · `git clone <bundle-path>` · `tar xzf <tarball>`

---

## Phase 1 — Clean the workspace on redesign

### 1.1 Migrations + schema

```bash
git checkout redesign
git add drizzle/0001_foamy_satana.sql drizzle/meta/0001_snapshot.json src/lib/schema.ts
git commit -m "db: add migration for feedback, enquiries, and emission factors"
```

### 1.2 SEO regenerated artifacts

```bash
git add public/search-index.json public/sitemap.xml public/robots.txt
git commit -m "seo: regenerate search index and sitemaps"
```

### 1.3 Deferred emission-factors product (committed now so nothing is lost)

```bash
git add scripts/generate-ef-* scripts/validate-emission-factors.ts scripts/ef-ingest/ \
        scripts/peek_*.ts \
        src/app/api/emission-factors/ src/app/redesign/dashboard/emission-factors/ \
        src/app/redesign/tools/ src/content/emission-factors/ src/lib/emission-factors/ \
        public/emission-factors/ public/sitemap-emission-factors.xml \
        brainstorming/EMISSION_FACTORS_*.md data/ef-sources/
git commit -m "feat(ef): emission factors core (deferred surface)"
```

### 1.4 Lesson content updates

```bash
git add src/content/eudr/lessons/
git commit -m "content: EUDR lesson updates"
```

### 1.5 Shell + cleanup (middleware, package.json, stale artifacts)

```bash
git add -A
git commit -m "chore: redesign shell updates + remove legacy scratchpads"
```

**Verify:** `git status` shows a clean working tree.

---

## Phase 2 — Sync with upstream

Bring main's 6 commits (CBAM guide, Carbon Pricing course, MDX fixes, audio additions) into redesign.

```bash
git merge main
```

**Conflict resolution rule:** if an MDX lesson has audio additions on both sides, keep both — verify they aren't duplicates.

```bash
git commit
```

**Verify:** `git log redesign..main --oneline` is empty. `npm run dev`, open `/redesign/courses/carbon-pricing` — confirm main's new content renders inside the redesign shell.

---

## Phase 3 — Create cutover branch

```bash
git checkout main
git checkout -b cutover
git merge --no-ff redesign -m "Merge branch 'redesign' into cutover"
```

Conflicts at this stage are trivial (lockfiles, journals).

---

## Phase 4 — Route flattening (surgical, atomic per group)

Pattern for every group: `mv` redesign files → `rm` legacy sibling → `tsc --noEmit` → commit.

### 4.1 Homepage

Canonical confirmed 2026-04-17: `src/app/redesign/components/page.tsx` is the locked homepage per `HOMEPAGE_LOCKED_SPEC.md`.

```bash
rm src/app/page.tsx                                        # legacy homepage
mv src/app/redesign/components/page.tsx src/app/page.tsx
# Also delete or move any sibling files in redesign/components/ that are referenced only by that page
rm -rf src/app/_components/LandingClient.tsx               # legacy landing client (confirm unused first)
npx tsc --noEmit
git add . && git commit -m "cutover: move homepage"
```

### 4.2 Auth

```bash
rm -rf src/app/sign-in src/app/sign-up
mv src/app/redesign/sign-in src/app/sign-in
mv src/app/redesign/sign-up src/app/sign-up
npx tsc --noEmit
git add . && git commit -m "cutover: move auth routes"
```

### 4.3 Courses + module redirect

```bash
rm -rf src/app/courses
mv src/app/redesign/courses src/app/courses
npx tsc --noEmit
git add . && git commit -m "cutover: move courses"
```

Then edit `next.config.mjs` to add the 301 for legacy-only module pages:

```js
async redirects() {
  return [
    {
      source: '/courses/:courseId/modules/:moduleId',
      destination: '/courses/:courseId',
      permanent: true,
    },
  ];
}
```

```bash
git add next.config.mjs && git commit -m "cutover: redirect legacy module URLs"
```

### 4.4 Guides — preserve `[slug]` SEO

```bash
rm -rf src/app/guides
mv src/app/redesign/guides src/app/guides
mv 'src/app/guides/[guideId]' 'src/app/guides/[slug]'
# Inside the moved page.tsx, rename every params.guideId → params.slug
npx tsc --noEmit
git add . && git commit -m "cutover: move guides, rename [guideId] → [slug]"
```

### 4.5 Remaining pages

Repeat the pattern (`rm -rf` legacy → `mv` from redesign → `tsc --noEmit` → atomic commit) for each:

- `dashboard`, `jobs`, `ask`, `glossary`, `feedback`, `disclaimer`

And for new-only pages (no legacy to remove):

- `pricing`, `services`, `services/enquire`, `fair-use`, `about`

**Leave alone (deferred):** `src/app/redesign/tools/`, `src/app/redesign/dashboard/emission-factors/`.

---

## Phase 5 — Global URL transformation

Strip `/redesign/` from URL literals only. The naive `s|/redesign/|/|g` breaks component imports like `@/components/redesign/RedesignFooter` — don't use it.

```bash
grep -rl --include='*.tsx' --include='*.ts' '["'"'"'`]/redesign/' src/app src/components \
  | xargs sed -i '' -E "s|([\"'\`])/redesign/|\1/|g"
```

This pattern only matches `/redesign/` preceded by a quote (`"`, `'`, or `` ` ``), leaving directory-path imports intact.

**Verify:**

```bash
grep -rn --include='*.tsx' --include='*.ts' '["'"'"'`]/redesign/' src/app src/components \
  | grep -v '/tools/emission-factors\|/dashboard/emission-factors'
```

Must return zero (EF surface is deferred). The `components/redesign/` directory rename is a cosmetic cleanup for after cutover.

```bash
npx tsc --noEmit
git add . && git commit -m "cutover: strip /redesign/ prefix from URL literals"
```

---

## Phase 6 — Global style elevation

Fonts + `redesign.css` currently load only inside the nested redesign layout. Lift to root.

1. Move the Inter + JetBrains Mono font loaders from `src/app/redesign/layout.tsx` into `src/app/layout.tsx`.
2. Move `import './redesign.css'` to `src/app/layout.tsx`. (Relocate the CSS file to `src/app/` so the import path resolves.)
3. Add `className="gt-redesign-root"` to `<body>` in `src/app/layout.tsx` — preserves every `.gt-redesign-root ...` selector with zero rewrites.
4. Delete `src/app/redesign/layout.tsx`.

```bash
npm run dev
# Visual check: /, /courses, /dashboard, /jobs, /guides — fonts + colors match locked specs.
git add . && git commit -m "cutover: lift redesign fonts and CSS to root layout"
```

---

## Phase 7 — Build + local smoke

```bash
npx tsc --noEmit
npm run build
```

Both must exit clean. Then walk every nav link on the locally built site:

- Homepage → every CTA + footer link
- Dashboard → every tile
- Courses → enter a course → enter a lesson
- Sign in / sign up flow

Any 404 = a missed URL transform. Fix before Phase 8.

---

## Phase 8 — Preview deploy on Vercel

**Do not skip this.** First time the flattened tree runs on Vercel infrastructure must be on a preview, not prod.

```bash
git push academy cutover
```

Vercel builds a preview URL automatically. Exercise:

- Every page from Phase 7
- Sign-in with a test Clerk account
- Submit the feedback form (will 500 until Phase 9 — expected)
- Submit the enquiry form (same)
- Smoke-curl top 20 URLs from the live sitemap against the preview URL — all must 200

---

## Phase 9 — Production database (Turso)

First production-side step. Back up first.

```bash
turso db dump <prod-db-name> > ~/backups/greentryst/turso-pre-merge-$(date +%Y%m%d).sql
```

Apply migration declaratively (audit-tracked):

```bash
export $(grep -v '^#' .env.local | xargs)
npx drizzle-kit migrate
```

**Verify:**

```bash
turso db shell <prod-db-name> "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

Tables must exist: `feedback_submissions`, `service_enquiries`, `ef_cite_lists`, `ef_cite_list_items`, `ef_saved_factors`, `ef_search_history`, `ef_issue_reports`.

Re-test the feedback form on the preview deploy — must now succeed.

---

## Phase 10 — Authentication (Clerk)

In the Clerk production dashboard → Paths:

- Sign-in: `/redesign/sign-in` → `/sign-in`
- Sign-up: `/redesign/sign-up` → `/sign-up`
- After sign-in: `/dashboard`
- After sign-up: `/dashboard`

**Verify:** sign out on preview, sign back in. Redirect lands on `/dashboard`, no loop.

---

## Phase 11 — Vercel env vars

Confirm in Vercel production environment:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- `RESEND_API_KEY`
- `SENTRY_DSN` (optional — build tolerates absence)

---

## Phase 12 — Final promotion

```bash
git checkout main
git merge --no-ff cutover -m "Release: major site redesign"
git push academy main
```

Monitor Vercel deploy log.

---

## Phase 13 — Post-deploy verification (first 15 minutes)

- [ ] Homepage loads, fonts render
- [ ] Sign-in + sign-up work end to end (test account)
- [ ] Dashboard loads with user data
- [ ] `/courses/vm0042` loads, MDX renders
- [ ] `/guides/eudr` loads (confirms `[slug]` rename worked)
- [ ] `/courses/vm0042/modules/1` returns 301 → `/courses/vm0042` (confirms redirect)
- [ ] `/jobs` loads, table populated
- [ ] `/ask` loads
- [ ] `/services/enquire` accepts a test submission
- [ ] Feedback form submits without 500
- [ ] No Sentry 404 spike, no 500 spike
- [ ] Smoke-curl top 20 URLs from old sitemap — all 200 or 301

---

## Rollback (only if Phase 13 fails)

```bash
git revert -m 1 HEAD
git push academy main
```

Vercel redeploys the previous build in ~90 seconds.

Then revert Clerk dashboard paths (`/sign-in` → `/redesign/sign-in`, same for sign-up). DB tables are additive and stay — legacy code does not reference them, so they're inert.

**Never `reset --hard` main.** Only revert forward.

---

## Pre-flight gates (all must be green before Phase 12)

- [ ] Phase 1: `git status` clean on redesign
- [ ] Phase 2: `git log redesign..main --oneline` empty
- [ ] Phase 4: `npx tsc --noEmit` clean after each route group
- [ ] Phase 5: the quote-anchored `/redesign/` grep returns zero
- [ ] Phase 7: `npm run build` clean
- [ ] Phase 8: preview deploy passes the smoke-URL list
- [ ] Phase 9: migration applied, 7 new tables visible in prod Turso; `turso db dump` file stored
- [ ] Phase 10: Clerk URLs updated
- [ ] Phase 11: Vercel env vars confirmed

Any red → fix before merging to main.

---

## Second merge — emission factors (1-2 weeks after cutover)

After main is stable:

- Branch off main
- `mv src/app/redesign/tools src/app/tools`
- `mv src/app/redesign/dashboard/emission-factors src/app/dashboard/emission-factors`
- Extend `src/app/sitemap.ts` with `/tools/emission-factors/*`
- Same cutover pattern: preview → smoke → merge → verify

---

## Risk summary

| # | Risk | Mitigation |
|---|---|---|
| 1 | Lost redesign work via `git reset` | Tags + bundles taken before starting (see Backups). Never reset, only revert. |
| 2 | Vercel build fails (missing scripts) | Phase 1.3 commits EF scripts before any merge attempt. |
| 3 | `/api/feedback` and `/api/enquiry` 500 | Phase 9 applies migration before merge to main. |
| 4 | Login broken post-merge | Phase 10 updates Clerk URLs in same window. Rollback plan includes reverting Clerk. |
| 5 | Internal nav 404s | Phase 5 sed is anchored to quote contexts — won't touch component imports. |
| 6 | Main-ahead commits silently lost | Phase 2 merges main into redesign first; verify via `git log redesign..main`. |
| 7 | CSS scoping breaks on layout lift | Phase 6 keeps `.gt-redesign-root` on `<body>`; zero selector rewrites needed. |
| 8 | User progress data corruption | Migration is additive only (no ALTER/DROP on existing tables). Phase 9 takes a Turso dump first. |
| 9 | Preview infrastructure surprise | Phase 8 runs the flattened tree on Vercel before prod. |
