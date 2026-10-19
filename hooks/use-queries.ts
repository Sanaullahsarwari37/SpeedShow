"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { GeoPlace, NetworkInfo, WeatherData } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) msg = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export function useNetworkInfo() {
  return useQuery({
    queryKey: ["network"],
    queryFn: () => fetchJson<NetworkInfo>("/api/network"),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useWeather(lat: number | null | undefined, lon: number | null | undefined) {
  const enabled = typeof lat === "number" && typeof lon === "number";
  return useQuery({
    queryKey: ["weather", lat, lon],
    queryFn: () => fetchJson<WeatherData>(`/api/weather?lat=${lat}&lon=${lon}`),
    enabled,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    retry: 1,
  });
}

/** Debounced city search (Open-Meteo geocoding). */
export function useGeocode(query: string) {
  const [debounced, setDebounced] = useState(query.trim());
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 280);
    return () => clearTimeout(t);
  }, [query]);
  const enabled = debounced.length >= 2;
  return {
    debounced,
    ...useQuery({
      queryKey: ["geocode", debounced.toLowerCase()],
      queryFn: async () => (await fetchJson<{ results: GeoPlace[] }>(`/api/geocode?q=${encodeURIComponent(debounced)}`)).results,
      enabled,
      staleTime: 60 * 60 * 1000,
      retry: 0,
    }),
  };
}
