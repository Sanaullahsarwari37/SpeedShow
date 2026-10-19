/**
 * Tiny in-memory token-bucket rate limiter.
 *
 * Best-effort protection: on serverless platforms each instance has its own
 * memory, so this limits abuse per warm instance. For hard guarantees, add
 * your host's WAF / rate-limit rules (Vercel Firewall is free on Hobby).
 */
interface Bucket {
  tokens: number;
  updated: number;
}

const buckets = new Map<string, Bucket>();

const MAX_KEYS = 5000;

export interface RateLimitOptions {
  /** Max tokens in the bucket (burst). */
  capacity: number;
  /** Tokens refilled per second. */
  refillPerSec: number;
}
export const RATE_MULT = 1;
export function rateLimit(
  key: string,
  opts: RateLimitOptions,
  cost = 1,
  now = Date.now(),
): { ok: boolean; retryAfterSec: number } {
  let b = buckets.get(key);
  if (!b) {
    if (buckets.size >= MAX_KEYS) prune(now);
    b = { tokens: opts.capacity, updated: now };
    buckets.set(key, b);
  }
  const elapsed = Math.max(0, (now - b.updated) / 1000);
  b.tokens = Math.min(opts.capacity, b.tokens + elapsed * opts.refillPerSec);
  b.updated = now;

  if (b.tokens >= cost) {
    b.tokens -= cost;
    return { ok: true, retryAfterSec: 0 };
  }
  const missing = cost - b.tokens;
  return { ok: false, retryAfterSec: Math.max(1, Math.ceil(missing / opts.refillPerSec)) };
}

function prune(now: number) {
  for (const [k, b] of buckets) {
    if (now - b.updated > 120_000) buckets.delete(k);
  }
  // Still too many? drop the oldest half.
  if (buckets.size >= MAX_KEYS) {
    let i = 0;
    for (const k of buckets.keys()) {
      buckets.delete(k);
      if (++i > MAX_KEYS / 2) break;
    }
  }
}

export function tooManyRequests(retryAfterSec: number): Response {
  return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSec),
      "Cache-Control": "no-store",
    },
  });
}
