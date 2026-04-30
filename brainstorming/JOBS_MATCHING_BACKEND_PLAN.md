# Jobs + Matching Feature, Backend Plan

Status: Planning note, written 2026-04-13
Scope: Everything behind the redesigned `/redesign/jobs` page and the resume-driven match feature on the `Matched for you` tab.

This document captures what the backend needs to look like so the matching feature currently mocked on the frontend becomes real. It is intentionally opinionated so that implementation can begin without another round of design.

## 1. Product Summary

The frontend already commits to a specific product model, so the backend must match it:

- Two tabs on `/redesign/jobs`: **All Jobs** (pure directory, no match data) and **Matched for you** (resume-driven, scored, ranked).
- Users upload a resume once. The platform builds a profile from the resume, then re-matches continuously as the user completes courses, updates preferences, or new jobs appear.
- Skills are NOT user-picked on the jobs page. They are derived from the resume and augmented by course completions. Users edit experience level and preferred region in their dashboard profile.
- Free tier sees top 2 matches fully, rest blurred with an upgrade CTA. Individual and above see every match on the board.
- Every fact shown on the page (match %, skill overlap, gap) must be defensible, in line with the rest of the Greentryst provenance promise.

## 2. Data Model

New tables (Turso + Drizzle ORM, matching the rest of the stack).

### `user_profile`
- `userId` (PK, FK to Clerk user)
- `experienceLevel` enum: `entry | mid | senior | lead`
- `preferredRegion` string, ISO country or region code, nullable
- `resumeFileUrl` string, signed URL base or object key
- `resumeParsedAt` timestamp, nullable
- `locale` string, default `en-GB`
- `dataResidency` enum: `eu | us`
- `createdAt`, `updatedAt`

### `user_skills`
- `(userId, skill)` composite PK
- `source` enum: `resume | course | manual`
- `confidence` float 0..1 (from parser or set to 1 for manual)
- `addedAt` timestamp
- `lastSeenAt` timestamp (refreshed on re-parse or course event)

### `jobs`
Replace the current `src/jobs/jobs.xlsx` read-at-request pattern.
- `id` (PK)
- `externalId` string, unique per source
- `source` string: `partner_ats_acme | linkedin_feed | manual`
- `title`, `company`, `location`, `country`, `remote`
- `profileDomain` enum: same five values as `PROFILE_LABELS` today
- `postedAt`, `ingestedAt`, `expiresAt`
- `rawDescription` text
- `extractedSkills` jsonb: array of `{ skill, confidence }`
- `requiredLevel` enum (same as `user_profile.experienceLevel`)
- `jobUrl` string, apply link
- `isActive` boolean, soft-delete flag

### `match_scores`
Denormalised cache. One row per (user, job) pair.
- `(userId, jobId)` composite PK
- `score` int 0..100
- `factors` jsonb: `{ skillOverlap, skillsMatched[], skillsMissing[], regionMatch, levelMatch, domainMatch }`
- `computedAt` timestamp
- `jobPostedAt` timestamp (denormalised for fast sorting)
- `isStale` boolean (marked true when a source input changes, cleared by the worker)

### `user_subscriptions`
- `userId` PK
- `tier` enum: `free | individual | pro | team | enterprise`
- `status` enum: `active | past_due | canceled | trialing`
- `stripeCustomerId`, `stripeSubscriptionId`
- `currentPeriodStart`, `currentPeriodEnd`
- `cancelAtPeriodEnd` boolean

### Existing tables reused
- `lesson_completions` — signal source for the re-matching worker
- `enrollments` — used for skill inference from courses

## 3. Resume Pipeline

### Upload
- Endpoint: `POST /api/resume`
- Accepts: PDF or DOCX, max 10 MB
- Flow: virus scan (ClamAV or R2-side) then write to Cloudflare R2 at `resumes/<userId>/<uuid>.pdf`
- Persist: `user_profile.resumeFileUrl`, mark `resumeParsedAt = null`
- Kick off background parse job via queue

### Parser (two options, pick one)
- **Managed**: Affinda, Sovren, or Textkernel. Fastest path to production. Cost roughly 10 to 40 cents per resume.
- **In-house**: `unstructured.io` for text extraction, plus an LLM pass (Claude Haiku or GPT-4.1-mini is enough) with a constrained prompt that returns JSON against the sustainability skill taxonomy. Cost roughly 1 to 4 cents per resume but needs our own evaluation harness.

### Extracted fields
- `skills[]` with confidence
- `yearsExperience` float
- `roles[]` with `{ title, company, years }`
- `seniorityHint` (mapped to `user_profile.experienceLevel`)
- `certifications[]`
- `languages[]`

### Post-parse actions
- Upsert `user_skills` rows with `source = resume`
- If `experienceLevel` is still null on `user_profile`, set it from `seniorityHint`
- Queue a recompute of all `match_scores` for this user
- Set `resumeParsedAt = now()`

### Retention
- Resume file retained 365 days after last activity, per the Fair Use page
- Parsed profile retained until user deletes account
- Delete endpoint: `DELETE /api/resume` removes file and derived skills from `user_skills` where `source = resume`

## 4. Skills Taxonomy

A controlled vocabulary, seeded once and maintained in code.

- Location: `src/lib/skills-taxonomy.ts`
- Structure: `{ canonical: string, synonyms: string[], domain: ProfileDomain | 'cross' }`
- Examples: `Scope 3`, `TCFD`, `CSRD`, `IFRS S1`, `IFRS S2`, `CBAM`, `SFDR`, `EU Taxonomy`, `VM0042`, `PCAF`, `SBTi`, `LCA`, `BRSR`, `GHG Protocol`, `Climate Risk`, `Biodiversity`, `Double Materiality`, `Article 6`, `CORSIA`, and so on. Start with the homepage ticker list; extend as new courses ship.
- Both the resume parser and the job enricher map free-text skills onto this vocabulary so matching compares apples to apples.
- Optional v2: swap exact-match for semantic embeddings via `pgvector` or a Turso extension.

## 5. Job Ingestion

Replace the xlsx with a scheduled ingest.

- Source options, in order of preference: partner ATS webhook, RSS / JSON feed from a partner job board, scraper of a fixed whitelist.
- Cron: hourly, dedup by `externalId`.
- Enrichment pipeline per ingested job:
  1. Detect `profileDomain` from title and description
  2. Run the taxonomy extractor to populate `extractedSkills`
  3. Infer `requiredLevel` from title keywords plus description
  4. Mark `isActive = true`, set `expiresAt = postedAt + 60 days`
- Expiry sweep: nightly, mark `isActive = false` for jobs past `expiresAt`.

## 6. Match Scoring Service

### Algorithm, v1
Simple weighted sum, easy to reason about, easy to ship.

```
score = 55
+ 22 if job.profileDomain matches user.primaryDomain (derived from skills)
+ 10 if user.preferredRegion == null OR job.country matches
+ 6 if titleMatchesUserLevel
+ min(25, skillOverlap * 3)   // where skillOverlap = count of user skills present in job.extractedSkills
- 3 if job.profileDomain is hard mismatch
clamp to [52, 98]
```

### Algorithm, v2 (optional)
Replace the skill overlap term with a cosine similarity over learned skill embeddings. Train on historical applications when there is enough signal. Keep v1 as a fallback.

### Storage and read path
- Scores are persisted to `match_scores` so the Matched for you list reads in a single indexed query.
- API reads never re-compute on the fly.
- Include `factors` payload so the UI can render the skill-gap explanation without a second call.

## 7. Re-matching Triggers

All recomputes go through an event queue (Inngest, QStash, or Bull on Upstash Redis). Workers are idempotent.

Trigger → worker action:
- Resume upload or replace → full re-score of this user against all active jobs
- Profile edit (level or region) → same
- `lesson_completions` row inserted → derive new `user_skills` rows, then re-score this user
- New `jobs` row inserted (ingest) → score this job against all active users (cap batch size)
- Nightly sweep → re-score everyone, catches taxonomy updates and job expiry
- Subscription upgrade → no recompute needed; entitlement layer handles visibility

Mark `match_scores.isStale = true` immediately on trigger, then clear when the worker finishes. The read API filters out stale rows only if the delta is beyond a threshold.

## 8. Subscription and Entitlements

### Billing
- Stripe or Lemon Squeezy. Stripe preferred for team seats.
- Webhook target: `POST /api/stripe/webhook`, updates `user_subscriptions`.
- Cancellations set `cancelAtPeriodEnd = true`; downgrade takes effect at period end.

### Entitlement service
A single file, `src/lib/entitlements.ts`, exporting:

```ts
function entitlementsFor(userId: string): {
  canSeeAllMatches: boolean;
  maxVisibleMatches: number;         // 2 for free, Infinity otherwise
  canSeeSkillGap: boolean;
  canExport: boolean;
  maxSustainIQ: number | 'unlimited';
  toolsIncluded: string[] | 'all';
};
```

### Server enforcement
The `FREE_TIER_VISIBLE_MATCHES = 2` constant in the frontend is a visual hint. The API `/api/me/matches` must itself gate results by entitlement. Never trust the client to respect the cap.

## 9. API Surface

All routes Clerk-gated unless noted.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/resume` | Upload resume, kicks off parse |
| `GET` | `/api/resume/status` | Poll parse state, returns `parsing | parsed | failed` |
| `DELETE` | `/api/resume` | Delete file + resume-derived skills |
| `GET` | `/api/me/profile` | Full profile, skills, level, region, tier |
| `PATCH` | `/api/me/profile` | Update level and region |
| `GET` | `/api/me/skills` | Derived skills with source and confidence |
| `PATCH` | `/api/me/skills` | Manual add / remove of skills |
| `GET` | `/api/jobs` | Current directory list, public, existing behaviour |
| `GET` | `/api/me/matches` | Ranked + entitled list for current user |
| `GET` | `/api/me/matches/:jobId` | Single match with skill-gap payload |
| `POST` | `/api/stripe/webhook` | Billing events, no auth, signed |

### `GET /api/me/matches` response shape

```json
{
  "tier": "free",
  "visibleCount": 2,
  "total": 416,
  "cursor": "...",
  "items": [
    {
      "job": { "id": "...", "title": "Senior ESG Analyst", "company": "Deloitte", "location": "London", "postedAt": "2026-04-10" },
      "score": 87,
      "factors": {
        "skillsMatched": ["Scope 3", "TCFD"],
        "skillsMissing": ["CBAM"],
        "regionMatch": true,
        "levelMatch": true,
        "domainMatch": "climate_risk"
      },
      "locked": false
    },
    {
      "job": { "id": "...", "title": "...", "company": "...", "location": "...", "postedAt": "..." },
      "score": null,
      "factors": null,
      "locked": true,
      "reason": "upgrade_required"
    }
  ]
}
```

## 10. Storage and Blobs

- Resume files: Cloudflare R2, one bucket per data residency (`greentryst-resumes-eu`, `greentryst-resumes-us`). Signed URLs only.
- Profiles, skills, scores, subscriptions: Turso primary DB.
- Optional: `pgvector` or Turso vector extension if skill embeddings are introduced.
- Backups: daily snapshot, 30-day retention.

## 11. Privacy and Compliance

Matches the commitments on the `/redesign/fair-use` and service agreements.

- Data residency: user picks EU or US at sign-up, enforced at R2 bucket + DB region.
- Retention: resume 365 days after last activity. Parsed profile and derived skills indefinite, user-deletable.
- Right to deletion: `DELETE /api/me` removes all user rows (cascade) and R2 objects.
- Audit log: every read of another user's data by an admin or analyst is logged to `admin_audit_log` (for Enterprise engagements).
- NDAs signed with every services engagement are separate; this backend does not need to track them, but the Enterprise tier needs role-scoped access so analysts only see their assigned client workspaces.

## 12. Observability

Minimum dashboards on day one:

- Resume parse success rate, latency, and failure reasons
- Jobs ingested per hour, by source
- Match recomputation queue depth, latency, error rate
- Score distribution histogram, by tier
- Conversion: free users who upload resume, then upgrade within 7 / 30 / 90 days
- Top "skills missing" across users, to inform course roadmap

Instrumentation: OpenTelemetry traces on every API route, logs to Axiom or Logtail, metrics to Grafana or Vercel Analytics.

## 13. Cost Awareness

Biggest line items, in order:

1. Resume parsing. Batch all parses through one provider or one LLM, cache aggressively. Cost scales with signups.
2. Nightly full rescore. For 10k users × 500 jobs that is 5M score rows. Use incremental recompute, not full sweep, once the user base is meaningful.
3. R2 storage. Effectively free at current scale, but retention rules keep it that way.
4. Vector store queries if added. Use approximate nearest neighbour with sensible `efSearch` values.

## 14. Minimum Viable Backend

Ship these five to make the Matched for you tab real:

1. **Turso tables**: `user_profile`, `user_skills`, `match_scores`, `user_subscriptions`. `jobs` can wait one release if the xlsx stays readable at request time.
2. **R2 upload + one LLM parse call** per resume. Cache results. No managed parser in v1.
3. **Simple scorer**: the weighted sum in section 6.1, written as a single pure function with unit tests.
4. **Nightly cron + event hooks**: trigger recomputes on resume upload and lesson completion. Skip the new-job broadcast recompute for v1 since the xlsx does not change often.
5. **Stripe + one webhook**: map events to `user_subscriptions.tier`. Entitlements read this column directly.
6. **Three API routes**: `POST /api/resume`, `GET/PATCH /api/me/profile`, `GET /api/me/matches`.

Everything else — embeddings, partner ATS ingest, skill-gap tutoring, admin audit logs — is a second pass.

## 15. What This Unlocks on the Frontend

When the above is live, the Matched for you tab becomes:

- Real match scores, sorted descending, paginated via cursor
- Skill-gap payload surfaces inline course recommendations per job (`factors.skillsMissing` intersected with the course catalogue)
- Upgrade CTA hits the real Stripe checkout, and the tier flips instantly on the page once the webhook lands
- Dashboard profile edits reflect on the jobs page within seconds (the queue handles it)
- Course completions rewrite match scores silently overnight; the user sees the updated ranking on next visit

The UI already assumes all of this. The backend is the missing half.

## 16. Open Questions

- Do we build the resume parser in-house or buy? Recommendation: buy for v1, revisit at 5k paying users.
- Do skills get a confidence-weighted scorer or a binary presence one? Recommendation: binary in v1, weighted later.
- How do we handle jobs that are ambiguous about required level? Recommendation: default `requiredLevel = null` and give those a neutral zero in `levelMatch`.
- Should the Free tier see real scores for only 2 jobs, or placeholder scores for all and real only for top 2? Current frontend picks the first. Confirm with product before server-side implementation.
