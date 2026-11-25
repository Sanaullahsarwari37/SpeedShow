import { buildGeocodeUrl, buildPhotonUrl, cleanQuery, parseGeocode, parsePhoton } from "@/lib/geocode";
import { getJson, json, jsonError, limit } from "@/lib/http";
import { parseCoordinate } from "@/lib/weather";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE = "public, max-age=3600, s-maxage=86400";

/**
 * Place search like a map app: countries, provinces / states, districts, cities,
 * towns and villages worldwide (Photon over OpenStreetMap). Optional `lat` / `lon`
 * (rounded to ~10 km) rank nearby places first. Falls back to Open-Meteo's
 * GeoNames search when Photon doesn't answer.
 */
export async function GET(req: Request): Promise<Response> {
  const limited = limit(req, "geo", { capacity: 40, refillPerSec: 1.5 });
  if (limited) return limited;

  const params = new URL(req.url).searchParams;
  const q = cleanQuery(params.get("q"));
  if (!q) return jsonError("Type at least 2 characters.", 400);
  const lat = parseCoordinate(params.get("lat"), -90, 90);
  const lon = parseCoordinate(params.get("lon"), -180, 180);
  const near = lat !== null && lon !== null ? { lat: Math.round(lat * 10) / 10, lon: Math.round(lon * 10) / 10 } : null;

  const photon = await getJson(buildPhotonUrl(q, near), { timeoutMs: 4000, revalidate: 86400 });
  const places = photon ? parsePhoton(photon) : [];
  if (places.length) return json({ results: places.slice(0, 10) }, { cache: CACHE });

  const raw = await getJson(buildGeocodeUrl(q, "en", process.env.OPEN_METEO_API_KEY || undefined), { timeoutMs: 5000, revalidate: 86400 });
  if (!raw && !photon) return jsonError("Search is temporarily unavailable.", 502);
  return json({ results: raw ? parseGeocode(raw, q).slice(0, 10) : [] }, { cache: CACHE });
}
