/**
 * Rate limiting for public + authenticated endpoints.
 *
 * Two entry points:
 *   - rateLimit(...)         synchronous, in-memory, resets on cold start.
 *                            Kept for callers that haven't migrated.
 *   - rateLimitDurable(...)  async. Uses Upstash sliding-window when
 *                            UPSTASH_REDIS_REST_URL / _TOKEN are set;
 *                            falls back to the in-memory limiter otherwise.
 *                            Prefer this for anything user-facing.
 *
 * Buckets are namespaced by `key` so different endpoints don't share
 * counters.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

interface RateBucket {
  count: number;
  resetAt: number;
}

const BUCKETS = new Map<string, RateBucket>();

export function rateLimit(
  key: string,
  ip: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterMs?: number } {
  const bucketKey = `${key}|${ip}`;
  const now = Date.now();
  const existing = BUCKETS.get(bucketKey);
  if (!existing || existing.resetAt < now) {
    BUCKETS.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (existing.count >= limit) {
    return { ok: false, retryAfterMs: existing.resetAt - now };
  }
  existing.count += 1;
  return { ok: true };
}

let redisSingleton: Redis | null = null;
let redisChecked = false;
const limiterCache = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (redisChecked) return redisSingleton;
  redisChecked = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisSingleton = new Redis({ url, token });
  return redisSingleton;
}

function getLimiter(
  key: string,
  limit: number,
  windowMs: number,
): Ratelimit | null {
  const cacheKey = `${key}|${limit}|${windowMs}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;
  const redis = getRedis();
  if (!redis) return null;
  const seconds = Math.max(1, Math.ceil(windowMs / 1000));
  const lim = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${seconds} s`),
    prefix: `rl:${key}`,
    analytics: false,
  });
  limiterCache.set(cacheKey, lim);
  return lim;
}

/**
 * Durable rate limiter. Uses Upstash if configured, otherwise falls back
 * to the in-memory limiter (so dev + previews work without env vars).
 *
 * `identifier` should be the most specific stable id available: prefer
 * userId for authenticated endpoints, IP for public ones.
 */
export async function rateLimitDurable(
  key: string,
  identifier: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; retryAfterMs?: number }> {
  const lim = getLimiter(key, limit, windowMs);
  if (!lim) return rateLimit(key, identifier, limit, windowMs);
  try {
    const res = await lim.limit(identifier);
    if (res.success) return { ok: true };
    return { ok: false, retryAfterMs: Math.max(0, res.reset - Date.now()) };
  } catch (err) {
    // Network blip or Upstash outage: fail open to in-memory rather than
    // locking the endpoint out. In-memory still blocks the worst abuse.
    console.warn('[rate-limit] Upstash call failed, falling back', err);
    return rateLimit(key, identifier, limit, windowMs);
  }
}

export function ipFromRequest(req: Request): string {
  // Prefer the last hop in X-Forwarded-For. On Vercel the edge appends the
  // real client IP as the final hop, so last-hop is the safest choice against
  // spoofed leading values.
  //
  // WARNING: this assumption breaks if another proxy (e.g. Cloudflare) is
  // placed in front of Vercel — the last hop then becomes Vercel's internal
  // IP, not the client. Revisit this helper before fronting with Cloudflare
  // and switch to CF-Connecting-IP / True-Client-IP in that topology.
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1]!;
  }
  return req.headers.get('x-real-ip') ?? 'unknown';
}
