import { getJson, json, jsonError, limit, TtlCache } from "@/lib/http";
import type { WeatherData } from "@/lib/types";
import { buildAirUrl, buildForecastUrl, normalizeWeather, parseAir, parseCoordinate } from "@/lib/weather";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Last good forecast per point: served (marked stale) when Open-Meteo is briefly down. */
const lastGood = new TtlCache<WeatherData>(6 * 60 * 60 * 1000, 300);

/** One retry after a short pause covers most transient upstream failures. */
async function withRetry<T>(load: () => Promise<T | null>): Promise<T | null> {
  return (await load()) ?? (await new Promise((r) => setTimeout(r, 400)), load());
}

/**
 * Weather for a point from Open-Meteo (free, open source, no key). Its "best match"
 * picks the highest-resolution model for each location (e.g. ICON-D2, AROME, HRRR).
 * Forecast and air quality are fetched in parallel; air quality fails soft.
 */
export async function GET(req: Request): Promise<Response> {
  const limited = limit(req, "wx", { capacity: 20, refillPerSec: 0.5 });
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const lat = parseCoordinate(searchParams.get("lat"), -90, 90);
  const lon = parseCoordinate(searchParams.get("lon"), -180, 180);
  if (lat === null || lon === null) return jsonError("Invalid or missing lat/lon.", 400);

  const key = process.env.OPEN_METEO_API_KEY || undefined;
  const cacheKey = `${lat},${lon}`;
  const [forecast, air] = await Promise.all([
    withRetry(() => getJson(buildForecastUrl(lat, lon, key), { timeoutMs: 6000, revalidate: 600 })),
    getJson(buildAirUrl(lat, lon, key), { timeoutMs: 3000, revalidate: 1800 }),
  ]);

  const data = forecast ? normalizeWeather(forecast, lat, lon, parseAir(air) ?? lastGood.get(cacheKey)?.air ?? null) : null;
  if (data) {
    lastGood.set(cacheKey, data);
    return json(data, { cache: "public, max-age=300, s-maxage=600, stale-while-revalidate=600" });
  }

  const fallback = lastGood.get(cacheKey);
  if (fallback) return json({ ...fallback, stale: true }, { cache: "no-store" });
  return jsonError("Weather is temporarily unavailable.", 502);
}
