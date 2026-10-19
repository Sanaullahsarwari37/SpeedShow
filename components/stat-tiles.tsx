"use client";

import { ArrowDownToLine, ArrowUpFromLine, Activity, Gauge } from "lucide-react";

import { formatSpeed } from "@/lib/format";
import type { Phase } from "@/lib/speedtest";
import { cn } from "@/lib/utils";

interface Props {
  phase: Phase;
  mbps: number;
  download: number | null;
  upload: number | null;
  latency?: number | null;
  jitter?: number | null;
}

function fmtMs(v: number | null | undefined): string {
  if (v == null || v <= 0) return "—";
  return v < 10 ? v.toFixed(1) : String(Math.round(v));
}

type Metric = {
  id: string;
  label: string;
  icon: React.ElementType;
  value: string;
  unit: string;
  live?: boolean;
  iconColor: string;
};

/** Single premium card — no icon backgrounds, compact. */
export function StatTiles({ phase, mbps, download, upload, latency, jitter }: Props) {
  const dl = phase === "download" ? mbps : download;
  const ul = phase === "upload" ? mbps : upload;
  const dlFmt = dl != null ? formatSpeed(dl) : null;
  const ulFmt = ul != null ? formatSpeed(ul) : null;

  const metrics: Metric[] = [
    {
      id: "download",
      label: "Download",
      icon: ArrowDownToLine,
      value: dlFmt?.value ?? "—",
      unit: dlFmt?.unit ?? "Mbps",
      live: phase === "download",
      iconColor: "text-sky-400",
    },
    {
      id: "upload",
      label: "Upload",
      icon: ArrowUpFromLine,
      value: ulFmt?.value ?? "—",
      unit: ulFmt?.unit ?? "Mbps",
      live: phase === "upload",
      iconColor: "text-violet-400",
    },
    {
      id: "latency",
      label: "Latency",
      icon: Activity,
      value: fmtMs(latency),
      unit: "ms",
      iconColor: "text-emerald-400",
    },
    {
      id: "jitter",
      label: "Jitter",
      icon: Gauge,
      value: fmtMs(jitter),
      unit: "ms",
      iconColor: "text-amber-400",
    },
  ];

  return (
    <div className="glass-premium overflow-hidden rounded-2xl sm:rounded-[1.5rem]">
      <div className="grid grid-cols-2 divide-x divide-y divide-border/50 sm:grid-cols-4 sm:divide-y-0">
        {metrics.map((m) => (
          <div
            key={m.id}
            className={cn(
              "relative flex flex-col gap-2 px-3.5 py-3.5 sm:px-4 sm:py-4",
              m.live && "bg-white/[0.03]",
            )}
          >
            <div className="flex items-center gap-1.5">
              <m.icon className={cn("size-3.5", m.iconColor, m.live && "animate-pulse")} aria-hidden="true" />
              <span className="text-[0.65rem] font-semibold tracking-wider text-muted-foreground uppercase">
                {m.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-xl font-semibold tracking-tight tabular-nums text-foreground sm:text-2xl">
                {m.value}
              </span>
              <span className="text-[0.7rem] font-medium text-muted-foreground">{m.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
