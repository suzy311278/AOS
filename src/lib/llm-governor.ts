/**
 * LLM Governor
 *
 * Single gateway for every large-language-model call in the product.
 * Every feature that wants to talk to an LLM talks to the Governor
 * first, and the Governor decides whether the call goes through.
 *
 * Responsibilities, in order of importance:
 *   1. Enforce per-user, per-tier usage caps server-side.
 *   2. Route the call to the right model for the feature.
 *   3. Serve a cached result where possible (exact-match today, swap
 *      in embedding-based semantic match later).
 *   4. Rotate across a pool of provider API keys with per-key daily
 *      token limits and a cooldown on rate-limit errors.
 *   5. Record usage so we can see cost per feature, tier, and user.
 *
 * Design principles (see `brainstorming/TECH_STRATEGY.md` Section 10):
 *   - Feature code MUST NOT call the provider directly. Always go
 *     through `governor.generate()` or `governor.generateStream()`.
 *   - Adding a new feature means adding a line to MODEL_ROUTING and
 *     a row to CAPS. Nothing else.
 *   - Caps are persisted in Turso (`llm_usage` table). The in-memory
 *     Map was reset on every Vercel cold start and not shared across
 *     instances, so free-tier caps were effectively unenforceable.
 *     The cache remains in-memory; it's a performance optimization,
 *     not a security boundary.
 */

import { sql } from 'drizzle-orm';

import { db } from './db';
import { llmUsage } from './schema';

/* ========================================================================
   Types (public)
   ======================================================================== */

export type Tier = 'free' | 'individual' | 'pro' | 'team' | 'enterprise';

/** Feature identifier. Add a new one by updating MODEL_ROUTING + CAPS. */
export type Feature = 'sustainiq' | 'resumeUpload';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GeneratePayload {
  feature: Feature;
  tier: Tier;
  /** Stable identifier for the caller. Use the Clerk userId when
   *  signed in; use a stable anonymous id (hashed IP, session id)
   *  when not. Caps are scoped to this subject. */
  subject: string;
  messages: ChatMessage[];
  /** Optional override for deterministic cache keying. If the same
   *  cacheKey is presented twice within CACHE_TTL_MS, the cached
   *  response is returned without a provider call. */
  cacheKey?: string;
  temperature?: number;
  maxTokens?: number;
  /** When true, bypass the cache on both read and write paths. */
  noCache?: boolean;
  /** When true, skip the per-subject cap check AND skip the increment
   *  on success. Use ONLY in internal service-to-service calls where
   *  the caller has already reserved a slot upstream (e.g. the
   *  /api/resume/process worker, which runs behind a shared-secret
   *  token after /api/resume/upload already called checkAndReserveCap).
   *  Usage reporting still happens; only the user-facing cap is
   *  bypassed. */
  bypassCap?: boolean;
}

export interface CapState {
  used: number;
  limit: number;
  period: 'daily' | 'monthly';
  resetsAt: number;
}

export interface AllowedTextResult {
  status: 'allowed';
  text: string;
  metadata: {
    model: string;
    cached: boolean;
    cap: CapState;
    promptTokens?: number;
    completionTokens?: number;
  };
}

export interface AllowedStreamResult {
  status: 'allowed';
  stream: ReadableStream<Uint8Array>;
  metadata: {
    model: string;
    cached: false;
    cap: CapState;
  };
}

export interface DeniedResult {
  status: 'denied';
  reason:
    | 'cap_reached'
    | 'no_provider_keys'
    | 'provider_error'
    | 'invalid_input';
  message: string;
  cap?: CapState;
}

export type GenerateTextResult = AllowedTextResult | DeniedResult;
export type GenerateStreamResult = AllowedStreamResult | DeniedResult;

/* ========================================================================
   Config (edit here to add a feature or change a cap)
   ======================================================================== */

const PROVIDER_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

/** Per-key infrastructure limits (mirrors what the existing Groq key
 *  rotator enforces). Adjust only when the provider changes policy. */
const PER_KEY_DAILY_TOKEN_LIMIT = 70_000;
const PER_KEY_COOLDOWN_MS = 65_000; // 65 seconds on rate limit

/** Model to use per feature. Groq OpenAI-compatible endpoint. */
const MODEL_ROUTING: Record<Feature, string> = {
  sustainiq: 'llama-3.3-70b-versatile',
  // Resume profile extraction is a single structured-output call per upload.
  // 70B is overkill but cheap on Groq and gives more reliable JSON than 8B.
  resumeUpload: 'llama-3.3-70b-versatile',
};

/** Caps per feature per tier. `Infinity` is fair-use unlimited. */
const CAPS: Record<
  Feature,
  Record<Tier, { period: 'daily' | 'monthly'; limit: number }>
> = {
  sustainiq: {
    free: { period: 'monthly', limit: 25 },
    individual: { period: 'daily', limit: 5 },
    pro: { period: 'daily', limit: 25 },
    team: { period: 'daily', limit: Number.POSITIVE_INFINITY },
    enterprise: { period: 'daily', limit: Number.POSITIVE_INFINITY },
  },
  // resumeUpload caps the "upload a new resume" user action. The cap
  // is reserved ONCE at /api/resume/upload via checkAndReserveCap. The
  // background /api/resume/process worker passes bypassCap:true so it
  // does not re-charge a second slot for the same upload.
  //
  // /api/resume/matches is intentionally not capped here — scoring is
  // pure CPU work against pre-computed embeddings and costs nothing.
  resumeUpload: {
    free: { period: 'monthly', limit: 20 },
    individual: { period: 'monthly', limit: 50 },
    pro: { period: 'monthly', limit: 200 },
    team: { period: 'monthly', limit: Number.POSITIVE_INFINITY },
    enterprise: { period: 'monthly', limit: Number.POSITIVE_INFINITY },
  },
};

/** Exact-match cache TTL. */
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_MAX_ENTRIES = 2_000;

/* ========================================================================
   Internal: provider key pool
   ======================================================================== */

interface KeyUsage {
  tokens: number;
  date: string; // YYYY-MM-DD UTC
  cooldownUntil: number; // ms timestamp; 0 if not cooling down
}

const keyUsage = new Map<string, KeyUsage>();

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function getKeys(): string[] {
  const raw =
    process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

function getKeyUsage(key: string): KeyUsage {
  const today = getTodayUTC();
  const usage = keyUsage.get(key);
  if (!usage || usage.date !== today) {
    const fresh: KeyUsage = {
      tokens: 0,
      date: today,
      cooldownUntil: 0,
    };
    keyUsage.set(key, fresh);
    return fresh;
  }
  return usage;
}

function pickAvailableKey(): string | null {
  const keys = getKeys();
  if (keys.length === 0) return null;

  const now = Date.now();
  for (const key of keys) {
    const u = getKeyUsage(key);
    if (u.tokens < PER_KEY_DAILY_TOKEN_LIMIT && u.cooldownUntil < now) {
      return key;
    }
  }
  return null;
}

function recordKeyTokens(key: string, tokensUsed: number): void {
  const u = getKeyUsage(key);
  u.tokens += tokensUsed;
  keyUsage.set(key, u);
}

function markKeyCooldown(key: string): void {
  const u = getKeyUsage(key);
  u.cooldownUntil = Date.now() + PER_KEY_COOLDOWN_MS;
  keyUsage.set(key, u);
}

/* ========================================================================
   Internal: per-subject usage caps (Turso-backed, atomic)
   ======================================================================== */

function periodKey(period: 'daily' | 'monthly', d: Date = new Date()): string {
  const iso = d.toISOString();
  return period === 'daily' ? iso.slice(0, 10) : iso.slice(0, 7);
}

function periodResetsAt(period: 'daily' | 'monthly'): number {
  const now = new Date();
  if (period === 'daily') {
    const next = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1
      )
    );
    return next.getTime();
  }
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );
  return next.getTime();
}

/** Read the current usage for (feature, subject, period) from Turso.
 *  Unlimited tiers skip the round-trip and report used=0. */
async function readCapState(
  feature: Feature,
  subject: string,
  tier: Tier
): Promise<CapState> {
  const cfg = CAPS[feature][tier];
  const period = cfg.period;
  const resetsAt = periodResetsAt(period);
  if (!Number.isFinite(cfg.limit)) {
    return { used: 0, limit: cfg.limit, period, resetsAt };
  }
  const pkey = periodKey(period);
  const rows = (await db.all(sql`
    SELECT used FROM llm_usage
    WHERE feature = ${feature}
      AND subject = ${subject}
      AND period_key = ${pkey}
  `)) as Array<{ used: number }>;
  return {
    used: rows[0]?.used ?? 0,
    limit: cfg.limit,
    period,
    resetsAt,
  };
}

/** Atomic "reserve a slot" — either inserts a fresh row at used=1, or
 *  increments an existing row BY 1 iff it's still under the limit.
 *  Returns the new `used` value on success, or null if the cap is full.
 *
 *  Safe against parallel instances and cold-start races: the whole
 *  check-then-increment happens in one SQL statement. */
async function reserveSlot(
  feature: Feature,
  subject: string,
  tier: Tier
): Promise<{ used: number } | null> {
  const cfg = CAPS[feature][tier];
  if (!Number.isFinite(cfg.limit)) {
    // Unlimited tier: no persistence needed.
    return { used: 0 };
  }
  const pkey = periodKey(cfg.period);
  const now = new Date();
  const rows = await db
    .insert(llmUsage)
    .values({
      feature,
      subject,
      periodKey: pkey,
      used: 1,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [llmUsage.feature, llmUsage.subject, llmUsage.periodKey],
      set: {
        used: sql`${llmUsage.used} + 1`,
        updatedAt: now,
      },
      where: sql`${llmUsage.used} < ${cfg.limit}`,
    })
    .returning({ used: llmUsage.used });
  if (rows.length === 0) return null;
  return { used: rows[0].used };
}

/* ========================================================================
   Internal: exact-match cache (FIFO-bounded)
   ======================================================================== */

interface CacheEntry {
  text: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  storedAt: number;
}

const cache = new Map<string, CacheEntry>();

async function computeCacheKey(
  feature: Feature,
  payload: GeneratePayload
): Promise<string> {
  if (payload.cacheKey) {
    return `${feature}|${payload.cacheKey}`;
  }
  const messages = payload.messages
    .map((m) => `${m.role}:${m.content}`)
    .join('\n---\n');
  const temp = payload.temperature ?? 0;
  const max = payload.maxTokens ?? 0;
  const raw = `${feature}|${MODEL_ROUTING[feature]}|T=${temp}|M=${max}|${messages}`;
  // SHA-256 if Web Crypto is available; otherwise a djb2 fallback.
  try {
    if (typeof globalThis.crypto?.subtle?.digest === 'function') {
      const bytes = new TextEncoder().encode(raw);
      const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    /* fallthrough */
  }
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 33) ^ raw.charCodeAt(i);
  }
  return `djb2:${(hash >>> 0).toString(16)}`;
}

function cacheGet(key: string): CacheEntry | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.storedAt > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit;
}

function cachePut(key: string, entry: CacheEntry): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const first = cache.keys().next().value as string | undefined;
    if (first) cache.delete(first);
  }
  cache.set(key, entry);
}

/* ========================================================================
   Internal: provider call
   ======================================================================== */

async function callProvider(args: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream: boolean;
}): Promise<Response> {
  return fetch(PROVIDER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: args.model,
      messages: args.messages,
      stream: args.stream,
      temperature: args.temperature,
      max_tokens: args.maxTokens,
    }),
  });
}

/* ========================================================================
   Internal: usage record
   ======================================================================== */

function recordUsage(args: {
  feature: Feature;
  tier: Tier;
  subject: string;
  model: string;
  cached: boolean;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs: number;
}): void {
  // TODO: write to `sustainiq_queries` when that table ships (see
  // DATA_ARCHITECTURE_PLAN.md Section 2.7). For v1 we log to the
  // server console so the dev inspecting a slow bill has a trail.
  // eslint-disable-next-line no-console
  console.info('[llm-governor] usage', args);
}

/* ========================================================================
   Public: generate text (buffered)
   ======================================================================== */

export async function generate(
  payload: GeneratePayload
): Promise<GenerateTextResult> {
  const started = Date.now();

  // 1. Validate
  if (!MODEL_ROUTING[payload.feature]) {
    return {
      status: 'denied',
      reason: 'invalid_input',
      message: `Unknown feature: ${payload.feature}`,
    };
  }
  if (!CAPS[payload.feature][payload.tier]) {
    return {
      status: 'denied',
      reason: 'invalid_input',
      message: `No cap configured for ${payload.feature}/${payload.tier}`,
    };
  }
  if (!payload.subject) {
    return {
      status: 'denied',
      reason: 'invalid_input',
      message: 'Missing subject identifier',
    };
  }

  // 2. Cap check. Internal service-to-service calls pass bypassCap when
  // a slot was already reserved upstream (e.g. /api/resume/process running
  // behind the RESUME_PROCESS_TOKEN bearer, after /api/resume/upload
  // already called checkAndReserveCap). In that case we skip the gate
  // entirely so one upload = one cap slot, not two.
  const capStateBefore = await readCapState(
    payload.feature,
    payload.subject,
    payload.tier
  );
  if (!payload.bypassCap && capStateBefore.used >= capStateBefore.limit) {
    return {
      status: 'denied',
      reason: 'cap_reached',
      message: `You have used ${capStateBefore.used} of ${capStateBefore.limit} ${capStateBefore.period} ${payload.feature} calls. Resets at ${new Date(capStateBefore.resetsAt).toISOString()}.`,
      cap: capStateBefore,
    };
  }

  // 3. Cache
  const cacheEnabled = !payload.noCache;
  const cacheKey = cacheEnabled
    ? await computeCacheKey(payload.feature, payload)
    : null;
  if (cacheKey) {
    const hit = cacheGet(cacheKey);
    if (hit) {
      // Cached responses do NOT increment the user cap — matches the
      // "you only get charged when we actually run the model" promise.
      recordUsage({
        feature: payload.feature,
        tier: payload.tier,
        subject: payload.subject,
        model: hit.model,
        cached: true,
        promptTokens: hit.promptTokens,
        completionTokens: hit.completionTokens,
        latencyMs: Date.now() - started,
      });
      return {
        status: 'allowed',
        text: hit.text,
        metadata: {
          model: hit.model,
          cached: true,
          cap: capStateBefore,
          promptTokens: hit.promptTokens,
          completionTokens: hit.completionTokens,
        },
      };
    }
  }

  // 4. Pick a key
  const apiKey = pickAvailableKey();
  if (!apiKey) {
    return {
      status: 'denied',
      reason: 'no_provider_keys',
      message:
        'No provider keys available right now. Either all keys hit their daily limit or are on cooldown.',
    };
  }

  // 5. Call provider
  const model = MODEL_ROUTING[payload.feature];
  let response: Response;
  try {
    response = await callProvider({
      apiKey,
      model,
      messages: payload.messages,
      temperature: payload.temperature,
      maxTokens: payload.maxTokens,
      stream: false,
    });
  } catch (err) {
    return {
      status: 'denied',
      reason: 'provider_error',
      message:
        err instanceof Error ? err.message : 'Provider call failed',
    };
  }

  if (response.status === 429) {
    markKeyCooldown(apiKey);
    return {
      status: 'denied',
      reason: 'provider_error',
      message:
        'Provider rate limit hit. Key is on cooldown; try again shortly.',
    };
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return {
      status: 'denied',
      reason: 'provider_error',
      message: `Provider error ${response.status}: ${body.slice(0, 200)}`,
    };
  }

  let json: {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  try {
    json = (await response.json()) as typeof json;
  } catch (err) {
    return {
      status: 'denied',
      reason: 'provider_error',
      message: 'Provider returned unparseable JSON',
    };
  }

  const text = json?.choices?.[0]?.message?.content ?? '';
  const promptTokens = json?.usage?.prompt_tokens;
  const completionTokens = json?.usage?.completion_tokens;
  const totalTokens = (promptTokens ?? 0) + (completionTokens ?? 0);

  // 6. Account for it
  if (totalTokens > 0) recordKeyTokens(apiKey, totalTokens);
  // Do not double-charge the cap when the caller has already reserved
  // a slot via checkAndReserveCap (see the bypassCap check above).
  if (!payload.bypassCap) {
    await reserveSlot(payload.feature, payload.subject, payload.tier);
  }
  if (cacheKey && text) {
    cachePut(cacheKey, {
      text,
      model,
      promptTokens,
      completionTokens,
      storedAt: Date.now(),
    });
  }

  const capStateAfter = await readCapState(
    payload.feature,
    payload.subject,
    payload.tier
  );

  recordUsage({
    feature: payload.feature,
    tier: payload.tier,
    subject: payload.subject,
    model,
    cached: false,
    promptTokens,
    completionTokens,
    latencyMs: Date.now() - started,
  });

  return {
    status: 'allowed',
    text,
    metadata: {
      model,
      cached: false,
      cap: capStateAfter,
      promptTokens,
      completionTokens,
    },
  };
}

/* ========================================================================
   Public: generate stream (SSE)
   ======================================================================== */

export async function generateStream(
  payload: GeneratePayload
): Promise<GenerateStreamResult> {
  // Validate
  if (!MODEL_ROUTING[payload.feature]) {
    return {
      status: 'denied',
      reason: 'invalid_input',
      message: `Unknown feature: ${payload.feature}`,
    };
  }
  if (!CAPS[payload.feature][payload.tier]) {
    return {
      status: 'denied',
      reason: 'invalid_input',
      message: `No cap configured for ${payload.feature}/${payload.tier}`,
    };
  }
  if (!payload.subject) {
    return {
      status: 'denied',
      reason: 'invalid_input',
      message: 'Missing subject identifier',
    };
  }

  const capStateBefore = await readCapState(
    payload.feature,
    payload.subject,
    payload.tier
  );
  if (capStateBefore.used >= capStateBefore.limit) {
    return {
      status: 'denied',
      reason: 'cap_reached',
      message: `You have used ${capStateBefore.used} of ${capStateBefore.limit} ${capStateBefore.period} ${payload.feature} calls. Resets at ${new Date(capStateBefore.resetsAt).toISOString()}.`,
      cap: capStateBefore,
    };
  }

  const apiKey = pickAvailableKey();
  if (!apiKey) {
    return {
      status: 'denied',
      reason: 'no_provider_keys',
      message: 'No provider keys available right now.',
    };
  }

  const model = MODEL_ROUTING[payload.feature];
  let response: Response;
  try {
    response = await callProvider({
      apiKey,
      model,
      messages: payload.messages,
      temperature: payload.temperature,
      maxTokens: payload.maxTokens,
      stream: true,
    });
  } catch (err) {
    return {
      status: 'denied',
      reason: 'provider_error',
      message:
        err instanceof Error ? err.message : 'Provider call failed',
    };
  }

  if (response.status === 429) {
    markKeyCooldown(apiKey);
    return {
      status: 'denied',
      reason: 'provider_error',
      message: 'Provider rate limit hit. Key is on cooldown.',
    };
  }
  if (!response.ok || !response.body) {
    const body = !response.ok ? await response.text().catch(() => '') : '';
    return {
      status: 'denied',
      reason: 'provider_error',
      message: `Provider error ${response.status}: ${body.slice(0, 200)}`,
    };
  }

  // Increment cap now — streams cannot be cached, and we charge the
  // call the moment the provider accepts it.
  await reserveSlot(payload.feature, payload.subject, payload.tier);

  recordUsage({
    feature: payload.feature,
    tier: payload.tier,
    subject: payload.subject,
    model,
    cached: false,
    latencyMs: 0,
  });

  const capStateAfter = await readCapState(
    payload.feature,
    payload.subject,
    payload.tier
  );

  return {
    status: 'allowed',
    stream: response.body,
    metadata: {
      model,
      cached: false,
      cap: capStateAfter,
    },
  };
}

/* ========================================================================
   Public: introspection
   ======================================================================== */

/** Return the current cap state for a subject without making a call. */
export async function capStateFor(
  feature: Feature,
  subject: string,
  tier: Tier
): Promise<CapState> {
  return readCapState(feature, subject, tier);
}

/** Check the cap and, if still under, reserve one slot atomically.
 *
 * Intended for features whose LLM work happens *outside* the Governor
 * (e.g. SustainIQ's streaming pipeline runs on a separate ASK server).
 * The Vercel-side proxy calls this before forwarding the request, so
 * the freemium contract is enforced without moving the pipeline itself.
 *
 * The reservation is a single atomic SQL statement against Turso:
 * two parallel requests at the boundary can't both "see used < limit"
 * and both succeed — exactly one will win. Cold-start Vercel instances
 * no longer reset the counter.
 *
 * - Returns `{ allowed: true, cap }` and increments usage on success.
 * - Returns `{ allowed: false, cap }` without mutation when capped.
 */
export async function checkAndReserveCap(
  feature: Feature,
  subject: string,
  tier: Tier
): Promise<{ allowed: boolean; cap: CapState }> {
  if (!CAPS[feature][tier]) {
    throw new Error(`Unknown tier "${tier}" for feature "${feature}"`);
  }
  const reserved = await reserveSlot(feature, subject, tier);
  const cap = await readCapState(feature, subject, tier);
  return { allowed: reserved !== null, cap };
}

/** Debug snapshot of the provider key pool. Masked for safety. */
export function keyPoolSnapshot() {
  const keys = getKeys();
  const now = Date.now();
  return keys.map((key) => {
    const u = getKeyUsage(key);
    const masked = `${key.slice(0, 8)}...${key.slice(-4)}`;
    return {
      key: masked,
      tokensToday: u.tokens,
      tokensRemaining: PER_KEY_DAILY_TOKEN_LIMIT - u.tokens,
      coolingDown: u.cooldownUntil > now,
      date: u.date,
    };
  });
}

/** Debug snapshot of the cache (sizes + oldest/newest timestamps). */
export function cacheSnapshot() {
  return {
    entries: cache.size,
    maxEntries: CACHE_MAX_ENTRIES,
    ttlMs: CACHE_TTL_MS,
  };
}
