import { getJson, TtlCache } from "@/lib/http";
import { getClientIp, ipVersion, isPrivateIp } from "@/lib/ip";
import type { RawNetwork } from "@/lib/types";

type Json = Record<string, unknown>;

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

const cache = new TtlCache<RawNetwork>(10 * 60_000);

/** ipwho.is response → RawNetwork. */
export function parseIpWho(d: Json): RawNetwork | null {
  const ip = str(d.ip);
  if (d.success === false || !ip) return null;
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

/** ipapi.co response → RawNetwork. */
export function parseIpApi(d: Json): RawNetwork | null {
  const ip = str(d.ip);
  if (d.error || !ip) return null;
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

/** Geo data from the hosting platform (Vercel headers). No ISP available. */
export function fromPlatformHeaders(req: Request, ip: string): RawNetwork {
  const h = req.headers;
  const coord = (name: string) => {
    const raw = h.get(name);
    const n = Number(raw);
    return raw && Number.isFinite(n) ? n : null;
  };
  const code = str(h.get("x-vercel-ip-country"));
  let country: string | null = code;
  if (code) {
    try {
      country = new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
    } catch {
      /* keep code */
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
    latitude: coord("x-vercel-ip-latitude"),
    longitude: coord("x-vercel-ip-longitude"),
    timezone: str(h.get("x-vercel-ip-timezone")),
    source: "platform",
  };
}

/** Fill gaps in a provider answer with platform geo headers. */
function merge(info: RawNetwork, platform: RawNetwork | null): RawNetwork {
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

/**
 * Look up the caller's IP, ISP and location.
 * The IP only comes from trusted platform headers and is validated with net.isIP
 * before it is placed in an upstream URL. Private addresses (local dev) fall back
 * to the server's public IP. Results are cached per IP for 10 minutes.
 */
export async function lookupNetwork(req: Request): Promise<RawNetwork | null> {
  const ip = getClientIp(req);
  const publicIp = ip && !isPrivateIp(ip) ? ip : null;
  const cacheKey = publicIp ?? "self";
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const platform = publicIp ? fromPlatformHeaders(req, publicIp) : null;

  const who = await getJson(`https://ipwho.is/${publicIp ?? ""}`, { timeoutMs: 3500 });
  let info = who ? parseIpWho(who) : null;
  if (!info) {
    const api = await getJson(`https://ipapi.co/${publicIp ? `${publicIp}/` : ""}json/`, { timeoutMs: 3500 });
    info = api ? parseIpApi(api) : null;
  }

  const result = info ? merge(info, platform) : platform;
  if (result) cache.set(cacheKey, result);
  return result;
}
