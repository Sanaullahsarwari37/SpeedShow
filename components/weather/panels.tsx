import { Sun as SunIcon, Sunrise, Sunset } from "lucide-react";

import { MoonGlyph } from "@/components/weather/sky";
import { Surface, SurfaceHeader } from "@/components/ui/surface";
import type { SunState } from "@/components/weather/use-sun";
import { formatClock, formatMinutes } from "@/lib/format";

/* ---------------- Sun & moon ---------------- */

export function SunMoon({ s }: { s: SunState }) {
  const f = s.sun;
  const x = f != null ? 120 - 100 * Math.cos(Math.PI * f) : null;
  const y = f != null ? 105 - 100 * Math.sin(Math.PI * f) : null;
  return (
    <Surface as="div" className="h-full">
      <SurfaceHeader icon={SunIcon} title="Sun & moon" actions={<span className="pr-2 text-xs text-muted-foreground tabular-nums">{s.next}</span>} />
      <div className="p-5 sm:px-6">
      {!s.polar ? (
        <svg viewBox="0 0 240 118" className="mx-auto mt-1 max-h-40 w-full" role="img" aria-label={`Sunrise ${formatClock(s.rise)}, sunset ${formatClock(s.set)}. ${s.next}.`}>
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
    </Surface>
  );
}
