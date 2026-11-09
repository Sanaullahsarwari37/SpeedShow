import { getClientIp } from "@/lib/ip";
import { rateLimit, tooManyRequests, type RateLimitOptions } from "@/lib/rate-limit";

export const USER_AGENT = "SpeedShow/2.0 (TalkNest)";

type Json = Record<string, unknown>;

interface GetJsonOptions {
  timeoutMs?: number;
  /** Seconds to cache in the Next.js data cache; omit for no caching. */
  revalidate?: number;
}

/** Fetch JSON from an upstream API. Never throws: returns null on any failure. */
export async function getJson<T = Json>(url: string, { timeoutMs = 5000, revalidate }: GetJsonOptions = {}): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(timeoutMs),
      ...(revalidate ? { next: { revalidate } } : { cache: "no-store" as const }),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    return data && typeof data === "object" ? (data as T) : null;
  } catch {
    return null;
  }
}

/** JSON response with consistent security + cache headers. */
export function json(body: unknown, { status = 200, cache = "no-store" }: { status?: number; cache?: string } = {}): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": cache, "X-Content-Type-Options": "nosniff" },
  });
}

export const jsonError = (error: string, status: number) => json({ error }, { status });

/** Per-IP rate limit. Returns a 429 response when exceeded, otherwise null. */
export function limit(req: Request, bucket: string, opts: RateLimitOptions): Response | null {
  const rl = rateLimit(`${bucket}:${getClientIp(req) ?? "anon"}`, opts);
  return rl.ok ? null : tooManyRequests(rl.retryAfterSec);
}

/** Small bounded in-memory cache with a time-to-live (per server instance). */
export class TtlCache<V> {
  private map = new Map<string, { at: number; value: V }>();
  constructor(
    private ttlMs: number,
    private max = 500,
  ) {}

  get(key: string): V | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (Date.now() - hit.at > this.ttlMs) {
      this.map.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: V) {
    if (this.map.size >= this.max) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { at: Date.now(), value });
  }
}
