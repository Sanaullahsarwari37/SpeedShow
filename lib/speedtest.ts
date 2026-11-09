/**
 * SpeedShow measurement engine, built on the official @cloudflare/speedtest
 * library (the engine behind speed.cloudflare.com).
 *
 * Order (like fast.com): idle latency → download → upload. Each direction
 * ramps payload sizes and stops growing once a request lasts ~1 s, so slow
 * lines finish quickly and gigabit lines still get saturated. Final bandwidth
 * is the 90th percentile of samples; latency is the median. Loaded latency
 * (ping while the line is busy) exposes bufferbloat.
 */

import type { SpeedMetrics } from "@/lib/types";

export type Phase = "idle" | "latency" | "download" | "upload" | "done" | "error";

export interface TestUpdate extends SpeedMetrics {
  phase: Phase;
  /** Latest throughput sample (Mbps) for the active direction. */
  live: number;
}

export interface RunResult extends SpeedMetrics {
  server: string;
}

export const UNREACHABLE_MESSAGE =
  "Couldn't reach Cloudflare's test servers. Check your connection, pause any ad-blocker or firewall that blocks speed.cloudflare.com, then test again.";
const STALLED_MESSAGE = "The test stalled because no data arrived for 20 seconds. Your connection may have dropped. Test again.";

const STALL_MS = 20_000;
const TRACE_URL = "https://speed.cloudflare.com/cdn-cgi/trace";

const MEASUREMENTS = [
  { type: "latency" as const, numPackets: 1 }, // opens the connection (TLS handshake) so it doesn't skew results
  { type: "latency" as const, numPackets: 16 },
  { type: "download" as const, bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: "download" as const, bytes: 1e5, count: 6 },
  { type: "download" as const, bytes: 1e6, count: 5 },
  { type: "download" as const, bytes: 1e7, count: 4 },
  { type: "download" as const, bytes: 2.5e7, count: 3 },
  { type: "download" as const, bytes: 1e8, count: 2 },
  { type: "upload" as const, bytes: 1e5, count: 5 },
  { type: "upload" as const, bytes: 1e6, count: 4 },
  { type: "upload" as const, bytes: 1e7, count: 3 },
  { type: "upload" as const, bytes: 2.5e7, count: 2 },
  { type: "upload" as const, bytes: 5e7, count: 2 },
];

/** Cloudflare data-centre codes → city, for the most common edges. */
const COLO: Record<string, string> = {
  AMS: "Amsterdam", ARN: "Stockholm", ATL: "Atlanta", BKK: "Bangkok", BOM: "Mumbai", CDG: "Paris", CGK: "Jakarta",
  DEL: "New Delhi", DFW: "Dallas", DOH: "Doha", DXB: "Dubai", EWR: "Newark", FRA: "Frankfurt", GRU: "São Paulo",
  HKG: "Hong Kong", IAD: "Ashburn", IST: "Istanbul", JNB: "Johannesburg", KHI: "Karachi", KUL: "Kuala Lumpur",
  LAX: "Los Angeles", LHR: "London", ISB: "Islamabad", LHE: "Lahore", MAD: "Madrid", MAN: "Manchester", MIA: "Miami",
  MRS: "Marseille", MXP: "Milan", NRT: "Tokyo", ORD: "Chicago", RUH: "Riyadh", SEA: "Seattle", SIN: "Singapore",
  SJC: "San Jose", SYD: "Sydney", TAS: "Tashkent", THR: "Tehran", WAW: "Warsaw", YYZ: "Toronto", ZRH: "Zurich", VIE: "Vienna",
};

/** Which Cloudflare edge serves this visitor, e.g. "Frankfurt (FRA)". Never throws. */
export async function fetchServerName(signal?: AbortSignal): Promise<string> {
  try {
    const res = await fetch(TRACE_URL, { signal, cache: "no-store" });
    const colo = /^colo=([A-Z]{3})$/m.exec(await res.text())?.[1];
    if (colo) return COLO[colo] ? `${COLO[colo]} (${colo})` : `Cloudflare ${colo}`;
  } catch {
    /* blocked by CORS or network: fall through */
  }
  return "Cloudflare edge";
}

export const isAbort = (e: unknown) => e instanceof DOMException && e.name === "AbortError";
const abortError = () => new DOMException("Aborted", "AbortError");

const mbps = (bps: unknown): number | null => (typeof bps === "number" && bps > 0 ? bps / 1e6 : null);
const ms = (v: unknown): number | null => (typeof v === "number" && v > 0 ? Math.round(v * 10) / 10 : null);

/** The subset of the engine's results API we rely on (all optional for safety across versions). */
interface EngineResults {
  /** The library returns a typed summary object; we read the fields we need defensively. */
  getSummary: () => object;
  getUnloadedLatency?: () => number | null | undefined;
  getUnloadedJitter?: () => number | null | undefined;
  getDownLoadedLatency?: () => number | null | undefined;
  getUpLoadedLatency?: () => number | null | undefined;
  getDownloadBandwidthPoints?: () => { bps?: number }[];
  getUploadBandwidthPoints?: () => { bps?: number }[];
}

function readMetrics(r: EngineResults): SpeedMetrics {
  const sum = (r.getSummary() ?? {}) as Record<string, unknown>;
  return {
    download: mbps(sum.download),
    upload: mbps(sum.upload),
    latency: ms(r.getUnloadedLatency?.() ?? sum.latency),
    jitter: ms(r.getUnloadedJitter?.() ?? sum.jitter),
    loadedDown: ms(r.getDownLoadedLatency?.() ?? sum.downLoadedLatency),
    loadedUp: ms(r.getUpLoadedLatency?.() ?? sum.upLoadedLatency),
  };
}

function lastSample(points: { bps?: number }[] | undefined): number | null {
  return points?.length ? mbps(points[points.length - 1]?.bps) : null;
}

/** Load the engine ahead of time (call when the browser is idle). */
export const preloadEngine = () => import("@cloudflare/speedtest").catch(() => undefined);

export async function runSpeedTest({
  signal,
  onUpdate,
}: {
  signal: AbortSignal;
  onUpdate: (u: TestUpdate) => void;
}): Promise<RunResult> {
  if (signal.aborted) throw abortError();
  const serverPromise = fetchServerName(signal);
  const { default: SpeedTest } = await import("@cloudflare/speedtest");
  if (signal.aborted) throw abortError();

  return new Promise<RunResult>((resolve, reject) => {
    let settled = false;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    let phase: Phase = "latency";
    let live = 0;

    const engine = new SpeedTest({
      autoStart: false,
      measurements: MEASUREMENTS,
      logMeasurementApiUrl: null,
      logAimApiUrl: null,
      measureDownloadLoadedLatency: true,
      measureUploadLoadedLatency: true,
      bandwidthFinishRequestDuration: 1000,
      bandwidthMinRequestDuration: 10,
      bandwidthPercentile: 0.9,
      latencyPercentile: 0.5,
    });

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      signal.removeEventListener("abort", onAbort);
      try {
        engine.pause();
      } catch {
        /* already stopped */
      }
      fn();
    };
    const fail = (err: unknown) =>
      finish(() => reject(signal.aborted ? abortError() : err instanceof Error ? err : new Error(String(err || UNREACHABLE_MESSAGE))));
    const onAbort = () => fail(abortError());
    const armWatchdog = () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(() => fail(new Error(STALLED_MESSAGE)), STALL_MS);
    };

    signal.addEventListener("abort", onAbort, { once: true });

    engine.onResultsChange = ({ type }: { type?: string }) => {
      if (settled) return;
      armWatchdog();
      try {
        const results = engine.results as EngineResults;
        if (type === "download" || type === "upload") phase = type;
        const sample =
          phase === "download"
            ? lastSample(results.getDownloadBandwidthPoints?.())
            : phase === "upload"
              ? lastSample(results.getUploadBandwidthPoints?.())
              : null;
        const metrics = readMetrics(results);
        live = sample ?? (phase === "upload" ? metrics.upload : metrics.download) ?? live;
        onUpdate({ ...metrics, phase, live });
      } catch {
        /* intermediate results can be incomplete */
      }
    };

    engine.onFinish = (results: EngineResults) => {
      const metrics = readMetrics(results);
      if (!metrics.download && !metrics.upload) return fail(new Error(UNREACHABLE_MESSAGE));
      const fallback = new Promise<string>((r) => setTimeout(() => r("Cloudflare edge"), 1500));
      void Promise.race([serverPromise, fallback]).then((server) => finish(() => resolve({ ...metrics, server })));
    };

    engine.onError = (e: unknown) => fail(new Error(typeof e === "string" && e ? `${UNREACHABLE_MESSAGE} (${e})` : UNREACHABLE_MESSAGE));

    onUpdate({ download: null, upload: null, latency: null, jitter: null, loadedDown: null, loadedUp: null, phase, live: 0 });
    armWatchdog();
    try {
      engine.play();
    } catch (e) {
      fail(e);
    }
  });
}
