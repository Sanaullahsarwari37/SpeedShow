/**
 * Tiny in-memory token-bucket rate limiter.
 * Best-effort: on serverless each warm instance has its own memory.
 * For hard guarantees add your host's firewall rules (Vercel Firewall is free).
 */
interface Bucket {
  tokens: number;
  updated: number;
}

export interface RateLimitOptions {
  /** Max tokens (burst). */
  capacity: number;
  /** Tokens refilled per second. */
  refillPerSec: number;
}

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export function rateLimit(key: string, opts: RateLimitOptions, cost = 1, now = Date.now()) {
  let b = buckets.get(key);
  if (!b) {
    if (buckets.size >= MAX_KEYS) prune(now);
    b = { tokens: opts.capacity, updated: now };
    buckets.set(key, b);
  }
  b.tokens = Math.min(opts.capacity, b.tokens + (Math.max(0, now - b.updated) / 1000) * opts.refillPerSec);
  b.updated = now;

  if (b.tokens >= cost) {
    b.tokens -= cost;
    return { ok: true, retryAfterSec: 0 };
  }
  return { ok: false, retryAfterSec: Math.max(1, Math.ceil((cost - b.tokens) / opts.refillPerSec)) };
}

function prune(now: number) {
  for (const [k, b] of buckets) if (now - b.updated > 120_000) buckets.delete(k);
  if (buckets.size < MAX_KEYS) return;
  let i = 0;
  for (const k of buckets.keys()) {
    buckets.delete(k);
    if (++i > MAX_KEYS / 2) break;
  }
}
