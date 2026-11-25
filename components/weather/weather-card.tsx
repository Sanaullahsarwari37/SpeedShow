"use client";

import * as React from "react";
import { MapPin, Navigation, RefreshCw, Sparkles } from "lucide-react";

import { LocalClock } from "@/components/local-time";
import { Chip } from "@/components/ui/primitives";
import { Instruments } from "@/components/weather/instruments";
import { DailyForecast, HourlyForecast, type UnitFormat } from "@/components/weather/forecast";
import { SunMoon } from "@/components/weather/panels";
import { PlaceSearch } from "@/components/weather/place-search";
import { Sky } from "@/components/weather/sky";
import { SKY_CONTROL } from "@/components/weather/styles";
import { useSunState } from "@/components/weather/use-sun";
import { WeatherBodySkeleton } from "@/components/weather/weather-skeleton";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { cToF, formatClock, isoMinutes, kmhToMph } from "@/lib/format";
import type { GeoPlace, WeatherData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { describeWeather, precipOutlook, skyColors } from "@/lib/weather";


export type Units = "c" | "f";

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
  units: Units;
  onUnits: (u: Units) => void;
}

/** Next 2 hours of rain in 15-minute bars (only shown when some is expected). */
function Nowcast({ quarters }: { quarters: WeatherData["nowcast"] }) {
  const max = Math.max(0, ...quarters.map((q) => q.precip));
  if (quarters.length < 2 || max < 0.05) return null;
  const scale = Math.max(0.2, max);
  const clock = (iso: string) => formatClock(isoMinutes(iso));
  return (
    <figure className="mt-4 max-w-xs">
      <figcaption className="mb-1.5 text-[0.7rem] font-semibold tracking-wide text-white/75 uppercase">Next 2 hours</figcaption>
      <div className="flex h-9 items-end gap-1" role="img" aria-label={`Rain over the next 2 hours, up to ${max.toFixed(1)} mm per 15 minutes`}>
        {quarters.map((q) => (
          <span
            key={q.time}
            title={`${clock(q.time)}: ${q.precip.toFixed(1)} mm`}
            className="grow-y flex-1 rounded-sm bg-sky-200"
            style={{ height: `${q.precip > 0.05 ? Math.max(18, (q.precip / scale) * 100) : 6}%`, opacity: q.precip > 0.05 ? 0.9 : 0.25 }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[0.68rem] text-white/70 tabular-nums">
        <span>{clock(quarters[0].time)}</span>
        <span>{clock(quarters[quarters.length - 1].time)}</span>
      </div>
    </figure>
  );
}

/** "Tuesday, 25 November" from "2026-11-25". */
function dayTitle(iso: string | undefined) {
  const [y, m, d] = (iso ?? "").split("-").map(Number);
  if (!y || !m || !d) return "Hourly forecast";
  return new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Weather + live local time for the detected or searched place, on a sky that matches the real time of day. */
export default function WeatherCard({ data, isLoading, isError, isFetching, placeLabel, hasLocation, custom, onSelectPlace, onRetry, units, onUnits: setUnits }: Props) {
  const s = useSunState(data);

  const fmt = React.useMemo<UnitFormat>(
    () => ({
      t: (c: number) => `${Math.round(units === "c" ? c : cToF(c))}°`,
      tempUnit: units === "c" ? "°C" : "°F",
      windValue: (k: number) => (units === "c" ? k : kmhToMph(k)),
      windUnit: units === "c" ? "km/h" : "mph",
    }),
    [units],
  );
  const { t } = fmt;
  const wind = React.useCallback((k: number) => `${Math.round(fmt.windValue(k))} ${fmt.windUnit}`, [fmt]);

  // Day picked in the 10-day list drives the hourly chart; a new place starts on today.
  const [day, setDay] = React.useState(0);
  const placeKey = data ? `${data.latitude},${data.longitude}` : "";
  const [shownKey, setShownKey] = React.useState(placeKey);
  if (shownKey !== placeKey) {
    setShownKey(placeKey);
    setDay(0);
  }
  const dayHours = React.useMemo(() => {
    if (!data) return [];
    const d = data.daily[day];
    if (day === 0 || !d) return data.hourly.slice(0, 24);
    return data.hourly.filter((h) => h.time.startsWith(d.date));
  }, [data, day]);
  const outlook = React.useMemo(
    () =>
      data
        ? precipOutlook(data.hourly, (iso, withMinutes) => formatClock(isoMinutes(iso), withMinutes ? {} : { minute: undefined }), data.nowcast ?? [])
        : "",
    [data],
  );

  const desc = data ? describeWeather(data.current.code) : null;
  const [c1, c2, c3] = skyColors(desc?.kind ?? "cloud", s?.part ?? "night");
  const busy = isLoading || (!data && !isError && hasLocation);
  const c = data?.current;

  return (
    <section id="weather" aria-labelledby="weather-title" className="lazy-section scroll-mt-24 pt-10 sm:pt-14">
      <div data-reveal="" className="mb-4 flex flex-col gap-3 px-1 sm:mb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[0.7rem] font-semibold tracking-[0.16em] text-primary uppercase">
          <span aria-hidden="true" className="h-px w-6 bg-gradient-to-r from-cyan-400 to-violet-400" />
          Weather
          </p>
          <h2 id="weather-title" className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            Forecast &amp; local time
          </h2>
        </div>
        <div className="flex items-center gap-2 lg:w-[28rem]">
          <PlaceSearch onSelect={onSelectPlace} custom={custom} className="min-w-0 flex-1" />
          <div role="group" aria-label="Temperature unit" className="flex rounded-full border border-border bg-muted p-0.5 text-xs font-semibold">
            {(["c", "f"] as const).map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={units === u}
                onClick={() => setUnits(u)}
                className={cn("rounded-full px-2.5 py-1.5 transition-colors", units === u ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
              >
                °{u.toUpperCase()}
              </button>
            ))}
          </div>
          <button type="button" aria-label="Refresh weather" onClick={onRetry} className={cn(SKY_CONTROL, "grid size-10 shrink-0 place-items-center rounded-full")}>
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      {busy ? (
        <WeatherBodySkeleton />
      ) : isError || !data || !desc || !s || !c ? (
        <div className="glass rounded-[var(--radius-panel)] px-6 py-16 text-center text-sm text-muted-foreground">
          <p>{hasLocation ? "Weather isn't loading right now." : "Search a city above to see its weather and local time."}</p>
          {hasLocation ? (
            <button type="button" onClick={onRetry} className={cn(SKY_CONTROL, "mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium")}>
              <RefreshCw className="size-4" /> Try again
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div data-reveal="stagger" className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
            {/* Now: the one card with the live sky */}
            <div
              className="relative isolate flex min-h-[26rem] flex-col overflow-hidden rounded-[var(--radius-panel)] border border-white/10 p-5 text-white sm:p-6 lg:col-span-5 lg:row-span-2"
              style={{ background: `linear-gradient(155deg, ${c1} 0%, ${c2} 55%, ${c3} 100%)` }}
            >
              <Sky kind={desc.kind} part={s.part} sun={s.sun} night={s.night} moon={s.moon.fraction} cover={c.cloudCover} intensity={desc.intensity} />
              <p className="relative z-10 flex items-center gap-1.5 text-sm font-medium text-white/90">
                {custom ? <MapPin className="size-4 shrink-0" aria-hidden="true" /> : <Navigation className="size-4 shrink-0" aria-hidden="true" />}
                <span className="truncate">{placeLabel}</span>
                <Chip tone="sky" className="uppercase">
                  {custom ? "Searched" : "Your location"}
                </Chip>
              </p>
              <div className="relative z-10 mt-4">
                <div className="flex items-start font-mono text-7xl font-semibold tracking-tighter tabular-nums [text-shadow:0_4px_30px_rgba(0,0,0,0.25)] sm:text-8xl">
                  {t(c.temp)}
                  <WeatherIcon code={c.code} isDay={s.isUp} className="mt-3 ml-3 size-10 text-white/90 sm:size-12" />
                </div>
                <p className="mt-1 text-lg font-semibold">{c.label ?? desc.label}</p>
                <p className="text-sm text-white/80">
                  Feels like {t(c.feelsLike)} · H {t(s.today?.max ?? c.temp)} · L {t(s.today?.min ?? c.temp)}
                </p>
                {outlook ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-xs font-medium text-white/90">
                    <Sparkles className="size-3.5 text-amber-200" aria-hidden="true" />
                    {outlook}
                  </p>
                ) : null}
                <Nowcast quarters={data.nowcast ?? []} />
              </div>
              <LocalClock tz={data.timezone} className="tile relative z-10 mt-auto px-4 py-3" />
            </div>

            <div className="lg:col-span-7">
              <HourlyForecast hours={dayHours} isToday={day === 0} title={day === 0 ? "Next 24 hours" : dayTitle(data.daily[day]?.date)} units={fmt} />
            </div>
            <div className="lg:col-span-7">
              <Instruments data={data} sun={s} t={t} wind={wind} />
            </div>
            {data.daily.length ? (
              <div className="lg:col-span-7">
                <DailyForecast days={data.daily} selected={day} onSelect={setDay} current={c.temp} units={fmt} />
              </div>
            ) : null}
            <div className="lg:col-span-5">
              <SunMoon s={s} />
            </div>
          </div>

          {data.stale ? (
            <p role="status" className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-200">
              <RefreshCw className="size-3.5" aria-hidden="true" />
              The weather service is briefly unreachable, so this is the last forecast received. It refreshes automatically.
            </p>
          ) : null}
          <p className="mt-4 px-1 text-[0.7rem] text-muted-foreground">
            Conditions as of {formatClock(isoMinutes(c.time))} local time · Weather, air quality &amp; place search by{" "}
            <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
              Open-Meteo.com
            </a>{" "}
            (open data, CC BY 4.0) ·{" "}
            <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
              GeoNames
            </a>
          </p>
        </>
      )}
    </section>
  );
}
