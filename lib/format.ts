export type SpeedUnit = "Kbps" | "Mbps" | "Gbps";

/** Mbps → display value + unit (Kbps below 1 Mbps, Gbps from 1000 Mbps). */
export function formatSpeed(mbps: number | null | undefined): { value: string; unit: SpeedUnit } {
  if (mbps == null || !Number.isFinite(mbps) || mbps <= 0) return { value: "0", unit: "Mbps" };
  if (mbps < 0.9995) {
    const kbps = mbps * 1000;
    return { value: kbps >= 100 ? kbps.toFixed(0) : kbps.toFixed(1), unit: "Kbps" };
  }
  if (mbps >= 1000) return { value: (mbps / 1000).toFixed(2), unit: "Gbps" };
  if (mbps >= 100) return { value: mbps.toFixed(0), unit: "Mbps" };
  if (mbps >= 10) return { value: mbps.toFixed(1), unit: "Mbps" };
  return { value: mbps.toFixed(2), unit: "Mbps" };
}

export function speedLabel(mbps: number | null | undefined): string {
  const { value, unit } = formatSpeed(mbps);
  return `${value} ${unit}`;
}

/** Milliseconds with one decimal under 10 ms; "—" when unknown. */
export function formatMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return "—";
  return ms < 10 ? ms.toFixed(1) : String(Math.round(ms));
}

/** "1 h 5 min", "12 min" from minutes. */
export function formatMinutes(total: number): string {
  const m = Math.max(0, Math.round(total));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
}

export function formatDateTime(epoch: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
      new Date(epoch),
    );
  } catch {
    return new Date(epoch).toLocaleString();
  }
}

export const cToF = (c: number) => (c * 9) / 5 + 32;
export const kmhToMph = (k: number) => k * 0.621371;

const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
export function windDirection(deg: number): string {
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

/* ------------------------------------------------------------------ */
/* Time zones                                                          */
/* ------------------------------------------------------------------ */

/** Returns the IANA zone when the runtime knows it, otherwise "UTC". */
export function safeZone(tz: string | null | undefined): string {
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

/** Wall-clock fields of `date` in `tz`. */
export function zonedParts(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: safeZone(tz),
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (t: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") % 24, minute: get("minute"), second: get("second") };
}

/** Minutes since local midnight in `tz`. */
export function zonedMinutes(date: Date, tz: string): number {
  const p = zonedParts(date, tz);
  return p.hour * 60 + p.minute + p.second / 60;
}

/** UTC offset of `tz` at `date`, in minutes (Kabul → 270). */
export function zoneOffset(date: Date, tz: string): number {
  const p = zonedParts(date, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/** "GMT+4:30", "GMT-5", "GMT". */
export function offsetLabel(minutes: number): string {
  if (!minutes) return "GMT";
  const sign = minutes > 0 ? "+" : "-";
  const a = Math.abs(minutes);
  const h = Math.floor(a / 60);
  const m = a % 60;
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

/** "Same time as you", "3 h 30 min ahead of you", "2 h behind you". */
export function offsetRelation(placeOffset: number, viewerOffset: number): string {
  const diff = placeOffset - viewerOffset;
  if (!diff) return "Same time as you";
  return `${formatMinutes(Math.abs(diff))} ${diff > 0 ? "ahead of" : "behind"} you`;
}

export function formatZoned(date: Date, tz: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(undefined, { ...opts, timeZone: safeZone(tz) }).format(date);
}

/** Minutes past midnight from a local ISO string like "2026-11-09T06:41". */
export function isoMinutes(iso: string | null | undefined): number | null {
  if (!iso || iso.length < 16) return null;
  const h = Number.parseInt(iso.slice(11, 13), 10);
  const m = Number.parseInt(iso.slice(14, 16), 10);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
}

/** Format minutes-past-midnight in the viewer's 12/24 h preference. */
export function formatClock(minutes: number | null, opts: Intl.DateTimeFormatOptions = {}): string {
  if (minutes == null) return "—";
  const d = new Date(Date.UTC(2000, 0, 1, Math.floor(minutes / 60), Math.floor(minutes % 60)));
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", ...opts, timeZone: "UTC" }).format(d);
}
