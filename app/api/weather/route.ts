import { fetchGoogleWeather, googleWeatherKey } from "@/lib/google-weather";
import { getJson, json, jsonError, limit } from "@/lib/http";
import { buildAirUrl, buildForecastUrl, normalizeWeather, parseAir, parseCoordinate } from "@/lib/weather";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Weather for a point. Google Weather API when GOOGLE_WEATHER_API_KEY is set,
 * otherwise (or if Google fails) Open-Meteo. Air quality always comes from
 * Open-Meteo and fails soft.
 */
export async function GET(req: Request): Promise<Response> {
  const limited = limit(req, "wx", { capacity: 20, refillPerSec: 0.5 });
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const lat = parseCoordinate(searchParams.get("lat"), -90, 90);
  const lon = parseCoordinate(searchParams.get("lon"), -180, 180);
  if (lat === null || lon === null) return jsonError("Invalid or missing lat/lon.", 400);

  const meteoKey = process.env.OPEN_METEO_API_KEY || undefined;
  const googleKey = googleWeatherKey();
  const airPromise = getJson(buildAirUrl(lat, lon, meteoKey), { timeoutMs: 3000, revalidate: 1800 }).then(parseAir);

  const [google, airNow] = await Promise.all([googleKey ? fetchGoogleWeather(lat, lon, googleKey, null) : null, airPromise]);
  let data = google ? { ...google, air: airNow } : null;
  if (!data) {
    const [forecast, air] = await Promise.all([getJson(buildForecastUrl(lat, lon, meteoKey), { timeoutMs: 6000, revalidate: 600 }), airPromise]);
    data = forecast ? normalizeWeather(forecast, lat, lon, air) : null;
  }
  if (!data) return jsonError("Weather is temporarily unavailable.", 502);

  return json(data, { cache: "public, max-age=300, s-maxage=600, stale-while-revalidate=600" });
}
