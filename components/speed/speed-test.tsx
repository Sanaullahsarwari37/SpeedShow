"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Check, Play, RotateCcw, Share2, ShieldCheck, Square, X, Zap } from "lucide-react";

import { NetworkCard } from "@/components/network-card";
import { SpeedGauge } from "@/components/speed/gauge";
import { LiveChart } from "@/components/speed/live-chart";
import { ReadyFor } from "@/components/speed/ready-for";
import { LatencyTile, SpeedTile } from "@/components/speed/result-tiles";
import { Button } from "@/components/ui/button";
import { Chip, SectionIntro } from "@/components/ui/primitives";
import { Surface } from "@/components/ui/surface";
import type { Units } from "@/components/weather/weather-card";
import { WeatherCardSkeleton } from "@/components/weather/weather-skeleton";
import { useThroughputSeries } from "@/hooks/use-live";
import { useNetworkInfo, useWeather } from "@/hooks/use-queries";
import { useSpeedTest } from "@/hooks/use-speed-test";
import { useStoredState } from "@/hooks/use-stored";
import { useFlash } from "@/hooks/use-ui";
import { formatBytes, formatMs, speedLabel, type RateUnit } from "@/lib/format";
import { rateConnection } from "@/lib/rating";
import { PHASE_ORDER, preloadEngine, type Phase } from "@/lib/speedtest";
import { METRICS, TIER_TONE } from "@/lib/theme";
import type { GeoPlace } from "@/lib/types";
import { cn, copyText, cssVars, joinParts } from "@/lib/utils";

/** Weather sits below the test: its code loads after the test is interactive. */
const WeatherCard = React.memo(
  dynamic(() => import("@/components/weather/weather-card"), {
    ssr: false,
    loading: () => <WeatherCardSkeleton />,
  }),
);

/* ----------------------------- storage validators ----------------------------- */

const isPlace = (x: unknown): x is GeoPlace | null => {
  if (x === null) return true;
  if (!x || typeof x !== "object") return false;
  const p = x as Record<string, unknown>;
  return typeof p.name === "string" && typeof p.latitude === "number" && typeof p.longitude === "number" && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180;
};
const isUnits = (v: unknown): v is Units => v === "c" || v === "f";
const isRateUnit = (v: unknown): v is RateUnit => v === "bits" || v === "bytes";

/* ----------------------------- pieces ----------------------------- */

/** Download first (like fast.com), then ping on the quiet line, then upload. */
const STEPS = [
  { phase: "download", metric: METRICS.download },
  { phase: "latency", metric: METRICS.ping },
  { phase: "upload", metric: METRICS.upload },
] as const;
const ORDER: Phase[] = [...PHASE_ORDER, "done"];

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
              active
                ? "border-foreground/25 bg-foreground/[0.07] text-foreground shadow-sm"
                : done
                  ? "border-foreground/12 bg-foreground/[0.04] text-foreground/80"
                  : "border-foreground/[0.08] text-foreground/45",
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
  const [units, setUnits] = useStoredState<Units>("speedshow:units", "c", isUnits);
  const [rateUnit, setRateUnit] = useStoredState<RateUnit>("speedshow:rate-unit", "bits", isRateUnit);
  const [shared, flashShared] = useFlash(1800);

  const lat = place ? place.latitude : network.data?.latitude;
  const lon = place ? place.longitude : network.data?.longitude;
  const hasLocation = lat != null && lon != null;
  const weather = useWeather(lat, lon);

  const { state, start, stop } = useSpeedTest({
    getMeta: () => ({ ip: network.data?.ip, isp: network.data?.isp ?? undefined }),
  });
  const { phase, running, result } = state;
  const target = phase === "download" || phase === "upload" ? state.live : phase === "done" ? (state.download ?? 0) : 0;
  const series = useThroughputSeries(phase, running, state.live);
  const live = running && (phase === "download" || phase === "upload");

  // Auto-start like fast.com: download begins as soon as the page is interactive, on any connection (VPN included).
  // A background tab waits until it is shown, so the result isn't throttled by the browser.
  const autoStarted = React.useRef(false);
  React.useEffect(() => {
    const go = () => {
      if (autoStarted.current || document.visibilityState === "hidden") return;
      autoStarted.current = true;
      void start();
    };
    go();
    if (autoStarted.current) return;
    void preloadEngine();
    document.addEventListener("visibilitychange", go);
    return () => document.removeEventListener("visibilitychange", go);
  }, [start]);

  // Stable callbacks keep the memoised cards below from re-rendering during a test.
  const refetchNetwork = network.refetch;
  const refetchWeather = weather.refetch;
  const retryNetwork = React.useCallback(() => void refetchNetwork(), [refetchNetwork]);
  const retryWeather = React.useCallback(() => void (hasLocation ? refetchWeather() : refetchNetwork()), [hasLocation, refetchWeather, refetchNetwork]);
  // Earlier versions kept a test history in this browser; the feature is gone, so clear what's left.
  React.useEffect(() => {
    try {
      localStorage.removeItem("speedshow:history:v2");
    } catch {
      /* storage unavailable */
    }
  }, []);

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
    idle: "Connecting to the nearest server…",
    download: state.liveLoaded != null ? `Measuring download · ping ${formatMs(state.liveLoaded)} ms under load` : "Measuring download speed…",
    latency: "Measuring ping on a quiet line…",
    upload: state.liveLoaded != null ? `Measuring upload · ping ${formatMs(state.liveLoaded)} ms under load` : "Measuring upload speed…",
    done: `Tested via ${result?.server ?? "Cloudflare"}`,
    error: "",
  }[phase];

  return (
    <div className="space-y-4 sm:space-y-5">
      {network.data?.vpn.detected ? (
        <p role="status" className="rise-in mx-auto flex w-fit items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/[0.06] px-3 py-1 text-xs text-amber-700 dark:text-amber-200/90">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
          VPN detected: results measure the VPN server, not your own line.
        </p>
      ) : null}

      {/* ───────────── Bento: test ───────────── */}
      <section id="test" aria-label="Internet speed test" className="grid scroll-mt-28 grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
        <Surface
          as="div"
          variant="console"
          data-running={running}
          data-done={phase === "done"}
          className="beam rise-in flex flex-col justify-center p-4 sm:p-6 lg:col-span-7 lg:row-span-3"
          style={cssVars({ "--d": "0.08s" })}
        >
          <Steps phase={phase} />
          <SpeedGauge mbps={target} phase={phase} latency={state.latency} unit={rateUnit} className="mt-1" />

          <div className="relative mt-2 flex flex-col items-center gap-2.5">
            {running ? (
              <Button variant="outline" size="lg" onClick={stop} className="min-w-44">
                <Square className="fill-current" /> Stop
              </Button>
            ) : (
              <Button variant="liquid" size="lg" onClick={() => void start()} className="min-w-44">
                {phase === "idle" ? <Play className="fill-current" /> : <RotateCcw />}
                {phase === "idle" ? "Start test" : "Test again"}
              </Button>
            )}
            <p className="min-h-4 text-center text-xs text-muted-foreground" aria-live="polite">
              {status}
            </p>
            {phase === "error" ? (
              <p role="alert" className="flex max-w-md items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-200">
                <X className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                {state.error}
              </p>
            ) : null}
          </div>
          <p className="sr-only" aria-live="polite">
            {phase === "done" && result ? `Test complete. Download ${speedLabel(result.download)}, upload ${speedLabel(result.upload)}, ping ${formatMs(result.latency)} milliseconds.` : ""}
          </p>
        </Surface>

        <div className="rise-in lg:col-span-5" style={cssVars({ "--d": "0.16s" })}>
          <SpeedTile state={state} unit={rateUnit} onUnit={setRateUnit} />
        </div>
        <div className="rise-in lg:col-span-5" style={cssVars({ "--d": "0.24s" })}>
          <LatencyTile state={state} />
        </div>
        <Surface as="div" variant="console" className="rise-in lg:col-span-5" style={cssVars({ "--d": "0.32s" })}>
          <LiveChart series={series} live={live} />
        </Surface>

        {rating && result ? (
          <Surface as="div" className="rise-in px-4 py-4 sm:px-5 lg:col-span-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <Chip tone={TIER_TONE[rating.tier]} icon={Zap}>
                  {rating.label}
                </Chip>
                <p className="min-w-0 text-sm text-pretty text-muted-foreground">{rating.blurb}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-muted-foreground md:inline">
                  via {result.server} · {formatBytes(state.bytes)} used
                </span>
                <Button size="sm" onClick={share}>
                  {shared ? <Check /> : <Share2 />} {shared ? "Copied" : "Share result"}
                </Button>
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2.5 text-xs font-medium text-muted-foreground">Ready for, per device</p>
              <ReadyFor result={result} />
            </div>
          </Surface>
        ) : null}
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
        units={units}
        onUnits={setUnits}
      />

      {/* ───────────── Connection ───────────── */}
      <section id="network" aria-labelledby="network-title" className="scroll-mt-24 pt-10 sm:pt-14">
        <SectionIntro id="network-title" eyebrow="Network" title="Your connection" />
        <div data-reveal="stagger" className="grid grid-cols-1">
          <NetworkCard data={network.data} isLoading={network.isPending} isError={network.isError} isFetching={network.isFetching} onRetry={retryNetwork} />
        </div>
      </section>
    </div>
  );
}
