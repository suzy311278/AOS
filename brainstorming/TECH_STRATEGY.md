# Greentryst Technology Strategy

Status: LOCKED on 2026-04-13
Horizon: 24 months (target scale: up to 4,000 paying users, 10,000 active users)
Scope: How we build, what we build, what we buy, what we defer.

This is the doc a CTO hands to engineer #1, to an enterprise security review, and to their own future self at 3am when a decision feels irreversible. It is opinionated. Assume every claim here is a decision, not a suggestion.

## 1. Mental Model

Every SaaS breaks into three layers. Think about them separately. Over-investing in one while starving another is how products fail.

1. **Product layer** — what the user sees. Next.js app, React components, pages, forms. Current focus. The question here is always: is the UI honest, fast, and accessible.
2. **Data layer** — what we remember. Database, file storage, caches. The question here is: is this the right shape, and can we migrate it later without losing sleep.
3. **Platform layer** — what runs it. Hosting, auth, payments, email, LLM providers, monitoring, CI/CD, backups, security. The question here is: are we borrowing mature systems or building immature ones.

Non-technical founders over-invest in layer 1 and under-invest in layer 3. Engineering hires over-invest in layer 3 and under-invest in layer 1. The job of a CTO is to spend evenly.

## 2. Principles

These guide every technical decision at our stage. Violating them costs money.

### 2.1 Boring stack, then earn complexity.

Every exotic tool adds a failure mode and a hiring constraint. Pick the obvious choice unless there's a reason not to. Next.js, Postgres-shaped SQL, Vercel, Clerk, Stripe, Cloudflare R2. All boring on purpose.

### 2.2 Own the data, rent everything else.

Our moat is the sourced-knowledge graph and the user's profile + history. Rent auth, payments, email, monitoring, LLM providers, blob storage. Own only the content, the data, and the model.

### 2.3 Reversible beats optimal.

Never make a one-way decision when a two-way one exists. Avoid vendor APIs we can't swap. Postgres-compatible SQL so we can leave Turso for Neon later. Stripe's standard API, not fancy features. Clerk's OIDC-compatible config.

### 2.4 Multi-tenant from day one.

Every user-owned table has a `userId` today. Most will grow a `teamId` when Team/Enterprise tiers ship. Adding tenancy after-the-fact is the most expensive refactor in SaaS. Design it in now.

### 2.5 Audit from day one.

If an enterprise buyer asks "who accessed our data," the answer cannot be "we'll add logs." Log every privileged read and every subscription change from the first commit. Cheap to do early, impossible to backfill.

### 2.6 Data residency is a product feature.

We sell to EU sustainability teams. Residency affects table design, bucket naming, and payment processing. Design it in, don't retrofit.

### 2.7 The LLM is a vendor.

Never write code that assumes a specific model. Abstract the provider at one narrow seam (`src/lib/llm.ts`), so swapping to Claude, Gemini, or self-hosted is a two-line change when prices or quality move.

## 3. Scale Calibration

Target, derived from founder projections:

- **End of 2026**: 500 total users
- **24 months**: up to 4,000 paying / 10,000 active users

This radically simplifies architecture decisions. Most "scaling" concerns evaporate. At 10,000 active users:

- Database: Turso handles 100× this easily. SQLite on a single VPS would work.
- Traffic: 300k-1M pageviews/month peak. Vercel Hobby + Pro covers it.
- File storage: 10k users × 500KB resumes = 5 GB. R2 costs under $1/month.
- Auth: Clerk Pro at 10k MAUs ≈ $1-2k/month. Predictable.
- **LLM spend**: 25 queries/day × 4k Pro users = 100k queries/day. End-to-end cost of $0.005-$0.02 per query = **$15-60k/month**. This is the dominant line item.

**The database isn't the problem at our scale. The LLM bill is.**

## 4. Stack, In Honest Detail

What we have, what to keep, what to replace when.

| Layer | Now | Keep until | Replace with |
|---|---|---|---|
| Frontend | Next.js 14 App Router, Tailwind | Mature, no reason to leave | React itself being replaced |
| Hosting | Vercel | ~$2k/mo bill | Fly.io, Render, self-hosted Next on AWS |
| Auth | Clerk (EU data residency) | Enterprise SSO gets painful | Auth0 Enterprise or self-hosted (only with security headcount) |
| DB | Turso (libSQL = SQLite at the edge) | Write throughput or complex joins hurt | Neon or Supabase (Postgres). Keep schema Postgres-compatible. |
| Blobs | Cloudflare R2 (planned) | Basically forever | S3 only if we need AWS-specific features |
| Payments | Stripe (when first buyer asks) | Forever. Don't second-guess. | N/A |
| Email | Resend (live, wired to feedback + enquiry) | Until transactional volume needs Postmark | Postmark for deliverability, AWS SES at scale |
| LLM | Provider-abstracted via `src/lib/llm.ts` (planned) | Never, that's the point | Whatever is best at the moment |
| Search / RAG | Voyage embeddings (already in scripts/) | SustainIQ quality plateaus | Pinecone / Turbopuffer / self-hosted |
| Jobs ingest | xlsx file | Traffic justifies automation | Partner ATS webhook, then scraper whitelist |
| Queue | None | Re-matching gets expensive | Inngest, QStash, or Upstash Redis |
| Analytics | Google Analytics (marketing) | Product analytics needed | PostHog for product, GA for marketing |
| Error tracking | Sentry (wired, EU region) | Never drop | N/A |
| Monitoring | None beyond Sentry | Once we're paid | Better Stack or Grafana Cloud |
| CI/CD | Vercel built-in | Probably forever | GitHub Actions for anything fancy |
| Backups | Turso daily (default) | Never drop | Add weekly export to R2 |

## 5. Boring-But-Critical Checklist

In rough order of what will bite us first. Every item here is cheap to do early and expensive to do late.

1. **Error tracking** — Sentry, live. Free tier covers us past launch. ✅ DONE
2. **Backups you've actually tested** — Turso backs up daily, but we've never restored. Do a restore drill into a scratch DB before the first paying customer.
3. **Environment parity** — real staging environment on a separate Vercel project with a separate Turso branch. Closes the "prod key in dev" failure mode we already hit once.
4. **Secrets rotation plan** — write the runbook for rotating Clerk, Turso, Stripe, R2, Sentry, Resend tokens without downtime. Store in `runbooks/`.
5. **On-call expectations** — who gets paged at 2am. Today that's the founder. Decide before first paying customer.
6. **Terms, privacy, DPA** — the homepage already claims EU residency. Have real v0 docs drafted before enterprise conversations.
7. **Accessibility floor** — WCAG AA contrast on every new surface. Procurement will audit it.
8. **Source-of-truth for content** — today MDX + YAML in git. Fine now. Plan for a CMS layer if you hire a non-technical editor.
9. **Billing calendar** — Stripe, Turso, Vercel, Clerk, R2, Resend, Sentry each bill monthly. One spreadsheet, one reminder at 80% of plan threshold.
10. **Support inbox** — `support@greentryst.com` forwarded to a shared inbox, triaged within 24 hours. Obvious, but half of pre-revenue startups skip it.

## 6. Decision Framework

When you're unsure, three questions:

1. **Is this our moat, or infrastructure?** Moat = build. Infrastructure = rent. Sustainability knowledge graph is moat. Email delivery is infrastructure.
2. **If we get this wrong, how long to recover?** < 1 day: decide in 10 minutes. > 1 week: get a second opinion. > 1 month: write a planning doc, sleep on it.
3. **Does this decision lock us in?** If yes, try harder to find the reversible version.

## 7. The Single Most Important Thing

At our scale, the technical risk isn't that the database can't handle it. The technical risk is that we burn runway on infrastructure for a user base we haven't acquired yet, and on LLM bills from features without caps.

**Build less. Cap more. Spend the saved time on the first enterprise deal.**

Every other principle in this document is a variation on that one sentence.

## 8. 30-Day Commitments

Concrete moves, in order, calibrated to the projected scale:

1. **Sentry dashboard verification** (10 min) — confirm events are landing
2. **LLM cost abstraction** (`src/lib/llm.ts`) — one file that routes every AI call through a single entry point with per-user daily caps, semantic caching, and model routing. Ship this *before* any real AI feature
3. **Real staging environment** — separate Vercel project, separate Turso DB branch. Closes the "prod key in dev" hole
4. **Cutover** — move `/redesign/*` → `/`, per the existing `REDESIGN_CUTOVER_PLAN.md`
5. **First enterprise conversation** — Climate Risk Assessment is the wedge. One closed enterprise deal = 40 individual subs at equal revenue, 1/10th the support load

Everything else — matching backend, SustainIQ production RAG, Tools productisation, Stripe wiring, SOC 2 — waits for signal. We do not build on speculation. We build in response to someone trying to pay us.

## 9. What We Are Not Building

Explicit deferrals, documented so they're not re-opened until there's signal:

- **Real Stripe wiring** — wait for first paying customer saying yes to a price
- **Matching backend** — wait for first free-tier user who uploads a resume
- **Real resume parser** — ships with matching backend
- **Tools / Regulations standalone pages** — wait for roadmap pull
- **Mobile polish beyond "does not break"** — enterprise buyers evaluate on desktop
- **SOC 2 Type II** — costs $20-40k + 6 months. Start only when an enterprise buyer names it as a blocker. Before that, a security FAQ is plenty
- **Product analytics (PostHog)** — GA covers marketing. Add PostHog when we have funnels worth analysing
- **Multi-region replication, sharding, read replicas** — premature for 10k users
- **Separate API service** — Next.js app is fine being product + API for the whole horizon

## 10. LLM Cost Discipline

Given that the LLM bill is the dominant cost at our scale, four rules apply to every AI feature:

1. **Route every call through `src/lib/llm.ts`.** No direct provider SDK calls from pages or API routes.
2. **Hard server-side caps per user per day.** Enforced in the abstraction layer, not the UI. Example: free tier = 5 SustainIQ queries per month, individual = 5 per day, pro = 25 per day.
3. **Semantic caching.** Same question asked by different users should reuse the same answer where possible. Cache keyed on embedding of the input.
4. **Model routing.** Expensive model only when the task needs it. Resume parsing: Haiku or Gemini Flash. SustainIQ synthesis: the best available. Never "GPT-5 everything."

If a feature can't respect these rules, it isn't ready to ship.

## 11. Hiring Strategy

Given the scale target, we do not need to hire before first paying customers. When we do:

- **Engineer #1**: full-stack product engineer comfortable with TypeScript + React + Next.js + SQL. The person who ships features, not the person who manages infrastructure. Infrastructure is intentionally simple so we don't need a specialist.
- **Engineer #2**: another product engineer, not an infrastructure engineer, unless we've crossed $2M ARR. Platform layer is Vercel + Clerk + Turso + Stripe + R2, all managed.
- **Sustainability analyst**: the person who delivers Services engagements and reviews SustainIQ output quality. Delivery quality at our stage is a hire-and-train problem, not an engineering problem.

Do not hire a DevOps, SRE, or dedicated platform engineer before $5M ARR.

## 12. Related Documents

- `REDESIGN_CUTOVER_PLAN.md` — how to ship the current redesign to production
- `JOBS_MATCHING_BACKEND_PLAN.md` — backend plan for the resume + matching feature
- `DATA_ARCHITECTURE_PLAN.md` — the ~20-table storage blueprint
- `BRAND_GUIDELINES.md` — identity, voice, typography, colour, motion
- `HOMEPAGE_LOCKED_SPEC.md`, `SERVICES_LOCKED_SPEC.md`, `PRICING_LOCKED_SPEC.md`, `JOBS_LOCKED_SPEC.md`, `COURSES_LOCKED_SPEC.md`, `FAIR_USE_LOCKED_SPEC.md` — surface-by-surface spec locks

## 13. Change Log

- 2026-04-13: First locked strategy document. Written once the redesign pass completed and the scale target was articulated (4k paying / 10k active over 24 months).
