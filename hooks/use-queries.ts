"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { GeoPlace, NetworkInfo, WeatherData } from "@/lib/types";

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

const MIN = 60_000;

export function useNetworkInfo() {
  return useQuery({
    queryKey: ["network"],
    queryFn: ({ signal }) => fetchJson<NetworkInfo>("/api/network", signal),
    staleTime: 10 * MIN,
    retry: 1,
  });
}

export function useWeather(lat: number | null | undefined, lon: number | null | undefined) {
  return useQuery({
    queryKey: ["weather", lat, lon],
    queryFn: ({ signal }) => fetchJson<WeatherData>(`/api/weather?lat=${lat}&lon=${lon}`, signal),
    enabled: typeof lat === "number" && typeof lon === "number",
    staleTime: 10 * MIN,
    refetchInterval: 15 * MIN,
    // Two retries with backoff ride out a flaky connection; old data stays on screen meanwhile.
    retry: 2,
    retryDelay: (n) => Math.min(8000, 1000 * 2 ** n),
  });
}

export interface LatLon {
  lat: number;
  lon: number;
}

/** Debounced place search. Keeps the previous list visible while typing; `near` ranks nearby places first. */
export function useGeocode(query: string, near?: LatLon | null) {
  const [debounced, setDebounced] = useState(query.trim());
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  // ~10 km is plenty for ranking and keeps the cache key stable.
  const bias = near ? `&lat=${near.lat.toFixed(1)}&lon=${near.lon.toFixed(1)}` : "";
  const result = useQuery({
    queryKey: ["geocode", debounced.toLowerCase(), bias],
    queryFn: async ({ signal }) =>
      (await fetchJson<{ results: GeoPlace[] }>(`/api/geocode?q=${encodeURIComponent(debounced)}${bias}`, signal)).results,
    enabled: debounced.length >= 2,
    staleTime: 60 * MIN,
    placeholderData: keepPreviousData,
    retry: 0,
  });
  return { ...result, debounced };
}
