/**
 * The SpeedShow mark, defined once: a dark tile holding the same 270° gauge
 * as the speed test (cyan → indigo → violet progress, white needle).
 * Used by <LogoMark>, the favicon, app icons and the social card.
 *
 * Geometry on a 64 × 64 grid: gauge centre (32, 35), radius 19,
 * arc from 135° to 405°, progress to 70 % (324°).
 */

export const BRAND_COLORS = {
  tile: "#0c0c10",
  tileTop: "#18181d",
  from: "#22d3ee",
  via: "#6366f1",
  to: "#a855f7",
} as const;

export const MARK = {
  /** Full 270° track. */
  track: "M18.57 48.44A19 19 0 1 1 45.44 48.44",
  /** Lit progress (70 %). */
  progress: "M18.57 48.44A19 19 0 1 1 47.37 23.83",
  /** Needle from the hub towards the end of the progress. */
  needle: { x1: 32, y1: 35, x2: 41.71, y2: 27.95 },
  hub: { cx: 32, cy: 35, r: 3.6 },
  stroke: 5.5,
} as const;

/**
 * Standalone SVG markup of the mark.
 * - `rounded`: rounded tile (favicon, logo). Off for app icons the OS masks itself.
 * - `inset`: shrink the gauge to fit a maskable icon's safe zone.
 */
export function markSvg({ rounded = true, inset = 1 }: { rounded?: boolean; inset?: number } = {}): string {
  const c = BRAND_COLORS;
  const k = inset;
  const t = `translate(${32 - 32 * k} ${33 - 33 * k}) scale(${k})`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.tileTop}"/><stop offset="1" stop-color="${c.tile}"/></linearGradient>
    <linearGradient id="g" x1="14" y1="50" x2="50" y2="18" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c.from}"/><stop offset=".55" stop-color="${c.via}"/><stop offset="1" stop-color="${c.to}"/></linearGradient>
  </defs>
  <rect width="64" height="64" rx="${rounded ? 15 : 0}" fill="url(#t)"/>
  ${rounded ? `<rect x=".5" y=".5" width="63" height="63" rx="14.5" fill="none" stroke="#fff" stroke-opacity=".1"/>` : ""}
  <g transform="${t}">
    <path d="${MARK.track}" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="${MARK.stroke}" stroke-linecap="round"/>
    <path d="${MARK.progress}" fill="none" stroke="url(#g)" stroke-width="${MARK.stroke}" stroke-linecap="round"/>
    <path d="M${MARK.needle.x1} ${MARK.needle.y1}L${MARK.needle.x2} ${MARK.needle.y2}" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>
    <circle cx="${MARK.hub.cx}" cy="${MARK.hub.cy}" r="${MARK.hub.r}" fill="#fff"/>
  </g>
</svg>`;
}
