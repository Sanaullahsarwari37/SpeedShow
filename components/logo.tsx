import { BRAND_COLORS as C, MARK } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** The SpeedShow mark (same geometry as the favicon and app icons; unique gradient ids per use). */
export function LogoMark({ className, id = "lm" }: { className?: string; id?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-9", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.tileTop} />
          <stop offset="1" stopColor={C.tile} />
        </linearGradient>
        <linearGradient id={`${id}-g`} x1="14" y1="50" x2="50" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.from} />
          <stop offset="0.55" stopColor={C.via} />
          <stop offset="1" stopColor={C.to} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${id}-t)`} />
      <rect x="0.5" y="0.5" width="63" height="63" rx="14.5" fill="none" stroke="#fff" strokeOpacity="0.1" />
      <path d={MARK.track} fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth={MARK.stroke} strokeLinecap="round" />
      <path d={MARK.progress} fill="none" stroke={`url(#${id}-g)`} strokeWidth={MARK.stroke} strokeLinecap="round" />
      <path d={`M${MARK.needle.x1} ${MARK.needle.y1}L${MARK.needle.x2} ${MARK.needle.y2}`} stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
      <circle cx={MARK.hub.cx} cy={MARK.hub.cy} r={MARK.hub.r} fill="#fff" />
    </svg>
  );
}
