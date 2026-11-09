"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Check, Play, RotateCcw, Share2, Square, X, Zap } from "lucide-react";

import { BlockedScreen } from "@/components/blocked-screen";
import { HistoryCard } from "@/components/history-card";
import { NetworkCard } from "@/components/network-card";
import { SpeedGauge } from "@/components/speed/gauge";
import { LiveChart } from "@/components/speed/live-chart";
import { StatTiles } from "@/components/speed/stat-tiles";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/primitives";
import { Surface } from "@/components/ui/surface";
import { useThroughputSeries } from "@/hooks/use-live";
import { useNetworkInfo, useWeather } from "@/hooks/use-queries";
import { useSpeedTest } from "@/hooks/use-speed-test";
import { useStoredState } from "@/hooks/use-stored";
import { useFlash } from "@/hooks/use-ui";
import { formatMs, speedLabel } from "@/lib/format";
import { rateConnection } from "@/lib/rating";
import { preloadEngine, type Phase } from "@/lib/speedtest";
import { METRICS, TIER_TONE } from "@/lib/theme";
import type { GeoPlace, SpeedResult } from "@/lib/types";
import { cn, copyText, joinParts } from "@/lib/utils";

/** Weather sits below the test: its code loads after the test is interactive. */
const WeatherCard = React.memo(
  dynamic(() => import("@/components/weather/weather-card"), {
    ssr: false,
    loading: () => <div className="glass h-[46rem] animate-pulse rounded-[var(--radius-panel)]" aria-hidden="true" />,
  }),
);

/* ----------------------------- storage validators ----------------------------- */

const isPlace = (x: unknown): x is GeoPlace | null => {
  if (x === null) return true;
  if (!x || typeof x !== "object") return false;
  const p = x as Record<string, unknown>;
  return typeof p.name === "string" && typeof p.latitude === "number" && typeof p.longitude === "number" && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180;
};
const isHistory = (x: unknown): x is SpeedResult[] =>
  Array.isArray(x) && x.every((r) => r && typeof r === "object" && typeof r.id === "string" && typeof r.at === "number");

/** Max wait for the VPN check before auto-starting anyway. */
const NETWORK_WAIT_MS = 2500;

/* ----------------------------- pieces ----------------------------- */

const STEPS = [
  { phase: "latency", metric: METRICS.ping },
  { phase: "download", metric: METRICS.download },
  { phase: "upload", metric: METRICS.upload },
] as const;
const ORDER: Phase[] = ["latency", "download", "upload", "done"];

function Steps({ phase }: { phase: Phase }) {
  const at = ORDER.indexOf(phase);
  return (
    <ol className="relative mx-auto flex max-w-[17rem] items-center gap-1.5" aria-label="Test progress">
      {STEPS.map(({ phase: id, metric: m }, i) => {
        const active = at === i;
        const done = at > i;
        const Icon = done ? Check : m.icon;
        return (
          <li
            key={id}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-full border px-2 py-1.5 text-[0.65rem] font-medium transition-colors duration-300",
              active ? "border-white/30 bg-white/12 text-white" : done ? "border-white/15 bg-white/[0.06] text-white/80" : "border-white/10 text-white/45",
            )}
          >
            <Icon className={cn("size-3", (active || done) && m.text, active && "animate-pulse")} aria-hidden="true" />
            {m.label}
          </li>
        );
      })}
    </ol>
  );
}

/* ----------------------------- main ----------------------------- */

export function SpeedTest() {
  const network = useNetworkInfo();
  const [place, setPlace] = useStoredState<GeoPlace | null>("speedshow:weather-place", null, isPlace);
  const [history, setHistory, historyReady] = useStoredState<SpeedResult[]>("speedshow:history:v2", [], isHistory);
  const [shared, flashShared] = useFlash(1800);

  const lat = place ? place.latitude : network.data?.latitude;
  const lon = place ? place.longitude : network.data?.longitude;
  const hasLocation = lat != null && lon != null;
  const weather = useWeather(lat, lon);

  const { state, start, stop } = useSpeedTest({
    onComplete: (r) => setHistory((prev) => [r, ...prev].slice(0, 20)),
    getMeta: () => ({ ip: network.data?.ip, isp: network.data?.isp ?? undefined }),
  });
  const { phase, running, result } = state;
  const target = phase === "download" || phase === "upload" ? state.live : phase === "done" ? (state.download ?? 0) : 0;
  const series = useThroughputSeries(phase, running, state.live);
  const live = running && (phase === "download" || phase === "upload");

  // Auto-start like fast.com once the VPN check answered (or after a short wait).
  const blocked = network.data?.risk.blocked === true;
  const [waited, setWaited] = React.useState(false);
  React.useEffect(() => {
    const idle = "requestIdleCallback" in window ? window.requestIdleCallback(() => void preloadEngine()) : 0;
    const t = setTimeout(() => setWaited(true), NETWORK_WAIT_MS);
    return () => {
      clearTimeout(t);
      if (idle) window.cancelIdleCallback(idle);
    };
  }, []);
  const autoStarted = React.useRef(false);
  const ready = !blocked && (!network.isPending || waited);
  React.useEffect(() => {
    if (!ready || autoStarted.current || document.visibilityState === "hidden") return;
    const t = setTimeout(() => {
      autoStarted.current = true;
      void start();
    }, 250);
    return () => clearTimeout(t);
  }, [ready, start]);

  // Stable callbacks keep the memoised cards below from re-rendering during a test.
  const refetchNetwork = network.refetch;
  const refetchWeather = weather.refetch;
  const retryNetwork = React.useCallback(() => void refetchNetwork(), [refetchNetwork]);
  const retryWeather = React.useCallback(() => void (hasLocation ? refetchWeather() : refetchNetwork()), [hasLocation, refetchWeather, refetchNetwork]);
  const clearHistory = React.useCallback(() => setHistory([]), [setHistory]);

  if (blocked && network.data) {
    return <BlockedScreen risk={network.data.risk} isFetching={network.isFetching} onRecheck={retryNetwork} />;
  }

  const rating = result ? rateConnection(result) : null;
  const placeLabel = place
    ? joinParts([place.name, place.admin1, place.country])
    : network.data
      ? joinParts([network.data.city, network.data.country])
      : "";

  const share = async () => {
    if (!result) return;
    const text = `My internet speed on SpeedShow: ↓ ${speedLabel(result.download)} · ↑ ${speedLabel(result.upload)} · ${formatMs(result.latency)} ms ping`;
    const url = window.location.origin;
    try {
      if (navigator.share) return await navigator.share({ title: "My SpeedShow result", text, url });
    } catch {
      return; // dismissed
    }
    if (await copyText(`${text} — ${url}`)) flashShared();
  };

  const status = {
    idle: "Starting automatically · private",
    latency: "Measuring ping…",
    download: "Measuring download…",
    upload: "Measuring upload…",
    done: `Tested via ${result?.server ?? "Cloudflare"}`,
    error: "",
  }[phase];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ───────────── Speed test ───────────── */}
      <section aria-label="Internet speed test" className="rise-in grid items-stretch gap-4 sm:gap-5 lg:grid-cols-12" style={{ "--d": "0.1s" } as React.CSSProperties}>
        <Surface as="div" variant="console" className="flex flex-col justify-center p-4 sm:p-6 lg:order-2 lg:col-span-7">
          <div aria-hidden="true" className="pointer-events-none absolute -top-20 -left-16 size-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -bottom-20 size-64 rounded-full bg-violet-500/20 blur-3xl" />

          <Steps phase={phase} />
          <SpeedGauge mbps={target} phase={phase} latency={state.latency} className="mt-1" />

          <div className="relative mt-2 flex flex-col items-center gap-2.5">
            {running ? (
              <Button variant="onDark" size="lg" onClick={stop} className="min-w-44">
                <Square className="fill-current" /> Stop
              </Button>
            ) : (
              <Button variant="liquid" size="lg" onClick={() => void start()} className="min-w-44">
                {phase === "idle" ? <Play className="fill-current" /> : <RotateCcw />}
                {phase === "idle" ? "Start test" : "Test again"}
              </Button>
            )}
            <p className="min-h-4 text-center text-xs text-white/55" aria-live="polite">
              {status}
            </p>
            {phase === "error" ? (
              <p role="alert" className="flex max-w-md items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                <X className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                {state.error}
              </p>
            ) : null}
          </div>
          <p className="sr-only" aria-live="polite">
            {phase === "done" && result ? `Test complete. Download ${speedLabel(result.download)}, upload ${speedLabel(result.upload)}, ping ${formatMs(result.latency)} milliseconds.` : ""}
          </p>
        </Surface>

        <div className="flex flex-col gap-4 sm:gap-5 lg:order-1 lg:col-span-5">
          <StatTiles state={state} />
          <Surface as="div" variant="console" pad="md" className="flex flex-1 flex-col justify-center">
            <LiveChart series={series} live={live} />
          </Surface>
          <Surface as="div" variant={rating ? "glass" : "soft"} className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
            {rating && result ? (
              <>
                <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2.5">
                  <Chip tone={TIER_TONE[rating.tier]} icon={Zap}>
                    {rating.label}
                  </Chip>
                  <p className="min-w-0 text-sm text-pretty text-muted-foreground">{rating.blurb}</p>
                </div>
                <Button size="sm" onClick={share}>
                  {shared ? <Check /> : <Share2 />} {shared ? "Copied" : "Share"}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Tip: pause other downloads and streams for the most accurate result.</p>
            )}
          </Surface>
        </div>
      </section>

      {/* ───────────── Weather & local time ───────────── */}
      <WeatherCard
        data={weather.data}
        isLoading={(!place && network.isPending) || weather.isLoading}
        isError={weather.isError}
        isFetching={weather.isFetching}
        placeLabel={placeLabel}
        hasLocation={hasLocation}
        custom={place !== null}
        onSelectPlace={setPlace}
        onRetry={retryWeather}
      />

      {/* ───────────── Connection & history ───────────── */}
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
        <NetworkCard data={network.data} isLoading={network.isPending} isError={network.isError} isFetching={network.isFetching} onRetry={retryNetwork} />
        <HistoryCard items={history} ready={historyReady} onClear={clearHistory} />
      </div>
    </div>
  );
}
