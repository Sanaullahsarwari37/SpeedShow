import * as React from "react";
import { Activity, Cloud, Droplets, Eye, Gauge, Leaf, Navigation, Sun, Umbrella, type LucideIcon } from "lucide-react";

import { Surface, SurfaceHeader } from "@/components/ui/surface";
import type { SunState } from "@/components/weather/use-sun";
import { windDirection } from "@/lib/format";
import type { WeatherData } from "@/lib/types";
import { aqiLevel, uvLevel, visibilityLabel } from "@/lib/weather";

/* ---------------- dials ---------------- */

function Ring({ value, max = 100, color = "#7dd3fc", icon: Icon, iconClass }: { value: number; max?: number; color?: string; icon?: LucideIcon; iconClass?: string }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-12 shrink-0 place-items-center">
      <svg viewBox="0 0 40 40" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="4" />
        <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(Math.min(max, Math.max(0, value)) / max) * c} ${c}`} />
      </svg>
      {Icon ? <Icon className={`size-4 ${iconClass ?? ""}`} aria-hidden="true" /> : null}
    </div>
  );
}

function Disc({ icon: Icon, iconClass, children }: { icon: LucideIcon; iconClass: string; children?: React.ReactNode }) {
  return (
    <div className="relative grid size-12 shrink-0 place-items-center rounded-full border border-border">
      <Icon className={`size-5 ${iconClass}`} aria-hidden="true" />
      {children}
    </div>
  );
}

/** Colour scales shared by the UV and air-quality dials. */
const SCALE = ["#86efac", "#fde047", "#fb923c", "#f87171", "#c084fc"];
const scaleColor = (v: number, stops: number[]) => {
  const i = stops.findIndex((s) => v <= s);
  return SCALE[i === -1 ? SCALE.length - 1 : i];
};
const UV_STOPS = [2, 5, 7, 10];
const AQI_STOPS = [50, 100, 150, 200];

/* ---------------- tile ---------------- */

function Instrument({ dial, label, value, note }: { dial: React.ReactNode; label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 bg-[var(--surface)] px-4 py-4 sm:px-5">
      {dial}
      <div className="w-full min-w-0">
        <dt className="text-xs whitespace-nowrap text-muted-foreground">{label}</dt>
        <dd className="text-base leading-tight font-semibold tabular-nums">{value}</dd>
        {note ? <dd className="truncate text-[0.7rem] text-muted-foreground">{note}</dd> : null}
      </div>
    </div>
  );
}

/** The eight current-conditions dials. */
export function Instruments({ data, sun, t, wind }: { data: WeatherData; sun: SunState; t: (c: number) => string; wind: (k: number) => string }) {
  const c = data.current;
  // Rain over the coming 12 hours: still useful late in the day, unlike a whole-day figure.
  const next = data.hourly.slice(0, 12);
  const rain = Math.max(0, ...next.map((h) => h.precipProb));
  const rainMm = next.reduce((t, h) => t + h.precip, 0);
  const uvPeak = sun.today?.uvMax ?? null;
  const items = [
    { label: "Humidity", dial: <Ring value={c.humidity} icon={Droplets} iconClass="text-sky-500 dark:text-sky-200" />, value: `${Math.round(c.humidity)}%`, note: c.dewPoint != null ? `Dew point ${t(c.dewPoint)}` : undefined },
    {
      label: "Wind",
      dial: (
        <div className="relative grid size-12 shrink-0 place-items-center rounded-full border border-border">
          <Navigation className="size-5 text-sky-500 dark:text-sky-200" style={{ transform: `rotate(${c.windDir + 135}deg)` }} aria-hidden="true" />
          <span className="absolute -top-1 text-[0.55rem] font-bold text-muted-foreground">N</span>
        </div>
      ),
      value: wind(c.windKmh),
      note: `From ${windDirection(c.windDir)}${c.gustKmh ? ` · gusts ${wind(c.gustKmh)}` : ""}`,
    },
    {
      label: "Rain, next 12 h",
      dial: <Ring value={rain} icon={Umbrella} iconClass="text-sky-500 dark:text-sky-200" />,
      value: `${Math.round(rain)}%`,
      note: rainMm >= 0.1 ? `${rainMm.toFixed(1)} mm expected` : rain >= 20 ? "Only light showers" : "No rain expected",
    },
    {
      label: "UV index",
      dial: <Ring value={c.uv ?? 0} max={11} color={scaleColor(c.uv ?? 0, UV_STOPS)} icon={Sun} iconClass="text-amber-500 dark:text-amber-200" />,
      value: c.uv != null ? Math.round(c.uv) : "—",
      note: c.uv != null ? `${uvLevel(c.uv)}${uvPeak != null && uvPeak > c.uv + 0.5 ? ` · peak ${Math.round(uvPeak)}` : ""}` : undefined,
    },
    {
      label: "Air quality",
      dial: <Ring value={data.air?.usAqi ?? 0} max={300} color={scaleColor(data.air?.usAqi ?? 0, AQI_STOPS)} icon={Leaf} iconClass="text-emerald-500 dark:text-emerald-200" />,
      value: data.air ? `${Math.round(data.air.usAqi)} AQI` : "—",
      note: data.air ? aqiLevel(data.air.usAqi) : "Not available",
    },
    { label: "Cloud cover", dial: <Ring value={c.cloudCover} color="#cbd5e1" icon={Cloud} iconClass="text-slate-500 dark:text-slate-200" />, value: `${Math.round(c.cloudCover)}%`, note: c.cloudCover >= 85 ? "Overcast" : c.cloudCover >= 50 ? "Mostly cloudy" : c.cloudCover >= 20 ? "Partly cloudy" : "Clear" },
    { label: "Visibility", dial: <Disc icon={Eye} iconClass="text-sky-500 dark:text-sky-200" />, value: c.visibilityM != null ? visibilityLabel(c.visibilityM) : "—" },
    {
      label: "Pressure",
      dial: <Disc icon={Gauge} iconClass="text-indigo-500 dark:text-indigo-200" />,
      value: (
        <>
          {Math.round(c.pressure)}
          <span className="text-xs font-normal text-muted-foreground"> hPa</span>
        </>
      ),
    },
  ];
  return (
    <Surface as="div">
      <SurfaceHeader icon={Activity} title="Current details" />
      <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        {items.map((i) => (
          <Instrument key={i.label} {...i} />
        ))}
      </dl>
    </Surface>
  );
}
