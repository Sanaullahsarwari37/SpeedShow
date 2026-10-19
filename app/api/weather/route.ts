import { getClientIp } from "@/lib/ip";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { buildOpenMeteoUrl, normalizeWeather, parseCoordinate } from "@/lib/weather-normalize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const rl = rateLimit(`wx:${getClientIp(req) ?? "anon"}`, { capacity: 20, refillPerSec: 0.5 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const { searchParams } = new URL(req.url);
  const lat = parseCoordinate(searchParams.get("lat"), -90, 90);
  const lon = parseCoordinate(searchParams.get("lon"), -180, 180);
  if (lat === null || lon === null) {
    return Response.json({ error: "Invalid or missing lat/lon." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const upstream = await fetch(buildOpenMeteoUrl(lat, lon, process.env.OPEN_METEO_API_KEY || undefined), {
      headers: { Accept: "application/json", "User-Agent": "SpeedShow/1.0 (TalkNest)" },
      signal: AbortSignal.timeout(6000),
      // Cache identical (rounded) coordinates for 10 minutes on the server.
      next: { revalidate: 600 },
    });
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
    const data = normalizeWeather(await upstream.json(), lat, lon);
    if (!data) throw new Error("bad payload");
    return Response.json(data, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "Weather is temporarily unavailable." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
