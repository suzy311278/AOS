# Greentryst: Scaling Architecture and Cost Model

**Date:** April 2026 (v2, revised with Codex review corrections)
**Context:** Architecture plan for scaling from 10-15 users to 1,000 users as a solo founder, with a focus on keeping LLM inference costs sustainable given $8-25/month pricing.

## 1. Current Stack

```
Next.js 14 (App Router, hybrid SSG + serverless)
Vercel (hosting, serverless functions, Mumbai bom1 region)
Turso/libSQL (database, Chennai maa region)
Clerk v6 (auth, Google + Email/Password)
Cloudflare R2 (audio files, bucket: greentryst-audios)
Groq (LLM inference for SustainIQ, free tier with multi-key rotation)
Cloudflare Workers AI (embeddings, bge-base-en-v1.5)
In-memory vector search (embeddings loaded from JSON on disk)
In-memory BM25 keyword search (technical_index fields)
```

## 2. Revenue Projections by Scale

| Users | Mix (Learn/Career/Pro) | Monthly Revenue |
|-------|----------------------|-----------------|
| 15 | 8 / 5 / 2 | $192 |
| 150 | 80 / 50 / 20 | $1,840 |
| 500 | 250 / 175 / 75 | $6,325 |
| 1,000 | 500 / 350 / 150 | $12,650 |

## 3. SustainIQ Query Volume Projections

### Tier Limits
- Learn ($8/mo): 10 queries/month
- Career ($14/mo): 6 queries/day (~180/month)
- Pro ($25/mo): 20 queries/day (~600/month)

### Theoretical Maximum Queries

| Users | Learn | Career | Pro | Total/month |
|-------|-------|--------|-----|-------------|
| 15 | 80 | 900 | 1,200 | ~2,200 |
| 150 | 800 | 9,000 | 12,000 | ~22,000 |
| 500 | 2,500 | 31,500 | 45,000 | ~79,000 |
| 1,000 | 5,000 | 63,000 | 90,000 | ~158,000 |

### Realistic Queries (30-40% utilization)

| Users | Realistic queries/month |
|-------|------------------------|
| 15 | ~800 |
| 150 | ~8,000 |
| 500 | ~28,000 |
| 1,000 | ~55,000 |

## 4. LLM Inference Cost Comparison

Cost per SustainIQ query (avg ~2K input tokens, ~500 output tokens):

| Model | Cost/query | 55K queries/month |
|-------|-----------|-------------------|
| GPT-4o | ~$0.01 | ~$550/mo |
| Claude Sonnet 4 | ~$0.014 | ~$770/mo |
| Groq Llama 3.3 70B | ~$0.0016 | ~$88/mo |
| Groq Llama 4 Scout | ~$0.0004 | ~$22/mo |
| Gemini 2.0 Flash | ~$0.0004 | ~$22/mo |
| DeepSeek V3 | ~$0.0004 | ~$22/mo |

**Conclusion:** Using a single premium model for all queries is viable but wasteful. Tiered routing is the correct approach.

## 5. Inference Strategy: Tiered Model Routing

Not every query needs the same model. 70-80% of queries are simple lookups or moderate synthesis where the retrieval (vector + keyword) already found the right content. The LLM just formats and presents it with citations.

### Routing Logic

```
User Query
    |
    v
Query Router (classify complexity, near-zero cost)
    |
    |-- Simple factual lookup ---------> Groq Llama 3.3 70B ($0.002/query)
    |   "What is the GWP of N2O?"        Fast, cheap, good enough
    |
    |-- Moderate synthesis -------------> Gemini 2.0 Flash ($0.0004/query)
    |   "Explain PCAF asset classes"      Very cheap, good quality
    |
    |-- Complex reasoning --------------> GPT-4o or Claude Sonnet ($0.01/query)
         "Compare CSRD and ISSB            Best quality, use sparingly
          requirements for pharma
          company in India and EU"
```

### Classification Logic

```ts
type ModelTier = 'fast' | 'standard' | 'premium';

function classifyQuery(query: string, contextLength: number): ModelTier {
  // Short queries with short context = fast model
  if (query.length < 100 && contextLength < 2000) return 'fast';

  // Queries asking for comparison, analysis, or multi-step reasoning
  const complexPatterns = /compare|analyze|implications|how would|what if|design|strategy/i;
  if (complexPatterns.test(query) || contextLength > 6000) return 'premium';

  return 'standard';
}

const MODEL_CONFIG = {
  fast:     { provider: 'groq',   model: 'llama-3.3-70b-versatile' },
  standard: { provider: 'google', model: 'gemini-2.0-flash' },
  premium:  { provider: 'openai', model: 'gpt-4o' },
};
```

### Blended Cost

If 75% of queries go to fast/standard ($0.0004-0.002) and 25% go to premium ($0.01):
- Blended cost per query: ~$0.003
- At 55,000 queries/month: **~$165/month** (vs $550-770 with single premium model)

## 6. Response Caching

Many SustainIQ queries are similar or identical across users ("What is Scope 3?", "Explain double materiality", "CSRD timelines").

### Strategy: Exact-Key Cache (not semantic)

This is an exact-match cache, not a semantic/fuzzy cache. The key is a hash of the normalized query + the IDs of the retrieved context chunks. If the same question retrieves the same source material, return the cached response.

This works because:
- Many sustainability questions are asked verbatim by multiple users ("What is Scope 3?", "Explain double materiality")
- The retrieval step (vector + keyword search) already handles query variation. Two differently-worded questions that retrieve the same chunks will produce the same cache key.
- Exact-key lookup is fast and simple. Semantic caching (embedding similarity on cached queries) adds complexity without proportional benefit at this scale.

### Implementation
```ts
// Normalize query: lowercase, trim, collapse whitespace
const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
// Cache key = hash of normalized query + sorted retrieved chunk IDs
const contextKey = retrievedChunkIds.sort().join(',');
const cacheKey = sha256(normalizedQuery + '|' + contextKey);

const cached = await db.select().from(queryCache)
  .where(eq(queryCache.key, cacheKey))
  .where(gt(queryCache.createdAt, sevenDaysAgo));

if (cached.length > 0) {
  return cached[0].response; // Zero inference cost
}
```

### Storage Options
- **Turso table** (free, already in the stack, simplest): add a `query_cache` table with TTL column
- **Vercel KV** (Redis-based, $25/mo at scale): faster reads, built-in TTL expiration

### Expected Cache Hit Rate
- 15 users: 10-15% (too few users for overlap)
- 150 users: 25-35%
- 500+ users: 35-50%

At 50% cache hit rate, inference costs are effectively halved.

## 7. Architecture at Each Scale

### 10-15 Users: Change Almost Nothing

```
Hosting:     Vercel Hobby or Pro ($0-20/mo base, Pro has usage overages beyond included credit)
Database:    Turso Free (500 DBs, 9GB, 500M rows read/mo)
Auth:        Clerk Hobby Free (50,000 MRUs included per app)
LLM:         Groq Free (multi-key rotation) + Gemini Flash
Embeddings:  Cloudflare Workers AI (free tier: 10K neurons/day)
Storage:     R2 Free (10GB, 10M reads/mo)
Vectors:     In-memory from JSON files (current approach)
Cache:       Turso table (query_cache)

Total infra cost: $0-20/month
Revenue: ~$192/month
Margin: 90%+
```

**Actions:**
- Add Stripe + subscription gating (server-side enforcement)
- Add certificate generation (PDF + verifiable URL)
- Add basic query routing (Groq for simple, Gemini Flash for moderate)
- Add response cache table in Turso
- Ship new UI (homepage, nav, pricing page)
- Add query logging for usage analytics

**Do NOT:**
- Move off Vercel
- Add a dedicated vector database
- Self-host anything
- Prematurely optimize

### 150 Users: First Real Bottleneck

```
Hosting:     Vercel Pro ($20/mo base + usage overages)
Database:    Turso Developer ($4.99/mo, expanded storage and reads)
Auth:        Clerk Hobby Free (still well under 50K MRUs)
LLM:         Groq paid + Gemini Flash ($5-15/mo) + GPT-4o premium ($20-40/mo)
Embeddings:  Cloudflare Workers AI (may hit free limits)
Storage:     R2 Free
Vectors:     MIGRATE from in-memory to dedicated store

Total infra cost: $50-80/month
Revenue: ~$1,840/month
Margin: 95%+
```

**The bottleneck at 150 users: in-memory vector index.**

Current approach loads embedding JSON files from disk on each serverless cold start. At 80-90 PDFs, these files are 50-100MB+. Vercel serverless has 250MB memory limit (Pro). Cold starts with large files get slow.

**Fix options (choose one):**
1. **Turso native vector search**: libSQL already supports vector search natively. Keep everything in one database. Simplest option for a solo founder since there's no new service to manage.
2. **Cloudflare Vectorize**: Free tier has 5M stored vectors, 30M queried vectors/month. Integrates with existing Cloudflare Workers AI embeddings. Better if you need dedicated vector infrastructure separate from relational data.

**Recommendation:** Turso native vector search first (zero new services, already in the stack). Move to Cloudflare Vectorize only if Turso vector query latency becomes a bottleneck.

**Also at this scale:**
- Response caching becomes meaningful (25-35% hit rate)
- Add query routing (fast/standard/premium)
- Add usage analytics dashboard for monitoring costs
- Monitor Vercel function execution times and memory

### 500-1,000 Users: The Scaled Architecture

```
Hosting:     Vercel Pro ($20/mo base + usage overages, budget ~$30-50/mo)
Database:    Turso Scaler ($24.92/mo)
Auth:        Clerk Pro ($20/mo)
LLM:         Tiered routing (~$100-200/mo blended)
Embeddings:  Cloudflare Workers AI paid ($0.01/1K neurons)
Vectors:     Turso native vector search or Cloudflare Vectorize
Cache:       Vercel KV ($25/mo) or Turso cache table
Storage:     R2 ($0-5/mo)
Monitoring:  Vercel Analytics (included with Pro)
Stripe fees: ~$380/mo (2.9% + 30c)
Domain:      ~$15/mo
Email/Misc:  ~$10-20/mo (transactional email, error monitoring)

Total infra cost: $600-750/month
Revenue: $12,650/month
Margin: 94%
```

### Request Flow at Scale

```
User Query
    |
    v
Vercel Serverless Function (Node.js runtime, not Edge)
    |
    |-- Check exact-key cache (Turso or Vercel KV)
    |   Cache hit? --> Return cached response (0 cost, <100ms)
    |
    |-- Embed query (Cloudflare Workers AI, ~50ms)
    |
    |-- Vector search (Turso native vectors or Cloudflare Vectorize, ~30ms)
    |
    |-- Keyword search (Turso FTS5, ~20ms)
    |
    |-- Merge results (Reciprocal Rank Fusion, in-function)
    |
    |-- Route to LLM (fast/standard/premium)
    |   |-- Groq Llama 70B (simple, ~500ms)
    |   |-- Gemini Flash (moderate, ~800ms)
    |   |-- GPT-4o (complex, ~2s)
    |
    |-- Stream response to client (SSE)
    |
    |-- After stream completes: cache write + log write (same request, after response sent)
```

### Static vs Dynamic Workload Separation

```
Static (SSG, cached at CDN, zero serverless cost):
  /courses/[courseId]/[lessonId]   - All lesson pages
  /courses/[courseId]              - Course overview pages
  /glossary                       - Glossary
  /tools                          - Tool landing pages (public)
  /tools/emission-factors         - EF search landing (public)
  /jobs                           - Job board (public listings)
  /                               - Homepage
  /pricing                        - Pricing page
  /about                          - About page

Dynamic (serverless functions, per-request cost):
  /api/ask                        - SustainIQ queries
  /api/progress/*                 - Lesson completion, quiz answers
  /api/jobs/matches               - Resume matching
  /api/stripe/*                   - Subscription management
  /api/tools/*                    - Calculator, assessments
  /dashboard                      - User dashboard
  /app/*                          - Authenticated workspaces
```

At 1,000 users, 95% of page views are static (course content, job browsing). Only SustainIQ queries, progress updates, and tool usage hit serverless functions.

Next.js route groups enforce this separation:
```
src/app/
  (static)/       - No auth in layout, pure SSG
  (marketing)/    - Homepage, pricing (static or ISR)
  (dynamic)/      - Auth + subscription checks in layout
  api/            - All API routes
```

## 8. Resume Matching: One-Time Extraction, Not Per-Query Inference

Resume matching does NOT need real-time LLM inference for every job comparison.

### Flow
```
Resume Upload
    |
    v
LLM extracts structured profile (one-time, ~$0.02)
    |
    v
Store in user_profiles table:
  - skills: ["GHG accounting", "PCAF", "ESG reporting", ...]
  - experience_years: 4
  - domains: ["carbon markets", "financed emissions"]
  - seniority: "mid"
  - preferences: { location: "India", remote: true }
    |
    v
Job Matching (fast SQL query, no LLM):
  score = 0.4 * skill_overlap
        + 0.2 * domain_match
        + 0.2 * location_fit
        + 0.1 * seniority_fit
        + 0.1 * course_completion_bonus
```

**Cost:** $0.02 per resume upload (one-time), not per match query.
At 1,000 users: $20 total, once.

## 9. Cost Model Summary at 1,000 Users

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Vercel Pro | $30-50 | Hosting + serverless (base $20 + usage overages) |
| Turso Scaler | $24.92 | Database + vectors + cache |
| Clerk Pro | $20 | Auth (50K MRUs included on Hobby, Pro for features) |
| LLM inference (blended) | $100-200 | Tiered routing + caching |
| Cloudflare R2 | $0-5 | Audio/file storage |
| Cloudflare Workers AI | $5-10 | Embeddings |
| Vercel KV | $25 | Response cache (optional, only if Turso cache too slow) |
| Stripe fees | ~$380 | 2.9% + 30c on revenue |
| Domain + email | $15 | Greentryst.com |
| Email delivery | $0-10 | Transactional email (Resend free tier, then $20/mo) |
| Error monitoring | $0 | Vercel logs + Sentry free tier |
| **Total** | **$600-750** | |
| **Revenue** | **$12,650** | |
| **Profit** | **~$11,900-12,050** | |
| **Margin** | **94%** | |

## 10. Write Path: The Real Turso Bottleneck

Turso/libSQL has a single-primary write architecture. Every SustainIQ query can generate: one cache read, one log write, one cache write on miss, and usage-counter updates. At scale, synchronous writes on every request will spike latency before read capacity does.

### Mitigation
- **Batch writes:** Accumulate log entries in memory and flush in batches (every 10 entries or every 5 seconds, whichever comes first). Use `waitUntil()` on Vercel serverless functions to run the flush after the response is sent.
- **Async cache writes:** Write the cache entry after streaming the response to the client, not before. The next identical query within the few-second write delay just gets a cache miss and a fresh LLM call. Acceptable trade-off.
- **Usage counters:** Increment in-memory per-request, flush to Turso in batches. For tier enforcement, a few queries of slack is acceptable.
- **Log rotation:** Purge query logs older than 90 days. Don't let the logs table grow unbounded.

### Vercel `waitUntil()` Pattern
```ts
// In the API route, after streaming the response:
import { waitUntil } from '@vercel/functions';

// ... stream response to client ...

// After response is sent, run non-blocking writes
waitUntil(Promise.all([
  db.insert(queryCache).values({ key: cacheKey, response: fullResponse, createdAt: Date.now() }),
  db.insert(queryLogs).values({ userId, query: query.slice(0, 200), modelUsed, latencyMs, tokensIn, tokensOut, createdAt: Date.now() }),
]));
```

This ensures writes never block the user's response and are durable (Vercel guarantees `waitUntil` execution on serverless functions, unlike fire-and-forget on Edge).

## 11. Privacy and Abuse Controls

### Query Logging Privacy
Users may paste sensitive data (company emissions, compliance details, client names) into SustainIQ queries. Logging raw query text creates retention and privacy risk.

**Mitigations:**
- Truncate logged queries to 200 characters (already specified in schema)
- Add a privacy notice in the UI: "Your queries are used to improve results and are retained for 90 days"
- Provide a "Delete my data" flow (required for GDPR if you have EU users)
- Never log the full retrieved context or the full LLM response in the query_logs table
- Store full responses only in the cache table with automatic TTL expiration (7 days)

### Rate Limiting and Abuse
- Enforce tier query limits server-side (not just client-side counters)
- Add per-minute rate limits to prevent automated scraping (e.g., max 10 queries/minute regardless of tier)
- Monitor for anomalous usage patterns (e.g., a single user making 100+ identical queries)
- Block or flag accounts that consistently trigger abuse patterns

## 12. Observability: Instrument From Day One

Add logging for every SustainIQ query. Costs nothing to implement, provides the data for every future scaling decision.

```ts
// Schema addition
export const queryLogs = sqliteTable('query_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  query: text('query').notNull(),          // truncated to 200 chars, no PII
  modelUsed: text('model_used').notNull(), // fast/standard/premium
  modelId: text('model_id'),               // actual model identifier
  cachedHit: integer('cached_hit').default(0),
  latencyMs: integer('latency_ms'),
  tokensIn: integer('tokens_in'),
  tokensOut: integer('tokens_out'),
  createdAt: integer('created_at'),
});
```

### Key Metrics to Track
- **Queries per user per day**: tier enforcement + usage patterns
- **Model distribution**: % fast/standard/premium (target: 75/20/5)
- **Cache hit rate**: target 30-50% at 150+ users
- **P95 latency**: target <3s for all queries
- **Cost per query**: track blended cost, alert if trending up
- **Vercel function duration + memory**: predict when to scale

## 11. What to Do at Each Phase

### Phase 1 (now, 10-15 users)
- [ ] Add Stripe + subscriptions + server-side tier gating
- [ ] Add certificate generation
- [ ] Add query routing (Groq fast + Gemini standard)
- [ ] Add response cache table in Turso
- [ ] Add query logging table
- [ ] Ship new UI
- [ ] DO NOT change infrastructure

### Phase 2 triggers (hard thresholds):
- Embeddings JSON bundle exceeds 150MB on disk, OR
- Vercel function cold starts exceed 3s (p95), OR
- Function memory usage exceeds 200MB (check Vercel dashboard)

Actions:
- [ ] Migrate vector index from in-memory JSON to Turso native vector search
- [ ] Upgrade Turso to Developer ($4.99/mo)
- [ ] Add premium model tier (GPT-4o for complex queries)
- [ ] Review cache hit rates, tune cache TTL
- [ ] If cache-read p95 from Turso exceeds 50ms, evaluate Vercel KV

### Phase 3 triggers (hard thresholds):
- 500+ paying users, OR
- Monthly revenue exceeds $5K, OR
- Turso Developer plan row-read limits are hit (check Turso dashboard), OR
- Write contention causes query log p95 > 100ms

Actions:
- [ ] Upgrade Turso to Scaler ($24.92/mo)
- [ ] Add Vercel KV for response caching if Turso cache reads are slow
- [ ] Add cost monitoring dashboard (track $/query by model tier)
- [ ] Move query log writes to batched `waitUntil()` if not already done
- [ ] Evaluate whether to add more embedding models for better retrieval

### Phase 4 triggers (hard thresholds):
- 1,000+ paying users, OR
- LLM inference exceeds $300/mo, OR
- Global user base (>30% users outside India) with latency complaints

Actions:
- [ ] Evaluate dedicated inference (Groq Enterprise, or self-hosted on Modal/Replicate)
- [ ] Consider Turso read replicas (multi-region for global latency)
- [ ] Evaluate PWA for mobile engagement
- [ ] Consider Vercel Enterprise if function concurrency limits are hit

## 12. Key Architectural Principles

1. **Static by default, dynamic only when necessary.** Course pages are SSG. Tools and SustainIQ are serverless. Never let auth state contaminate static routes.

2. **Tiered inference, not uniform.** Route queries to the cheapest model that can answer them well. 75% of queries don't need GPT-4o.

3. **Cache aggressively.** Many sustainability questions are asked by many people. A 40% cache hit rate halves your inference costs.

4. **Extract once, query many times.** Resume skills are extracted once on upload. Emission factors are indexed once. Job skills are tagged once. Matching and search are fast database operations, not LLM calls.

5. **Instrument everything, optimize nothing prematurely.** Log query costs, latency, cache hits, and model usage from day one. Make scaling decisions from data, not guesses.

6. **Keep the stack simple.** Vercel + Turso + Cloudflare + Groq/Gemini. No Kubernetes, no self-hosted databases, no custom infrastructure. A solo founder's most expensive resource is time, not compute.

7. **Writes are the bottleneck, not reads.** Turso has a single-primary write architecture. Never block user responses on database writes. Use `waitUntil()` for cache writes, log writes, and usage counter updates.

8. **Respect user privacy.** Truncate logged queries, set retention limits, provide data deletion flows. Users will paste sensitive client data into SustainIQ. Plan for it from day one.
