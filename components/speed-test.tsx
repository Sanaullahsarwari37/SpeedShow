"use client";

import * as React from "react";
import { ArrowDownToLine, ArrowUpFromLine, Check, Play, RotateCcw, Share2, Square, X, Zap } from "lucide-react";

import { BlockedScreen } from "@/components/blocked-screen";
import { LiveChart } from "@/components/live-chart";
import { NetworkCard } from "@/components/network-card";
import { SpeedGauge } from "@/components/speed-gauge";
import { StatTiles } from "@/components/stat-tiles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WeatherCard } from "@/components/weather-card";
import { useNetworkInfo, useWeather } from "@/hooks/use-queries";
import { useSpeedTest } from "@/hooks/use-speed-test";
import { useWeatherLocation } from "@/hooks/use-weather-location";
import { speedLabel } from "@/lib/format";
import { rateConnection } from "@/lib/rating";
import type { Phase } from "@/lib/speedtest";
import { cn } from "@/lib/utils";

const STEPS: { id: Phase; label: string; icon: React.ElementType }[] = [
  { id: "download", label: "Download", icon: ArrowDownToLine },
  { id: "upload", label: "Upload", icon: ArrowUpFromLine },
];

const TIER_VARIANT = {
  slow: "danger",
  fair: "warning",
  good: "default",
  great: "success",
  excellent: "success",
  blazing: "success",
} as const;

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div className={cn("fade-up", className)} style={{ "--d": `${delay}s` } as React.CSSProperties}>
      {children}
    </div>
  );
}

export function SpeedTest() {
  const network = useNetworkInfo();
  const { place, choose } = useWeatherLocation();
  const lat = place ? place.latitude : network.data?.latitude;
  const lon = place ? place.longitude : network.data?.longitude;
  const weather = useWeather(lat, lon);
  const [copied, setCopied] = React.useState(false);

  const { state, start, stop } = useSpeedTest({
    onComplete: undefined,
    getMeta: () => ({ ip: network.data?.ip, isp: network.data?.isp ?? undefined }),
  });

  const { phase, running } = state;
  const result = state.result;
  const rating = result ? rateConnection(result) : null;
  const stepIndex = STEPS.findIndex((s) => s.id === phase);
  const gaugeValue = phase === "done" && result ? result.download : phase === "idle" || phase === "error" ? 0 : state.mbps;
  const detected = network.data ? [network.data.city, network.data.country].filter(Boolean).join(", ") : "";
  const placeLabel = place ? [place.name, place.admin1, place.country].filter(Boolean).join(", ") : detected;
  const live = running && (phase === "download" || phase === "upload");

  if (network.data?.risk.blocked) {
    return <BlockedScreen risk={network.data.risk} isFetching={network.isFetching} onRecheck={() => void network.refetch()} />;
  }

  const share = async () => {
    if (!result) return;
    const latPart =
      result.latency != null && result.latency > 0
        ? ` · ${result.latency < 10 ? result.latency.toFixed(1) : Math.round(result.latency)} ms`
        : "";
    const text = `My internet speed on SpeedShow: ↓ ${speedLabel(result.download)} · ↑ ${speedLabel(result.upload)}${latPart}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "SpeedShow result", text, url: window.location.origin });
      } else {
        await navigator.clipboard.writeText(`${text} — ${window.location.origin}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Speed test — gauge first (most important), then results */}
      <section aria-label="Internet speed test" className="space-y-4 sm:space-y-5">
        <div className="grid items-stretch gap-4 sm:gap-5 lg:grid-cols-12">
          {/* Gauge — full width on mobile, focused */}
          <div className="panel-hero fade-up relative overflow-hidden rounded-[1.5rem] p-4 sm:rounded-[1.75rem] sm:p-5 lg:col-span-7 lg:order-2 lg:p-6">
            <div aria-hidden="true" className="pointer-events-none absolute -top-20 -left-16 size-64 rounded-full bg-blue-500/20 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-12 -bottom-20 size-64 rounded-full bg-violet-500/20 blur-3xl" />

            <ol className="relative mx-auto mb-1 flex max-w-[12rem] items-center gap-2" aria-label="Test progress">
              {STEPS.map((s, i) => {
                const complete = phase === "done" || (stepIndex > i && stepIndex !== -1);
                const active = s.id === phase;
                return (
                  <li
                    key={s.id}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1 rounded-full border px-2 py-1.5 text-[0.65rem] font-medium transition-all duration-400",
                      active
                        ? "border-indigo-300/50 bg-indigo-400/15 text-white"
                        : complete
                          ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
                          : "border-white/10 text-white/40",
                    )}
                  >
                    {complete ? <Check className="size-3" /> : <s.icon className={cn("size-3", active && "animate-pulse")} />}
                    {s.label}
                  </li>
                );
              })}
            </ol>

            <SpeedGauge mbps={gaugeValue} phase={phase} />

            <div
              className="relative mx-auto mt-1 h-1 w-full max-w-[10rem] overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(state.overall * 100)}
              aria-label="Test progress"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400 transition-[width] duration-300"
                style={{ width: `${state.overall * 100}%` }}
              />
            </div>

            <div className="relative mt-3 flex flex-col items-center gap-2">
              {running ? (
                <Button variant="glass" size="lg" onClick={stop} className="min-w-[11rem] touch-manipulation">
                  <Square className="fill-current" /> Stop
                </Button>
              ) : (
                <Button variant="liquid" size="lg" onClick={start} className="min-w-[11rem] touch-manipulation">
                  {phase === "done" || phase === "error" ? <RotateCcw /> : <Play className="fill-current" />}
                  {phase === "done" || phase === "error" ? "Test again" : "Start test"}
                </Button>
              )}
              <p className="min-h-4 text-center text-[0.65rem] text-white/50" aria-live="polite">
                {!running && phase === "idle" ? "Tap to measure · Private" : null}
                {live ? `${phase} · ${speedLabel(state.mbps)}` : null}
                {phase === "done" && state.server ? `Via ${state.server}` : null}
              </p>
              {phase === "error" && (
                <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  <X className="size-3.5 shrink-0" />
                  {state.error ?? "Test failed. Try again."}
                </div>
              )}
            </div>
          </div>

          {/* Results column */}
          <div className="flex flex-col gap-4 sm:gap-5 lg:order-1 lg:col-span-5">
            <Reveal delay={0.04}>
              <StatTiles
                phase={phase}
                mbps={state.mbps}
                download={state.download}
                upload={state.upload}
                latency={state.latency ?? result?.latency}
                jitter={state.jitter ?? result?.jitter}
              />
            </Reveal>
            <Reveal delay={0.06} className="panel-hero flex min-h-[8rem] flex-1 flex-col justify-center overflow-hidden rounded-[1.5rem] p-3.5 sm:rounded-[1.75rem] sm:p-4">
              <LiveChart series={state.series} live={live} />
            </Reveal>
            {rating && result ? (
              <Reveal className="glass-premium flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3.5 sm:rounded-[1.5rem] sm:px-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge variant={TIER_VARIANT[rating.tier]} className="px-2.5 py-0.5">
                    <Zap aria-hidden="true" /> {rating.label}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{rating.blurb}</p>
                </div>
                <Button variant="glass" size="sm" onClick={share} className="touch-manipulation">
                  {copied ? <Check /> : <Share2 />} {copied ? "Copied" : "Share"}
                </Button>
              </Reveal>
            ) : null}
          </div>
        </div>
      </section>

      {/* Weather — sky-first experience */}
      <Reveal delay={0.08}>
        <WeatherCard
          data={weather.data}
          isLoading={(!place && network.isLoading) || weather.isLoading}
          isError={weather.isError}
          isFetching={weather.isFetching}
          placeLabel={placeLabel}
          hasLocation={lat != null && lon != null}
          custom={place !== null}
          onSelectPlace={choose}
          onRetry={() => void (weather.isError || place ? weather.refetch() : network.refetch())}
        />
      </Reveal>

      {/* Connection details */}
      <Reveal delay={0.1}>
        <NetworkCard
          data={network.data}
          isLoading={network.isLoading}
          isError={network.isError}
          isFetching={network.isFetching}
          onRetry={() => void network.refetch()}
        />
      </Reveal>
    </div>
  );
}
