"use client";

import * as React from "react";
import { ArrowDown, Navigation, Umbrella, Wind } from "lucide-react";

import { Skeleton } from "@/components/ui/primitives";
import { useSunState } from "@/components/weather/use-sun";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { cToF, formatClock, isoMinutes, kmhToMph } from "@/lib/format";
import type { WeatherData } from "@/lib/types";
import { describeWeather, precipOutlook, skyColors } from "@/lib/weather";

export type Units = "c" | "f";

/** Compact "now" weather for the dashboard; the full forecast lives further down the page. */
export const WeatherMini = React.memo(function WeatherMini({
  data,
  isLoading,
  placeLabel,
  units,
}: {
  data: WeatherData | undefined;
  isLoading: boolean;
  placeLabel: string;
  units: Units;
}) {
  const s = useSunState(data);
  const t = (c: number) => `${Math.round(units === "c" ? c : cToF(c))}°`;
  const desc = data ? describeWeather(data.current.code) : null;
  const [c1, c2, c3] = skyColors(desc?.kind ?? "cloud", s?.part ?? "night");
  const outlook = React.useMemo(() => (data ? precipOutlook(data.hourly, (iso) => formatClock(isoMinutes(iso), { minute: undefined })) : ""), [data]);
  const c = data?.current;

  return (
    <a
      href="#weather"
      aria-label={c && desc ? `Weather in ${placeLabel}: ${t(c.temp)}, ${c.label ?? desc.label}. Open the full forecast.` : "Open the full forecast"}
      className="group relative flex min-h-56 flex-col overflow-hidden rounded-[var(--radius-panel)] border border-white/10 p-5 text-white transition-transform duration-300 hover:-translate-y-0.5 sm:p-6"
      style={{ background: `linear-gradient(155deg, ${c1} 0%, ${c2} 60%, ${c3} 100%)` }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
      <div className="relative flex items-center justify-between gap-2 text-xs font-medium text-white/85">
        <span className="flex min-w-0 items-center gap-1.5">
          <Navigation className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{placeLabel || "Your location"}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-black/20 px-2 py-0.5 text-[0.68rem] transition-colors group-hover:bg-black/35">
          Full forecast <ArrowDown className="size-3" aria-hidden="true" />
        </span>
      </div>

      {c && desc ? (
        <div className="relative mt-auto pt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-6xl leading-none font-semibold tracking-tighter tabular-nums">{t(c.temp)}</p>
              <p className="mt-2 font-semibold">{c.label ?? desc.label}</p>
              <p className="text-xs text-white/75">
                H {t(s?.today?.max ?? c.temp)} · L {t(s?.today?.min ?? c.temp)} · Feels {t(c.feelsLike)}
              </p>
            </div>
            <WeatherIcon code={c.code} isDay={s?.isUp ?? c.isDay} className="size-14 text-white/90 drop-shadow" />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/15 pt-3 text-xs text-white/85">
            <span className="flex items-center gap-1.5">
              <Umbrella className="size-3.5" aria-hidden="true" />
              {Math.round(data.hourly[0]?.precipProb ?? 0)}%
            </span>
            <span className="flex items-center gap-1.5">
              <Wind className="size-3.5" aria-hidden="true" />
              {units === "c" ? `${Math.round(c.windKmh)} km/h` : `${Math.round(kmhToMph(c.windKmh))} mph`}
            </span>
            {outlook ? <span className="min-w-0 truncate text-white/75">{outlook}</span> : null}
          </div>
        </div>
      ) : (
        <div className="relative mt-auto space-y-2.5 pt-6" aria-busy={isLoading}>
          <Skeleton className="h-14 w-28 rounded-xl bg-white/10" />
          <Skeleton className="h-4 w-32 bg-white/10" />
          <Skeleton className="h-3 w-44 bg-white/10" />
          {!isLoading ? <p className="text-xs text-white/70">Search a city in the forecast below.</p> : null}
        </div>
      )}
    </a>
  );
});
