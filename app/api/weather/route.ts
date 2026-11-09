import { getJson, json, jsonError, limit } from "@/lib/http";
import { buildAirUrl, buildForecastUrl, normalizeWeather, parseAir, parseCoordinate } from "@/lib/weather";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const limited = limit(req, "wx", { capacity: 20, refillPerSec: 0.5 });
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const lat = parseCoordinate(searchParams.get("lat"), -90, 90);
  const lon = parseCoordinate(searchParams.get("lon"), -180, 180);
  if (lat === null || lon === null) return jsonError("Invalid or missing lat/lon.", 400);

  const key = process.env.OPEN_METEO_API_KEY || undefined;
  // Forecast and air quality in parallel; air quality is optional (fails soft).
  const [forecast, air] = await Promise.all([
    getJson(buildForecastUrl(lat, lon, key), { timeoutMs: 6000, revalidate: 600 }),
    getJson(buildAirUrl(lat, lon, key), { timeoutMs: 3000, revalidate: 1800 }),
  ]);

  const data = forecast ? normalizeWeather(forecast, lat, lon, parseAir(air)) : null;
  if (!data) return jsonError("Weather is temporarily unavailable.", 502);

  return json(data, { cache: "public, max-age=300, s-maxage=600, stale-while-revalidate=600" });
}
