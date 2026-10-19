export type SpeedUnit = "Kbps" | "Mbps" | "Gbps";

/**
 * Format a throughput given in Mbps into a display value + unit:
 * below 1 Mbps -> Kbps, 1-999 Mbps -> Mbps, 1000+ -> Gbps.
 */
export function formatSpeed(mbps: number): { value: string; unit: SpeedUnit } {
  if (!Number.isFinite(mbps) || mbps <= 0) return { value: "0", unit: "Kbps" };
  if (mbps < 0.9995) {
    const kbps = mbps * 1000;
    return { value: kbps >= 100 ? kbps.toFixed(0) : kbps.toFixed(1), unit: "Kbps" };
  }
  if (mbps >= 1000) return { value: (mbps / 1000).toFixed(2), unit: "Gbps" };
  if (mbps >= 100) return { value: mbps.toFixed(0), unit: "Mbps" };
  if (mbps >= 10) return { value: mbps.toFixed(1), unit: "Mbps" };
  return { value: mbps.toFixed(2), unit: "Mbps" };
}

/** Compact "123 Mbps" style string. */
export function speedLabel(mbps: number): string {
  const { value, unit } = formatSpeed(mbps);
  return `${value} ${unit}`;
}

/** Human duration for a number of seconds ("45 sec", "6 min", "1 h 10 min"). */
export function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "—";
  if (sec < 90) return `${Math.max(1, Math.round(sec))} sec`;
  const min = sec / 60;
  if (min < 90) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min - h * 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  return ms >= 100 ? ms.toFixed(0) : ms.toFixed(1);
}

export function formatDateTime(epoch: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(epoch));
  } catch {
    return new Date(epoch).toLocaleString();
  }
}

export const cToF = (c: number) => (c * 9) / 5 + 32;
export const kmhToMph = (k: number) => k * 0.621371;

export function windDirection(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}
