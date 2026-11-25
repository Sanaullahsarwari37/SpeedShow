"use client";

import * as React from "react";

import { useNow } from "@/hooks/use-now";
import { moonPhase, SUN_ELEVATION, sunDay } from "@/lib/astro";
import { formatClock, formatMinutes, formatZoned, isoMinutes, zonedMinutes, zonedParts } from "@/lib/format";
import type { WeatherData, WeatherDay } from "@/lib/types";
import { dayPart } from "@/lib/weather";

const dateKey = (p: { year: number; month: number; day: number }) => `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;

/**
 * Where the sun and moon are right now at the place, updated once a minute
 * (not every second, so the whole weather card doesn't re-render per tick).
 */
export function useSunState(data: WeatherData | undefined) {
  const now = useNow(60_000);
  return React.useMemo(() => {
    if (!data) return null;
    const tz = data.timezone;
    const p = now !== null ? zonedParts(new Date(now), tz) : null;
    const localDate = p ? dateKey(p) : data.current.time.slice(0, 10);
    const idx = Math.max(0, data.daily.findIndex((d) => d.date === localDate));
    const today: WeatherDay | undefined = data.daily[idx];
    const minutes = now !== null ? zonedMinutes(new Date(now), tz) : (isoMinutes(data.current.time) ?? 720);
    // Sun events from the orbital formulas; Open-Meteo's sunrise / sunset win when present.
    const [y, mo, d] = localDate.split("-").map(Number);
    const astro = sunDay(data.latitude, data.longitude, y, mo, d);
    const local = (ms: number) => zonedMinutes(new Date(ms), tz);
    const between = (e: number) => {
      const t = astro.at(e);
      return t ? { up: local(t.up), down: local(t.down) } : null;
    };
    const riseSet = between(SUN_ELEVATION.riseSet);
    const rise = isoMinutes(today?.sunrise) ?? riseSet?.up ?? null;
    const set = isoMinutes(today?.sunset) ?? riseSet?.down ?? null;
    const nextRise = isoMinutes(data.daily[idx + 1]?.sunrise) ?? rise;
    const part = dayPart(minutes, rise, set, data.current.isDay);
    const polar = rise == null || set == null || set <= rise;
    const isUp = polar ? data.current.isDay : minutes >= rise && minutes < set;

    let sun: number | null = isUp ? 0.5 : null;
    let night: number | null = isUp ? null : 0.5;
    let next = isUp ? "Polar day" : "Polar night";
    if (!polar) {
      if (isUp) {
        sun = (minutes - rise) / (set - rise);
        next = `Sunset in ${formatMinutes(set - minutes)}`;
      } else {
        // Night runs from sunset to the next sunrise, possibly across midnight.
        const length = 1440 - set + (nextRise ?? rise);
        night = Math.min(1, (minutes >= set ? minutes - set : 1440 - set + minutes) / length);
        next = `Sunrise in ${formatMinutes(minutes < rise ? rise - minutes : 1440 - minutes + (nextRise ?? rise))}`;
      }
    }
    const moon = moonPhase(now ?? Date.parse(data.updatedAt));
    const tomorrow: WeatherDay | undefined = data.daily[idx + 1];
    const tRise = isoMinutes(tomorrow?.sunrise);
    const tSet = isoMinutes(tomorrow?.sunset);
    return {
      part,
      sun,
      night,
      rise,
      set,
      polar,
      isUp,
      next,
      daylight: polar ? null : set - rise,
      /** Tomorrow's daylight minus today's, minutes (null when unknown). */
      daylightChange: !polar && tRise != null && tSet != null && tSet > tRise ? tSet - tRise - (set - rise) : null,
      /** Minutes since local midnight at the place. */
      minutes,
      /** Solar noon (local minutes) and the sun's highest elevation today. */
      noon: local(astro.noon),
      peak: astro.peak,
      /** Sun below 6°: morning golden hour ends at `up`, evening one starts at `down`. */
      golden: between(SUN_ELEVATION.golden),
      /** Civil twilight: first light (`up`) and dark (`down`). */
      civil: between(SUN_ELEVATION.civil),
      moon,
      /** "today 3:59 PM", "tomorrow" or "Sat, 6 Dec", in the place's time zone. */
      when: (ms: number) => {
        const at = zonedParts(new Date(ms), tz);
        const ahead = Math.round((Date.UTC(at.year, at.month - 1, at.day) - Date.UTC(y, mo - 1, d)) / 86_400_000);
        if (ahead <= 0) return `today ${formatClock(at.hour * 60 + at.minute)}`;
        if (ahead === 1) return `tomorrow ${formatClock(at.hour * 60 + at.minute)}`;
        return formatZoned(new Date(ms), tz, { weekday: "short", day: "numeric", month: "short" });
      },
      today,
    };
  }, [data, now]);
}

export type SunState = NonNullable<ReturnType<typeof useSunState>>;
