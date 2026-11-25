import type { GeoPlace } from "@/lib/types";

type Json = Record<string, unknown>;

/** Clean a user search string; returns null when unusable. */
export function cleanQuery(q: string | null): string | null {
  if (!q) return null;
  const s = q.normalize("NFKC").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim();
  return s.length >= 2 && s.length <= 80 ? s : null;
}

/* ------------------------------------------------------------------ */
/* Photon (OpenStreetMap): countries, provinces, districts, towns     */
/* ------------------------------------------------------------------ */

/** Only administrative areas and settlements: no shops, roads or rivers. */
const PHOTON_LAYERS = ["country", "state", "county", "city", "district", "locality"];

/**
 * Photon search-as-you-type over OpenStreetMap (photon.komoot.io, free, no key).
 * Understands "district, province, country" queries; `near` ranks nearby places first.
 */
export function buildPhotonUrl(q: string, near?: { lat: number; lon: number } | null, lang = "en"): string {
  const u = new URL("https://photon.komoot.io/api/");
  u.searchParams.set("q", q);
  u.searchParams.set("limit", "15");
  u.searchParams.set("lang", lang);
  for (const l of PHOTON_LAYERS) u.searchParams.append("layer", l);
  if (near) {
    u.searchParams.set("lat", String(near.lat));
    u.searchParams.set("lon", String(near.lon));
  }
  return u.toString();
}

const KIND_BY_VALUE: Record<string, string> = {
  city: "City",
  town: "Town",
  village: "Village",
  hamlet: "Village",
  municipality: "Municipality",
  administrative: "Municipality",
  suburb: "Area",
  quarter: "Area",
  neighbourhood: "Area",
  borough: "Area",
  island: "Island",
};

function photonKind(type: string, value: string): string {
  if (type === "country") return "Country";
  if (type === "state") return "Province / state";
  if (type === "county") return "District";
  return KIND_BY_VALUE[value] ?? (type === "city" ? "City" : "Place");
}

/** Normalise Photon GeoJSON features into places. */
export function parsePhoton(d: unknown): GeoPlace[] {
  const features = (d as Json | null)?.features;
  if (!Array.isArray(features)) return [];
  const out: GeoPlace[] = [];
  const seen = new Set<string>();

  for (const f of features as Json[]) {
    const p = (f.properties ?? {}) as Json;
    const coords = (f.geometry as Json | undefined)?.coordinates;
    const name = str(p.name);
    if (!name || !Array.isArray(coords)) continue;
    const [lon, lat] = coords as unknown[];
    if (typeof lat !== "number" || typeof lon !== "number" || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    if (p.osm_key !== "place" && p.osm_key !== "boundary") continue;

    const type = str(p.type) ?? "";
    const state = str(p.state);
    const county = str(p.county);
    const city = str(p.city);
    // Parent areas, smallest first, never repeating the place's own name.
    const parents = (type === "country" ? [] : type === "state" ? [] : type === "county" ? [state] : [type === "city" ? county : (city ?? county), state])
      .filter((x): x is string => !!x && x !== name);
    const admin = [...new Set(parents)].join(", ") || null;
    const countryCode = str(p.countrycode)?.toUpperCase() ?? null;

    const key = `${name}|${admin ?? ""}|${countryCode ?? ""}|${type}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      id: `osm:${str(p.osm_type) ?? ""}${String(p.osm_id ?? `${lat},${lon}`)}`,
      name,
      admin1: admin,
      country: type === "country" ? null : str(p.country),
      countryCode,
      latitude: Math.round(lat * 10000) / 10000,
      longitude: Math.round(lon * 10000) / 10000,
      timezone: null,
      kind: photonKind(type, str(p.osm_value) ?? ""),
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Open-Meteo (GeoNames): fallback when Photon is unavailable          */
/* ------------------------------------------------------------------ */

/**
 * Open-Meteo geocoding — up to 40 results so districts, towns and
 * places in every country (including Afghanistan) surface in search.
 */
export function buildGeocodeUrl(q: string, lang = "en", apiKey?: string): string {
  const base = apiKey ? "https://customer-geocoding-api.open-meteo.com" : "https://geocoding-api.open-meteo.com";
  const u = new URL(`${base}/v1/search`);
  u.searchParams.set("name", q);
  u.searchParams.set("count", "40");
  u.searchParams.set("language", lang);
  u.searchParams.set("format", "json");
  if (apiKey) u.searchParams.set("apikey", apiKey);
  return u.toString();
}

const str = (v: unknown) => (typeof v === "string" && v ? v : null);

function nameScore(query: string, name: string): number {
  const q = query.toLowerCase();
  const n = name.toLowerCase();
  if (n === q) return 12;
  if (n.startsWith(q)) return 8;
  if (n.includes(q)) return 4;
  return 0;
}

/**
 * Normalise Open-Meteo geocoding results.
 * Includes cities, districts, provinces and places worldwide.
 * admin1 = province/state, admin2 = district (when available).
 */
export function parseGeocode(d: unknown, query = ""): GeoPlace[] {
  const results = (d as Json | null)?.results;
  if (!Array.isArray(results)) return [];

  const out: (GeoPlace & { _score: number })[] = [];
  const seen = new Set<string>();

  for (const r of results as Json[]) {
    const lat = r.latitude;
    const lon = r.longitude;
    const name = str(r.name);
    if (typeof lat !== "number" || typeof lon !== "number" || !name) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;

    const admin1 = str(r.admin1);
    const admin2 = str(r.admin2);
    const country = str(r.country);
    const countryCode = str(r.country_code)?.toUpperCase() ?? null;
    const feature = str(r.feature_code) ?? "";
    const pop = typeof r.population === "number" ? r.population : 0;

    // Deduplicate same name + admin + country
    const key = `${name}|${admin2 ?? ""}|${admin1 ?? ""}|${countryCode ?? ""}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    // Relevance ranking
    let score = nameScore(query, name) + Math.log10(pop + 1);

    // Feature codes (GeoNames): populated places + admin divisions
    if (feature === "PPLC") score += 6; // capital
    else if (feature === "PPLA" || feature === "PPLA2") score += 4; // admin seat
    else if (feature.startsWith("PPL")) score += 3; // city / town / village
    else if (feature.startsWith("ADM2") || feature === "ADM2") score += 3.5; // district
    else if (feature.startsWith("ADM1") || feature === "ADM1") score += 2.5; // province
    else if (feature.startsWith("ADM")) score += 2;

    // Boost exact-ish district/province name matches
    if (query && admin1 && admin1.toLowerCase().includes(query.toLowerCase())) score += 2;
    if (query && admin2 && admin2.toLowerCase().includes(query.toLowerCase())) score += 2.5;

    // Slight boost for Afghanistan so local districts rank well for Afghan users
    if (countryCode === "AF") score += 0.5;

    // Region label: district, province when available
    const regionParts = [admin2, admin1].filter(Boolean);
    const regionLabel = regionParts.length ? regionParts.join(", ") : admin1;

    out.push({
      id: String(r.id ?? `${lat},${lon}`),
      name,
      admin1: regionLabel,
      country,
      countryCode,
      latitude: Math.round(lat * 10000) / 10000,
      longitude: Math.round(lon * 10000) / 10000,
      timezone: str(r.timezone),
      _score: score,
    });
  }

  out.sort((a, b) => b._score - a._score);
  return out.map(({ _score: _, ...p }) => p);
}
