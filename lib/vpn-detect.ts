import type { NetworkRisk, RawNetwork } from "@/lib/types";

/**
 * VPN / proxy screening.
 *
 * Signals (any one is enough to flag):
 *  1. ipapi.is flags (is_vpn, is_proxy, is_tor, is_datacenter), free, optional IPAPI_KEY for higher limits.
 *  2. Network-name heuristics on the ISP / organisation (known VPN brands and hosting providers).
 *
 * No detector is perfect: brand-new VPN servers can slip through and a few corporate
 * networks look like hosting. Failures fail OPEN (a lookup outage never locks real users out).
 * Search-engine crawlers are never blocked so SEO is unaffected.
 * Set BLOCK_VPN=off to disable the check entirely.
 */

const VPN_BRANDS =
  /\b(vpn|proxy|proxies|nordvpn|nordlayer|expressvpn|express\s?vpn|proton\s?(vpn|ag)|mullvad|surfshark|cyberghost|private\s?internet\s?access|ipvanish|windscribe|tunnelbear|hide\.?me|hotspot\s?shield|purevpn|torguard|vyprvpn|atlas\s?vpn|privadovpn|ivacy|hidemyass|zenmate|perfect\s?privacy|airvpn|ovpn|m247|datacamp|cdn77|tefincom|packethub|clouvider|performive|frantech|buyvm|ptr\s?hosting)\b/i;

const HOSTING =
  /\b(digitalocean|linode|akamai\s?connected|vultr|choopa|ovh|hetzner|contabo|leaseweb|quadranet|colocrossing|amazon|aws|google\s?cloud|google\s?llc|microsoft\s?(azure|corporation)|oracle\s?(cloud|corporation)|alibaba|tencent\s?cloud|scaleway|online\s?s\.a\.s|psychz|hostinger|hostwinds|servers?\.com|datacenter|data\s?center|hosting|colo(cation)?|cloud\s?(host|server))\b/i;

const CRAWLER_UA =
  /(googlebot|google-inspectiontool|adsbot-google|bingbot|bingpreview|duckduckbot|slurp|baiduspider|yandex(bot)?|applebot|facebookexternalhit|twitterbot|linkedinbot|slackbot|whatsapp|telegrambot|discordbot|lighthouse|chrome-lighthouse|pagespeed)/i;

export function isCrawlerUserAgent(ua: string | null | undefined): boolean {
  return !!ua && CRAWLER_UA.test(ua);
}

/** Pure name-based check (exported for tests). */
export function heuristicReasons(parts: (string | null | undefined)[]): string[] {
  const text = parts.filter(Boolean).join(" ");
  if (!text) return [];
  if (VPN_BRANDS.test(text)) return ["VPN / proxy network"];
  if (HOSTING.test(text)) return ["Hosting / data-centre network"];
  return [];
}

interface IpapiIs {
  is_vpn?: boolean;
  is_proxy?: boolean;
  is_tor?: boolean;
  is_datacenter?: boolean;
  is_crawler?: boolean | string;
}

/** Pure flag mapping (exported for tests). */
export function flagReasons(d: IpapiIs | null | undefined): string[] {
  if (!d || typeof d !== "object") return [];
  if (d.is_crawler && d.is_crawler !== "false") return [];
  const out: string[] = [];
  if (d.is_tor) out.push("Tor exit node");
  if (d.is_vpn) out.push("VPN");
  if (d.is_proxy) out.push("Proxy");
  if (d.is_datacenter) out.push("Hosting / data-centre network");
  return out;
}

const CACHE_TTL = 10 * 60 * 1000;
const CACHE_MAX = 500;
const cache = new Map<string, { at: number; reasons: string[] }>();

function remember(ip: string, reasons: string[]) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(ip, { at: Date.now(), reasons });
}

async function fetchFlags(ip: string, fetchImpl: typeof fetch): Promise<IpapiIs | null> {
  const key = process.env.IPAPI_KEY;
  const url = `https://api.ipapi.is/?q=${encodeURIComponent(ip)}${key ? `&key=${encodeURIComponent(key)}` : ""}`;
  try {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(2500), headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as IpapiIs;
  } catch {
    return null;
  }
}

export async function assessRisk(
  info: Pick<RawNetwork, "ip" | "isp" | "org" | "asn">,
  userAgent: string | null,
  fetchImpl: typeof fetch = fetch,
): Promise<NetworkRisk> {
  const open: NetworkRisk = { blocked: false, reasons: [] };
  if ((process.env.BLOCK_VPN ?? "").toLowerCase() === "off") return open;
  if (!info.ip || isCrawlerUserAgent(userAgent)) return open;

  const hit = cache.get(info.ip);
  if (hit && Date.now() - hit.at < CACHE_TTL) return { blocked: hit.reasons.length > 0, reasons: hit.reasons };

  const flags = await fetchFlags(info.ip, fetchImpl);
  let reasons = flagReasons(flags);
  if (reasons.length === 0 && !(flags?.is_crawler && flags.is_crawler !== "false")) {
    reasons = heuristicReasons([info.isp, info.org]);
  }
  remember(info.ip, reasons);
  return { blocked: reasons.length > 0, reasons };
}
