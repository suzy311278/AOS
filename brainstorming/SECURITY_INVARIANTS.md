# Security Invariants

Baseline security rules for Greentryst. Every new endpoint, feature, or schema change must hold these. If an invariant must be broken, the PR description has to state *why* and what compensating control replaces it.

Last updated: 2026-04-20.

## Uploads

1. **No unscanned file is ever retrievable.** Upload state machine is `uploading → scanning → parsing → ready`. Retrieval endpoints only serve `ready`. `infected` and `error` are terminal; `scanning` and `parsing` return 409 to callers.
2. **No user-uploaded file is ever served inline.** `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, and `Content-Security-Policy: default-src 'none'; sandbox` on every response that returns user-uploaded bytes.
3. **Scanning is fail-closed.** If the scanner is unreachable or its env vars are missing, the row goes to `error`, not `ready`. We never promote unscanned bytes.
4. **Infected files are quarantined, not silently dropped.** Row is kept with `status='infected'` for audit; the R2 object is deleted.
5. **Size caps enforced at the boundary.** Pre-check via `Content-Length` before buffering, hard reject at the size limit. Applies to every multipart handler.
6. **Parsing happens in a background worker**, never in the request handler. PDF/DOCX parsers are arbitrary-code surfaces; we do not expose them to the edge.

## Authentication and Authorization

1. **Clerk auth is mandatory** on every endpoint that reads or writes user data. The route handler calls `auth()`; there are no hardcoded user ids in production code paths.
2. **Dev-only auth bypasses are gated on `NODE_ENV !== 'production'`.** Vercel preview runs as production, so bypasses never leak to preview or prod.
3. **Compound-key authorization on updates.** Every PATCH/DELETE guards on `(primaryKey, userId)` so one user cannot mutate another's data.
4. **Internal service-to-service endpoints use bearer tokens**, compared with `timingSafeEqual` on buffers of equal length. No shared secrets in URLs.

## Rate Limiting

1. **Public endpoints use durable rate limits**, not in-memory. Upstash Redis when configured (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`), in-memory fallback only for local dev.
2. **Authenticated LLM endpoints have both a per-minute burst cap and a monthly cap.** Shared limiter buckets across related endpoints so switching route cannot bypass the gate.
3. **Rate-limit identifiers use the last-hop X-Forwarded-For** on Vercel. This assumption breaks if Cloudflare is placed in front; revisit `src/lib/rate-limit.ts` before that topology change.
4. **Fail open to in-memory on Upstash outages.** Better to preserve availability with weaker enforcement than to lock the endpoint out during a vendor blip.

## Data Handling

1. **User PII and LLM logs are stored with an audit reason, not "just in case".** If we cannot articulate why a field is retained, it is not stored.
2. **Untrusted content is never passed to an LLM as instructions.** Resume text, user queries, and form submissions are wrapped in delimited tags with explicit system-prompt rules; prompt injection attempts in the wrapped content are ignored by instruction, not sanitization alone.
3. **Error messages stored in the database must not echo raw LLM output or raw file contents.** Terse failure codes only; PII stays off the wire and out of logs.
4. **Secrets are never committed.** Hardcoded emails and API tokens in source are treated as bugs. Env vars live in `.env.local` (gitignored) and the Vercel dashboard.

## When these rules change

1. New invariants are appended here in a PR, not slipped in.
2. Relaxations require an explicit compensating control in the same PR.
3. Every security-adjacent PR description cross-references the invariants it touches, so reviewers can verify coverage.
