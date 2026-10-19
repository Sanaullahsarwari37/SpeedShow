"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { isAbort, runSpeedTest, type Phase } from "@/lib/speedtest";
import type { SpeedResult } from "@/lib/types";
import { uid } from "@/lib/utils";

export interface TestState {
  phase: Phase;
  running: boolean;
  mbps: number;
  fraction: number;
  /** 0..1 across the whole test. */
  overall: number;
  download: number | null;
  upload: number | null;
  latency: number | null;
  jitter: number | null;
  server: string | null;
  error: string | null;
  result: SpeedResult | null;
  /** Live throughput samples (about every 100 ms) for the real-time chart. */
  series: SeriesPoint[];
}

export interface SeriesPoint {
  phase: "download" | "upload";
  mbps: number;
}

const initial: TestState = {
  phase: "idle",
  running: false,
  mbps: 0,
  fraction: 0,
  overall: 0,
  download: null,
  upload: null,
  latency: null,
  jitter: null,
  server: null,
  error: null,
  result: null,
  series: [],
};

function overallOf(phase: Phase, f: number): number {
  switch (phase) {
    case "download":
      return 0.5 * f;
    case "upload":
      return 0.5 + 0.5 * f;
    case "done":
      return 1;
    default:
      return 0;
  }
}

interface Options {
  onComplete?: (r: SpeedResult) => void;
  /** Extra info stored with each result (IP / ISP). */
  getMeta?: () => { ip?: string; isp?: string };
}

export function useSpeedTest({ onComplete, getMeta }: Options = {}) {
  const [state, setState] = useState<TestState>(initial);
  const acRef = useRef<AbortController | null>(null);
  const cbRef = useRef({ onComplete, getMeta });
  cbRef.current = { onComplete, getMeta };

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const ac = new AbortController();
      acRef.current = ac;
      return runSpeedTest({
        signal: ac.signal,
        onUpdate: (u) =>
          setState((s) => ({
            ...s,
            series:
              (u.phase === "download" || u.phase === "upload") && u.fraction < 1
                ? [...s.series, { phase: u.phase, mbps: u.mbps }].slice(-400)
                : s.series,
            phase: u.phase,
            running: u.phase !== "done",
            mbps: u.mbps,
            fraction: u.fraction,
            overall: overallOf(u.phase, u.fraction),
            download: u.download ?? s.download,
            upload: u.upload ?? s.upload,
            latency: u.latency ?? s.latency,
            jitter: u.jitter ?? s.jitter,
            server: u.server ?? s.server,
          })),
      });
    },
    onSuccess: (r) => {
      const meta = cbRef.current.getMeta?.() ?? {};
      const result: SpeedResult = {
        id: uid(),
        at: Date.now(),
        download: r.download,
        upload: r.upload,
        server: r.server,
        latency: r.latency,
        jitter: r.jitter,
        ...meta,
      };
      setState((s) => ({ ...s, phase: "done", running: false, overall: 1, result }));
      cbRef.current.onComplete?.(result);
    },
    onError: (e) => {
      if (isAbort(e)) {
        setState(initial);
        return;
      }
      setState((s) => ({
        ...s,
        phase: "error",
        running: false,
        error: e instanceof Error ? e.message : "The speed test failed. Please try again.",
      }));
    },
  });

  const start = useCallback(() => {
    if (isPending) return;
    setState({ ...initial, phase: "download", running: true });
    mutate();
  }, [isPending, mutate]);

  const stop = useCallback(() => acRef.current?.abort(), []);

  useEffect(() => () => acRef.current?.abort(), []);

  return { state, start, stop };
}
