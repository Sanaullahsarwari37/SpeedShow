import { getClientIp } from "@/lib/ip";
import { lookupNetwork } from "@/lib/network-lookup";
import { assessRisk } from "@/lib/vpn-detect";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const rl = rateLimit(`net:${getClientIp(req) ?? "anon"}`, { capacity: 12, refillPerSec: 0.2 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const info = await lookupNetwork(req);
  if (!info) {
    return Response.json(
      { error: "Could not determine your network details." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
  const risk = await assessRisk(info, req.headers.get("user-agent"));
  return Response.json({ ...info, risk }, {
    headers: {
      // Personal data: never cache on shared caches.
      "Cache-Control": risk.blocked ? "no-store" : "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
