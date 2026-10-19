import type { WeatherKind } from "@/lib/weather-codes";

export type SkyKey = WeatherKind | "night";

/** Realistic sky gradients per condition. */
export const SKY: Record<SkyKey, string> = {
  clear: "from-[#5eb8f5] via-[#3b82f6] to-[#1e3a8a]",
  night: "from-[#0a0e2e] via-[#121848] to-[#1a1040]",
  cloud: "from-[#7a8fa8] via-[#4a6fa5] to-[#1e3a6e]",
  fog: "from-[#9ca3af] via-[#6b7280] to-[#374151]",
  drizzle: "from-[#64748b] via-[#3b5998] to-[#1e3a5f]",
  rain: "from-[#475569] via-[#1e3a6e] to-[#0f172a]",
  snow: "from-[#93c5fd] via-[#64748b] to-[#1e3a5f]",
  storm: "from-[#1e1b4b] via-[#312e81] to-[#0c0a1a]",
};

function Cloud({
  className,
  opacity = 0.85,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <svg viewBox="0 0 140 70" className={className} aria-hidden="true" style={{ opacity }}>
      <path
        d="M35 58a20 20 0 0 1-3-39.7A28 28 0 0 1 86 14a24 24 0 0 1 26 24 16 16 0 0 1-3 22Z"
        fill="url(#cloudfill)"
      />
    </svg>
  );
}

/* Star field centered around middle of sky */
const STARS = Array.from({ length: 40 }, (_, i) => ({
  x: 8 + ((i * 47) % 84),
  y: 6 + ((i * 29) % 50),
  d: ((i * 17) % 40) / 10,
  s: 0.8 + (i % 4) * 0.5,
  bright: i % 5 === 0,
}));

/** Sky backdrop — moon & stars centered; sun centered when day. */
export function WeatherScene({ kind, isDay }: { kind: WeatherKind; isDay: boolean }) {
  const showSun = isDay && (kind === "clear" || kind === "cloud");
  const showMoon = !isDay && kind !== "storm";
  const showStars = !isDay;
  const clouds = kind !== "clear";
  const heavy = kind === "rain" || kind === "storm" || kind === "drizzle";

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="cloudfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0.3" />
          </linearGradient>
          <radialGradient id="sunglow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef9c3" stopOpacity="1" />
            <stop offset="35%" stopColor="#fde68a" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#fbbf24" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Horizon glow */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background: isDay
            ? "linear-gradient(to top, rgba(255,255,255,0.12), transparent)"
            : "linear-gradient(to top, rgba(99,102,241,0.08), transparent)",
        }}
      />

      {/* Stars — spread across center sky */}
      {showStars && (
        <div className="absolute inset-0">
          {STARS.map((s, i) => (
            <span
              key={i}
              className="star absolute rounded-full bg-white"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.s,
                height: s.s,
                opacity: s.bright ? 0.95 : 0.5,
                boxShadow: s.bright ? "0 0 4px 1px rgba(255,255,255,0.45)" : undefined,
                animationDelay: `${s.d}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Sun — center of sky */}
      {showSun && (
        <div className="absolute top-[12%] left-1/2 size-44 -translate-x-1/2 sm:size-52">
          <svg viewBox="0 0 200 200" className="size-full">
            <circle cx="100" cy="100" r="95" fill="url(#sunglow)" />
            <g className="sun-rays" stroke="#fef08a" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round">
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i * Math.PI) / 6;
                const inner = 46;
                const outer = i % 2 === 0 ? 70 : 62;
                return (
                  <line
                    key={i}
                    x1={100 + Math.cos(a) * inner}
                    y1={100 + Math.sin(a) * inner}
                    x2={100 + Math.cos(a) * outer}
                    y2={100 + Math.sin(a) * outer}
                  />
                );
              })}
            </g>
            <circle cx="100" cy="100" r="32" fill="#fef9c3" />
            <circle cx="100" cy="100" r="24" fill="#fde68a" opacity="0.9" />
          </svg>
        </div>
      )}

      {/* Moon — center of sky */}
      {showMoon && (
        <div className="absolute top-[14%] left-1/2 size-20 -translate-x-1/2 sm:size-24">
          <div className="absolute -inset-6 rounded-full bg-indigo-200/20 blur-2xl" />
          <svg viewBox="0 0 100 100" className="relative size-full drop-shadow-[0_0_24px_rgba(199,210,254,0.6)]">
            <defs>
              <mask id="moonmask">
                <rect width="100" height="100" fill="white" />
                <circle cx="66" cy="36" r="30" fill="black" />
              </mask>
            </defs>
            <circle cx="48" cy="50" r="34" fill="#e8edff" mask="url(#moonmask)" />
            <circle cx="48" cy="50" r="34" fill="#c7d2fe" mask="url(#moonmask)" opacity="0.3" />
          </svg>
        </div>
      )}

      {/* Clouds — sides so center moon/sun stays clear */}
      {clouds && (
        <>
          <Cloud className="drift-a absolute top-[22%] -left-[10%] w-[40%] sm:w-[34%]" opacity={heavy ? 0.55 : 0.7} />
          <Cloud className="drift-b absolute top-[28%] -right-[8%] w-[44%] sm:w-[36%]" opacity={heavy ? 0.5 : 0.6} />
          {(kind === "fog" || heavy) && (
            <Cloud className="drift-a absolute top-[8%] left-[15%] w-[50%]" opacity={0.35} />
          )}
          {kind === "storm" && (
            <Cloud className="drift-b absolute top-[35%] left-[20%] w-[45%]" opacity={0.4} />
          )}
        </>
      )}

      {/* Vignette for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/20 to-transparent" />
    </div>
  );
}
