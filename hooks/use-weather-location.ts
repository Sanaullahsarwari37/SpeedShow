"use client";

import { useCallback, useEffect, useState } from "react";

import type { GeoPlace } from "@/lib/types";

const KEY = "speedshow:weather-loc";

function valid(x: unknown): x is GeoPlace {
  if (!x || typeof x !== "object") return false;
  const p = x as Record<string, unknown>;
  return (
    typeof p.name === "string" &&
    typeof p.latitude === "number" &&
    typeof p.longitude === "number" &&
    Math.abs(p.latitude) <= 90 &&
    Math.abs(p.longitude) <= 180
  );
}

/** A city the visitor picked for the weather card (kept in this browser only). `null` = use detected location. */
export function useWeatherLocation() {
  const [place, setPlace] = useState<GeoPlace | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (valid(parsed)) setPlace(parsed);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  const choose = useCallback((p: GeoPlace | null) => {
    setPlace(p);
    try {
      if (p) localStorage.setItem(KEY, JSON.stringify(p));
      else localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { place, choose };
}
