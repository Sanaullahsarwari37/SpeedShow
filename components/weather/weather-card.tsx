"use client";

import * as React from "react";
import { MapPin, Navigation, RefreshCw } from "lucide-react";

import { LocalClock } from "@/components/local-time";
import { Chip, Skeleton } from "@/components/ui/primitives";
import { Instruments } from "@/components/weather/instruments";
import { Forecast, HourlyCurve, SunMoon } from "@/components/weather/panels";
import { PlaceSearch } from "@/components/weather/place-search";
import { Sky } from "@/components/weather/sky";
import { SKY_CONTROL } from "@/components/weather/styles";
import { useSunState } from "@/components/weather/use-sun";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { useStoredState } from "@/hooks/use-stored";
import { cToF, formatClock, isoMinutes, kmhToMph } from "@/lib/format";
import type { GeoPlace, WeatherData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { describeWeather, skyColors } from "@/lib/weather";

type Units = "c" | "f";
const isUnits = (v: unknown): v is Units => v === "c" || v === "f";

interface Props {
  data: WeatherData | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  placeLabel: string;
  hasLocation: boolean;
  custom: boolean;
  onSelectPlace: (p: GeoPlace | null) => void;
  onRetry: () => void;
}

/** Weather + live local time for the detected or searched place, on a sky that matches the real time of day. */
export default function WeatherCard({ data, isLoading, isError, isFetching, placeLabel, hasLocation, custom, onSelectPlace, onRetry }: Props) {
  const [units, setUnits] = useStoredState<Units>("speedshow:units", "c", isUnits);
  const s = useSunState(data);

  const t = React.useCallback((c: number) => `${Math.round(units === "c" ? c : cToF(c))}°`, [units]);
  const wind = React.useCallback((k: number) => (units === "c" ? `${Math.round(k)} km/h` : `${Math.round(kmhToMph(k))} mph`), [units]);

  const desc = data ? describeWeather(data.current.code) : null;
  const [c1, c2, c3] = skyColors(desc?.kind ?? "cloud", s?.part ?? "night");
  const busy = isLoading || (!data && !isError && hasLocation);
  const c = data?.current;

  return (
    <section
      id="weather"
      aria-labelledby="weather-title"
      className="relative isolate flex min-h-[28rem] scroll-mt-28 flex-col overflow-hidden rounded-[var(--radius-panel)] border border-white/10 text-white shadow-[0_24px_64px_-24px_rgba(30,41,130,0.5)] sm:min-h-[32rem]"
      style={{ background: `linear-gradient(150deg, ${c1} 0%, ${c2} 55%, ${c3} 100%)` }}
    >
      {data && desc && s ? <Sky kind={desc.kind} part={s.part} sun={s.sun} night={s.night} moon={s.moon.fraction} cover={data.current.cloudCover} intensity={desc.intensity} /> : null}

      {/* Toolbar */}
      <div className="relative z-20 flex items-center gap-2 p-5 sm:p-6">
        <h2 id="weather-title" className="sr-only">
          Weather and local time
        </h2>
        <PlaceSearch onSelect={onSelectPlace} custom={custom} className="min-w-0 flex-1" />
        <div role="group" aria-label="Temperature unit" className="flex rounded-full border border-white/20 bg-white/10 p-0.5 text-xs font-semibold">
          {(["c", "f"] as const).map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={units === u}
              onClick={() => setUnits(u)}
              className={cn("rounded-full px-2.5 py-1.5 transition-colors", units === u ? "bg-white text-slate-900" : "text-white/80 hover:text-white")}
            >
              °{u.toUpperCase()}
            </button>
          ))}
        </div>
        <button type="button" aria-label="Refresh weather" onClick={onRetry} className={cn(SKY_CONTROL, "grid size-10 shrink-0 place-items-center rounded-full")}>
          <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
        </button>
      </div>

      <div className="relative z-10 flex-1 px-5 pb-5 sm:px-6 sm:pb-6">
        {busy ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading weather">
            <Skeleton className="h-24 w-56 bg-white/15" />
            <Skeleton className="h-28 w-full bg-white/15" />
            <Skeleton className="h-40 w-full bg-white/15" />
          </div>
        ) : isError || !data || !desc || !s || !c ? (
          <div className="py-16 text-center text-sm text-white/85">
            <p>{hasLocation ? "Weather isn't loading right now." : "Search a city above to see its weather and local time."}</p>
            {hasLocation ? (
              <button type="button" onClick={onRetry} className={cn(SKY_CONTROL, "mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium")}>
                <RefreshCw className="size-4" /> Try again
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hero: conditions + live local clock */}
            <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-medium text-white/85">
                  {custom ? <MapPin className="size-4 shrink-0" aria-hidden="true" /> : <Navigation className="size-4 shrink-0" aria-hidden="true" />}
                  <span className="truncate">{placeLabel}</span>
                  <Chip tone="sky" className="uppercase">
                    {custom ? "Searched" : "Your location"}
                  </Chip>
                </p>
                <div className="mt-1 flex items-start font-mono text-7xl font-semibold tracking-tighter tabular-nums [text-shadow:0_4px_30px_rgba(0,0,0,0.25)] sm:text-8xl">
                  {t(c.temp)}
                  <span className="mt-3 ml-1 text-2xl font-medium text-white/70">{units.toUpperCase()}</span>
                  <WeatherIcon code={c.code} isDay={s.isUp} className="mt-4 ml-3 size-10 text-white/90 sm:size-12" />
                </div>
                <p className="text-lg font-semibold">{desc.label}</p>
                <p className="text-sm text-white/80">
                  Feels like {t(c.feelsLike)} · H {t(s.today?.max ?? c.temp)} · L {t(s.today?.min ?? c.temp)}
                </p>
              </div>
              <LocalClock tz={data.timezone} className="tile px-4 py-3 sm:min-w-[15rem] sm:text-right" />
            </div>

            <Instruments data={data} sun={s} t={t} wind={wind} />
            <HourlyCurve hours={data.hourly} t={t} />
            <div className="grid gap-3 lg:grid-cols-2">
              <SunMoon s={s} />
              {data.daily.length ? <Forecast days={data.daily} t={t} /> : null}
            </div>

            <p className="text-[0.7rem] text-white/70">
              Updated {formatClock(isoMinutes(c.time))} local time · Weather &amp; place search by{" "}
              <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
                Open-Meteo.com
              </a>
              {" · "}
              <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
                GeoNames
              </a>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
