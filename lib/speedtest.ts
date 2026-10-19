/**
 * SpeedShow engine — official @cloudflare/speedtest
 * (same engine as speed.cloudflare.com).
 *
 * Fast path: download → upload immediately.
 * Short ramp for quick results while maintaining useful measurements.
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

export const isAbort = (e: unknown) =>
  e instanceof DOMException && e.name === "AbortError";

const abortError = () => new DOMException("Aborted", "AbortError");

const bpsToMbps = (
  bps: number | undefined | null,
): number => (bps != null && bps > 0 ? bps / 1e6 : 0);

/** Quick but solid measurement ramp. */
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

  // Idle latency and jitter after transfers
  { type: "latency" as const, numPackets: 8 },
];

type Summary = {
  download?: number | null;
  upload?: number | null;
  latency?: number | null;
  jitter?: number | null;
};

/**
 * Cloudflare can return null or undefined for unloaded latency/jitter
 * when the corresponding measurements are unavailable.
 */
type EngineResults = {
  getSummary: () => Summary;
  getUnloadedLatency?: () => number | null | undefined;
  getUnloadedJitter?: () => number | null | undefined;
};

function readLatency(
  results: EngineResults,
): { latency: number | null; jitter: number | null } {
  const summary = results.getSummary();

  const latencyValue =
    results.getUnloadedLatency?.() ?? summary.latency;

  const jitterValue =
    results.getUnloadedJitter?.() ?? summary.jitter;

  return {
    latency:
      latencyValue != null && latencyValue > 0
        ? Math.round(latencyValue * 10) / 10
        : null,

    jitter:
      jitterValue != null && jitterValue > 0
        ? Math.round(jitterValue * 10) / 10
        : null,
  };
}

export async function runSpeedTest(
  opts: RunOptions,
): Promise<RunResult> {
  const { signal, onUpdate } = opts;

  if (signal.aborted) {
    throw abortError();
  }

  const { default: SpeedTest } = await import("@cloudflare/speedtest");

  // The signal may have been aborted while the module was loading.
  if (signal.aborted) {
    throw abortError();
  }

  return new Promise<RunResult>((resolve, reject) => {
    let finished = false;
    let phase: Phase = "download";
    let downloadMbps = 0;
    let uploadMbps = 0;
    let latencyMs: number | null = null;
    let jitterMs: number | null = null;

    const server = "Cloudflare Edge";

    const cleanup = () => {
      signal.removeEventListener("abort", onAbort);

      try {
        engine.pause();
      } catch {
        // Ignore cleanup errors.
      }
    };

    const done = (fn: () => void) => {
      if (finished) return;

      finished = true;
      cleanup();
      fn();
    };

    const fail = (err: unknown) =>
      done(() => {
        if (isAbort(err) || signal.aborted) {
          reject(abortError());
        } else {
          reject(
            err instanceof Error ? err : new Error(String(err)),
          );
        }
      });

    const succeed = (result: RunResult) =>
      done(() => resolve(result));

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
        // Ignore errors while stopping an aborted test.
      }

      fail(abortError());
    };

    signal.addEventListener("abort", onAbort, { once: true });

    const emit = (
      currentPhase: Phase,
      mbps: number,
      fraction: number,
    ) => {
      onUpdate({
        phase: currentPhase,
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

        const { latency, jitter } = readLatency(
          engine.results as EngineResults,
        );

        if (latency != null) latencyMs = latency;
        if (jitter != null) jitterMs = jitter;

        const currentType = (type || "").toLowerCase();

        if (
          currentType.includes("upload") ||
          (ul > 0 && !currentType.includes("download"))
        ) {
          phase = "upload";
        } else {
          phase = "download";
        }

        const live =
          phase === "upload"
            ? uploadMbps || ul
            : downloadMbps || dl;

        let fraction = 0.08;

        if (downloadMbps > 0) {
          fraction = 0.35 + Math.min(0.2, downloadMbps / 500);
        }

        if (uploadMbps > 0) {
          fraction = 0.65 + Math.min(0.25, uploadMbps / 200);
        }

        emit(phase, live, Math.min(0.95, fraction));
      } catch {
        // Intermediate results may be incomplete.
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

        succeed({
          download: dl,
          upload: ul,
          server,
          latency,
          jitter,
        });
      } catch (error) {
        fail(error);
      }
    };

    engine.onError = (error: string) => {
      fail(new Error(error || UNREACHABLE_MESSAGE));
    };

    emit("download", 0, 0);

    try {
      engine.play();
    } catch (error) {
      fail(error);
    }
  });
}

export const toMbps = (bytes: number, ms: number) =>
  ms > 0 ? (bytes * 8) / 1e6 / (ms / 1000) : 0;
