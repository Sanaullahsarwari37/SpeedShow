"use client";

import * as React from "react";

import { useNow } from "@/hooks/use-now";
import { formatMinutes, isoMinutes, zonedMinutes, zonedParts } from "@/lib/format";
import type { WeatherData, WeatherDay } from "@/lib/types";
import { dayPart, moonPhase } from "@/lib/weather";

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
    const localDate = p ? `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}` : data.current.time.slice(0, 10);
    const idx = Math.max(0, data.daily.findIndex((d) => d.date === localDate));
    const today: WeatherDay | undefined = data.daily[idx];
    const minutes = now !== null ? zonedMinutes(new Date(now), tz) : (isoMinutes(data.current.time) ?? 720);
    const rise = isoMinutes(today?.sunrise);
    const set = isoMinutes(today?.sunset);
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
    return { part, sun, night, rise, set, polar, isUp, next, daylight: polar ? null : set - rise, moon: moonPhase(now ?? Date.now()), today };
  }, [data, now]);
}

export type SunState = NonNullable<ReturnType<typeof useSunState>>;
