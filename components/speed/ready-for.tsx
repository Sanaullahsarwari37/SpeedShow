import { Check, Gamepad2, Globe, Minus, MonitorPlay, Radio, Tv, Video, X, type LucideIcon } from "lucide-react";

import { readiness, type ActivityId, type Readiness } from "@/lib/rating";
import type { SpeedMetrics } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICON: Record<ActivityId, LucideIcon> = {
  browse: Globe,
  hd: Tv,
  "4k": MonitorPlay,
  calls: Video,
  gaming: Gamepad2,
  stream: Radio,
};

const STATUS: Record<Readiness, { icon: LucideIcon; label: string; mark: string; tile: string }> = {
  yes: { icon: Check, label: "Ready", mark: "bg-emerald-400/15 text-emerald-300", tile: "border-emerald-400/20" },
  limited: { icon: Minus, label: "Limited", mark: "bg-amber-400/15 text-amber-300", tile: "border-amber-400/20" },
  no: { icon: X, label: "Too slow", mark: "bg-rose-400/15 text-rose-300", tile: "border-white/[0.06] opacity-60" },
};

/** After a test: which everyday activities this connection handles, one device at a time. */
export function ReadyFor({ result }: { result: Pick<SpeedMetrics, "download" | "upload" | "latency"> }) {
  const items = readiness(result);
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="What this connection is ready for">
      {items.map((a, i) => {
        const Icon = ICON[a.id];
        const s = STATUS[a.status];
        return (
          <li
            key={a.id}
            className={cn("rise-in flex items-center gap-2.5 rounded-[var(--radius-tile)] border bg-white/[0.02] px-3 py-2.5", s.tile)}
            style={{ animationDelay: `${0.1 + i * 0.06}s` }}
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.label}</span>
            <span className={cn("grid size-5 shrink-0 place-items-center rounded-full", s.mark)} title={s.label}>
              <s.icon className="size-3" aria-hidden="true" />
              <span className="sr-only">{s.label}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
