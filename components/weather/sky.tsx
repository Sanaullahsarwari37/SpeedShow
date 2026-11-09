"use client";

import * as React from "react";

import { useSvgId } from "@/hooks/use-ui";
import type { DayPart, WeatherKind } from "@/lib/weather";

/**
 * Realistic sky driven by live data:
 *  - cloud count, size and darkness follow the reported cloud cover and condition
 *  - the sun and moon sit where they really are, hidden or glowing through clouds as they would be
 *  - rain / drizzle / snow density follows the reported intensity; storms get lightning bolts
 *  - fog is drifting mist bands; stars only show through clear patches at night
 * Pure CSS/SVG with deterministic positions (no layout shift, no JS animation loop).
 */

const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Sky-arc position (0 = east horizon, 1 = west horizon) in % of the top band. */
const arc = (f: number) => ({ left: `${8 + f * 84}%`, top: `${78 - Math.sin(Math.PI * f) * 62}%` });

/* ------------------------------------------------------------------ */
/* Moon                                                                */
/* ------------------------------------------------------------------ */

export function MoonGlyph({ fraction, className }: { fraction: number; className?: string }) {
  const r = 10;
  const k = Math.cos(2 * Math.PI * fraction);
  const waxing = fraction < 0.5;
  const inner = waxing ? (k > 0 ? 0 : 1) : k > 0 ? 1 : 0;
  const d = `M0 ${-r} A${r} ${r} 0 0 ${waxing ? 1 : 0} 0 ${r} A${Math.abs(k) * r} ${r} 0 0 ${inner} 0 ${-r}Z`;
  return (
    <svg viewBox="-12 -12 24 24" className={className} aria-hidden="true">
      <circle r={r} fill="#c7d2fe" fillOpacity="0.18" />
      <path d={d} fill="#e8edff" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Clouds                                                              */
/* ------------------------------------------------------------------ */

type Tone = "white" | "grey" | "rain" | "storm" | "night" | "golden";

/** [lit top, shaded base] per cloud tone. */
const TONE: Record<Tone, [string, string]> = {
  white: ["#ffffff", "#d9e2ee"],
  grey: ["#e9edf2", "#9aa5b4"],
  rain: ["#aeb7c3", "#5f6a7a"],
  storm: ["#6a7184", "#262a38"],
  night: ["#56607c", "#232a42"],
  golden: ["#ffe2cc", "#94809a"],
};

/** Three puff layouts (viewBox 200 × 100), each a list of circles + a flat base. */
const SHAPES: [number, number, number][][] = [
  [[50, 64, 24], [84, 50, 32], [124, 52, 30], [156, 66, 21]],
  [[42, 68, 19], [72, 54, 27], [108, 42, 35], [146, 56, 27], [172, 70, 16]],
  [[62, 62, 23], [96, 50, 30], [132, 60, 23]],
];

function Cloud({ shape, tone, gid, style, className }: { shape: number; tone: Tone; gid: string; style: React.CSSProperties; className?: string }) {
  const [, shade] = TONE[tone];
  const puffs = SHAPES[shape];
  const xs = puffs.map(([x, , r]) => [x - r, x + r]);
  const left = Math.min(...xs.map((p) => p[0]));
  const right = Math.max(...xs.map((p) => p[1]));
  return (
    <svg viewBox="0 0 200 100" className={className} style={style} aria-hidden="true">
      <g fill={`url(#${gid}-${tone})`}>
        {puffs.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
        <rect x={left + 8} y={62} width={right - left - 16} height={24} rx={12} />
      </g>
      {/* shaded underside */}
      <ellipse cx={(left + right) / 2} cy={84} rx={(right - left) / 2 - 6} ry={8} fill={shade} opacity={0.55} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

interface SkyProps {
  kind: WeatherKind;
  part: DayPart;
  /** 0..1 sun progress from sunrise to sunset (null when it's down). */
  sun: number | null;
  /** 0..1 progress through the night (null during the day). */
  night: number | null;
  /** Moon phase 0..1. */
  moon: number;
  /** Reported cloud cover, %. */
  cover: number;
  /** Precipitation strength 0..1. */
  intensity: number;
}

const STARS = Array.from({ length: 46 }, (_, i) => ({ x: 3 + rnd(i, 1) * 94, y: 3 + rnd(i, 2) * 42, s: rnd(i, 3) > 0.82 ? 2 : 1, d: rnd(i, 4) * 4 }));
const BOLTS = ["M30 0 L18 34 L28 34 L14 70 L40 26 L29 26 L38 0Z", "M24 0 L12 30 L22 30 L8 62 L34 22 L24 22 L32 0Z"];

export const Sky = React.memo(function Sky({ kind, part, sun, night, moon, cover, intensity }: SkyProps) {
  const gid = useSvgId("k");
  const wet = kind === "rain" || kind === "drizzle";
  const overcast = kind === "cloud" || wet || kind === "storm" || kind === "snow";

  // How the sun / moon / stars come through.
  const bodyOpacity = kind === "clear" ? 1 : kind === "partly" ? 0.9 : kind === "fog" ? 0.35 : overcast && kind !== "storm" && !wet ? 0.22 : 0;
  const starOpacity = kind === "clear" ? 1 : kind === "partly" ? Math.max(0.25, 1 - cover / 100) : 0;

  // Cloud field from the real cloud cover.
  const count =
    kind === "clear" ? (cover >= 25 ? 2 : cover >= 10 ? 1 : 0) : kind === "partly" ? Math.min(5, Math.max(2, Math.round(cover / 18))) : kind === "fog" ? 0 : 9;
  const tone: Tone =
    kind === "storm" ? "storm" : part === "night" ? "night" : wet || kind === "snow" ? "rain" : kind === "cloud" ? "grey" : part === "day" ? "white" : "golden";
  const clouds = Array.from({ length: count }, (_, i) => {
    const front = i % 3 === 2;
    const w = overcast ? 46 + rnd(i, 11) * 30 : 30 + rnd(i, 11) * 22;
    return {
      shape: i % 3,
      front,
      style: {
        left: `${(overcast ? -18 + (i / count) * 104 : 4 + rnd(i, 12) * 78) + (rnd(i, 13) - 0.5) * 10}%`,
        top: `${overcast ? -6 + rnd(i, 14) * 30 : 4 + rnd(i, 14) * 34}%`,
        width: `${w}%`,
        opacity: (front ? 0.95 : 0.75) * (part === "night" ? 0.8 : 1),
        animationDuration: `${34 + rnd(i, 15) * 30}s`,
        animationDelay: `${-rnd(i, 16) * 30}s`,
      } as React.CSSProperties,
    };
  });

  // Precipitation density from intensity.
  const precip = kind === "snow" ? "snow" : wet || kind === "storm" ? "rain" : null;
  const drops = precip === "snow" ? Math.round(28 + intensity * 44) : kind === "drizzle" ? Math.round(24 + intensity * 20) : Math.round(40 + intensity * 64);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg width="0" height="0" className="absolute">
        <defs>
          {(Object.keys(TONE) as Tone[]).map((t) => (
            <linearGradient key={t} id={`${gid}-${t}`} x1="0" y1="10" x2="0" y2="92" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={TONE[t][0]} />
              <stop offset="100%" stopColor={TONE[t][1]} />
            </linearGradient>
          ))}
          <radialGradient id={`${gid}-sun`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffbe6" />
            <stop offset="30%" stopColor="#fde68a" stopOpacity="0.75" />
            <stop offset="65%" stopColor="#fbbf24" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Horizon light */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            part === "day"
              ? "linear-gradient(to top, rgba(255,255,255,0.14), transparent)"
              : part === "night"
                ? "linear-gradient(to top, rgba(99,102,241,0.08), transparent)"
                : "linear-gradient(to top, rgba(251,146,60,0.22), transparent)",
        }}
      />

      {/* Stars through clear patches */}
      {(part === "night" || part === "dusk") && starOpacity > 0
        ? STARS.map((s, i) => (
            <span
              key={i}
              className="star absolute rounded-full bg-white"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: starOpacity * (s.s > 1 ? 0.95 : 0.55) * (part === "dusk" ? 0.5 : 1), animationDelay: `${s.d}s` }}
            />
          ))
        : null}

      {/* Sun and moon on their real arc */}
      <div className="absolute inset-x-0 top-0 h-72 sm:h-80">
        {sun != null && bodyOpacity > 0 ? (
          <div className="absolute size-44 -translate-x-1/2 -translate-y-1/2 sm:size-52" style={{ ...arc(sun), opacity: bodyOpacity }}>
            <svg viewBox="0 0 200 200" className="size-full">
              <circle cx="100" cy="100" r="96" fill={`url(#${gid}-sun)`} />
              {kind === "clear" || kind === "partly" ? (
                <>
                  <g className="sun-rays" stroke="#fef08a" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round">
                    {Array.from({ length: 12 }, (_, i) => {
                      const a = (i * Math.PI) / 6;
                      const o = i % 2 === 0 ? 70 : 62;
                      return <line key={i} x1={100 + Math.cos(a) * 46} y1={100 + Math.sin(a) * 46} x2={100 + Math.cos(a) * o} y2={100 + Math.sin(a) * o} />;
                    })}
                  </g>
                  <circle cx="100" cy="100" r="28" fill="#fffbe6" />
                  <circle cx="100" cy="100" r="22" fill="#fde68a" opacity="0.85" />
                </>
              ) : null}
            </svg>
          </div>
        ) : null}
        {night != null && bodyOpacity > 0 ? (
          <div className="absolute size-16 -translate-x-1/2 -translate-y-1/2 sm:size-20" style={{ ...arc(night), opacity: bodyOpacity }}>
            <div className="absolute -inset-6 rounded-full bg-indigo-200/15 blur-2xl" />
            <MoonGlyph fraction={moon} className="relative size-full drop-shadow-[0_0_24px_rgba(199,210,254,0.55)]" />
          </div>
        ) : null}
      </div>

      {/* Overcast ceiling: a soft deck behind the individual clouds */}
      {overcast ? (
        <div
          className="absolute inset-x-0 top-0 h-80 sm:h-96"
          style={{
            background: `linear-gradient(to bottom, ${TONE[tone][1]}${kind === "storm" ? "f0" : "b0"}, ${TONE[tone][1]}00)`,
          }}
        />
      ) : null}

      {/* Cloud field: back layer, then front layer */}
      <div className="absolute inset-x-0 top-0 h-72 sm:h-80">
        {clouds
          .filter((c) => !c.front)
          .concat(clouds.filter((c) => c.front))
          .map((c, i) => (
            <Cloud key={i} gid={gid} shape={c.shape} tone={tone} style={c.style} className={`absolute ${i % 2 ? "drift-b" : "drift-a"}`} />
          ))}
      </div>

      {/* Fog banks */}
      {kind === "fog"
        ? [22, 42, 62, 80].map((top, i) => (
            <div
              key={top}
              className={`absolute -inset-x-1/4 h-[16%] ${i % 2 ? "drift-b" : "drift-a"}`}
              style={{ top: `${top}%`, background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.28), transparent)", filter: "blur(10px)" }}
            />
          ))
        : null}

      {/* Rain / drizzle / snow */}
      {precip ? (
        <div className={`precip ${precip} ${precip === "rain" ? "-skew-x-12" : ""}`}>
          {Array.from({ length: drops }, (_, i) => (
            <i
              key={i}
              style={
                {
                  left: `${rnd(i, 5) * 110 - 5}%`,
                  "--d": `${-rnd(i, 6) * 4}s`,
                  "--t":
                    precip === "snow"
                      ? `${4 + rnd(i, 7) * 4}s`
                      : kind === "drizzle"
                        ? `${1.2 + rnd(i, 7) * 0.6}s`
                        : `${0.55 + rnd(i, 7) * 0.35 - intensity * 0.15}s`,
                  "--drift": precip === "snow" ? `${(rnd(i, 8) - 0.5) * 60}px` : "0px",
                  ...(precip === "snow"
                    ? { width: `${2 + rnd(i, 9) * 4}px`, height: `${2 + rnd(i, 9) * 4}px`, opacity: 0.6 + rnd(i, 10) * 0.4 }
                    : kind === "drizzle"
                      ? { height: "9px", opacity: 0.55 }
                      : { height: `${12 + intensity * 12}px`, width: intensity > 0.7 ? "2px" : undefined, opacity: 0.6 + intensity * 0.35 }),
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ) : null}

      {/* Thunderstorm */}
      {kind === "storm" ? (
        <>
          <div className="lightning" />
          {BOLTS.map((d, i) => (
            <svg
              key={i}
              viewBox="0 0 48 72"
              className="bolt absolute w-10 sm:w-12"
              style={{ left: i ? "68%" : "22%", top: i ? "14%" : "8%", animationDelay: `${i * 2.6}s` }}
            >
              <path d={d} fill="#fef9c3" />
            </svg>
          ))}
        </>
      ) : null}

      {/* Scrim keeps white text readable on any sky */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/20 to-transparent" />
    </div>
  );
});
