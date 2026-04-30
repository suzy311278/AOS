# Greentryst Data Architecture Plan

Status: LOCKED on 2026-04-13
Scope: Every table Greentryst will own between today and 24 months out.
Target scale: up to 4,000 paying / 10,000 active users.

This is the storage blueprint. The backend plans for individual features (matching, SustainIQ, tools) reference table names from this document. When implementing a feature, start here to confirm the table shape, then move to the feature plan for the pipeline details.

If you are about to add a new table to `src/lib/schema.ts` that is not listed here, stop and update this document first.

## 1. Principles

Pulled from `TECH_STRATEGY.md` principle 2. Applied to every table decision.

- **Postgres-compatible SQL.** Turso today, Neon later if needed. No SQLite-only features.
- **Multi-tenant from day one.** Every user-owned table has a `userId`. Most will grow a `teamId` when Team/Enterprise subscriptions ship. Schema designed now so that the add is a column, not a refactor.
- **Soft delete, not hard delete.** Every user-facing table has `isActive` or equivalent. Hard deletes run via a background worker after retention period.
- **Data residency travels with the row.** Every user-owned table denormalises `dataResidency` (`'eu' | 'us'`) from the user profile. Makes residency-aware reads fast; survives future region splits.
- **Timestamps on everything.** `createdAt` + `updatedAt` (integer, unix-timestamp mode) on every row. `createdAt` indexed where queried.
- **jsonb for evolving payloads, columns for queried fields.** Don't explode schema for every form change. Don't bury queryable fields in jsonb.
- **No cascading deletes at the DB level.** Cascade via application worker so audit logs stay intact.

## 2. Table Inventory

Grouped by concern. Tables in **bold** exist today. Tables in *italic* are planned. Total: **4 today, ~20 at full build.**

### 2.1 Learning progress (already live)

- **`enrollments`** — `(userId, courseId)` PK. Tracks when a user started a course and their last visited lesson.
- **`lesson_completions`** — `(userId, courseId, lessonId)` PK. One row per completed lesson.
- **`quiz_attempts`** — `(userId, courseId, lessonId, questionIdx)` PK. Per-question answer state.
- **`daily_activity`** — `(userId, activityDate)` PK. Daily counters for streak calendar.

No changes planned in 24-month horizon.

### 2.2 Engagement forms (partially live)

- **`feedback_submissions`** — auto-inc id. `type ('bug' | 'feature' | 'content' | 'other')`, `userId?`, `email`, `message`, `metadata` jsonb, `pageUrl?`, `userAgent?`, `createdAt`, `handledAt?`. Drives the Feedback page and Resend notifications.
- **`service_enquiries`** — auto-inc id. `name`, `email`, `company`, `role?`, `engagement`, `timeline`, `budget?`, `message`, `userId?`, `pageUrl?`, `userAgent?`, `status ('new' | 'contacted' | 'qualified' | 'closed')`, `createdAt`, `handledAt?`. Sales lead table for the Services enquiry form.

Indices live today. Kept intentionally separate because the workflow, retention, and notification templates differ.

### 2.3 Identity & tenancy (planned)

Needed when Team / Enterprise tiers ship. Not required for individuals.

- *`users`* — `userId` (Clerk id, PK), cached profile (`email`, `firstName`, `lastName`, `avatarUrl`), `dataResidency ('eu' | 'us')`, `locale`, `createdAt`, `updatedAt`. Denormalised cache of the Clerk record so joins don't require a Clerk API call.
- *`teams`* — `teamId` (uuid, PK), `name`, `slug`, `dataResidency`, `stripeCustomerId?`, `createdAt`, `updatedAt`.
- *`team_members`* — `(teamId, userId)` PK. `role ('admin' | 'member' | 'analyst')`, `invitedAt`, `joinedAt?`, `leftAt?`.

### 2.4 Subscriptions & entitlements (planned)

Needed when Stripe ships. Before that, everyone is treated as `free`.

- *`subscriptions`* — `subscriptionId` (Stripe id, PK). Either `userId` or `teamId` (never both). `tier ('free' | 'individual' | 'pro' | 'team' | 'enterprise')`, `status ('active' | 'past_due' | 'canceled' | 'trialing')`, `currentPeriodStart`, `currentPeriodEnd`, `cancelAtPeriodEnd`, `stripeCustomerId`, `createdAt`, `updatedAt`.
- *`tool_addons`* — auto-inc id. `userId` or `teamId`. `toolId`, `status`, `stripePriceId`, `currentPeriodEnd`, `createdAt`. For the `$15/mo` à la carte tool add-ons.

### 2.5 Profile & matching (planned)

Needed for the jobs matching feature. See `JOBS_MATCHING_BACKEND_PLAN.md` for scoring details.

- *`user_profile`* — `userId` PK. `experienceLevel ('entry' | 'mid' | 'senior' | 'lead' | 'director')`, `preferredRegion?`, `resumeFileUrl?` (R2 object key), `resumeParsedAt?`, `dataResidency`, `createdAt`, `updatedAt`.
- *`user_skills`* — `(userId, skill)` PK. `source ('resume' | 'course' | 'manual')`, `confidence`, `addedAt`, `lastSeenAt`.

### 2.6 Jobs (planned)

Replaces the xlsx file at `src/jobs/jobs.xlsx` once traffic justifies it.

- *`jobs`* — `jobId` (uuid, PK). `externalId` (unique per source), `source`, `title`, `company`, `location`, `country`, `remote`, `profileDomain`, `postedAt`, `ingestedAt`, `expiresAt`, `rawDescription`, `extractedSkills` jsonb, `requiredLevel?`, `jobUrl`, `isActive`.
- *`match_scores`* — `(userId, jobId)` PK. `score` (0-100), `factors` jsonb, `computedAt`, `jobPostedAt` (denormalised for fast sorting), `isStale`.
- *`saved_jobs`* — `(userId, jobId)` PK. `savedAt`, `note?`. Later feature.

### 2.7 SustainIQ (planned)

Needed when the production RAG pipeline ships.

- *`sustainiq_queries`* — auto-inc id. `userId`, `query` text, `answerFingerprint?` (hash of cached semantic answer), `providerModel`, `promptTokens`, `completionTokens`, `costCents`, `latencyMs`, `createdAt`. Drives rate limits, analytics, and LLM cost tracking.
- *`sustainiq_sessions`* — `sessionId` (uuid, PK). `userId`, `title`, `createdAt`, `updatedAt`. Groups queries into saved workspaces.
- *`sustainiq_citations`* — `(queryId, citationIdx)` PK. `sourceDocId`, `page`, `excerpt`, `confidence`. Cached citation payload for replay.

### 2.8 Tools (planned)

One model reused across every professional tool (GHG Calculator, Report Drafter, IFRS Gap, BRSR Screener, CBAM Preparer, Scope 3 Estimator).

- *`tool_workspaces`* — `workspaceId` (uuid, PK). `userId` or `teamId`. `toolId`, `name`, `createdAt`, `updatedAt`, `isActive`.
- *`tool_documents`* — `(workspaceId, version)` PK. `data` jsonb blob, `createdAt`. Versioned data for each workspace.
- *`tool_exports`* — auto-inc id. `workspaceId`, `format ('pdf' | 'docx' | 'xlsx' | 'csv')`, `filename`, `exportedAt`, `userId`.

### 2.9 Regulations (planned)

Deferred until the Regulations product surface ships.

- *`regulation_watchlist`* — `(userId, regulationId)` PK. `subscribedAt`, `alertsEnabled`.
- *`regulation_applicability`* — `(userId, regulationId)` PK. `applies ('yes' | 'no' | 'partial' | 'unsure')`, `note?`, `lastReviewedAt`.

### 2.10 Audit (Enterprise requirement)

- *`admin_audit_log`* — auto-inc id. `actorUserId`, `subjectUserId?`, `subjectTeamId?`, `action` string, `metadata` jsonb, `ipAddress`, `userAgent`, `createdAt`. Every admin / analyst read of another user's data is logged here. Non-negotiable for Enterprise tier.

## 3. Shape Standards

Rules every new table must follow.

### 3.1 Primary keys
- User-scoped event tables (like `lesson_completions`): composite PK including `userId` and a natural key. Do not use auto-increment here.
- Entity tables (like `jobs`, `teams`, `tool_workspaces`): UUID primary key.
- Append-only log tables (like `feedback_submissions`, `admin_audit_log`): auto-incrementing integer PK.

### 3.2 Indices (mandatory)
- Any column filtered in a server-side query has an index.
- Any column used for sorting on a paginated read has an index.
- `createdAt` is indexed on any table that supports a "recent" view.
- Foreign-ish columns (`userId`, `teamId`, `jobId`) are indexed whenever they appear in WHERE clauses.

### 3.3 Naming
- Table names: snake_case, plural (`match_scores`, not `MatchScore`).
- Column names: camelCase in the Drizzle schema, snake_case on disk (Drizzle maps automatically).
- Avoid ambiguous names: `status`, `type` are fine when the allowed values are enumerated in code.

### 3.4 Enumerated values
- Store as `text` in Turso. Validate in application code, preferably via Zod.
- Document the allowed values in a comment on the schema field.
- Never use SQL CHECK constraints — they block future enum additions.

### 3.5 Timestamps
- All timestamps are integer (unix seconds) in `{ mode: 'timestamp' }` mode.
- `createdAt` on every user-facing table, set via `$defaultFn(() => new Date())` at write time.
- `updatedAt` only when mutation semantics exist. Update via application code, not DB trigger.

### 3.6 Nullability
- Default columns to NOT NULL with sensible default. Only allow NULL when it carries semantic meaning ("no value yet" vs "zero").
- `userId` is nullable only on tables that accept anonymous submissions (feedback, enquiries).

### 3.7 Soft delete
- User-facing entities (workspaces, match scores, saved jobs) use an `isActive` boolean or an `archivedAt` timestamp.
- Append-only logs do not soft-delete.
- The GDPR-delete worker reads `users.dataResidency` + `users.deleteRequestedAt` and cascades through a queue, not a SQL `ON DELETE CASCADE`.

### 3.8 Data residency
- Every user-owned table that stores substantive content denormalises `dataResidency` from the `users` row at write time. Reads never join back to `users` just to get residency.
- R2 buckets are split by region (`greentryst-eu-<purpose>`, `greentryst-us-<purpose>`). The object path in `resumeFileUrl` encodes the region.

## 4. Migrations

- Drizzle Kit (`drizzle-kit push` for dev, `drizzle-kit generate` + apply for prod).
- Every schema change lands in the same commit as the code that uses it.
- Migrations are additive only until the feature using a column is fully shipped. Column drops land in a follow-up commit after the code no longer references them.
- Before production: add a CI step that fails if `drizzle-kit generate` produces any output (means the committed schema drifted from the DB).

## 5. Backups & Disaster Recovery

- Turso auto-backs up daily. Retention: 30 days on paid plan.
- Weekly export to R2: via a Vercel cron hitting an internal route that runs `sqlite3 .dump`. Two regions, 90-day retention.
- **Restore drill**: at least once before first paying customer, restore a backup into a scratch Turso DB and verify every table reads. Document the runbook in `runbooks/restore.md`.

## 6. Retention Policies

| Table | Retention | Notes |
|---|---|---|
| Learning progress (all 4) | Forever | User can delete manually |
| `feedback_submissions` | 2 years | Purge via worker after 24 months |
| `service_enquiries` | 5 years | Sales leads, longer retention |
| `users` + `user_profile` | Forever, until user requests deletion | GDPR right to delete honoured within 30 days |
| `user_skills` | Forever | Tied to user |
| `jobs` | 180 days after `expiresAt` | Then hard delete |
| `match_scores` | Recompute on signal; keep last score only | Not a log |
| `sustainiq_queries` | 365 days | Anonymise after 90 days (strip query text, keep cost/latency) |
| `tool_workspaces` + `tool_documents` | Forever, until user requests deletion | Treated as user content |
| `admin_audit_log` | 7 years | Non-negotiable for Enterprise |
| Resumes in R2 | 365 days after last activity | Then hard delete |

## 7. Privacy & Compliance

- **Data residency**: EU or US, user choice at sign-up, denormalised into every row as described.
- **GDPR deletion**: `DELETE /api/me` queues a deletion job; user sees "scheduled for deletion" immediately, data gone within 30 days; audit log rows retained (depersonalised) for 7 years.
- **Access logging**: every admin/analyst read of another user's data writes an `admin_audit_log` row. Applies to support tooling and services engagements.
- **Export**: `GET /api/me/export` returns a zip of every row that belongs to the caller, for portability.
- **Encryption**: at rest (Turso default + R2 default), in transit (TLS 1.3). No customer-held keys in v1; revisit for Enterprise.

## 8. Cost Awareness

Dominant storage costs, in order:

1. **Nothing** at our scale target (up to 10k users). Turso storage < $20/month. R2 < $5/month.
2. The expensive bit is LLM token cost downstream of `sustainiq_queries`, not the table. Managed in `src/lib/llm.ts`, not here.

Storage is effectively free at this scale. This plan optimises for correctness and future-proofing, not cost.

## 9. Sequencing

Add tables in this order, each only when the feature using them is about to ship:

1. Today: `enrollments`, `lesson_completions`, `quiz_attempts`, `daily_activity`, `feedback_submissions`, `service_enquiries` (all live).
2. Before Stripe: `users`, `subscriptions`.
3. With matching feature: `user_profile`, `user_skills`, `jobs`, `match_scores`.
4. With Team tier: `teams`, `team_members`, `tool_addons`.
5. With SustainIQ productisation: `sustainiq_queries`, `sustainiq_sessions`, `sustainiq_citations`.
6. With Tools productisation: `tool_workspaces`, `tool_documents`, `tool_exports`.
7. With Regulations productisation: `regulation_watchlist`, `regulation_applicability`.
8. With first Enterprise buyer: `admin_audit_log`.
9. If needed: `saved_jobs`.

Target at full build: **~20 tables**. Not excessive for a multi-surface product.

## 10. Out of Scope

Things explicitly not in this plan, documented so they don't sneak back in:

- **Materialised views** — our scale doesn't need them. Cache denormalisation inside application code where needed.
- **Event sourcing** — overkill. Append-only log tables cover the use case (`admin_audit_log`, `tool_exports`).
- **Multi-region writes** — read replicas fine when needed; sharding not in the 24-month plan.
- **GraphQL** — REST endpoints via Next.js route handlers are simpler and sufficient.
- **Separate analytics warehouse** — query the transactional DB until that's slow. At 4k paying users, it won't be.

## 11. Files Under Lock

Changes to the following require a commit to this document in the same change:

- `src/lib/schema.ts`
- `drizzle.config.ts`
- `src/lib/db.ts`
- `drizzle/` migration directory

## 12. Related Documents

- `TECH_STRATEGY.md` — overall technology strategy, including the principles this plan enforces
- `JOBS_MATCHING_BACKEND_PLAN.md` — detailed backend plan for matching, references tables in Sections 2.5 and 2.6
- `REDESIGN_CUTOVER_PLAN.md` — production cutover sequencing
- `BRAND_GUIDELINES.md` — identity rules, unrelated but often needed alongside

## 13. Change Log

- 2026-04-13: First locked data architecture plan. Captures the 4 existing tables, 2 just-shipped engagement tables, and the ~14 planned tables across identity, subscriptions, matching, SustainIQ, tools, regulations, and audit.
