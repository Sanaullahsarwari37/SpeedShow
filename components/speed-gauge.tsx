"use client";

import * as React from "react";

import { formatSpeed } from "@/lib/format";
import { speedToFraction } from "@/lib/rating";
import type { Phase } from "@/lib/speedtest";
import { cn } from "@/lib/utils";

const CX = 200;
const CY = 200;
const R = 160;
const START = 135; // degrees, bottom-left
const SWEEP = 270;
const ORB_R = 112;

/** Gauge scale marks: value in Mbps + label. The scale is logarithmic (50 Kbps → 1 Gbps). */
const TICKS: { v: number; l: string }[] = [
  { v: 0.05, l: "0" },
  { v: 0.5, l: "500K" },
  { v: 1, l: "1M" },
  { v: 5, l: "5M" },
  { v: 10, l: "10M" },
  { v: 50, l: "50M" },
  { v: 100, l: "100M" },
  { v: 500, l: "500M" },
  { v: 1000, l: "1G" },
];

function polar(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

const ARC_PATH = (() => {
  const s = polar(R, START);
  const e = polar(R, START + SWEEP);
  return `M ${s.x} ${s.y} A ${R} ${R} 0 1 1 ${e.x} ${e.y}`;
})();

/** One wavelength = 232 units; 4 segments = 2 wavelengths so a 232px shift loops seamlessly. */
function wavePath(amp: number) {
  return `M0 0 q58 ${-amp} 116 0 t116 0 t116 0 t116 0 L464 320 L0 320 Z`;
}

const PHASE_STYLE: Record<string, { from: string; to: string; glow: string; label: string }> = {
  idle: { from: "#6366f1", to: "#3b82f6", glow: "#6366f1", label: "Ready" },
  download: { from: "#3b82f6", to: "#6366f1", glow: "#3b82f6", label: "Download" },
  upload: { from: "#818cf8", to: "#7c3aed", glow: "#818cf8", label: "Upload" },
  done: { from: "#38bdf8", to: "#6366f1", glow: "#6366f1", label: "Complete" },
  error: { from: "#fb7185", to: "#e11d48", glow: "#fb7185", label: "Error" },
};

function useAnimatedNumber(target: number) {
  const [value, setValue] = React.useState(target);
  const cur = React.useRef(target);
  React.useEffect(() => {
    let raf = 0;
    const tick = () => {
      const d = target - cur.current;
      if (Math.abs(d) < Math.max(0.0002, Math.abs(target) * 0.002)) {
        cur.current = target;
        setValue(target);
        return;
      }
      cur.current += d * 0.16;
      setValue(cur.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

interface SpeedGaugeProps {
  /** Speed to display in Mbps (live or final). */
  mbps: number;
  phase: Phase;
  className?: string;
}

export function SpeedGauge({ mbps, phase, className }: SpeedGaugeProps) {
  const style = PHASE_STYLE[phase] ?? PHASE_STYLE.idle;
  const display = useAnimatedNumber(mbps);
  const { value, unit } = formatSpeed(display);

  const fraction = speedToFraction(display);
  const active = phase === "download" || phase === "upload";
  const level = phase === "idle" ? 0.1 : Math.max(0.1, 0.1 + fraction * 0.82);
  const waveY = CY + ORB_R - level * ORB_R * 2;

  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gradId = `g-${uid}`;
  const liqId = `l-${uid}`;
  const clipId = `c-${uid}`;
  const glowId = `f-${uid}`;
  const orbId = `o-${uid}`;

  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-[20rem] sm:max-w-[20rem]", className)}>
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="absolute inset-[10%] rounded-full opacity-70 blur-3xl transition-colors duration-700"
        style={{ background: `radial-gradient(circle, ${style.glow}66, transparent 70%)` }}
      />
      {active && (
        <div aria-hidden="true" className="pulse-ring absolute inset-[15%] rounded-full border" style={{ borderColor: `${style.glow}77` }} />
      )}

      <svg viewBox="0 0 400 400" className="relative size-full overflow-visible" role="img" aria-label={`Speed gauge: ${value} ${unit}`}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={style.from} />
            <stop offset="100%" stopColor={style.to} />
          </linearGradient>
          <linearGradient id={liqId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={style.from} stopOpacity="0.95" />
            <stop offset="100%" stopColor={style.to} stopOpacity="0.92" />
          </linearGradient>
          <radialGradient id={orbId} cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#222a6e" />
            <stop offset="55%" stopColor="#0f1445" />
            <stop offset="100%" stopColor="#060822" />
          </radialGradient>
          <clipPath id={clipId}>
            <circle cx={CX} cy={CY} r={ORB_R - 2} />
          </clipPath>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <path d={ARC_PATH} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="14" strokeLinecap="round" />

        {/* Ticks + labels */}
        {TICKS.map((t) => {
          const f = speedToFraction(t.v);
          const deg = START + SWEEP * f;
          const a = polar(R + 13, deg);
          const b = polar(R + 20, deg);
          const l = polar(R + 35, deg);
          const lit = fraction + 0.002 >= f;
          return (
            <g key={t.l} opacity={lit ? 1 : 0.55} className="transition-opacity duration-500">
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={lit ? style.glow : "currentColor"} strokeOpacity={lit ? 0.9 : 0.5} strokeWidth="2" strokeLinecap="round" />
              <text x={l.x} y={l.y} textAnchor="middle" dominantBaseline="central" className="fill-muted-foreground font-mono" fontSize="10.5">
                {t.l}
              </text>
            </g>
          );
        })}

        {/* Progress arc */}
        <path
          d={ARC_PATH}
          pathLength={100}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${Math.max(0.01, fraction * 100)} 100`}
          filter={`url(#${glowId})`}
          style={{ transition: "stroke-dasharray 0.25s ease-out" }}
        />

        {/* Orb */}
        <circle cx={CX} cy={CY} r={ORB_R} fill={`url(#${orbId})`} />
        <g clipPath={`url(#${clipId})`}>
          {/* Liquid */}
          <g style={{ transform: `translateY(${waveY}px)`, transition: "transform 0.7s cubic-bezier(0.3, 0.8, 0.3, 1)" }}>
            <g transform={`translate(${CX - ORB_R}, 0)`}>
              <g className="wave-2" opacity="0.45">
                <path d={wavePath(12)} fill={`url(#${liqId})`} />
              </g>
              <g className="wave-1" opacity="0.85">
                <path d={wavePath(9)} fill={`url(#${liqId})`} transform="translate(0, 5)" />
              </g>
            </g>
          </g>
          {active &&
            [0, 1, 2, 3, 4].map((i) => (
              <circle
                key={i}
                className="bubble"
                cx={CX - 60 + i * 30}
                cy={CY + ORB_R - 20}
                r={2 + (i % 3)}
                fill="#fff"
                fillOpacity="0.5"
                style={{ animationDelay: `${i * 0.8}s`, animationDuration: `${3 + (i % 3)}s` }}
              />
            ))}
          {/* Glass reflection */}
          <ellipse cx={CX - 34} cy={CY - 72} rx="52" ry="20" fill="#fff" fillOpacity="0.1" transform={`rotate(-28 ${CX - 34} ${CY - 72})`} />
        </g>
        <circle cx={CX} cy={CY} r={ORB_R} fill="none" stroke="#a5b4fc" strokeOpacity="0.35" strokeWidth="1.5" />
      </svg>

      {/* Centre readout (light text: the orb is a dark crystal in both themes) */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-[0.7rem] font-semibold tracking-[0.18em] uppercase opacity-75 sm:text-xs">{style.label}</span>
        <span
          className="font-mono text-[2.4rem] leading-tight font-semibold tracking-tight tabular-nums [text-shadow:0_2px_20px_rgba(15,20,69,0.6)] sm:text-5xl"
          aria-live="off"
        >
          {value}
        </span>
        <span className="text-sm font-medium tracking-wide opacity-85">{unit}</span>
      </div>
    </div>
  );
}
