"use client";

import * as React from "react";
import { Droplet, Thermometer, Umbrella, Wind } from "lucide-react";

import { SKY_LABEL } from "@/components/weather/styles";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { useSvgId } from "@/hooks/use-ui";
import { formatClock, isoMinutes, windDirection } from "@/lib/format";
import { areaPath, smoothPath, type Point } from "@/lib/svg";
import type { WeatherDay, WeatherHour } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface UnitFormat {
  /** °C → "23°" in the chosen unit. */
  t: (c: number) => string;
  tempUnit: string;
  /** km/h → number in the chosen unit. */
  windValue: (kmh: number) => number;
  windUnit: string;
}

/* ------------------------------------------------------------------ */
/* Hourly chart with Temperature / Precipitation / Wind tabs           */
/* ------------------------------------------------------------------ */

type Tab = "temp" | "precip" | "wind";
const TABS: { id: Tab; label: string; icon: typeof Thermometer }[] = [
  { id: "temp", label: "Temperature", icon: Thermometer },
  { id: "precip", label: "Precipitation", icon: Umbrella },
  { id: "wind", label: "Wind", icon: Wind },
];

const COL = 58; // px per hour
const CH = 112; // chart height
const TOP = 26; // room for value labels
const BASE = CH - 6;

const hourLabel = (iso: string) => formatClock(isoMinutes(iso), { minute: undefined });

function TempChart({ hours, t, id }: { hours: WeatherHour[]; t: UnitFormat["t"]; id: string }) {
  const lo = Math.min(...hours.map((h) => h.temp));
  const span = Math.max(2, Math.max(...hours.map((h) => h.temp)) - lo);
  const pts: Point[] = hours.map((h, i) => [i * COL + COL / 2, TOP + (1 - (h.temp - lo) / span) * (BASE - TOP - 18)] as const);
  return (
    <>
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath(pts, CH)} fill={`url(#${id}t)`} />
      <path d={smoothPath(pts)} fill="none" stroke="#fcd34d" strokeWidth="2.5" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <g key={hours[i].time}>
          <circle cx={x} cy={y} r="3" fill="#fde68a" />
          <text x={x} y={y - 9} textAnchor="middle" fontSize="12" fontWeight="600" fill="#fff">
            {t(hours[i].temp)}
          </text>
        </g>
      ))}
    </>
  );
}

function PrecipChart({ hours }: { hours: WeatherHour[] }) {
  return (
    <>
      {hours.map((h, i) => {
        const x = i * COL + COL / 2;
        const height = Math.max(2, (h.precipProb / 100) * (BASE - TOP));
        return (
          <g key={h.time}>
            <title>{`${Math.round(h.precipProb)}% chance${h.precip > 0 ? `, ${h.precip.toFixed(1)} mm` : ""}`}</title>
            <rect x={x - 11} y={TOP} width="22" height={BASE - TOP} rx="5" fill="#fff" fillOpacity="0.06" />
            <rect x={x - 11} y={BASE - height} width="22" height={height} rx="5" fill="#60a5fa" fillOpacity={0.35 + (h.precipProb / 100) * 0.6} />
            <text x={x} y={TOP - 8} textAnchor="middle" fontSize="11.5" fontWeight="600" fill={h.precipProb >= 30 ? "#bfdbfe" : "#fff"} fillOpacity={h.precipProb >= 30 ? 1 : 0.7}>
              {Math.round(h.precipProb)}%
            </text>
          </g>
        );
      })}
    </>
  );
}

function WindChart({ hours, windValue }: { hours: WeatherHour[]; windValue: UnitFormat["windValue"] }) {
  const max = Math.max(10, ...hours.map((h) => h.windKmh));
  return (
    <>
      {hours.map((h, i) => {
        const x = i * COL + COL / 2;
        const k = 0.75 + (h.windKmh / max) * 0.65;
        return (
          <g key={h.time}>
            <title>{`${Math.round(windValue(h.windKmh))}, from ${windDirection(h.windDir)}`}</title>
            <text x={x} y={TOP - 8} textAnchor="middle" fontSize="12" fontWeight="600" fill="#fff">
              {Math.round(windValue(h.windKmh))}
            </text>
            {/* Arrow points where the wind blows to (meteorological direction + 180°). */}
            <g transform={`translate(${x} ${(TOP + BASE) / 2}) rotate(${h.windDir + 180}) scale(${k})`}>
              <path d="M0 -14 L8 4 L0 -1 L-8 4 Z" fill="#a5f3fc" fillOpacity={0.55 + (h.windKmh / max) * 0.45} />
            </g>
          </g>
        );
      })}
    </>
  );
}

export function HourlyForecast({ hours, title, isToday, units }: { hours: WeatherHour[]; title: string; isToday: boolean; units: UnitFormat }) {
  const [tab, setTab] = React.useState<Tab>("temp");
  const id = useSvgId("hf");
  const scroller = React.useRef<HTMLDivElement>(null);
  const tabsId = React.useId();
  const width = hours.length * COL;

  // A new day starts at its first hour.
  React.useEffect(() => {
    scroller.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [hours]);

  if (hours.length < 2) return null;
  const legend = tab === "temp" ? units.tempUnit : tab === "precip" ? "chance of rain" : units.windUnit;

  return (
    <div className="tile p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className={SKY_LABEL}>
          {title}
          <span className="ml-2 font-normal tracking-normal normal-case text-white/55">{legend}</span>
        </h3>
        <div role="tablist" aria-label="Hourly forecast view" className="flex rounded-full border border-white/15 bg-black/15 p-0.5">
          {TABS.map((x) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              id={`${tabsId}-${x.id}`}
              aria-selected={tab === x.id}
              aria-controls={`${tabsId}-panel`}
              onClick={() => setTab(x.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                tab === x.id ? "bg-white text-slate-900 shadow" : "text-white/75 hover:text-white",
              )}
            >
              <x.icon className="size-3.5" aria-hidden="true" />
              <span className="max-sm:sr-only">{x.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scroller}
        id={`${tabsId}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabsId}-${tab}`}
        tabIndex={0}
        className="no-scrollbar -mx-4 mt-3 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,transparent,#000_16px,#000_calc(100%-16px),transparent)] sm:-mx-5 sm:px-5"
      >
        <div style={{ width }} className="relative">
          {isToday ? <div aria-hidden="true" className="absolute inset-y-0 left-0 rounded-xl bg-white/[0.07]" style={{ width: COL }} /> : null}
          <svg
            width={width}
            height={CH}
            viewBox={`0 0 ${width} ${CH}`}
            className="relative block overflow-visible"
            role="img"
            aria-label={`${title}: hourly ${TABS.find((x) => x.id === tab)?.label.toLowerCase()}`}
          >
            {tab === "temp" ? <TempChart hours={hours} t={units.t} id={id} /> : tab === "precip" ? <PrecipChart hours={hours} /> : <WindChart hours={hours} windValue={units.windValue} />}
          </svg>
          <ol className="relative flex">
            {hours.map((h, i) => (
              <li key={h.time} className="flex shrink-0 flex-col items-center gap-1.5 pt-2 pb-1" style={{ width: COL }}>
                <WeatherIcon code={h.code} isDay={h.isDay} className="size-5 text-white/90" />
                <span className={cn("text-[0.7rem] tabular-nums", isToday && i === 0 ? "font-semibold text-white" : "text-white/65")}>
                  {isToday && i === 0 ? "Now" : hourLabel(h.time)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 10-day list (each row selects that day for the hourly chart)        */
/* ------------------------------------------------------------------ */

function dayName(iso: string, i: number) {
  if (i === 0) return "Today";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function DailyForecast({
  days,
  selected,
  onSelect,
  current,
  units,
}: {
  days: WeatherDay[];
  selected: number;
  onSelect: (i: number) => void;
  /** Current temperature, marked on today's range bar. */
  current: number;
  units: UnitFormat;
}) {
  const lo = Math.min(...days.map((d) => d.min));
  const span = Math.max(1, Math.max(...days.map((d) => d.max)) - lo);
  const pos = (v: number) => ((v - lo) / span) * 100;

  return (
    <div className="tile p-3 sm:p-4">
      <h3 className={cn(SKY_LABEL, "mb-2 px-1")}>{days.length}-day forecast</h3>
      <ul className="space-y-0.5">
        {days.map((d, i) => (
          <li key={d.date}>
            <button
              type="button"
              aria-pressed={selected === i}
              aria-label={`${dayName(d.date, i)}: low ${units.t(d.min)}, high ${units.t(d.max)}, ${Math.round(d.precipProb)}% chance of rain. Show hourly forecast.`}
              onClick={() => onSelect(i)}
              className={cn(
                "grid w-full grid-cols-[3rem_1.5rem_2.75rem_2.1rem_1fr_2.1rem] items-center gap-2 rounded-xl px-2 py-2 text-left text-sm transition-colors sm:gap-2.5",
                selected === i ? "bg-white/15 ring-1 ring-white/20" : "hover:bg-white/[0.07]",
              )}
            >
              <span className="font-medium">{dayName(d.date, i)}</span>
              <WeatherIcon code={d.code} className="size-5 text-white" />
              <span className={cn("flex items-center gap-0.5 text-[0.7rem] tabular-nums", d.precipProb >= 20 ? "text-sky-200" : "text-transparent")}>
                <Droplet className="size-3" aria-hidden="true" />
                {Math.round(d.precipProb)}%
              </span>
              <span className="text-right text-white/65 tabular-nums">{units.t(d.min)}</span>
              <span className="relative h-1.5 rounded-full bg-black/25" aria-hidden="true">
                <span
                  className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-300 via-emerald-200 to-amber-300"
                  style={{ left: `${pos(d.min)}%`, width: `${Math.max(6, pos(d.max) - pos(d.min))}%` }}
                />
                {i === 0 ? (
                  <span
                    className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900/60 bg-white"
                    style={{ left: `${Math.min(100, Math.max(0, pos(current)))}%` }}
                  />
                ) : null}
              </span>
              <span className="font-semibold tabular-nums">{units.t(d.max)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
