import { getClientIp, ipVersion, isPrivateIp } from "@/lib/ip";
import type { RawNetwork } from "@/lib/types";

const TIMEOUT_MS = 4500;

type Json = Record<string, unknown>;

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

async function getJson(url: string, fetchImpl: typeof fetch): Promise<Json | null> {
  try {
    const res = await fetchImpl(url, {
      headers: { Accept: "application/json", "User-Agent": "SpeedShow/1.0 (TalkNest)" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    return data && typeof data === "object" ? (data as Json) : null;
  } catch {
    return null;
  }
}

/** Parse the ipwho.is response shape. */
export function parseIpWho(d: Json): RawNetwork | null {
  if (d.success === false) return null;
  const ip = str(d.ip);
  if (!ip) return null;
  const conn = (d.connection ?? {}) as Json;
  const tz = (d.timezone ?? {}) as Json;
  const asn = num(conn.asn);
  return {
    ip,
    version: ipVersion(ip),
    isp: str(conn.isp),
    org: str(conn.org),
    asn: asn !== null ? `AS${asn}` : null,
    city: str(d.city),
    region: str(d.region),
    country: str(d.country),
    countryCode: str(d.country_code),
    latitude: num(d.latitude),
    longitude: num(d.longitude),
    timezone: str(tz.id),
    source: "ipwho.is",
  };
}

/** Parse the ipapi.co response shape. */
export function parseIpApi(d: Json): RawNetwork | null {
  if (d.error) return null;
  const ip = str(d.ip);
  if (!ip) return null;
  return {
    ip,
    version: ipVersion(ip),
    isp: str(d.org),
    org: str(d.org),
    asn: str(d.asn),
    city: str(d.city),
    region: str(d.region),
    country: str(d.country_name),
    countryCode: str(d.country_code),
    latitude: num(d.latitude),
    longitude: num(d.longitude),
    timezone: str(d.timezone),
    source: "ipapi.co",
  };
}

function safeDecode(v: string | null): string | null {
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

/** Geo information supplied by the hosting platform (Vercel) – no ISP available. */
export function fromPlatformHeaders(req: Request, ip: string): RawNetwork {
  const h = req.headers;
  const lat = Number(h.get("x-vercel-ip-latitude"));
  const lon = Number(h.get("x-vercel-ip-longitude"));
  const code = str(h.get("x-vercel-ip-country"));
  let country: string | null = null;
  if (code) {
    try {
      country = new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
    } catch {
      country = code;
    }
  }
  return {
    ip,
    version: ipVersion(ip),
    isp: null,
    org: null,
    asn: null,
    city: safeDecode(h.get("x-vercel-ip-city")),
    region: str(h.get("x-vercel-ip-country-region")),
    country,
    countryCode: code,
    latitude: h.get("x-vercel-ip-latitude") && Number.isFinite(lat) ? lat : null,
    longitude: h.get("x-vercel-ip-longitude") && Number.isFinite(lon) ? lon : null,
    timezone: str(h.get("x-vercel-ip-timezone")),
    source: "platform",
  };
}

/**
 * Look up the caller's IP, ISP and location.
 * The IP is only ever taken from trusted platform headers and validated with
 * net.isIP before being placed in an upstream URL (no SSRF / injection surface).
 * Private addresses (local development) fall back to the server's public IP,
 * which is your own when running `npm run dev`.
 */
export async function lookupNetwork(req: Request, fetchImpl: typeof fetch = fetch): Promise<RawNetwork | null> {
  const ip = getClientIp(req);
  const target = ip && !isPrivateIp(ip) ? ip : "";
  const platform = ip && !isPrivateIp(ip) ? fromPlatformHeaders(req, ip) : null;

  const who = await getJson(`https://ipwho.is/${target}`, fetchImpl);
  const a = who ? parseIpWho(who) : null;
  if (a) return mergePlatform(a, platform);

  const api = await getJson(`https://ipapi.co/${target ? `${target}/` : ""}json/`, fetchImpl);
  const b = api ? parseIpApi(api) : null;
  if (b) return mergePlatform(b, platform);

  return platform && (platform.city || platform.countryCode) ? platform : ip ? fromPlatformHeaders(req, ip) : null;
}

function mergePlatform(info: RawNetwork, platform: RawNetwork | null): RawNetwork {
  if (!platform) return info;
  return {
    ...info,
    city: info.city ?? platform.city,
    region: info.region ?? platform.region,
    country: info.country ?? platform.country,
    countryCode: info.countryCode ?? platform.countryCode,
    latitude: info.latitude ?? platform.latitude,
    longitude: info.longitude ?? platform.longitude,
    timezone: info.timezone ?? platform.timezone,
  };
}
