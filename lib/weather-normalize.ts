import type { WeatherData, WeatherDay, WeatherHour } from "@/lib/types";

type Json = Record<string, unknown>;

const n = (v: unknown, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const s = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function parseCoordinate(value: string | null, min: number, max: number): number | null {
  if (value === null || value.trim() === "") return null;
  const x = Number(value);
  if (!Number.isFinite(x) || x < min || x > max) return null;
  return Math.round(x * 100) / 100; // ~1 km precision: better cache hits and privacy
}

/** Turn the raw Open-Meteo response into a compact, typed payload. */
export function normalizeWeather(raw: unknown, lat: number, lon: number): WeatherData | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Json;
  const c = r.current as Json | undefined;
  if (!c || typeof c.temperature_2m !== "number") return null;

  const h = (r.hourly ?? {}) as Json;
  const hTime = arr(h.time);
  const hourly: WeatherHour[] = [];
  const nowHour = s(c.time).slice(0, 13); // "YYYY-MM-DDTHH"
  for (let i = 0; i < hTime.length && hourly.length < 24; i++) {
    const t = s(hTime[i]);
    if (t.slice(0, 13) < nowHour) continue;
    hourly.push({
      time: t,
      temp: n(arr(h.temperature_2m)[i]),
      code: n(arr(h.weather_code)[i]),
      isDay: n(arr(h.is_day)[i], 1) === 1,
      precipProb: n(arr(h.precipitation_probability)[i]),
    });
  }

  const d = (r.daily ?? {}) as Json;
  const dTime = arr(d.time);
  const daily: WeatherDay[] = dTime.slice(0, 7).map((t, i) => ({
    date: s(t),
    code: n(arr(d.weather_code)[i]),
    max: n(arr(d.temperature_2m_max)[i]),
    min: n(arr(d.temperature_2m_min)[i]),
    precipProb: n(arr(d.precipitation_probability_max)[i]),
    sunrise: s(arr(d.sunrise)[i]) || null,
    sunset: s(arr(d.sunset)[i]) || null,
  }));

  return {
    latitude: lat,
    longitude: lon,
    timezone: s(r.timezone) || "UTC",
    current: {
      temp: n(c.temperature_2m),
      feelsLike: n(c.apparent_temperature, n(c.temperature_2m)),
      humidity: n(c.relative_humidity_2m),
      windKmh: n(c.wind_speed_10m),
      windDir: n(c.wind_direction_10m),
      code: n(c.weather_code),
      isDay: n(c.is_day, 1) === 1,
      precip: n(c.precipitation),
      cloudCover: n(c.cloud_cover),
      pressure: n(c.pressure_msl),
      time: s(c.time),
    },
    hourly,
    daily,
    updatedAt: new Date().toISOString(),
  };
}

export function buildOpenMeteoUrl(lat: number, lon: number, apiKey?: string): string {
  const base = apiKey ? "https://customer-api.open-meteo.com/v1/forecast" : "https://api.open-meteo.com/v1/forecast";
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
    timezone: "auto",
    forecast_days: "6",
  });
  if (apiKey) params.set("apikey", apiKey);
  return `${base}?${params.toString()}`;
}
