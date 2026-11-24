"use client";

import { useEffect, useRef, useState } from "react";

import type { Phase } from "@/lib/speedtest";

/** Time constant of the easing: ~63 % of the way to the target in this many ms. */
const EASE_MS = 110;

/**
 * Eases a displayed number towards its target with frame-rate-independent
 * exponential smoothing (identical feel on 60 Hz and 120 Hz screens).
 * Use it in the leaf component that shows the number, so only that
 * component re-renders each frame (not the whole page).
 */
export function useEased(target: number) {
  const [value, setValue] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const d = target - cur.current;
      if (Math.abs(d) <= Math.max(0.0005, Math.abs(target) * 0.002)) {
        cur.current = target;
        setValue(target);
        return;
      }
      cur.current += d * (1 - Math.exp(-dt / EASE_MS));
      setValue(cur.current);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

export type Direction = "download" | "upload";
export interface SeriesPoint {
  phase: Direction;
  mbps: number;
}

/** Samples the live throughput ~8×/s while download/upload runs, for the chart. */
export function useThroughputSeries(phase: Phase, running: boolean, value: number) {
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  // Download is always the first stage, so it marks a new run.
  useEffect(() => {
    if (phase === "download") setSeries([]);
  }, [phase]);

  const sampling = running && (phase === "download" || phase === "upload");
  useEffect(() => {
    if (!sampling) return;
    const dir = phase as Direction;
    const id = setInterval(() => setSeries((s) => [...s, { phase: dir, mbps: latest.current }].slice(-400)), 125);
    return () => clearInterval(id);
  }, [sampling, phase]);

  return series;
}
