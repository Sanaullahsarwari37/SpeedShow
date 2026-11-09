import { Activity, ArrowDownToLine, ArrowUpFromLine, Gauge, Waves, type LucideIcon } from "lucide-react";

import type { Tier } from "@/lib/rating";

/**
 * Single source of truth for every measured metric: label, icon and colours.
 * The gauge, stat tiles, live chart, progress steps and guide all read from here,
 * so a colour or label changes in one place.
 */
export const METRICS = {
  download: {
    label: "Download",
    icon: ArrowDownToLine,
    text: "text-sky-400",
    dot: "bg-sky-400",
    from: "#38bdf8",
    to: "#6366f1",
    glow: "#3b82f6",
    help: "How fast data reaches you. It decides how quickly pages load, videos start and files download.",
  },
  upload: {
    label: "Upload",
    icon: ArrowUpFromLine,
    text: "text-violet-400",
    dot: "bg-violet-400",
    from: "#a78bfa",
    to: "#c026d3",
    glow: "#8b5cf6",
    help: "How fast you send data: video calls, live streaming, cloud backups and large attachments.",
  },
  ping: {
    label: "Ping",
    icon: Activity,
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    from: "#34d399",
    to: "#0ea5e9",
    glow: "#34d399",
    help: "Round-trip time to the server on a quiet line. Lower feels snappier; under 30 ms is excellent.",
  },
  loaded: {
    label: "Loaded ping",
    short: "Loaded",
    icon: Gauge,
    text: "text-amber-400",
    dot: "bg-amber-400",
    from: "#fbbf24",
    to: "#f97316",
    glow: "#f59e0b",
    help: "Ping while the line is busy. A big jump means bufferbloat, the usual cause of laggy calls and games.",
  },
  jitter: {
    label: "Jitter",
    icon: Waves,
    text: "text-rose-400",
    dot: "bg-rose-400",
    from: "#fb7185",
    to: "#e11d48",
    glow: "#fb7185",
    help: "How much ping varies between packets. Under 10 ms keeps calls and games smooth.",
  },
} as const satisfies Record<string, { label: string; short?: string; icon: LucideIcon; text: string; dot: string; from: string; to: string; glow: string; help: string }>;

export type MetricKey = keyof typeof METRICS;

/** Rating badge tones. */
export const TIER_TONE: Record<Tier, Tone> = { slow: "danger", fair: "warning", good: "info", great: "success", excellent: "success" };

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "sky";

export const TONES: Record<Tone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  info: "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300",
  success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  danger: "border-rose-500/30 bg-rose-500/15 text-rose-700 dark:text-rose-300",
  /** For use on dark/sky surfaces regardless of theme. */
  sky: "border-white/15 bg-white/15 text-white",
};
