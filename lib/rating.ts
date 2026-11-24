import type { SpeedMetrics } from "@/lib/types";
import type { Tone } from "@/lib/theme";

export type Tier = "slow" | "fair" | "good" | "great" | "excellent";

export interface Rating {
  tier: Tier;
  label: string;
  /** One sentence on what this connection handles comfortably. */
  blurb: string;
}

export function rateConnection({ download, latency, loadedDown }: Pick<SpeedMetrics, "download" | "latency" | "loadedDown">): Rating {
  const d = download ?? 0;
  const base: Rating =
    d >= 500
      ? { tier: "excellent", label: "Excellent", blurb: "Handles 8K streams, huge downloads and dozens of devices at once." }
      : d >= 100
        ? { tier: "excellent", label: "Very fast", blurb: "4K on several screens, fast cloud backups and a busy household." }
        : d >= 50
          ? { tier: "great", label: "Fast", blurb: "Smooth 4K streaming and video calls on a few devices at once." }
          : d >= 25
            ? { tier: "good", label: "Good", blurb: "One 4K stream or several HD streams and video calls." }
            : d >= 8
              ? { tier: "fair", label: "Fair", blurb: "HD video and calls work; large downloads take a while." }
              : { tier: "slow", label: "Slow", blurb: "Browsing and messaging work; video may buffer." };

  // A fast line with heavy bufferbloat still feels laggy in calls and games.
  const bloat = latency != null && loadedDown != null ? loadedDown - latency : 0;
  if (bloat > 100 && d >= 8) return { ...base, blurb: `${base.blurb} Latency jumps when the line is busy, so calls and games may lag during downloads.` };
  return base;
}

/** What each activity needs, for the guide table (download Mbps, upload Mbps, max latency ms). */
export const NEEDS = [
  { activity: "Browsing, email and messaging", down: "1–5 Mbps", up: "1 Mbps", ping: "Any" },
  { activity: "HD video streaming (1080p)", down: "5–8 Mbps", up: "—", ping: "Any" },
  { activity: "4K video streaming", down: "15–25 Mbps", up: "—", ping: "Any" },
  { activity: "HD video calls", down: "3–4 Mbps", up: "3–4 Mbps", ping: "Under 100 ms" },
  { activity: "Online gaming", down: "5–10 Mbps", up: "2–3 Mbps", ping: "Under 50 ms" },
  { activity: "Live streaming in 1080p", down: "5 Mbps", up: "6–10 Mbps", ping: "Under 100 ms" },
] as const;

/**
 * Bufferbloat grade from how much latency rises under load (loaded − idle),
 * using the common A+…F bands (as popularised by the Waveform test).
 */
export function bufferbloatGrade(idle: number | null, loaded: number | null): { grade: string; tone: Tone } | null {
  if (idle == null || loaded == null) return null;
  const rise = Math.max(0, loaded - idle);
  if (rise < 5) return { grade: "A+", tone: "success" };
  if (rise < 30) return { grade: "A", tone: "success" };
  if (rise < 60) return { grade: "B", tone: "info" };
  if (rise < 200) return { grade: "C", tone: "warning" };
  if (rise < 400) return { grade: "D", tone: "danger" };
  return { grade: "F", tone: "danger" };
}

export type Readiness = "yes" | "limited" | "no";

/**
 * Comfortable ("yes") and minimum ("limited") requirements per activity, per device.
 * Same sources as the NEEDS table: download/upload in Mbps, ping in ms.
 */
const ACTIVITIES = [
  { id: "browse", label: "Browsing", good: { down: 5, up: 1 }, min: { down: 1, up: 0.5 } },
  { id: "hd", label: "HD video", good: { down: 8 }, min: { down: 5 } },
  { id: "4k", label: "4K video", good: { down: 25 }, min: { down: 15 } },
  { id: "calls", label: "Video calls", good: { down: 4, up: 4, ping: 100 }, min: { down: 3, up: 3, ping: 150 } },
  { id: "gaming", label: "Gaming", good: { down: 10, up: 3, ping: 50 }, min: { down: 5, up: 2, ping: 80 } },
  { id: "stream", label: "Live streaming", good: { up: 10, ping: 100 }, min: { up: 6, ping: 150 } },
] as const;

export type ActivityId = (typeof ACTIVITIES)[number]["id"];

type Need = { down?: number; up?: number; ping?: number };
const meets = (n: Need, d: number, u: number, p: number | null) =>
  (n.down == null || d >= n.down) && (n.up == null || u >= n.up) && (n.ping == null || p == null || p <= n.ping);

/** What this result comfortably handles, handles with limits, or doesn't. */
export function readiness({ download, upload, latency }: Pick<SpeedMetrics, "download" | "upload" | "latency">) {
  const d = download ?? 0;
  const u = upload ?? 0;
  return ACTIVITIES.map((a) => ({
    id: a.id as ActivityId,
    label: a.label,
    status: (meets(a.good, d, u, latency) ? "yes" : meets(a.min, d, u, latency) ? "limited" : "no") as Readiness,
  }));
}
