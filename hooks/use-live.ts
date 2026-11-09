"use client";

import { useEffect, useRef, useState } from "react";

import type { Phase } from "@/lib/speedtest";

/**
 * Eases a displayed number towards its target on animation frames.
 * Use it in the leaf component that shows the number, so only that
 * component re-renders each frame (not the whole page).
 */
export function useEased(target: number) {
  const [value, setValue] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    let raf = 0;
    const step = () => {
      const d = target - cur.current;
      if (Math.abs(d) <= Math.max(0.0005, Math.abs(target) * 0.002)) {
        cur.current = target;
        setValue(target);
        return;
      }
      cur.current += d * 0.15;
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
  useEffect(() => {
    if (phase === "latency") setSeries([]);
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
