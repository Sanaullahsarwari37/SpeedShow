"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isAbort, runSpeedTest, type Phase } from "@/lib/speedtest";
import type { SpeedMetrics, SpeedResult } from "@/lib/types";
import { uid } from "@/lib/utils";

export interface TestState extends SpeedMetrics {
  phase: Phase;
  running: boolean;
  /** Latest throughput sample, Mbps. */
  live: number;
  server: string | null;
  error: string | null;
  result: SpeedResult | null;
}

const EMPTY: TestState = {
  phase: "idle",
  running: false,
  live: 0,
  download: null,
  upload: null,
  latency: null,
  jitter: null,
  loadedDown: null,
  loadedUp: null,
  server: null,
  error: null,
  result: null,
};

interface Options {
  onComplete?: (r: SpeedResult) => void;
  /** Extra info stored with each result. */
  getMeta?: () => Pick<SpeedResult, "ip" | "isp">;
}

export function useSpeedTest({ onComplete, getMeta }: Options = {}) {
  const [state, setState] = useState<TestState>(EMPTY);
  const ctrlRef = useRef<AbortController | null>(null);
  const cbRef = useRef({ onComplete, getMeta });
  useEffect(() => {
    cbRef.current = { onComplete, getMeta };
  });

  const start = useCallback(async () => {
    if (ctrlRef.current) return;
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setState({ ...EMPTY, phase: "latency", running: true });

    try {
      const r = await runSpeedTest({
        signal: ctrl.signal,
        onUpdate: (u) => {
          if (!ctrl.signal.aborted) setState((s) => ({ ...s, ...u, running: true }));
        },
      });
      const result: SpeedResult = { id: uid(), at: Date.now(), ...r, ...cbRef.current.getMeta?.() };
      setState((s) => ({ ...s, ...r, phase: "done", running: false, live: r.download ?? 0, result }));
      cbRef.current.onComplete?.(result);
    } catch (e) {
      if (ctrl.signal.aborted || isAbort(e)) return;
      setState((s) => ({
        ...s,
        phase: "error",
        running: false,
        error: e instanceof Error ? e.message : "The speed test failed. Test again.",
      }));
    } finally {
      if (ctrlRef.current === ctrl) ctrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    ctrlRef.current?.abort();
    ctrlRef.current = null;
    setState(EMPTY);
  }, []);

  useEffect(
    () => () => {
      ctrlRef.current?.abort();
      ctrlRef.current = null;
    },
    [],
  );

  return { state, start, stop };
}
