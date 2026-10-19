export type Tier = "slow" | "fair" | "good" | "great" | "excellent" | "blazing";

export interface Rating {
  tier: Tier;
  label: string;
  /** One short sentence describing what the connection is good for. */
  blurb: string;
}

export interface Measured {
  download: number;
  upload: number;
}

export function rateConnection(m: Measured): Rating {
  const d = m.download;
  if (d >= 1000) return { tier: "blazing", label: "Blazing", blurb: "Multi-gigabit ready — 8K, large downloads and dozens of devices with ease." };
  if (d >= 500) return { tier: "blazing", label: "Blazing fast", blurb: "Handles 8K streaming, huge downloads and many devices at once." };
  if (d >= 200) return { tier: "excellent", label: "Excellent", blurb: "Effortless 4K, cloud backups and busy households." };
  if (d >= 100) return { tier: "excellent", label: "Excellent", blurb: "Comfortable for 4K streaming, cloud work and busy households." };
  if (d >= 50) return { tier: "great", label: "Great", blurb: "Smooth 4K streaming and video calls on several devices." };
  if (d >= 25) return { tier: "good", label: "Good", blurb: "Fine for HD/4K streaming and video calls." };
  if (d >= 10) return { tier: "fair", label: "Fair", blurb: "Good for browsing and HD video on one or two devices." };
  return { tier: "slow", label: "Slow", blurb: "Browsing and messaging work; video may buffer." };
}

/** Gauge range: 50 Kbps (0.05 Mbps) at the start of the arc up to 1 Gbps at the end. */
export const GAUGE_MIN_MBPS = 0.05;
export const GAUGE_MAX_MBPS = 1000;

/** Log-scaled 0..1 position of a speed on the gauge. */
export function speedToFraction(mbps: number): number {
  if (!Number.isFinite(mbps) || mbps <= GAUGE_MIN_MBPS) return 0;
  const f = Math.log10(mbps / GAUGE_MIN_MBPS) / Math.log10(GAUGE_MAX_MBPS / GAUGE_MIN_MBPS);
  return Math.min(1, Math.max(0, f));
}
