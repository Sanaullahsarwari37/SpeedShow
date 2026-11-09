"use client";

import * as React from "react";

import { LiveDot } from "@/components/ui/primitives";
import type { Direction, SeriesPoint } from "@/hooks/use-live";
import { useSvgId } from "@/hooks/use-ui";
import { formatSpeed } from "@/lib/format";
import { areaPath, niceMax, smoothPath, toPoints, type Point } from "@/lib/svg";
import { METRICS } from "@/lib/theme";

const W = 640;
const H = 160;
const BOX = { width: W, height: H, top: 16, bottom: 10 };
const DIRS: Direction[] = ["download", "upload"];

/** Real-time throughput chart; colours come from the shared metric config. */
export const LiveChart = React.memo(function LiveChart({ series, live }: { series: SeriesPoint[]; live: boolean }) {
  const id = useSvgId("c");
  const max = niceMax(Math.max(0.5, ...series.map((p) => p.mbps)) * 1.2);
  // While running, leave room ahead of the tip; when finished, use the full width.
  const pts = toPoints(
    series.map((p) => p.mbps),
    { ...BOX, max, slots: live ? Math.max(120, series.length) : series.length },
  );
  const firstUp = series.findIndex((p) => p.phase === "upload");
  const lineFor = (dir: Direction): Point[] => {
    const own = pts.filter((_, i) => series[i].phase === dir);
    // Join upload to the end of download so the trace is continuous.
    return dir === "upload" && firstUp > 0 ? [pts[firstUp - 1], ...own] : own;
  };
  const tip = pts[pts.length - 1];
  const tipColor = METRICS[series[series.length - 1]?.phase ?? "download"].from;
  const scale = formatSpeed(max);

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between text-[0.7rem] font-medium tracking-wide text-white/60">
        <span className="flex items-center gap-2">
          <LiveDot on={live} className={live ? "text-sky-400" : "text-white/40"} />
          Live throughput
        </span>
        <span className="flex items-center gap-3.5">
          {DIRS.map((d) => (
            <span key={d} className="flex items-center gap-1.5">
              <i className={`size-1.5 rounded-full ${METRICS[d].dot}`} /> {METRICS[d].label}
            </span>
          ))}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-[var(--radius-tile)] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-36 w-full sm:h-40" role="img" aria-label="Real-time download and upload throughput">
          <defs>
            {DIRS.map((d) => (
              <React.Fragment key={d}>
                <linearGradient id={`${id}f${d}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={METRICS[d].from} stopOpacity="0.42" />
                  <stop offset="100%" stopColor={METRICS[d].from} stopOpacity="0" />
                </linearGradient>
                <linearGradient id={`${id}s${d}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={METRICS[d].from} />
                  <stop offset="100%" stopColor={METRICS[d].to} />
                </linearGradient>
              </React.Fragment>
            ))}
          </defs>
          {[0.25, 0.5, 0.75].map((g) => {
            const y = BOX.top + (H - BOX.top - BOX.bottom) * g;
            return <line key={g} x1="0" x2={W} y1={y} y2={y} stroke="#fff" strokeOpacity="0.07" strokeDasharray="4 8" vectorEffect="non-scaling-stroke" />;
          })}
          {DIRS.map((d) => {
            const p = lineFor(d);
            if (p.length < 2) return null;
            return (
              <g key={d}>
                <path d={areaPath(p, H)} fill={`url(#${id}f${d})`} />
                <path d={smoothPath(p)} fill="none" stroke={`url(#${id}s${d})`} strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              </g>
            );
          })}
        </svg>
        {live && tip ? (
          <span
            aria-hidden="true"
            className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]"
            style={{ left: `${(tip[0] / W) * 100}%`, top: `${(tip[1] / H) * 100}%`, borderColor: tipColor }}
          />
        ) : null}
        <span className="pointer-events-none absolute top-2 right-3 text-[0.65rem] text-white/40 tabular-nums">
          {scale.value} {scale.unit}
        </span>
        {!series.length ? <span className="absolute inset-0 grid place-items-center text-xs text-white/40">The speed curve appears here during the test</span> : null}
      </div>
    </div>
  );
});
