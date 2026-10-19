"use client";

import * as React from "react";

import { formatSpeed } from "@/lib/format";
import type { SeriesPoint } from "@/hooks/use-speed-test";

const W = 640;
const H = 160;
const PAD = { t: 16, b: 12, l: 0, r: 0 };

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

/** Smooth cubic path through points. */
function smoothPath(pts: readonly (readonly [number, number])[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx.toFixed(1)},${y0.toFixed(1)} ${mx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d;
}

function toPoints(series: SeriesPoint[], max: number, total: number) {
  const plotH = H - PAD.t - PAD.b;
  return series.map((s, i) => {
    const x = total <= 1 ? 0 : (i / (total - 1)) * W;
    const y = H - PAD.b - (s.mbps / max) * plotH;
    return [x, y] as const;
  });
}

function splitByPhase(series: SeriesPoint[], all: readonly (readonly [number, number])[]) {
  const down: (readonly [number, number])[] = [];
  const up: (readonly [number, number])[] = [];
  series.forEach((s, i) => {
    if (s.phase === "download") down.push(all[i]);
    else up.push(all[i]);
  });
  return { down, up };
}

/** Modern real-time throughput chart. */
export function LiveChart({ series, live }: { series: SeriesPoint[]; live: boolean }) {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const peak = Math.max(0.5, ...series.map((s) => s.mbps));
  const max = niceMax(peak * 1.2);
  const total = Math.max(120, series.length);
  const all = toPoints(series, max, total);
  const { down, up } = splitByPhase(series, all);
  const last = all[all.length - 1];
  const maxLabel = formatSpeed(max);

  const area = (pts: readonly (readonly [number, number])[]) =>
    pts.length > 1
      ? `${smoothPath(pts)} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`
      : "";

  return (
    <div className="relative">
      <div className="mb-2.5 flex items-center justify-between text-[0.7rem] font-medium tracking-wide text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className={`relative flex size-1.5 ${live ? "" : "opacity-50"}`}>
            {live && <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-400 opacity-70" />}
            <span className={`relative inline-flex size-1.5 rounded-full ${live ? "bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" : "bg-muted-foreground/40"}`} />
          </span>
          Live throughput
        </span>
        <span className="flex items-center gap-3.5">
          <span className="flex items-center gap-1.5">
            <i className="size-1.5 rounded-full bg-gradient-to-r from-sky-400 to-blue-500" /> Down
          </span>
          <span className="flex items-center gap-1.5">
            <i className="size-1.5 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" /> Up
          </span>
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="relative block h-36 w-full sm:h-40"
          role="img"
          aria-label="Real-time download and upload throughput"
        >
          <defs>
            <linearGradient id={`fd-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`fu-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`ld-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id={`lu-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#e879f9" />
            </linearGradient>
            <filter id={`glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Subtle grid */}
          {[0.25, 0.5, 0.75].map((g) => (
            <line
              key={g}
              x1="0"
              x2={W}
              y1={PAD.t + (H - PAD.t - PAD.b) * g}
              y2={PAD.t + (H - PAD.t - PAD.b) * g}
              stroke="currentColor"
              strokeOpacity="0.07"
              strokeDasharray="4 8"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* Filled areas */}
          {down.length > 1 && <path d={area(down)} fill={`url(#fd-${uid})`} />}
          {up.length > 1 && <path d={area(up)} fill={`url(#fu-${uid})`} />}

          {/* Lines with soft glow */}
          {down.length > 1 && (
            <path
              d={smoothPath(down)}
              fill="none"
              stroke={`url(#ld-${uid})`}
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              filter={`url(#glow-${uid})`}
            />
          )}
          {up.length > 1 && (
            <path
              d={smoothPath(up)}
              fill="none"
              stroke={`url(#lu-${uid})`}
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              filter={`url(#glow-${uid})`}
            />
          )}

          {/* Live tip */}
          {live && last && (
            <circle
              cx={last[0]}
              cy={last[1]}
              r="4.5"
              fill="#fff"
              stroke={series[series.length - 1]?.phase === "upload" ? "#c084fc" : "#38bdf8"}
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* Scale label */}
        <div className="pointer-events-none absolute top-2 right-3 text-[0.65rem] tabular-nums text-white/40">
          {maxLabel.value} {maxLabel.unit}
        </div>
      </div>
    </div>
  );
}
