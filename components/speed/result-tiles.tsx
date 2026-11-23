"use client";

import * as React from "react";

import { Chip, LiveDot } from "@/components/ui/primitives";
import { Surface } from "@/components/ui/surface";
import type { TestState } from "@/hooks/use-speed-test";
import { useEased } from "@/hooks/use-live";
import { formatMs, formatSpeed } from "@/lib/format";
import { bufferbloatGrade } from "@/lib/rating";
import { METRICS, type MetricKey } from "@/lib/theme";
import { cn } from "@/lib/utils";

const LABEL = "flex items-center gap-1.5 text-xs font-medium text-muted-foreground";

function Big({ metric, value, unit, note, active }: { metric: MetricKey; value: string; unit: string; note: string; active: boolean }) {
  const m = METRICS[metric];
  return (
    <div className="min-w-0 px-5 py-5 sm:px-6">
      <dt className={LABEL}>
        <m.icon className={cn("size-3.5", m.text)} aria-hidden="true" />
        {m.label}
        {active ? <LiveDot className={cn("ml-0.5", m.text)} /> : null}
      </dt>
      <dd className="mt-2 flex items-baseline gap-1.5">
        <span className={cn("font-mono text-4xl font-semibold tracking-tight tabular-nums transition-colors sm:text-[2.75rem]", active ? m.text : "text-foreground")}>
          {value}
        </span>
        <span className="text-sm font-medium text-muted-foreground">{unit}</span>
      </dd>
      <dd className="mt-1 truncate text-xs text-muted-foreground">{note}</dd>
    </div>
  );
}

/** Download + upload. Eases its own live value, so only this tile re-renders per frame. */
export const SpeedTile = React.memo(function SpeedTile({ state }: { state: TestState }) {
  const { phase } = state;
  const eased = useEased(phase === "download" || phase === "upload" ? state.live : 0);
  const dl = phase === "download" ? eased : state.download;
  const ul = phase === "upload" ? eased : state.upload;
  const d = formatSpeed(dl);
  const u = formatSpeed(ul);
  return (
    <Surface as="div">
      <dl className="grid grid-cols-2 divide-x divide-border">
        <Big metric="download" value={dl != null ? d.value : "—"} unit={d.unit} note={phase === "download" ? "Measuring…" : dl != null ? "90th percentile" : "Waiting"} active={phase === "download"} />
        <Big metric="upload" value={ul != null ? u.value : "—"} unit={u.unit} note={phase === "upload" ? "Measuring…" : ul != null ? "90th percentile" : "After ping"} active={phase === "upload"} />
      </dl>
    </Surface>
  );
});

function Small({ metric, value, note, active }: { metric: MetricKey; value: string; note: string; active?: boolean }) {
  const m = METRICS[metric];
  return (
    <div className="min-w-0 px-4 py-4 sm:px-5">
      <dt className={LABEL}>
        <m.icon className={cn("size-3.5", m.text)} aria-hidden="true" />
        {"short" in m ? m.short : m.label}
        {active ? <LiveDot className={cn("ml-0.5", m.text)} /> : null}
      </dt>
      <dd className="mt-1.5 flex items-baseline gap-1">
        <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">ms</span>
      </dd>
      <dd className="mt-0.5 truncate text-[0.7rem] text-muted-foreground">{note}</dd>
    </div>
  );
}

/** Ping, loaded ping and jitter, with a bufferbloat grade once loaded latency is known. */
export const LatencyTile = React.memo(function LatencyTile({ state }: { state: TestState }) {
  const loaded = [state.loadedDown, state.loadedUp].filter((v): v is number => v != null);
  const worst = loaded.length ? Math.max(...loaded) : null;
  const grade = state.phase === "done" ? bufferbloatGrade(state.latency, worst) : null;
  return (
    <Surface as="div">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
        <span className="text-xs font-medium text-muted-foreground">Responsiveness</span>
        {grade ? (
          <Chip tone={grade.tone} className="font-mono">
            Bufferbloat {grade.grade}
          </Chip>
        ) : (
          <span className="text-[0.7rem] text-muted-foreground/70">Bufferbloat grade after the test</span>
        )}
      </div>
      <dl className="grid grid-cols-3 divide-x divide-border">
        <Small metric="ping" value={formatMs(state.latency)} note="Idle, median" active={state.phase === "latency"} />
        <Small metric="loaded" value={formatMs(worst)} note={loaded.length ? `↓ ${formatMs(state.loadedDown)} · ↑ ${formatMs(state.loadedUp)}` : "Under load"} />
        <Small metric="jitter" value={formatMs(state.jitter)} note="Variation" />
      </dl>
    </Surface>
  );
});
