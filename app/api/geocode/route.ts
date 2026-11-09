import { buildGeocodeUrl, cleanQuery, parseGeocode } from "@/lib/geocode";
import { getJson, json, jsonError, limit } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const limited = limit(req, "geo", { capacity: 40, refillPerSec: 1.5 });
  if (limited) return limited;

  const q = cleanQuery(new URL(req.url).searchParams.get("q"));
  if (!q) return jsonError("Type at least 2 characters.", 400);

  const raw = await getJson(buildGeocodeUrl(q, "en", process.env.OPEN_METEO_API_KEY || undefined), {
    timeoutMs: 6000,
    revalidate: 86400,
  });
  if (!raw) return jsonError("Search is temporarily unavailable.", 502);

  return json({ results: parseGeocode(raw, q).slice(0, 12) }, { cache: "public, max-age=3600, s-maxage=86400" });
}
