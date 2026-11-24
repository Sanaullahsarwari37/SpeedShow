import { Sun as SunIcon } from "lucide-react";

import { Surface, SurfaceHeader } from "@/components/ui/surface";
import { MoonGlyph } from "@/components/weather/sky";
import type { SunState } from "@/components/weather/use-sun";
import { useSvgId } from "@/hooks/use-ui";
import { formatClock, formatMinutes } from "@/lib/format";
import { uvLevel } from "@/lib/weather";

/* ------------------------------------------------------------------ */
/* 24-hour sun path                                                    */
/* ------------------------------------------------------------------ */

const W = 360;
const H = 150;
const HY = 96; // horizon
const AMP = 70; // peak height above the horizon
const BELOW = 30; // deepest dip below the horizon (midnight)
const DAY = 1440;

/**
 * Sun height through the day as a cosine centred on solar noon, scaled so it
 * crosses the horizon exactly at sunrise and sunset (1 = noon peak, < 0 = below).
 */
function elevation(t: number, noon: number, daylight: number) {
  const c0 = Math.cos((Math.PI * daylight) / DAY);
  return (Math.cos((2 * Math.PI * (t - noon)) / DAY) - c0) / (1 - c0);
}

function SunPath({ s }: { s: SunState }) {
  const id = useSvgId("sp");
  if (s.rise == null || s.set == null || s.daylight == null) return null;
  const noon = (s.rise + s.set) / 2;
  // Above the horizon scale to AMP; below it, scale the night dip so its lowest point is BELOW deep.
  const floor = Math.abs(elevation(noon + DAY / 2, noon, s.daylight)) || 1;
  const y = (t: number) => {
    const e = elevation(t, noon, s.daylight!);
    return e >= 0 ? HY - e * AMP : HY - (e / floor) * BELOW;
  };
  const x = (t: number) => (t / DAY) * W;
  const pts: [number, number][] = [];
  for (let t = 0; t <= DAY; t += 10) pts.push([x(t), y(t)]);
  const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join("");
  const area = `${line}L${W} ${HY}L0 ${HY}Z`;
  const now = s.minutes;
  const sx = x(now);
  const sy = y(now);
  const up = sy < HY;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Sun path today. Sunrise ${formatClock(s.rise)}, sunset ${formatClock(s.set)}. ${s.next}.`}>
      <defs>
        <clipPath id={`${id}a`}>
          <rect x="0" y="0" width={W} height={HY} />
        </clipPath>
        <clipPath id={`${id}p`}>
          <rect x="0" y="0" width={sx} height={H} />
        </clipPath>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.3" />
          <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}s`}>
          <stop offset="0" stopColor="#fde68a" stopOpacity="0.6" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Daylight area above the horizon */}
      <path d={area} fill={`url(#${id}g)`} clipPath={`url(#${id}a)`} />
      {/* Whole day (future), then the elapsed part brighter */}
      <path d={line} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="3 4" />
      <path d={line} fill="none" stroke="#fbbf24" strokeWidth="2.25" strokeLinecap="round" clipPath={`url(#${id}p)`} />

      {/* Horizon + sunrise / sunset ticks */}
      <line x1="0" x2={W} y1={HY} y2={HY} stroke="currentColor" strokeOpacity="0.25" />
      {[s.rise, s.set].map((t, i) => (
        <g key={t}>
          <circle cx={x(t)} cy={HY} r="2.5" style={{ fill: "var(--surface)" }} stroke="currentColor" strokeOpacity="0.6" />
          {/* Outside the arc: sunrise label to its left, sunset to its right */}
          <text x={x(t) + (i ? 7 : -7)} y={HY - 7} textAnchor={i ? "start" : "end"} fontSize="10" fill="currentColor" fillOpacity="0.8">
            {formatClock(t)}
          </text>
        </g>
      ))}
      {/* Time axis */}
      {[0, 360, 720, 1080, 1440].map((t) => (
        <text key={t} x={Math.min(W - 2, Math.max(2, x(t)))} y={H - 2} textAnchor={t === 0 ? "start" : t === 1440 ? "end" : "middle"} fontSize="9" fill="currentColor" fillOpacity="0.5">
          {formatClock(t % DAY, { minute: undefined })}
        </text>
      ))}

      {/* Now */}
      <line x1={sx} x2={sx} y1="8" y2={HY} stroke="currentColor" strokeOpacity="0.1" />
      {up ? <circle cx={sx} cy={sy} r="16" fill={`url(#${id}s)`} /> : null}
      <circle cx={sx} cy={sy} r={up ? 5.5 : 4} fill={up ? "#fbbf24" : "var(--surface)"} stroke={up ? "none" : "currentColor"} strokeWidth="1.5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="min-w-0 bg-[var(--surface)] px-4 py-3.5 sm:px-5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tracking-tight tabular-nums">{value}</dd>
      {note ? <dd className="truncate text-xs text-muted-foreground">{note}</dd> : null}
    </div>
  );
}

const days = (d: number) => (d < 1 ? "tonight" : `in ${Math.round(d)} day${Math.round(d) === 1 ? "" : "s"}`);

export function SunMoon({ s }: { s: SunState }) {
  const change = s.daylightChange;
  const uv = s.today?.uvMax ?? null;
  const noon = s.rise != null && s.set != null ? (s.rise + s.set) / 2 : null;

  return (
    <Surface as="div" className="h-full">
      <SurfaceHeader icon={SunIcon} title="Sun & moon" actions={<span className="pr-2 text-xs text-muted-foreground tabular-nums">{s.next}</span>} />

      {s.polar ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground sm:px-6">{s.isUp ? "Polar day: the sun stays up all day." : "Polar night: the sun stays down all day."}</p>
      ) : (
        <div className="px-4 pt-4 pb-2 sm:px-5">
          <SunPath s={s} />
        </div>
      )}

      <dl className="grid grid-cols-2 gap-px border-y border-border bg-border">
        <Stat
          label="Daylight"
          value={s.daylight != null ? formatMinutes(s.daylight) : "—"}
          note={change != null && Math.round(change) !== 0 ? `${change > 0 ? "+" : "−"}${formatMinutes(Math.abs(change))} tomorrow` : change != null ? "Same tomorrow" : undefined}
        />
        <Stat label="Solar noon" value={formatClock(noon)} note="Sun at its highest" />
        <Stat label="Golden hour" value={s.set != null ? formatClock(s.set - 60) : "—"} note="Soft light until sunset" />
        <Stat label="UV peak" value={uv != null ? String(Math.round(uv)) : "—"} note={uv != null ? uvLevel(uv) : undefined} />
      </dl>

      <div className="flex items-center gap-4 px-4 py-4 sm:px-5">
        <span className="relative grid size-14 shrink-0 place-items-center rounded-full border border-border bg-slate-900 dark:bg-indigo-400/5">
          <MoonGlyph fraction={s.moon.fraction} className="size-10" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{s.moon.name}</p>
          <p className="text-xs text-muted-foreground">{Math.round(s.moon.illumination * 100)}% illuminated</p>
        </div>
        <dl className="shrink-0 text-right text-xs text-muted-foreground">
          <div>
            <dt className="inline">Full moon </dt>
            <dd className="inline font-medium text-foreground">{days(s.moon.toFull)}</dd>
          </div>
          <div className="mt-1">
            <dt className="inline">New moon </dt>
            <dd className="inline font-medium text-foreground">{days(s.moon.toNew)}</dd>
          </div>
        </dl>
      </div>
    </Surface>
  );
}
