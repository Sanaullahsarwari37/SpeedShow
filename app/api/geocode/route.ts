import { buildGeocodeUrl, cleanQuery, parseGeocode } from "@/lib/geocode";
import { getClientIp } from "@/lib/ip";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const rl = rateLimit(`geo:${getClientIp(req) ?? "anon"}`, { capacity: 40, refillPerSec: 1.5 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const q = cleanQuery(new URL(req.url).searchParams.get("q"));
  if (!q) {
    return Response.json({ error: "Type at least 2 characters." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const upstream = await fetch(buildGeocodeUrl(q, "en", process.env.OPEN_METEO_API_KEY || undefined), {
      headers: { Accept: "application/json", "User-Agent": "SpeedShow/1.0 (TalkNest)" },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 86400 },
    });
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
    const json = await upstream.json();
    return Response.json(
      { results: parseGeocode(json, q) },
      { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400", "X-Content-Type-Options": "nosniff" } },
    );
  } catch {
    return Response.json({ error: "Search is temporarily unavailable." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
