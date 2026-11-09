import { Sunrise, Sunset } from "lucide-react";

import { MoonGlyph } from "@/components/weather/sky";
import { SKY_LABEL } from "@/components/weather/styles";
import type { SunState } from "@/components/weather/use-sun";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { formatClock, formatMinutes, isoMinutes } from "@/lib/format";
import { areaPath, smoothPath } from "@/lib/svg";
import type { WeatherData } from "@/lib/types";
import { cn } from "@/lib/utils";

type Temp = (c: number) => string;

/* ---------------- Next 24 hours ---------------- */

const HW = 720;
const HH = 120;

export function HourlyCurve({ hours, t }: { hours: WeatherData["hourly"]; t: Temp }) {
  const list = hours.slice(0, 24);
  if (list.length < 3) return null;
  const pad = 22;
  const top = 30;
  const bottom = 22;
  const lo = Math.min(...list.map((h) => h.temp));
  const span = Math.max(1, Math.max(...list.map((h) => h.temp)) - lo);
  const pts = list.map((h, i) => [pad + (i * (HW - pad * 2)) / (list.length - 1), top + (1 - (h.temp - lo) / span) * (HH - top - bottom)] as const);

  return (
    <div className="tile p-4">
      <h3 className={SKY_LABEL}>Next 24 hours</h3>
      <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
        <svg viewBox={`0 0 ${HW} ${HH + 48}`} className="mt-2 h-44 w-full min-w-[40rem]" role="img" aria-label="Hourly temperature and rain chance for the next 24 hours">
          <defs>
            <linearGradient id="hc-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath(pts, HH)} fill="url(#hc-fill)" />
          <path d={smoothPath(pts)} fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          {pts.map(([x, y], i) => {
            if (i % 3) return null;
            const h = list[i];
            return (
              <g key={h.time}>
                <circle cx={x} cy={y} r="3.5" fill="#fff" />
                <text x={x} y={y - 10} textAnchor="middle" fontSize="12" fontWeight="600" fill="#fff">
                  {t(h.temp)}
                </text>
                <text x={x} y={HH + 16} textAnchor="middle" fontSize="11" fill="#fff" fillOpacity="0.75">
                  {i === 0 ? "Now" : formatClock(isoMinutes(h.time), { minute: undefined })}
                </text>
                {h.precipProb >= 20 ? (
                  <text x={x} y={HH + 36} textAnchor="middle" fontSize="10.5" fill="#bae6fd">
                    💧{Math.round(h.precipProb)}%
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ---------------- Sun & moon ---------------- */

export function SunMoon({ s }: { s: SunState }) {
  const f = s.sun;
  const x = f != null ? 120 - 100 * Math.cos(Math.PI * f) : null;
  const y = f != null ? 105 - 100 * Math.sin(Math.PI * f) : null;
  return (
    <div className="tile p-4">
      <div className="flex items-center justify-between">
        <h3 className={SKY_LABEL}>Sun &amp; moon</h3>
        <span className="text-xs text-white/75 tabular-nums">{s.next}</span>
      </div>
      {!s.polar ? (
        <svg viewBox="0 0 240 118" className="mt-2 w-full" role="img" aria-label={`Sunrise ${formatClock(s.rise)}, sunset ${formatClock(s.set)}. ${s.next}.`}>
          <defs>
            <linearGradient id="sp-grad" x1="0" x2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
            <radialGradient id="sp-glow">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <line x1="10" y1="105" x2="230" y2="105" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
          <path d="M20 105 A100 100 0 0 1 220 105" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round" />
          {x != null && y != null ? (
            <>
              <path d={`M20 105 A100 100 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`} fill="none" stroke="url(#sp-grad)" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx={x} cy={y} r="22" fill="url(#sp-glow)" />
              <circle cx={x} cy={y} r="9" fill="#fde68a" />
            </>
          ) : null}
        </svg>
      ) : null}
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          <Sunrise className="size-3.5 text-amber-200" aria-hidden="true" />
          {formatClock(s.rise)}
        </span>
        <span className="text-white/70 tabular-nums">{s.daylight != null ? `${formatMinutes(s.daylight)} daylight` : ""}</span>
        <span className="flex items-center gap-1.5 font-medium">
          <Sunset className="size-3.5 text-orange-300" aria-hidden="true" />
          {formatClock(s.set)}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-3">
        <MoonGlyph fraction={s.moon.fraction} className="size-9" />
        <p className="text-sm">
          <span className="font-medium">{s.moon.name}</span>
          <span className="block text-xs text-white/70">{Math.round(s.moon.illumination * 100)}% illuminated</span>
        </p>
      </div>
    </div>
  );
}

/* ---------------- 7-day forecast ---------------- */

function dayName(iso: string, i: number) {
  if (i === 0) return "Today";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function Forecast({ days, t }: { days: WeatherData["daily"]; t: Temp }) {
  const lo = Math.min(...days.map((d) => d.min));
  const span = Math.max(1, Math.max(...days.map((d) => d.max)) - lo);
  return (
    <div className="tile p-4">
      <h3 className={cn(SKY_LABEL, "mb-2")}>7-day forecast</h3>
      <ul className="space-y-1.5">
        {days.map((d, i) => (
          <li key={d.date} className="grid grid-cols-[2.8rem_1.4rem_2.2rem_1fr_2.2rem] items-center gap-2 text-sm">
            <span className="font-medium">{dayName(d.date, i)}</span>
            <WeatherIcon code={d.code} className="size-5 text-white" />
            <span className="text-right text-white/70 tabular-nums">{t(d.min)}</span>
            <span className="relative h-1.5 rounded-full bg-white/20" aria-hidden="true">
              <span
                className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-200 via-white to-amber-200"
                style={{ left: `${((d.min - lo) / span) * 100}%`, width: `${Math.max(8, ((d.max - d.min) / span) * 100)}%` }}
              />
            </span>
            <span className="font-semibold tabular-nums">{t(d.max)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
