/**
 * Groq API Key Rotation Manager
 *
 * Rotates across multiple Groq API keys with:
 * - Per-key daily token limit (70K tokens/day)
 * - Per-key RPM cooldown tracking (marks key as cooling down on rate limit)
 * Keys are provided as a comma-separated string in GROQ_API_KEYS env var.
 */

const DAILY_TOKEN_LIMIT = 70_000;
const COOLDOWN_MS = 65_000; // 65 seconds cooldown on rate limit hit

interface KeyUsage {
  tokens: number;
  date: string; // YYYY-MM-DD UTC
  cooldownUntil: number; // timestamp ms, 0 if not cooling down
}

// In-memory usage tracking
const usageMap = new Map<string, KeyUsage>();

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function getKeys(): string[] {
  const raw = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
  return raw.split(",").map(k => k.trim()).filter(Boolean);
}

function getUsage(key: string): KeyUsage {
  const today = getTodayUTC();
  const usage = usageMap.get(key);
  if (!usage || usage.date !== today) {
    const fresh: KeyUsage = { tokens: 0, date: today, cooldownUntil: 0 };
    usageMap.set(key, fresh);
    return fresh;
  }
  return usage;
}

/**
 * Get the next available Groq API key.
 * Skips keys that are over daily token limit or in RPM cooldown.
 */
export function getAvailableKey(): string | null {
  const keys = getKeys();
  if (keys.length === 0) return null;

  const now = Date.now();
  for (const key of keys) {
    const usage = getUsage(key);
    if (usage.tokens < DAILY_TOKEN_LIMIT && usage.cooldownUntil < now) {
      return key;
    }
  }

  return null;
}

/**
 * Record token usage for a key after a successful API call.
 */
export function recordUsage(key: string, tokensUsed: number): void {
  const usage = getUsage(key);
  usage.tokens += tokensUsed;
  usageMap.set(key, usage);
}

/**
 * Mark a key as rate-limited. It will be skipped for COOLDOWN_MS.
 */
export function markRateLimited(key: string): void {
  const usage = getUsage(key);
  usage.cooldownUntil = Date.now() + COOLDOWN_MS;
  usageMap.set(key, usage);
}

/**
 * Get current usage stats for all keys (for debugging/monitoring).
 */
export function getUsageStats() {
  const keys = getKeys();
  const now = Date.now();
  return keys.map(key => {
    const masked = key.slice(0, 8) + "..." + key.slice(-4);
    const usage = getUsage(key);
    return {
      key: masked,
      tokens: usage.tokens,
      remaining: DAILY_TOKEN_LIMIT - usage.tokens,
      coolingDown: usage.cooldownUntil > now,
      date: usage.date,
    };
  });
}
