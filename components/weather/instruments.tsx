import * as React from "react";
import { Droplets, Eye, Gauge, Leaf, Navigation, Sun, Thermometer, Umbrella, type LucideIcon } from "lucide-react";

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
        <circle cx="20" cy="20" r={r} fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="4" />
        <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(Math.min(max, Math.max(0, value)) / max) * c} ${c}`} />
      </svg>
      {Icon ? <Icon className={`size-4 ${iconClass ?? ""}`} aria-hidden="true" /> : null}
    </div>
  );
}

function Disc({ icon: Icon, iconClass, children }: { icon: LucideIcon; iconClass: string; children?: React.ReactNode }) {
  return (
    <div className="relative grid size-12 shrink-0 place-items-center rounded-full border border-white/25">
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
    <div className="tile flex flex-col items-start gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
      {dial}
      <div className="w-full min-w-0">
        <dt className="text-xs whitespace-nowrap text-white/75">{label}</dt>
        <dd className="text-base leading-tight font-semibold tabular-nums">{value}</dd>
        {note ? <dd className="truncate text-[0.7rem] text-white/70">{note}</dd> : null}
      </div>
    </div>
  );
}

/** The eight current-conditions dials. */
export function Instruments({ data, sun, t, wind }: { data: WeatherData; sun: SunState; t: (c: number) => string; wind: (k: number) => string }) {
  const c = data.current;
  const rain = sun.today?.precipProb ?? 0;
  const items = [
    { label: "Humidity", dial: <Ring value={c.humidity} icon={Droplets} iconClass="text-sky-200" />, value: `${Math.round(c.humidity)}%`, note: c.dewPoint != null ? `Dew point ${t(c.dewPoint)}` : undefined },
    {
      label: "Wind",
      dial: (
        <div className="relative grid size-12 shrink-0 place-items-center rounded-full border border-white/25">
          <Navigation className="size-5 text-sky-200" style={{ transform: `rotate(${c.windDir + 135}deg)` }} aria-hidden="true" />
          <span className="absolute -top-1 text-[0.55rem] font-bold text-white/70">N</span>
        </div>
      ),
      value: wind(c.windKmh),
      note: `From ${windDirection(c.windDir)}${c.gustKmh ? ` · gusts ${wind(c.gustKmh)}` : ""}`,
    },
    {
      label: "Rain today",
      dial: <Ring value={rain} icon={Umbrella} iconClass="text-sky-200" />,
      value: `${Math.round(rain)}%`,
      note: sun.today && sun.today.precipSum > 0 ? `${sun.today.precipSum.toFixed(1)} mm expected` : "No rain expected",
    },
    {
      label: "UV index",
      dial: <Ring value={c.uv ?? 0} max={11} color={scaleColor(c.uv ?? 0, UV_STOPS)} icon={Sun} iconClass="text-amber-200" />,
      value: c.uv != null ? Math.round(c.uv) : "—",
      note: c.uv != null ? uvLevel(c.uv) : undefined,
    },
    {
      label: "Air quality",
      dial: <Ring value={data.air?.usAqi ?? 0} max={300} color={scaleColor(data.air?.usAqi ?? 0, AQI_STOPS)} icon={Leaf} iconClass="text-emerald-200" />,
      value: data.air ? `${Math.round(data.air.usAqi)} AQI` : "—",
      note: data.air ? aqiLevel(data.air.usAqi) : "Not available",
    },
    { label: "Feels like", dial: <Disc icon={Thermometer} iconClass="text-rose-200" />, value: t(c.feelsLike), note: `Cloud cover ${Math.round(c.cloudCover)}%` },
    { label: "Visibility", dial: <Disc icon={Eye} iconClass="text-sky-200" />, value: c.visibilityM != null ? visibilityLabel(c.visibilityM) : "—" },
    {
      label: "Pressure",
      dial: <Disc icon={Gauge} iconClass="text-indigo-200" />,
      value: (
        <>
          {Math.round(c.pressure)}
          <span className="text-xs font-normal text-white/70"> hPa</span>
        </>
      ),
    },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((i) => (
        <Instrument key={i.label} {...i} />
      ))}
    </dl>
  );
}
