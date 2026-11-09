"use client";

import * as React from "react";

import type { TestState } from "@/hooks/use-speed-test";
import { useEased } from "@/hooks/use-live";
import { formatMs, formatSpeed } from "@/lib/format";
import { METRICS, type MetricKey } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface TileProps {
  metric: MetricKey;
  value: string;
  unit: string;
  note: string;
  live?: boolean;
}

function Tile({ metric, value, unit, note, live }: TileProps) {
  const m = METRICS[metric];
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5 px-4 py-4 transition-colors", live && "bg-accent")}>
      <dt className="flex items-center gap-1.5 text-[0.68rem] font-semibold tracking-wider text-muted-foreground uppercase">
        <m.icon className={cn("size-3.5", m.text, live && "animate-pulse")} aria-hidden="true" />
        {"short" in m ? m.short : m.label}
      </dt>
      <dd className="flex items-baseline gap-1">
        <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        <span className="text-xs font-medium text-muted-foreground">{unit}</span>
      </dd>
      <dd className="truncate text-[0.7rem] text-muted-foreground">{note}</dd>
    </div>
  );
}

/** Four headline numbers. Eases its own live value so only this card re-renders per frame. */
export const StatTiles = React.memo(function StatTiles({ state }: { state: TestState }) {
  const { phase } = state;
  const eased = useEased(phase === "download" || phase === "upload" ? state.live : 0);
  const dl = phase === "download" ? eased : state.download;
  const ul = phase === "upload" ? eased : state.upload;
  const d = formatSpeed(dl);
  const u = formatSpeed(ul);
  const loaded = [state.loadedDown, state.loadedUp].filter((v): v is number => v != null);

  return (
    <dl className="glass grid grid-cols-2 divide-border/70 overflow-hidden rounded-[var(--radius-panel)] max-sm:[&>*:nth-child(-n+2)]:border-b max-sm:[&>*:nth-child(odd)]:border-r sm:grid-cols-4 sm:divide-x">
      <Tile metric="download" value={dl != null ? d.value : "—"} unit={d.unit} note={phase === "download" ? "Measuring…" : "90th percentile"} live={phase === "download"} />
      <Tile metric="upload" value={ul != null ? u.value : "—"} unit={u.unit} note={phase === "upload" ? "Measuring…" : "90th percentile"} live={phase === "upload"} />
      <Tile metric="ping" value={formatMs(state.latency)} unit="ms" note={state.jitter != null ? `Jitter ${formatMs(state.jitter)} ms` : "Idle, median"} live={phase === "latency"} />
      <Tile
        metric="loaded"
        value={formatMs(loaded.length ? Math.max(...loaded) : null)}
        unit="ms"
        note={loaded.length ? `↓ ${formatMs(state.loadedDown)} · ↑ ${formatMs(state.loadedUp)} ms` : "While the line is busy"}
      />
    </dl>
  );
});
