import type { AirQuality, WeatherData, WeatherDay, WeatherHour, WeatherQuarter } from "@/lib/types";

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

/** Temperature (°C) → colour on a fixed scale, so a bar shows how cold or warm a day really is. */
const TEMP_SCALE: [number, string][] = [
  [-20, "#a5b4fc"],
  [-5, "#60a5fa"],
  [5, "#38bdf8"],
  [12, "#34d399"],
  [20, "#facc15"],
  [28, "#fb923c"],
  [36, "#ef4444"],
];
export function tempColor(c: number): string {
  const i = TEMP_SCALE.findIndex(([t]) => c <= t);
  return TEMP_SCALE[i === -1 ? TEMP_SCALE.length - 1 : Math.max(0, i)][1];
}
/** CSS gradient for a min → max temperature bar, passing through each scale colour in between. */
export function tempGradient(min: number, max: number): string {
  const stops = [min, ...TEMP_SCALE.map(([t]) => t).filter((t) => t > min && t < max), max];
  const span = Math.max(0.1, max - min);
  return `linear-gradient(90deg, ${stops.map((t) => `${tempColor(t)} ${(((t - min) / span) * 100).toFixed(0)}%`).join(", ")})`;
}

export const visibilityLabel = (m: number) => (m >= 10000 ? `${Math.round(m / 1000)} km` : m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);

/* ------------------------------------------------------------------ */
/* Plain-language outlook                                              */
/* ------------------------------------------------------------------ */

/**
 * One-line "what's next" summary from the coming hours, e.g.
 * "Rain likely from 3 PM" or "No rain expected in the next 12 hours".
 * `clock` formats a local ISO time (hour only unless `withMinutes`).
 */
export function precipOutlook(hours: WeatherHour[], clock: (iso: string, withMinutes?: boolean) => string, nowcast: WeatherQuarter[] = []): string {
  // Next 2 hours: 15-minute data is sharper than hourly chances.
  if (nowcast.length) {
    const wet = (q: WeatherQuarter) => q.precip >= 0.1;
    const what = (q: WeatherQuarter) => (describeWeather(q.code).kind === "snow" ? "Snow" : "Rain");
    if (wet(nowcast[0])) {
      const stop = nowcast.findIndex((q) => !wet(q));
      return stop > 0 ? `${what(nowcast[0])} stopping around ${clock(nowcast[stop].time, true)}` : `${what(nowcast[0])} for at least the next 2 hours`;
    }
    const start = nowcast.findIndex(wet);
    if (start > 0) return `${what(nowcast[start])} starting around ${clock(nowcast[start].time, true)}`;
  }
  const next = hours.slice(0, 12);
  if (!next.length) return "";
  const wetNow = next[0].precip > 0.05 || (next[0].precipProb >= 60 && describeWeather(next[0].code).intensity > 0);
  const snow = (h: WeatherHour) => describeWeather(h.code).kind === "snow";
  if (wetNow) {
    const stop = next.findIndex((h) => h.precipProb < 30 && h.precip < 0.05);
    const what = snow(next[0]) ? "Snow" : "Rain";
    return stop > 0 ? `${what} easing around ${clock(next[stop].time)}` : `${what} continuing for the next few hours`;
  }
  const start = next.findIndex((h) => h.precipProb >= 50);
  if (start > 0) return `${snow(next[start]) ? "Snow" : "Rain"} likely from ${clock(next[start].time)} (${Math.round(next[start].precipProb)}%)`;
  const maybe = next.findIndex((h) => h.precipProb >= 25);
  if (maybe > 0) return `Slight chance of rain around ${clock(next[maybe].time)}`;
  return "No rain expected in the next 12 hours";
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
/** Round to `d` decimals: keeps the JSON payload small (nobody needs 7.0999999 °C). */
const rd = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
/** Seconds → hours (1 decimal), or null. */
const hours = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? rd(v / 3600) : null);

/** Validate a lat/lon query param, rounded to ~1 km (better cache hits, more privacy). */
export function parseCoordinate(value: string | null, min: number, max: number): number | null {
  if (value === null || value.trim() === "") return null;
  const x = Number(value);
  if (!Number.isFinite(x) || x < min || x > max) return null;
  return Math.round(x * 100) / 100;
}

const withKey = (base: string, commercial: string, apiKey?: string) => (apiKey ? commercial : base);

export const FORECAST_DAYS = 10;

export function buildForecastUrl(lat: number, lon: number, apiKey?: string): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      // Current values come from the 15-minute model step, not the top of the hour.
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m,uv_index,visibility",
    hourly:
      "temperature_2m,precipitation_probability,precipitation,weather_code,is_day,wind_speed_10m,wind_direction_10m,relative_humidity_2m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,uv_index_max,sunrise,sunset,wind_speed_10m_max,wind_direction_10m_dominant,wind_gusts_10m_max,sunshine_duration,precipitation_hours",
    minutely_15: "precipitation,weather_code",
    forecast_minutely_15: "8",
    timezone: "auto",
    forecast_days: String(FORECAST_DAYS),
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
  // Every remaining hour of the forecast, so any day can be charted.
  for (let i = nowIdx; i < hTime.length; i++) {
    hourly.push({
      time: s(hTime[i]),
      temp: rd(n(col("temperature_2m")[i])),
      code: n(col("weather_code")[i]),
      isDay: n(col("is_day")[i], 1) === 1,
      precipProb: Math.round(n(col("precipitation_probability")[i])),
      precip: rd(n(col("precipitation")[i]), 2),
      windKmh: rd(n(col("wind_speed_10m")[i])),
      windDir: Math.round(n(col("wind_direction_10m")[i])),
      humidity: Math.round(n(col("relative_humidity_2m")[i])),
    });
  }

  const d = (r.daily ?? {}) as Json;
  const dcol = (key: string) => arr(d[key]);
  const daily: WeatherDay[] = dcol("time")
    .slice(0, FORECAST_DAYS)
    .map((t, i) => ({
      date: s(t),
      code: n(dcol("weather_code")[i]),
      max: rd(n(dcol("temperature_2m_max")[i])),
      min: rd(n(dcol("temperature_2m_min")[i])),
      precipProb: n(dcol("precipitation_probability_max")[i]),
      precipSum: n(dcol("precipitation_sum")[i]),
      uvMax: nOrNull(dcol("uv_index_max")[i]),
      sunrise: s(dcol("sunrise")[i]) || null,
      sunset: s(dcol("sunset")[i]) || null,
      windMax: nOrNull(dcol("wind_speed_10m_max")[i]),
      windDir: nOrNull(dcol("wind_direction_10m_dominant")[i]),
      gustMax: nOrNull(dcol("wind_gusts_10m_max")[i]),
      sunshineH: hours(dcol("sunshine_duration")[i]),
      precipHours: nOrNull(dcol("precipitation_hours")[i]),
    }));

  const m = (r.minutely_15 ?? {}) as Json;
  const mTime = arr(m.time);
  const nowcast: WeatherQuarter[] = mTime.map((t, i) => ({
    time: s(t),
    precip: rd(n(arr(m.precipitation)[i]), 2),
    code: n(arr(m.weather_code)[i]),
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
      dewPoint: nOrNull(c.dew_point_2m),
      windKmh: n(c.wind_speed_10m),
      gustKmh: nOrNull(c.wind_gusts_10m),
      windDir: n(c.wind_direction_10m),
      code: n(c.weather_code),
      isDay: n(c.is_day, 1) === 1,
      precip: n(c.precipitation),
      cloudCover: n(c.cloud_cover),
      pressure: n(c.pressure_msl),
      uv: nOrNull(c.uv_index),
      visibilityM: nOrNull(c.visibility),
      time: s(c.time),
    },
    hourly,
    nowcast,
    daily,
    air,
    updatedAt: new Date().toISOString(),
  };
}
