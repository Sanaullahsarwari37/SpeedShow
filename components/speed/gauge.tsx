"use client";

import * as React from "react";

import { useEased } from "@/hooks/use-live";
import { useSvgId } from "@/hooks/use-ui";
import { formatMs, formatSpeed } from "@/lib/format";
import type { Phase } from "@/lib/speedtest";
import { METRICS } from "@/lib/theme";
import { cn } from "@/lib/utils";

const CX = 200;
const CY = 200;
const R = 160;
const START = 135;
const SWEEP = 270;
const ORB_R = 112;

/** Log scale: 50 Kbps at the start of the arc, 1 Gbps at the end. */
const MIN_MBPS = 0.05;
const MAX_MBPS = 1000;
const toFraction = (mbps: number) =>
  !Number.isFinite(mbps) || mbps <= MIN_MBPS ? 0 : Math.min(1, Math.log10(mbps / MIN_MBPS) / Math.log10(MAX_MBPS / MIN_MBPS));

const polar = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
};

/** Static geometry computed once at module load. */
const ARC = (() => {
  const s = polar(R, START);
  const e = polar(R, START + SWEEP);
  return `M ${s.x} ${s.y} A ${R} ${R} 0 1 1 ${e.x} ${e.y}`;
})();
const TICKS = (
  [
    [0.05, "0"],
    [0.5, "500K"],
    [1, "1M"],
    [5, "5M"],
    [10, "10M"],
    [50, "50M"],
    [100, "100M"],
    [500, "500M"],
    [1000, "1G"],
  ] as const
).map(([v, label]) => {
  const f = toFraction(v);
  const deg = START + SWEEP * f;
  return { label, f, a: polar(R + 13, deg), b: polar(R + 20, deg), l: polar(R + 35, deg) };
});
/** Two wavelengths of 232 units so a 232px shift loops seamlessly. */
const wave = (amp: number) => `M0 0 q58 ${-amp} 116 0 t116 0 t116 0 t116 0 L464 320 L0 320 Z`;
const WAVE_BACK = wave(12);
const WAVE_FRONT = wave(9);

const IDLE = { from: "#6366f1", to: "#3b82f6", glow: "#6366f1" };
const ERROR = { from: "#fb7185", to: "#e11d48", glow: "#fb7185" };
const STYLE: Record<Phase, { from: string; to: string; glow: string; label: string }> = {
  idle: { ...IDLE, label: "Ready" },
  latency: { ...METRICS.ping, label: METRICS.ping.label },
  download: { ...METRICS.download, label: METRICS.download.label },
  upload: { ...METRICS.upload, label: METRICS.upload.label },
  done: { ...METRICS.download, label: METRICS.download.label },
  error: { ...ERROR, label: "Error" },
};

interface Props {
  /** Target speed (Mbps); the gauge eases towards it itself. */
  mbps: number;
  phase: Phase;
  latency: number | null;
  className?: string;
}

/** Liquid orb gauge: arc fills on a log scale and the liquid rises with speed. */
export const SpeedGauge = React.memo(function SpeedGauge({ mbps, phase, latency, className }: Props) {
  const eased = useEased(mbps);
  const s = STYLE[phase];
  const ping = phase === "latency";
  const { value, unit } = ping ? { value: formatMs(latency), unit: "ms" } : formatSpeed(eased);
  const fraction = ping ? 0 : toFraction(eased);
  const active = phase === "latency" || phase === "download" || phase === "upload";
  const level = phase === "idle" ? 0.1 : 0.1 + fraction * 0.82;
  const id = useSvgId("g");

  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-[20rem]", className)}>
      <div aria-hidden="true" className="absolute inset-[10%] rounded-full opacity-70 blur-3xl transition-colors duration-700" style={{ background: `radial-gradient(circle, ${s.glow}66, transparent 70%)` }} />
      {active ? <div aria-hidden="true" className="pulse-ring absolute inset-[15%] rounded-full border" style={{ borderColor: `${s.glow}77` }} /> : null}

      <svg viewBox="0 0 400 400" className="relative size-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}a`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={s.from} />
            <stop offset="100%" stopColor={s.to} />
          </linearGradient>
          <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.from} stopOpacity="0.95" />
            <stop offset="100%" stopColor={s.to} stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id={`${id}o`} cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#222a6e" />
            <stop offset="55%" stopColor="#0f1445" />
            <stop offset="100%" stopColor="#060822" />
          </radialGradient>
          <clipPath id={`${id}c`}>
            <circle cx={CX} cy={CY} r={ORB_R - 2} />
          </clipPath>
          <filter id={`${id}f`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path d={ARC} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="14" strokeLinecap="round" />
        {TICKS.map((t) => {
          const lit = fraction > 0 && fraction + 0.002 >= t.f;
          return (
            <g key={t.label} opacity={lit ? 1 : 0.55}>
              <line x1={t.a.x} y1={t.a.y} x2={t.b.x} y2={t.b.y} stroke={lit ? s.glow : "currentColor"} strokeOpacity={lit ? 0.9 : 0.5} strokeWidth="2" strokeLinecap="round" />
              <text x={t.l.x} y={t.l.y} textAnchor="middle" dominantBaseline="central" fill="currentColor" fillOpacity="0.6" className="font-mono" fontSize="10.5">
                {t.label}
              </text>
            </g>
          );
        })}
        <path d={ARC} pathLength={100} fill="none" stroke={`url(#${id}a)`} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${Math.max(0.01, fraction * 100)} 100`} filter={`url(#${id}f)`} />

        <circle cx={CX} cy={CY} r={ORB_R} fill={`url(#${id}o)`} />
        <g clipPath={`url(#${id}c)`}>
          <g style={{ transform: `translateY(${CY + ORB_R - level * ORB_R * 2}px)`, transition: "transform 0.7s cubic-bezier(0.3, 0.8, 0.3, 1)" }}>
            <g transform={`translate(${CX - ORB_R}, 0)`}>
              <g className="wave-2" opacity="0.45">
                <path d={WAVE_BACK} fill={`url(#${id}l)`} />
              </g>
              <g className="wave-1" opacity="0.85">
                <path d={WAVE_FRONT} fill={`url(#${id}l)`} transform="translate(0, 5)" />
              </g>
            </g>
          </g>
          {active
            ? [0, 1, 2, 3, 4].map((i) => (
                <circle key={i} className="bubble" cx={CX - 60 + i * 30} cy={CY + ORB_R - 20} r={2 + (i % 3)} fill="#fff" fillOpacity="0.5" style={{ animationDelay: `${i * 0.8}s`, animationDuration: `${3 + (i % 3)}s` }} />
              ))
            : null}
          <ellipse cx={CX - 34} cy={CY - 72} rx="52" ry="20" fill="#fff" fillOpacity="0.1" transform={`rotate(-28 ${CX - 34} ${CY - 72})`} />
        </g>
        <circle cx={CX} cy={CY} r={ORB_R} fill="none" stroke="#a5b4fc" strokeOpacity="0.35" strokeWidth="1.5" />
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-white" aria-hidden="true">
        <span className="text-[0.7rem] font-semibold tracking-[0.18em] uppercase opacity-75 sm:text-xs">{s.label}</span>
        <span className="font-mono text-[2.5rem] leading-tight font-semibold tracking-tight tabular-nums [text-shadow:0_2px_20px_rgba(15,20,69,0.6)] sm:text-5xl">{value}</span>
        <span className="text-sm font-medium tracking-wide opacity-85">{unit}</span>
      </div>
    </div>
  );
});
