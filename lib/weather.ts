import type { AirQuality, WeatherData, WeatherDay, WeatherHour } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* WMO codes                                                           */
/* ------------------------------------------------------------------ */

export type WeatherKind = "clear" | "partly" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "storm";

const WMO: Record<number, [string, WeatherKind]> = {
  0: ["Clear sky", "clear"],
  1: ["Mainly clear", "clear"],
  2: ["Partly cloudy", "partly"],
  3: ["Overcast", "cloud"],
  45: ["Fog", "fog"],
  48: ["Freezing fog", "fog"],
  51: ["Light drizzle", "drizzle"],
  53: ["Drizzle", "drizzle"],
  55: ["Heavy drizzle", "drizzle"],
  56: ["Freezing drizzle", "drizzle"],
  57: ["Freezing drizzle", "drizzle"],
  61: ["Light rain", "rain"],
  63: ["Rain", "rain"],
  65: ["Heavy rain", "rain"],
  66: ["Freezing rain", "rain"],
  67: ["Freezing rain", "rain"],
  71: ["Light snow", "snow"],
  73: ["Snow", "snow"],
  75: ["Heavy snow", "snow"],
  77: ["Snow grains", "snow"],
  80: ["Light showers", "rain"],
  81: ["Showers", "rain"],
  82: ["Violent showers", "rain"],
  85: ["Snow showers", "snow"],
  86: ["Heavy snow showers", "snow"],
  95: ["Thunderstorm", "storm"],
  96: ["Thunderstorm with hail", "storm"],
  99: ["Thunderstorm with hail", "storm"],
};

/** Precipitation strength 0..1 per WMO code (drives how dense rain or snow looks). */
const INTENSITY: Record<number, number> = {
  51: 0.3, 53: 0.55, 55: 0.8, 56: 0.4, 57: 0.7,
  61: 0.35, 63: 0.65, 65: 1, 66: 0.45, 67: 0.8,
  71: 0.35, 73: 0.65, 75: 1, 77: 0.3,
  80: 0.45, 81: 0.75, 82: 1, 85: 0.5, 86: 0.9,
  95: 0.8, 96: 0.9, 99: 1,
};

export function describeWeather(code: number): { label: string; kind: WeatherKind; intensity: number } {
  const [label, kind] = WMO[code] ?? ["Unknown", "cloud"];
  return { label, kind, intensity: INTENSITY[code] ?? 0 };
}

/* ------------------------------------------------------------------ */
/* Readable scales                                                     */
/* ------------------------------------------------------------------ */

const scale = (v: number, steps: [number, string][]) => steps.find(([max]) => v <= max)?.[1] ?? steps[steps.length - 1][1];

export const uvLevel = (uv: number) =>
  scale(uv, [
    [2, "Low"],
    [5, "Moderate"],
    [7, "High"],
    [10, "Very high"],
    [Infinity, "Extreme"],
  ]);

/** US AQI categories (EPA). */
export const aqiLevel = (aqi: number) =>
  scale(aqi, [
    [50, "Good"],
    [100, "Moderate"],
    [150, "Unhealthy for some"],
    [200, "Unhealthy"],
    [300, "Very unhealthy"],
    [Infinity, "Hazardous"],
  ]);

export const visibilityLabel = (m: number) => (m >= 10000 ? `${Math.round(m / 1000)} km` : m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);

/* ------------------------------------------------------------------ */
/* Moon                                                                */
/* ------------------------------------------------------------------ */

const SYNODIC = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const MOON_NAMES = [
  "New moon",
  "Waxing crescent",
  "First quarter",
  "Waxing gibbous",
  "Full moon",
  "Waning gibbous",
  "Last quarter",
  "Waning crescent",
];

/** Moon phase for a moment: fraction 0..1 (0 = new, 0.5 = full), name and lit share. */
export function moonPhase(at: number) {
  const age = ((((at - KNOWN_NEW_MOON) / 86_400_000) % SYNODIC) + SYNODIC) % SYNODIC;
  const fraction = age / SYNODIC;
  return {
    fraction,
    name: MOON_NAMES[Math.floor(fraction * 8 + 0.5) % 8],
    illumination: (1 - Math.cos(2 * Math.PI * fraction)) / 2,
  };
}

/* ------------------------------------------------------------------ */
/* Sky                                                                 */
/* ------------------------------------------------------------------ */

export type DayPart = "night" | "dawn" | "day" | "dusk";

/** Which part of the day it is from live local minutes and today's sun times. */
export function dayPart(now: number, rise: number | null, set: number | null, fallbackIsDay: boolean): DayPart {
  if (rise == null || set == null || set <= rise) return fallbackIsDay ? "day" : "night";
  const TWILIGHT = 40;
  if (Math.abs(now - rise) <= TWILIGHT) return "dawn";
  if (Math.abs(now - set) <= TWILIGHT) return "dusk";
  return now > rise && now < set ? "day" : "night";
}

/** Sky gradient [top, middle, horizon] for a condition and the real part of the day. */
export function skyColors(kind: WeatherKind, part: DayPart): [string, string, string] {
  const wet = kind === "rain" || kind === "drizzle";
  const grey = wet || kind === "cloud" || kind === "fog" || kind === "snow";
  if (kind === "storm") return part === "night" ? ["#07080f", "#141826", "#232838"] : ["#1d2230", "#2d3446", "#3c4458"];
  if (part === "night") {
    if (grey) return ["#0d1120", "#1a2133", "#283148"];
    return ["#060a24", "#101848", "#1c1a52"];
  }
  if (part === "dawn" || part === "dusk") {
    if (grey) return ["#3a4154", "#5d6276", "#8a7c80"];
    return part === "dawn" ? ["#1e3a8a", "#6d5bb8", "#f0a072"] : ["#1e1b4b", "#7c3a7a", "#f08a5d"];
  }
  if (wet) return ["#3f4a5c", "#56637a", "#707d92"];
  if (kind === "snow") return ["#6f7d92", "#8d9aae", "#aab5c5"];
  if (kind === "fog") return ["#7d8796", "#949eab", "#aab2bd"];
  if (kind === "cloud") return ["#5b687d", "#76849a", "#93a0b3"];
  if (kind === "partly") return ["#2f73c9", "#4b8fdb", "#86b9e9"];
  return ["#1e66d0", "#3d8ae6", "#7fbdf2"];
}

/* ------------------------------------------------------------------ */
/* Open-Meteo                                                          */
/* ------------------------------------------------------------------ */

type Json = Record<string, unknown>;
const n = (v: unknown, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const nOrNull = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const s = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Validate a lat/lon query param, rounded to ~1 km (better cache hits, more privacy). */
export function parseCoordinate(value: string | null, min: number, max: number): number | null {
  if (value === null || value.trim() === "") return null;
  const x = Number(value);
  if (!Number.isFinite(x) || x < min || x > max) return null;
  return Math.round(x * 100) / 100;
}

const withKey = (base: string, commercial: string, apiKey?: string) => (apiKey ? commercial : base);

export function buildForecastUrl(lat: number, lon: number, apiKey?: string): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code,is_day,uv_index,visibility,dew_point_2m,wind_gusts_10m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,uv_index_max,sunrise,sunset",
    timezone: "auto",
    forecast_days: "7",
  });
  if (apiKey) params.set("apikey", apiKey);
  return `${withKey("https://api.open-meteo.com", "https://customer-api.open-meteo.com", apiKey)}/v1/forecast?${params}`;
}

export function buildAirUrl(lat: number, lon: number, apiKey?: string): string {
  const params = new URLSearchParams({ latitude: String(lat), longitude: String(lon), current: "us_aqi,pm2_5,pm10", timezone: "auto" });
  if (apiKey) params.set("apikey", apiKey);
  return `${withKey("https://air-quality-api.open-meteo.com", "https://customer-air-quality-api.open-meteo.com", apiKey)}/v1/air-quality?${params}`;
}

export function parseAir(raw: unknown): AirQuality | null {
  const c = (raw as Json | null)?.current as Json | undefined;
  const aqi = nOrNull(c?.us_aqi);
  return c && aqi !== null ? { usAqi: aqi, pm25: nOrNull(c.pm2_5), pm10: nOrNull(c.pm10) } : null;
}

/** Raw Open-Meteo forecast → compact typed payload. */
export function normalizeWeather(raw: unknown, lat: number, lon: number, air: AirQuality | null = null): WeatherData | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Json;
  const c = r.current as Json | undefined;
  if (!c || typeof c.temperature_2m !== "number") return null;

  const h = (r.hourly ?? {}) as Json;
  const col = (key: string) => arr(h[key]);
  const hTime = col("time");
  const nowHour = s(c.time).slice(0, 13); // "YYYY-MM-DDTHH"
  const nowIdx = Math.max(0, hTime.findIndex((t) => s(t).slice(0, 13) >= nowHour));

  const hourly: WeatherHour[] = [];
  for (let i = nowIdx; i < hTime.length && hourly.length < 24; i++) {
    hourly.push({
      time: s(hTime[i]),
      temp: n(col("temperature_2m")[i]),
      code: n(col("weather_code")[i]),
      isDay: n(col("is_day")[i], 1) === 1,
      precipProb: n(col("precipitation_probability")[i]),
    });
  }

  const d = (r.daily ?? {}) as Json;
  const dcol = (key: string) => arr(d[key]);
  const daily: WeatherDay[] = dcol("time")
    .slice(0, 7)
    .map((t, i) => ({
      date: s(t),
      code: n(dcol("weather_code")[i]),
      max: n(dcol("temperature_2m_max")[i]),
      min: n(dcol("temperature_2m_min")[i]),
      precipProb: n(dcol("precipitation_probability_max")[i]),
      precipSum: n(dcol("precipitation_sum")[i]),
      uvMax: nOrNull(dcol("uv_index_max")[i]),
      sunrise: s(dcol("sunrise")[i]) || null,
      sunset: s(dcol("sunset")[i]) || null,
    }));

  return {
    latitude: lat,
    longitude: lon,
    timezone: s(r.timezone) || "UTC",
    timezoneAbbr: s(r.timezone_abbreviation) || null,
    utcOffsetSec: n(r.utc_offset_seconds),
    current: {
      temp: n(c.temperature_2m),
      feelsLike: n(c.apparent_temperature, n(c.temperature_2m)),
      humidity: n(c.relative_humidity_2m),
      dewPoint: nOrNull(col("dew_point_2m")[nowIdx]),
      windKmh: n(c.wind_speed_10m),
      gustKmh: nOrNull(col("wind_gusts_10m")[nowIdx]),
      windDir: n(c.wind_direction_10m),
      code: n(c.weather_code),
      isDay: n(c.is_day, 1) === 1,
      precip: n(c.precipitation),
      cloudCover: n(c.cloud_cover),
      pressure: n(c.pressure_msl),
      uv: nOrNull(col("uv_index")[nowIdx]),
      visibilityM: nOrNull(col("visibility")[nowIdx]),
      time: s(c.time),
    },
    hourly,
    daily,
    air,
    updatedAt: new Date().toISOString(),
  };
}
