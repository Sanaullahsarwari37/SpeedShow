/** Shared SVG chart helpers (used by the live chart, history sparkline and hourly curve). */

export type Point = readonly [number, number];

/** Smooth cubic path through points (horizontal tangents: no overshoot). */
export function smoothPath(pts: readonly Point[]): string {
  if (pts.length < 2) return "";
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = f((x0 + x1) / 2);
    d += ` C${mx},${f(y0)} ${mx},${f(y1)} ${f(x1)},${f(y1)}`;
  }
  return d;
}

/** Closes a line path down to a baseline to make a filled area. */
export function areaPath(pts: readonly Point[], baseline: number): string {
  const line = smoothPath(pts);
  return line ? `${line} L${pts[pts.length - 1][0].toFixed(1)},${baseline} L${pts[0][0].toFixed(1)},${baseline} Z` : "";
}

/** Rounds a maximum up to 1, 2, 5 or 10 × 10ⁿ for a clean axis. */
export function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

/** Maps values to points across a width/height box (top padding, bottom padding). */
export function toPoints(values: readonly number[], { width, height, max, top = 0, bottom = 0, slots = values.length }: {
  width: number;
  height: number;
  max: number;
  top?: number;
  bottom?: number;
  /** Horizontal slots (≥ values.length) — leaves room ahead of a live line. */
  slots?: number;
}): Point[] {
  const step = slots > 1 ? width / (slots - 1) : 0;
  return values.map((v, i) => [i * step, height - bottom - (Math.max(0, v) / max) * (height - top - bottom)] as const);
}
