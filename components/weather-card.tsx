"use client";

import * as React from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Gauge,
  MapPin,
  Moon,
  Navigation,
  RefreshCw,
  Sun,
  Sunrise,
  Sunset,
  Umbrella,
  Wind,
} from "lucide-react";

import { PlaceSearch } from "@/components/place-search";
import { Skeleton } from "@/components/ui/skeleton";
import { SKY, WeatherScene, type SkyKey } from "@/components/weather-scene";
import { cToF, kmhToMph, windDirection } from "@/lib/format";
import type { GeoPlace, WeatherData } from "@/lib/types";
import { describeWeather, type WeatherKind } from "@/lib/weather-codes";
import { cn } from "@/lib/utils";

type Units = "c" | "f";
const UNITS_KEY = "speedshow:units";

export function WeatherIcon({ code, isDay, className }: { code: number; isDay: boolean; className?: string }) {
  const { kind } = describeWeather(code);
  const p = { className, "aria-hidden": true as const };
  switch (kind) {
    case "clear":
      return code === 0 || code === 1 ? isDay ? <Sun {...p} /> : <Moon {...p} /> : isDay ? <CloudSun {...p} /> : <CloudMoon {...p} />;
    case "cloud":
      return code === 2 ? isDay ? <CloudSun {...p} /> : <CloudMoon {...p} /> : <Cloud {...p} />;
    case "fog":
      return <CloudFog {...p} />;
    case "drizzle":
      return <CloudDrizzle {...p} />;
    case "rain":
      return <CloudRain {...p} />;
    case "snow":
      return <CloudSnow {...p} />;
    case "storm":
      return <CloudLightning {...p} />;
  }
}

function Precip({ kind }: { kind: WeatherKind }) {
  if (kind === "rain" || kind === "drizzle" || kind === "storm") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: kind === "drizzle" ? 14 : 28 }).map((_, i) => (
          <span
            key={i}
            className="rain-drop"
            style={{ left: `${(i * 37) % 100}%`, animationDelay: `${((i * 53) % 100) / 60}s`, animationDuration: `${0.8 + ((i * 7) % 5) / 10}s` }}
          />
        ))}
        {kind === "storm" && <div className="lightning" />}
      </div>
    );
  }
  if (kind === "snow") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="snow-flake"
            style={{ left: `${(i * 43) % 100}%`, animationDelay: `${((i * 61) % 100) / 22}s`, animationDuration: `${3.5 + ((i * 11) % 30) / 10}s` }}
          />
        ))}
      </div>
    );
  }
  return null;
}

/* ---------------------------- helpers ---------------------------- */

const minutesOf = (iso: string | null | undefined) => {
  if (!iso) return null;
  const h = Number.parseInt(iso.slice(11, 13), 10);
  const m = Number.parseInt(iso.slice(14, 16), 10);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
};

const clock = (iso: string | null | undefined) => {
  const mins = minutesOf(iso);
  if (mins === null) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

function hourLabel(iso: string, i: number) {
  if (i === 0) return "Now";
  const h = Number.parseInt(iso.slice(11, 13), 10);
  if (Number.isNaN(h)) return "";
  return `${h % 12 === 0 ? 12 : h % 12}${h >= 12 ? "p" : "a"}`;
}

function dayLabel(iso: string, i: number) {
  if (i === 0) return "Today";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short" });
}

const GLASS = "rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md";

/* ---------------------------- sub-views ---------------------------- */

function SunPath({ data }: { data: WeatherData }) {
  const rise = minutesOf(data.daily[0]?.sunrise);
  const set = minutesOf(data.daily[0]?.sunset);
  const now = minutesOf(data.current.time);
  if (rise === null || set === null || now === null) return null;

  // Polar day / polar night
  if (set <= rise) {
    const polarDay = data.current.isDay;
    return (
      <div className={cn(GLASS, "p-4")}>
        <div className="flex items-center justify-between text-xs text-white/75">
          <span className="font-semibold tracking-wide uppercase">Sun</span>
          <span>{polarDay ? "Polar day" : "Polar night"}</span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 py-4 text-sm text-white/80">
          {polarDay ? <Sun className="size-5 text-amber-200" aria-hidden="true" /> : <Moon className="size-5 text-indigo-200" aria-hidden="true" />}
          {polarDay ? "The sun does not set today" : "The sun does not rise today"}
        </div>
      </div>
    );
  }

  const daylight = set - rise;
  const f = (now - rise) / daylight;
  const up = f >= 0 && f <= 1;
  const c = Math.min(1, Math.max(0, f));
  // Smooth arc position
  const x = 120 - 100 * Math.cos(Math.PI * c);
  const y = 105 - 100 * Math.sin(Math.PI * c);

  // Time until next event
  let countdown = "";
  if (up) {
    const left = set - now;
    const h = Math.floor(left / 60);
    const m = left % 60;
    countdown = h > 0 ? `Sunset in ${h}h ${m}m` : `Sunset in ${m}m`;
  } else if (now < rise) {
    const left = rise - now;
    const h = Math.floor(left / 60);
    const m = left % 60;
    countdown = h > 0 ? `Sunrise in ${h}h ${m}m` : `Sunrise in ${m}m`;
  } else {
    countdown = "Night";
  }

  return (
    <div className={cn(GLASS, "p-4")}>
      <div className="flex items-center justify-between text-xs text-white/75">
        <span className="font-semibold tracking-wide uppercase">Sun path</span>
        <span className="tabular-nums">
          {Math.floor(daylight / 60)}h {String(daylight % 60).padStart(2, "0")}m daylight
        </span>
      </div>
      <svg
        viewBox="0 0 240 125"
        className="mt-2 w-full"
        role="img"
        aria-label={`Sunrise ${clock(data.daily[0]?.sunrise)}, sunset ${clock(data.daily[0]?.sunset)}. ${countdown}`}
      >
        {/* Horizon */}
        <line x1="10" y1="105" x2="230" y2="105" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
        {/* Full arc (dashed) */}
        <path
          d="M20 105 A100 100 0 0 1 220 105"
          fill="none"
          stroke="white"
          strokeOpacity="0.3"
          strokeWidth="2"
          strokeDasharray="4 6"
          strokeLinecap="round"
        />
        {/* Progress arc (golden while sun is up) */}
        {up && (
          <path
            d={`M20 105 A100 100 0 0 1 ${x} ${y}`}
            fill="none"
            stroke="url(#sunGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}
        <defs>
          <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Glow */}
        {up && <circle cx={x} cy={y} r="22" fill="url(#sunGlow)" />}
        {/* Sun / moon disk */}
        <circle
          cx={x}
          cy={y}
          r={up ? 10 : 7}
          fill={up ? "#fde68a" : "#a5b4fc"}
          opacity={up ? 1 : 0.75}
          style={up ? { filter: "drop-shadow(0 0 8px rgba(253,230,138,0.8))" } : undefined}
        />
        {/* Small rays when sun is up */}
        {up &&
          [0, 45, 90, 135].map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const x1 = x + Math.cos(rad) * 14;
            const y1 = y + Math.sin(rad) * 14;
            const x2 = x + Math.cos(rad) * 20;
            const y2 = y + Math.sin(rad) * 20;
            return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fde68a" strokeWidth="1.5" strokeOpacity="0.7" strokeLinecap="round" />;
          })}
      </svg>
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          <Sunrise className="size-3.5 text-amber-200" aria-hidden="true" />
          {clock(data.daily[0]?.sunrise)}
        </span>
        <span className="text-white/70 tabular-nums">{countdown}</span>
        <span className="flex items-center gap-1.5 font-medium">
          <Sunset className="size-3.5 text-orange-300" aria-hidden="true" />
          {clock(data.daily[0]?.sunset)}
        </span>
      </div>
    </div>
  );
}

function HourlyCurve({ hours, t }: { hours: WeatherData["hourly"]; t: (c: number) => string }) {
  const list = hours.slice(0, 24);
  if (list.length < 3) return null;
  const W = 480;
  const H = 110;
  const padX = 18;
  const top = 26;
  const bottom = 18;
  const temps = list.map((h) => h.temp);
  const lo = Math.min(...temps);
  const hi = Math.max(...temps);
  const span = Math.max(1, hi - lo);
  const pts = list.map((h, i) => ({
    x: padX + (i * (W - padX * 2)) / (list.length - 1),
    y: top + (1 - (h.temp - lo) / span) * (H - top - bottom),
  }));
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C${mx},${pts[i - 1].y} ${mx},${pts[i].y} ${pts[i].x},${pts[i].y}`;
  }
  return (
    <div className={cn(GLASS, "p-4")}>
      <h4 className="text-xs font-semibold tracking-wide text-white/75 uppercase">Next 24 hours</h4>
      <div className="scrollbar-thin -mx-1 overflow-x-auto px-1">
        <svg viewBox={`0 0 ${W} ${H + 22}`} className="mt-2 h-36 w-full min-w-[30rem]" role="img" aria-label="Hourly temperature curve">
          <defs>
            <linearGradient id="hc-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${d} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`} fill="url(#hc-fill)" />
          <path d={d} fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          {pts.map((p, i) =>
            i % 3 === 0 ? (
              <g key={list[i].time}>
                <circle cx={p.x} cy={p.y} r="3.5" fill="#fff" />
                <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff">
                  {t(list[i].temp)}
                </text>
                <text x={p.x} y={H + 14} textAnchor="middle" fontSize="10.5" fill="#fff" fillOpacity="0.75">
                  {hourLabel(list[i].time, i)}
                </text>
              </g>
            ) : null,
          )}
        </svg>
      </div>
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 40 40" className="size-12 -rotate-90" aria-hidden="true">
      <circle cx="20" cy="20" r={r} fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="4" />
      <circle cx="20" cy="20" r={r} fill="none" stroke="#7dd3fc" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(Math.min(100, value) / 100) * c} ${c}`} />
    </svg>
  );
}

/* ---------------------------- card ---------------------------- */

interface Props {
  data: WeatherData | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  placeLabel: string;
  hasLocation: boolean;
  /** True when a searched city is selected instead of the detected location. */
  custom: boolean;
  onSelectPlace: (p: GeoPlace | null) => void;
  onRetry: () => void;
}

export function WeatherCard({ data, isLoading, isError, isFetching, placeLabel, hasLocation, custom, onSelectPlace, onRetry }: Props) {
  const [units, setUnits] = React.useState<Units>("c");

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(UNITS_KEY);
      if (saved === "c" || saved === "f") setUnits(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const changeUnits = (u: Units) => {
    setUnits(u);
    try {
      localStorage.setItem(UNITS_KEY, u);
    } catch {
      /* ignore */
    }
  };

  const t = (c: number) => `${Math.round(units === "c" ? c : cToF(c))}°`;
  const wind = (k: number) => (units === "c" ? `${Math.round(k)} km/h` : `${Math.round(kmhToMph(k))} mph`);

  const desc = data ? describeWeather(data.current.code) : null;
  const sky: SkyKey = data && desc ? (!data.current.isDay && (desc.kind === "clear" || desc.kind === "cloud") ? "night" : desc.kind) : "cloud";

  const days = data?.daily.slice(0, 5) ?? [];
  const gMin = days.length ? Math.min(...days.map((d) => d.min)) : 0;
  const gMax = days.length ? Math.max(...days.map((d) => d.max)) : 1;
  const span = Math.max(1, gMax - gMin);
  const busy = isLoading || (!data && !isError && hasLocation);

  return (
    <section
      aria-label="Weather"
      className={cn("relative isolate flex h-full min-h-[28rem] flex-col overflow-hidden rounded-[2rem] sm:min-h-[32rem] border border-white/10 bg-gradient-to-br text-white shadow-[0_24px_64px_-24px_rgba(30,41,130,0.5)] transition-[background] duration-700", SKY[sky])}
    >
      {data && desc ? <WeatherScene kind={desc.kind} isDay={data.current.isDay} /> : null}
      {data && desc ? <Precip kind={desc.kind} /> : null}

      <div className="relative z-20 flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <PlaceSearch onSelect={onSelectPlace} custom={custom} className="min-w-0 flex-1 basis-56" />
          <div role="group" aria-label="Temperature unit" className="flex rounded-full border border-white/20 bg-white/10 p-0.5 text-xs font-semibold backdrop-blur-md">
            {(["c", "f"] as const).map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={units === u}
                onClick={() => changeUnits(u)}
                className={cn("rounded-full px-2.5 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none", units === u ? "bg-white text-slate-900" : "text-white/80 hover:text-white")}
              >
                °{u.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Refresh weather"
            onClick={onRetry}
            className="grid size-10 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-1 px-5 pb-5 sm:px-6 sm:pb-6">
        {busy ? (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-24 w-48 bg-white/15" />
            <Skeleton className="h-28 w-full bg-white/15" />
            <Skeleton className="h-36 w-full bg-white/15" />
          </div>
        ) : isError || !data || !desc ? (
          <div className="py-10 text-center text-sm text-white/85">
            <p>{hasLocation ? "Weather is unavailable right now." : "Search a city above to see its weather."}</p>
            {hasLocation && (
              <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 font-medium hover:bg-white/20">
                <RefreshCw className="size-4" /> Try again
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hero */}
            <div className="pt-2">
              <p className="flex items-center gap-1.5 text-sm font-medium text-white/85">
                {custom ? <MapPin className="size-4 shrink-0" aria-hidden="true" /> : <Navigation className="size-4 shrink-0" aria-hidden="true" />}
                <span className="truncate">{placeLabel}</span>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[0.65rem] tracking-wide uppercase">{custom ? "Searched" : "Your location"}</span>
              </p>
              <div className="mt-1 flex items-start font-mono text-7xl font-semibold tracking-tighter tabular-nums [text-shadow:0_4px_30px_rgba(0,0,0,0.25)] sm:text-8xl">
                {t(data.current.temp)}
                <span className="mt-3 ml-1 text-2xl font-medium text-white/70">{units === "c" ? "C" : "F"}</span>
              </div>
              <p className="text-lg font-semibold">{desc.label}</p>
              <p className="text-sm text-white/80">
                Feels like {t(data.current.feelsLike)} · H {t(data.daily[0]?.max ?? data.current.temp)} · L {t(data.daily[0]?.min ?? data.current.temp)}
              </p>
            </div>

            {/* Instruments */}
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className={cn(GLASS, "flex items-center gap-3 p-3")}>
                <Ring value={data.current.humidity} />
                <div>
                  <dt className="flex items-center gap-1 text-xs text-white/75"><Droplets className="size-3.5" aria-hidden="true" /> Humidity</dt>
                  <dd className="text-base font-semibold tabular-nums">{Math.round(data.current.humidity)}%</dd>
                </div>
              </div>
              <div className={cn(GLASS, "flex items-center gap-3 p-3")}>
                <div className="relative grid size-12 shrink-0 place-items-center rounded-full border border-white/25" aria-hidden="true">
                  <Navigation className="size-5 text-sky-200 transition-transform duration-700" style={{ transform: `rotate(${data.current.windDir + 180 - 45}deg)` }} />
                  <span className="absolute -top-1 text-[0.55rem] font-bold text-white/70">N</span>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-xs text-white/75"><Wind className="size-3.5" aria-hidden="true" /> Wind</dt>
                  <dd className="text-sm leading-tight font-semibold">{wind(data.current.windKmh)}<br /><span className="text-xs font-normal text-white/70">from {windDirection(data.current.windDir)}</span></dd>
                </div>
              </div>
              <div className={cn(GLASS, "flex items-center gap-3 p-3")}>
                <Ring value={data.daily[0]?.precipProb ?? 0} />
                <div>
                  <dt className="flex items-center gap-1 text-xs text-white/75"><Umbrella className="size-3.5" aria-hidden="true" /> Rain chance</dt>
                  <dd className="text-base font-semibold tabular-nums">{Math.round(data.daily[0]?.precipProb ?? 0)}%</dd>
                </div>
              </div>
              <div className={cn(GLASS, "flex items-center gap-3 p-3")}>
                <div className="grid size-12 shrink-0 place-items-center rounded-full border border-white/25"><Gauge className="size-5 text-indigo-200" aria-hidden="true" /></div>
                <div>
                  <dt className="text-xs text-white/75">Pressure</dt>
                  <dd className="text-sm leading-tight font-semibold tabular-nums">{Math.round(data.current.pressure)}<span className="text-xs font-normal text-white/70"> hPa</span></dd>
                </div>
              </div>
            </dl>

            <HourlyCurve hours={data.hourly} t={t} />

            <div className="grid gap-3 lg:grid-cols-2">
              <SunPath data={data} />
              {days.length > 0 && (
                <div className={cn(GLASS, "p-4")}>
                  <h4 className="mb-2 text-xs font-semibold tracking-wide text-white/75 uppercase">5-day forecast</h4>
                  <ul className="space-y-2">
                    {days.map((d, i) => (
                      <li key={d.date} className="grid grid-cols-[2.8rem_1.4rem_1fr] items-center gap-2 text-sm">
                        <span className="font-medium">{dayLabel(d.date, i)}</span>
                        <WeatherIcon code={d.code} isDay className="size-5 text-white" />
                        <div className="flex items-center gap-2">
                          <span className="w-8 text-right text-white/70 tabular-nums">{t(d.min)}</span>
                          <div className="relative h-1.5 flex-1 rounded-full bg-white/20">
                            <div
                              className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-200 via-white to-amber-200"
                              style={{ left: `${((d.min - gMin) / span) * 100}%`, width: `${Math.max(8, ((d.max - d.min) / span) * 100)}%` }}
                            />
                          </div>
                          <span className="w-8 font-semibold tabular-nums">{t(d.max)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <p className="text-[0.7rem] text-white/70">
              Weather &amp; place search by{" "}
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
