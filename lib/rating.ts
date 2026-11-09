import type { SpeedMetrics } from "@/lib/types";

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
