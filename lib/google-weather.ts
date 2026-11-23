/**
 * Google Maps Platform Weather API → SpeedShow `WeatherData`.
 * https://developers.google.com/maps/documentation/weather
 *
 * Used when GOOGLE_WEATHER_API_KEY is set (server only). Every unit is read from
 * the response and converted, so the adapter never assumes what METRIC returns.
 * Unknown condition types (Google adds them over time) fall back to a keyword match.
 */

import { getJson } from "@/lib/http";
import type { AirQuality, WeatherData, WeatherDay, WeatherHour } from "@/lib/types";
import { FORECAST_DAYS } from "@/lib/weather";

const BASE = "https://weather.googleapis.com/v1";
const HOURS = FORECAST_DAYS * 24; // API max is 240
const PAGE_BUDGET_MS = 5000; // stop paging hours after this; keep what arrived

export const googleWeatherKey = () => process.env.GOOGLE_WEATHER_API_KEY || process.env.GOOGLE_MAPS_API_KEY || undefined;

/* ------------------------------------------------------------------ */
/* Response shapes (only the fields we read; all optional)              */
/* ------------------------------------------------------------------ */

interface GTemp { degrees?: number; unit?: string }
interface GSpeed { value?: number; unit?: string }
interface GQpf { quantity?: number; unit?: string }
interface GCondition { type?: string; description?: { text?: string } }
interface GWind { direction?: { degrees?: number }; speed?: GSpeed; gust?: GSpeed }
interface GPrecip { probability?: { percent?: number }; qpf?: GQpf }
interface GDateTime { year?: number; month?: number; day?: number; hours?: number; utcOffset?: string }

interface GCurrent {
  currentTime?: string;
  timeZone?: { id?: string };
  isDaytime?: boolean;
  weatherCondition?: GCondition;
  temperature?: GTemp;
  feelsLikeTemperature?: GTemp;
  dewPoint?: GTemp;
  relativeHumidity?: number;
  uvIndex?: number;
  precipitation?: GPrecip;
  airPressure?: { meanSeaLevelMillibars?: number };
  wind?: GWind;
  visibility?: { distance?: number; unit?: string };
  cloudCover?: number;
}
interface GHour {
  displayDateTime?: GDateTime;
  isDaytime?: boolean;
  weatherCondition?: GCondition;
  temperature?: GTemp;
  precipitation?: GPrecip;
  wind?: GWind;
  relativeHumidity?: number;
}
interface GDayPart {
  weatherCondition?: GCondition;
  precipitation?: GPrecip;
  wind?: GWind;
  uvIndex?: number;
}
interface GDay {
  displayDate?: { year?: number; month?: number; day?: number };
  daytimeForecast?: GDayPart;
  nighttimeForecast?: GDayPart;
  fullDayForecast?: GDayPart;
  maxTemperature?: GTemp;
  minTemperature?: GTemp;
  sunEvents?: { sunriseTime?: string; sunsetTime?: string };
}
interface GHoursPage { forecastHours?: GHour[]; timeZone?: { id?: string }; nextPageToken?: string }
interface GDaysPage { forecastDays?: GDay[]; timeZone?: { id?: string } }

/* ------------------------------------------------------------------ */
/* Units                                                               */
/* ------------------------------------------------------------------ */

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const rd = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

const celsius = (t: GTemp | undefined): number | null => {
  const v = num(t?.degrees);
  return v == null ? null : rd(t?.unit === "FAHRENHEIT" ? ((v - 32) * 5) / 9 : v);
};
const kmh = (s: GSpeed | undefined): number | null => {
  const v = num(s?.value);
  return v == null ? null : rd(s?.unit === "MILES_PER_HOUR" ? v * 1.609344 : v);
};
const mm = (q: GQpf | undefined): number => {
  const v = num(q?.quantity) ?? 0;
  return rd(q?.unit === "INCHES" ? v * 25.4 : v, 2);
};
const metres = (v: GCurrent["visibility"]): number | null => {
  const d = num(v?.distance);
  return d == null ? null : Math.round(d * (v?.unit === "MILES" ? 1609.344 : 1000));
};

/** Protobuf Duration "3600s" / "-14400s" → seconds. */
const offsetSeconds = (s: string | undefined): number | null => {
  const m = /^(-?\d+(?:\.\d+)?)s$/.exec(s ?? "");
  return m ? Math.round(Number(m[1])) : null;
};
const pad = (n: number | undefined) => String(n ?? 0).padStart(2, "0");
/** UTC timestamp → local "YYYY-MM-DDTHH:MM" at a fixed offset. */
const localIso = (utc: string | undefined, offsetSec: number): string | null => {
  const t = utc ? Date.parse(utc) : NaN;
  return Number.isFinite(t) ? new Date(t + offsetSec * 1000).toISOString().slice(0, 16) : null;
};

/* ------------------------------------------------------------------ */
/* Condition types → WMO codes (drives icons, sky and rain animation)  */
/* ------------------------------------------------------------------ */

const TYPE_CODE: Record<string, number> = {
  CLEAR: 0, MOSTLY_CLEAR: 1, VERY_HOT: 0, PARTLY_CLOUDY: 2, MOSTLY_CLOUDY: 3, CLOUDY: 3, WINDY: 2, FOG: 45,
  WIND_AND_RAIN: 63, LIGHT_RAIN_SHOWERS: 80, CHANCE_OF_SHOWERS: 80, SCATTERED_SHOWERS: 80, RAIN_SHOWERS: 81, HEAVY_RAIN_SHOWERS: 82,
  LIGHT_TO_MODERATE_RAIN: 61, MODERATE_TO_HEAVY_RAIN: 65, RAIN: 63, LIGHT_RAIN: 61, HEAVY_RAIN: 65, RAIN_PERIODICALLY_HEAVY: 65,
  HEAVY_RAIN_TO_RAINSTORM: 65, SLEET: 66, RAIN_AND_SNOW: 85,
  LIGHT_SNOW_SHOWERS: 85, CHANCE_OF_SNOW_SHOWERS: 85, SCATTERED_SNOW_SHOWERS: 85, SNOW_SHOWERS: 85, HEAVY_SNOW_SHOWERS: 86,
  LIGHT_TO_MODERATE_SNOW: 71, MODERATE_TO_HEAVY_SNOW: 75, SNOW: 73, LIGHT_SNOW: 71, HEAVY_SNOW: 75, SNOWSTORM: 75,
  SNOW_PERIODICALLY_HEAVY: 75, HEAVY_SNOW_STORM: 75, BLOWING_SNOW: 73,
  HAIL: 96, HAIL_SHOWERS: 96, THUNDERSTORM: 95, THUNDERSHOWER: 95, LIGHT_THUNDERSTORM_RAIN: 95, SCATTERED_THUNDERSTORMS: 95, HEAVY_THUNDERSTORM: 99,
};

function conditionCode(c: GCondition | undefined): number {
  const type = c?.type ?? "";
  if (type in TYPE_CODE) return TYPE_CODE[type];
  const k = `${type} ${c?.description?.text ?? ""}`.toUpperCase();
  if (/THUNDER|LIGHTNING/.test(k)) return 95;
  if (/SNOW|SLEET/.test(k)) return 73;
  if (/RAIN|SHOWER|DRIZZLE/.test(k)) return 63;
  if (/FOG|MIST|HAZE/.test(k)) return 45;
  if (/CLOUD|OVERCAST/.test(k)) return 3;
  if (/CLEAR|SUN/.test(k)) return 1;
  return 3;
}
const label = (c: GCondition | undefined) => c?.description?.text?.trim() || undefined;

/* ------------------------------------------------------------------ */
/* Fetch                                                               */
/* ------------------------------------------------------------------ */

const url = (path: string, lat: number, lon: number, key: string, extra: Record<string, string> = {}) =>
  `${BASE}/${path}?${new URLSearchParams({
    key,
    "location.latitude": String(lat),
    "location.longitude": String(lon),
    unitsSystem: "METRIC",
    languageCode: "en",
    ...extra,
  })}`;

/** All forecast hours (24 per page, pages are chained by token), within a time budget. */
async function fetchHours(lat: number, lon: number, key: string): Promise<GHoursPage | null> {
  const started = Date.now();
  const first = await getJson<GHoursPage>(url("forecast/hours:lookup", lat, lon, key, { hours: String(HOURS), pageSize: "24" }), {
    timeoutMs: 4000,
    revalidate: 600,
  });
  if (!first?.forecastHours?.length) return null;
  const hours = [...first.forecastHours];
  let token = first.nextPageToken;
  while (token && hours.length < HOURS && Date.now() - started < PAGE_BUDGET_MS) {
    const page = await getJson<GHoursPage>(url("forecast/hours:lookup", lat, lon, key, { hours: String(HOURS), pageSize: "24", pageToken: token }), {
      timeoutMs: 3000,
      revalidate: 600,
    });
    if (!page?.forecastHours?.length) break;
    hours.push(...page.forecastHours);
    token = page.nextPageToken;
  }
  return { ...first, forecastHours: hours };
}

/** Google current + hourly + daily, normalised. Returns null if Google can't answer (caller falls back). */
export async function fetchGoogleWeather(lat: number, lon: number, key: string, air: AirQuality | null): Promise<WeatherData | null> {
  const [current, hoursPage, daysPage] = await Promise.all([
    getJson<GCurrent>(url("currentConditions:lookup", lat, lon, key), { timeoutMs: 4000, revalidate: 600 }),
    fetchHours(lat, lon, key),
    getJson<GDaysPage>(url("forecast/days:lookup", lat, lon, key, { days: String(FORECAST_DAYS), pageSize: String(FORECAST_DAYS) }), {
      timeoutMs: 4000,
      revalidate: 1800,
    }),
  ]);
  const temp = celsius(current?.temperature);
  if (!current || temp == null) return null;

  const gHours = hoursPage?.forecastHours ?? [];
  const offset = offsetSeconds(gHours[0]?.displayDateTime?.utcOffset) ?? 0;
  const timezone = current.timeZone?.id || hoursPage?.timeZone?.id || daysPage?.timeZone?.id || "UTC";

  const hourly: WeatherHour[] = gHours.map((h) => {
    const d = h.displayDateTime ?? {};
    return {
      time: `${d.year}-${pad(d.month)}-${pad(d.day)}T${pad(d.hours)}:00`,
      temp: celsius(h.temperature) ?? temp,
      code: conditionCode(h.weatherCondition),
      label: label(h.weatherCondition),
      isDay: h.isDaytime ?? true,
      precipProb: Math.round(num(h.precipitation?.probability?.percent) ?? 0),
      precip: mm(h.precipitation?.qpf),
      windKmh: kmh(h.wind?.speed) ?? 0,
      windDir: Math.round(num(h.wind?.direction?.degrees) ?? 0),
      humidity: Math.round(num(h.relativeHumidity) ?? 0),
    };
  });

  const daily: WeatherDay[] = (daysPage?.forecastDays ?? []).map((d) => {
    const day = d.daytimeForecast ?? d.fullDayForecast;
    const night = d.nighttimeForecast;
    const parts = [day, night].filter((p): p is GDayPart => Boolean(p));
    const winds = parts.map((p) => kmh(p.wind?.speed)).filter((v): v is number => v != null);
    const dd = d.displayDate ?? {};
    return {
      date: `${dd.year}-${pad(dd.month)}-${pad(dd.day)}`,
      code: conditionCode(day?.weatherCondition ?? night?.weatherCondition),
      label: label(day?.weatherCondition ?? night?.weatherCondition),
      max: celsius(d.maxTemperature) ?? temp,
      min: celsius(d.minTemperature) ?? temp,
      precipProb: Math.max(0, ...parts.map((p) => num(p.precipitation?.probability?.percent) ?? 0)),
      precipSum: rd(parts.reduce((s, p) => s + mm(p.precipitation?.qpf), 0), 2),
      uvMax: num(day?.uvIndex),
      sunrise: localIso(d.sunEvents?.sunriseTime, offset),
      sunset: localIso(d.sunEvents?.sunsetTime, offset),
      windMax: winds.length ? Math.max(...winds) : null,
      windDir: num(day?.wind?.direction?.degrees),
    };
  });

  return {
    source: "google",
    latitude: lat,
    longitude: lon,
    timezone,
    timezoneAbbr: null,
    utcOffsetSec: offset,
    current: {
      temp,
      feelsLike: celsius(current.feelsLikeTemperature) ?? temp,
      humidity: num(current.relativeHumidity) ?? 0,
      dewPoint: celsius(current.dewPoint),
      windKmh: kmh(current.wind?.speed) ?? 0,
      gustKmh: kmh(current.wind?.gust),
      windDir: num(current.wind?.direction?.degrees) ?? 0,
      code: conditionCode(current.weatherCondition),
      label: label(current.weatherCondition),
      isDay: current.isDaytime ?? true,
      precip: hourly[0]?.precip ?? 0,
      cloudCover: num(current.cloudCover) ?? 0,
      pressure: num(current.airPressure?.meanSeaLevelMillibars) ?? 0,
      uv: num(current.uvIndex),
      visibilityM: metres(current.visibility),
      time: localIso(current.currentTime, offset) ?? hourly[0]?.time ?? "",
    },
    hourly,
    daily,
    air,
    updatedAt: new Date().toISOString(),
  };
}
