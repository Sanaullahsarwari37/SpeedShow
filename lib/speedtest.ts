/**
 * SpeedShow engine — official `@cloudflare/speedtest` (same as speed.cloudflare.com).
 * Fast path: download → upload immediately. Short ramp for quick results; still accurate.
 */

export type Phase = "idle" | "download" | "upload" | "done" | "error";

export const CLOUDFLARE_HOST = "https://speed.cloudflare.com";

export interface TestUpdate {
  phase: Phase;
  mbps: number;
  fraction: number;
  download?: number;
  upload?: number;
  latency?: number;
  jitter?: number;
  server?: string;
}

export interface RunOptions {
  signal: AbortSignal;
  onUpdate: (u: TestUpdate) => void;
  host?: string;
  skipLatency?: boolean;
}

export interface RunResult {
  download: number;
  upload: number;
  server: string;
  latency: number | null;
  jitter: number | null;
}

export const UNREACHABLE_MESSAGE =
  "Couldn't reach Cloudflare's speed servers. Check your connection, turn off any VPN or ad-blocker, and try again.";

export const isAbort = (e: unknown) => e instanceof DOMException && e.name === "AbortError";

const abortError = () => new DOMException("Aborted", "AbortError");
const bpsToMbps = (bps: number | undefined | null) => (bps != null && bps > 0 ? bps / 1e6 : 0);

/** Quick but solid ramp — finishes in a few seconds on typical links. */
const FAST_MEASUREMENTS = [
  // Download first
  { type: "download" as const, bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: "download" as const, bytes: 1e6, count: 3 },
  { type: "download" as const, bytes: 1e7, count: 3 },
  { type: "download" as const, bytes: 2.5e7, count: 2 },
  { type: "download" as const, bytes: 1e8, count: 2 },
  // Upload second
  { type: "upload" as const, bytes: 1e5, count: 3 },
  { type: "upload" as const, bytes: 1e6, count: 3 },
  { type: "upload" as const, bytes: 1e7, count: 2 },
  { type: "upload" as const, bytes: 2.5e7, count: 2 },
  // Latency + jitter after transfers (idle ping)
  { type: "latency" as const, numPackets: 8 },
];

type Summary = { download?: number; upload?: number; latency?: number; jitter?: number };
type EngineResults = {
  getSummary: () => Summary;
  getUnloadedLatency?: () => number | undefined;
  getUnloadedJitter?: () => number | undefined;
};

function readLatency(results: EngineResults): { latency: number | null; jitter: number | null } {
  const s = results.getSummary();
  const lat = results.getUnloadedLatency?.() ?? s.latency;
  const jit = results.getUnloadedJitter?.() ?? s.jitter;
  return {
    latency: lat != null && lat > 0 ? Math.round(lat * 10) / 10 : null,
    jitter: jit != null && jit > 0 ? Math.round(jit * 10) / 10 : null,
  };
}

export async function runSpeedTest(opts: RunOptions): Promise<RunResult> {
  const { signal, onUpdate } = opts;
  if (signal.aborted) throw abortError();

  const { default: SpeedTest } = await import("@cloudflare/speedtest");

  return new Promise<RunResult>((resolve, reject) => {
    let finished = false;
    let phase: Phase = "download";
    let downloadMbps = 0;
    let uploadMbps = 0;
    let latencyMs: number | null = null;
    let jitterMs: number | null = null;
    const server = "Cloudflare Edge";

    const done = (fn: () => void) => {
      if (finished) return;
      finished = true;
      cleanup();
      fn();
    };

    const fail = (err: unknown) =>
      done(() => {
        if (isAbort(err) || signal.aborted) reject(abortError());
        else reject(err instanceof Error ? err : new Error(String(err)));
      });

    const succeed = (r: RunResult) => done(() => resolve(r));

    const engine = new SpeedTest({
      autoStart: false,
      logAimApiUrl: null,
      logMeasurementApiUrl: null,
      measurements: FAST_MEASUREMENTS,
      measureDownloadLoadedLatency: false,
      measureUploadLoadedLatency: false,
      bandwidthFinishRequestDuration: 700,
      bandwidthPercentile: 0.9,
      latencyPercentile: 0.5,
      bandwidthMinRequestDuration: 8,
    });

    const onAbort = () => {
      try {
        engine.pause();
      } catch {
        /* ignore */
      }
      fail(abortError());
    };
    signal.addEventListener("abort", onAbort, { once: true });

    const cleanup = () => {
      signal.removeEventListener("abort", onAbort);
      try {
        engine.pause();
      } catch {
        /* ignore */
      }
    };

    const emit = (p: Phase, mbps: number, fraction: number) => {
      onUpdate({
        phase: p,
        mbps,
        fraction,
        download: downloadMbps || undefined,
        upload: uploadMbps || undefined,
        latency: latencyMs ?? undefined,
        jitter: jitterMs ?? undefined,
        server,
      });
    };

    engine.onResultsChange = ({ type }: { type?: string }) => {
      if (finished || signal.aborted) return;
      try {
        const summary = engine.results.getSummary() as Summary;
        const dl = bpsToMbps(summary.download);
        const ul = bpsToMbps(summary.upload);
        if (dl > 0) downloadMbps = dl;
        if (ul > 0) uploadMbps = ul;

        const { latency, jitter } = readLatency(engine.results as EngineResults);
        if (latency != null) latencyMs = latency;
        if (jitter != null) jitterMs = jitter;

        const t = (type || "").toLowerCase();
        if (t.includes("upload") || (ul > 0 && !t.includes("download"))) phase = "upload";
        else phase = "download";

        const live = phase === "upload" ? uploadMbps || ul : downloadMbps || dl;
        let fraction = 0.08;
        if (downloadMbps > 0) fraction = 0.35 + Math.min(0.2, downloadMbps / 500);
        if (uploadMbps > 0) fraction = 0.65 + Math.min(0.25, uploadMbps / 200);

        emit(phase, live, Math.min(0.95, fraction));
      } catch {
        /* incomplete */
      }
    };

    engine.onFinish = (results: EngineResults) => {
      if (finished) return;
      try {
        const summary = results.getSummary();
        const dl = bpsToMbps(summary.download);
        const ul = bpsToMbps(summary.upload);
        const { latency, jitter } = readLatency(results);

        if (dl <= 0 && ul <= 0) {
          fail(new Error(UNREACHABLE_MESSAGE));
          return;
        }

        downloadMbps = dl;
        uploadMbps = ul;
        latencyMs = latency;
        jitterMs = jitter;

        emit("done", dl, 1);
        succeed({ download: dl, upload: ul, server, latency, jitter });
      } catch (e) {
        fail(e);
      }
    };

    engine.onError = (err: string) => fail(new Error(err || UNREACHABLE_MESSAGE));

    emit("download", 0, 0);
    try {
      engine.play();
    } catch (e) {
      fail(e);
    }
  });
}

export const toMbps = (bytes: number, ms: number) => (ms > 0 ? (bytes * 8) / 1e6 / (ms / 1000) : 0);
