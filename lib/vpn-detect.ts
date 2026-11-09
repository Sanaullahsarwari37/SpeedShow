import { getJson, TtlCache } from "@/lib/http";
import type { NetworkRisk, RawNetwork } from "@/lib/types";

/**
 * VPN / proxy screening.
 *  1. ipapi.is flags (is_vpn, is_proxy, is_tor, is_datacenter); optional IPAPI_KEY.
 *  2. Network-name heuristics on the ISP / organisation.
 * Lookups fail OPEN, crawlers are never blocked, BLOCK_VPN=off disables it.
 */

const VPN_BRANDS =
  /\b(vpn|proxy|proxies|nordvpn|nordlayer|expressvpn|express\s?vpn|proton\s?(vpn|ag)|mullvad|surfshark|cyberghost|private\s?internet\s?access|ipvanish|windscribe|tunnelbear|hide\.?me|hotspot\s?shield|purevpn|torguard|vyprvpn|atlas\s?vpn|privadovpn|ivacy|hidemyass|zenmate|perfect\s?privacy|airvpn|ovpn|m247|datacamp|cdn77|tefincom|packethub|clouvider|performive|frantech|buyvm|ptr\s?hosting)\b/i;

const HOSTING =
  /\b(digitalocean|linode|akamai\s?connected|vultr|choopa|ovh|hetzner|contabo|leaseweb|quadranet|colocrossing|amazon|aws|google\s?cloud|google\s?llc|microsoft\s?(azure|corporation)|oracle\s?(cloud|corporation)|alibaba|tencent\s?cloud|scaleway|online\s?s\.a\.s|psychz|hostinger|hostwinds|servers?\.com|datacenter|data\s?center|hosting|colo(cation)?|cloud\s?(host|server))\b/i;

const CRAWLER_UA =
  /(googlebot|google-inspectiontool|adsbot-google|bingbot|bingpreview|duckduckbot|slurp|baiduspider|yandex(bot)?|applebot|facebookexternalhit|twitterbot|linkedinbot|slackbot|whatsapp|telegrambot|discordbot|lighthouse|chrome-lighthouse|pagespeed)/i;

export const vpnCheckEnabled = () => (process.env.BLOCK_VPN ?? "").toLowerCase() !== "off";
export const isCrawlerUserAgent = (ua: string | null | undefined) => !!ua && CRAWLER_UA.test(ua);

export function heuristicReasons(parts: (string | null | undefined)[]): string[] {
  const text = parts.filter(Boolean).join(" ");
  if (VPN_BRANDS.test(text)) return ["VPN / proxy network"];
  if (HOSTING.test(text)) return ["Hosting / data-centre network"];
  return [];
}

export interface IpapiFlags {
  is_vpn?: boolean;
  is_proxy?: boolean;
  is_tor?: boolean;
  is_datacenter?: boolean;
  is_crawler?: boolean | string;
}

const isCrawlerFlag = (d: IpapiFlags | null) => !!d?.is_crawler && d.is_crawler !== "false";

export function flagReasons(d: IpapiFlags | null | undefined): string[] {
  if (!d || typeof d !== "object" || isCrawlerFlag(d)) return [];
  const out: string[] = [];
  if (d.is_tor) out.push("Tor exit node");
  if (d.is_vpn) out.push("VPN");
  if (d.is_proxy) out.push("Proxy");
  if (d.is_datacenter) out.push("Hosting / data-centre network");
  return out;
}

const verdicts = new TtlCache<string[]>(10 * 60_000);

/** ipapi.is flags for an IP (call early so it runs in parallel with the ISP lookup). */
export function fetchFlags(ip: string): Promise<IpapiFlags | null> {
  const key = process.env.IPAPI_KEY;
  return getJson<IpapiFlags>(`https://api.ipapi.is/?q=${encodeURIComponent(ip)}${key ? `&key=${encodeURIComponent(key)}` : ""}`, {
    timeoutMs: 2500,
  });
}

export async function assessRisk(
  info: Pick<RawNetwork, "ip" | "isp" | "org">,
  userAgent: string | null,
  prefetched?: Promise<IpapiFlags | null>,
): Promise<NetworkRisk> {
  if (!vpnCheckEnabled() || !info.ip || isCrawlerUserAgent(userAgent)) return { blocked: false, reasons: [] };

  let reasons = verdicts.get(info.ip);
  if (!reasons) {
    const flags = await (prefetched ?? fetchFlags(info.ip));
    reasons = flagReasons(flags);
    if (!reasons.length && !isCrawlerFlag(flags)) reasons = heuristicReasons([info.isp, info.org]);
    verdicts.set(info.ip, reasons);
  }
  return { blocked: reasons.length > 0, reasons };
}
