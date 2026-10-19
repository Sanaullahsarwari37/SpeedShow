import { getClientIp } from "@/lib/ip";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

function handle(req: Request): Response {
  const key = `ping:${getClientIp(req) ?? "anon"}`;
  const rl = rateLimit(key, { capacity: 120, refillPerSec: 20 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);
  return new Response(null, { status: 204, headers });
}

export const GET = handle;
export const HEAD = handle;
