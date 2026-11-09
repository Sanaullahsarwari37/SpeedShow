import { json, jsonError, limit } from "@/lib/http";
import { getClientIp, isPrivateIp } from "@/lib/ip";
import { lookupNetwork } from "@/lib/network-lookup";
import { assessRisk, fetchFlags, isCrawlerUserAgent, vpnCheckEnabled } from "@/lib/vpn-detect";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const limited = limit(req, "net", { capacity: 12, refillPerSec: 0.2 });
  if (limited) return limited;

  const ua = req.headers.get("user-agent");
  const ip = getClientIp(req);
  const publicIp = ip && !isPrivateIp(ip) ? ip : null;

  // Start the VPN check in parallel with the ISP lookup (saves one round trip).
  const flags = publicIp && vpnCheckEnabled() && !isCrawlerUserAgent(ua) ? fetchFlags(publicIp) : undefined;

  const info = await lookupNetwork(req);
  if (!info) return jsonError("Could not detect your network details.", 502);

  const risk = await assessRisk(info, ua, info.ip === publicIp ? flags : undefined);
  // Personal data: never store on shared caches.
  return json({ ...info, risk }, { cache: risk.blocked ? "no-store" : "private, max-age=300" });
}
