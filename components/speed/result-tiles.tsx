"use client";

import * as React from "react";

import { Gauge, Timer } from "lucide-react";

import { Chip, LiveDot } from "@/components/ui/primitives";
import { Surface, SurfaceHeader } from "@/components/ui/surface";
import type { TestState } from "@/hooks/use-speed-test";
import { useEased } from "@/hooks/use-live";
import { formatBytes, formatMs, formatRate, type RateUnit } from "@/lib/format";
import { bufferbloatGrade } from "@/lib/rating";
import { METRICS, type MetricKey } from "@/lib/theme";
import { cn, cssVars } from "@/lib/utils";

const LABEL = "flex items-center gap-1.5 text-xs font-medium text-muted-foreground";

function Big({ metric, value, unit, note, active }: { metric: MetricKey; value: string; unit: string; note?: string; active: boolean }) {
  const m = METRICS[metric];
  return (
    <div className="min-w-0 px-5 py-4 sm:px-6">
      <dt className={LABEL}>
        <m.icon className={cn("size-3.5", m.text)} aria-hidden="true" />
        {m.label}
        {active ? <LiveDot className={cn("ml-0.5", m.text)} /> : null}
      </dt>
      <dd className="mt-2 flex items-baseline gap-1.5">
        <span
          className={cn("font-mono text-4xl font-semibold tracking-tight tabular-nums sm:text-[2.75rem]", value !== "—" ? "value-gradient" : "text-muted-foreground")}
          style={cssVars({ "--from": m.from, "--to": m.to })}
        >
          {value}
        </span>
        <span className="text-sm font-medium text-muted-foreground">{unit}</span>
      </dd>
      <dd className="mt-1 h-4 truncate text-xs text-muted-foreground">{note}</dd>
    </div>
  );
}

/** Mbps ⇄ MB/s switch for the speed figures (remembered in this browser). */
function UnitSwitch({ unit, onChange }: { unit: RateUnit; onChange: (u: RateUnit) => void }) {
  return (
    <div role="group" aria-label="Speed unit" className="mr-1 flex rounded-full border border-border bg-black/5 p-0.5 text-[0.68rem] font-semibold dark:bg-black/30">
      {(
        [
          ["bits", "Mbps"],
          ["bytes", "MB/s"],
        ] as const
      ).map(([u, label]) => (
        <button
          key={u}
          type="button"
          aria-pressed={unit === u}
          onClick={() => onChange(u)}
          className={cn("rounded-full px-2.5 py-1 transition-colors", unit === u ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Download + upload, data used. Eases its own live value, so only this tile re-renders per frame. */
export const SpeedTile = React.memo(function SpeedTile({ state, unit, onUnit }: { state: TestState; unit: RateUnit; onUnit: (u: RateUnit) => void }) {
  const { phase } = state;
  const eased = useEased(phase === "download" || phase === "upload" ? state.live : 0);
  const dl = phase === "download" ? eased : state.download;
  const ul = phase === "upload" ? eased : state.upload;
  const other: RateUnit = unit === "bits" ? "bytes" : "bits";
  const note = (v: number | null, measuring: boolean) => {
    if (measuring) return "Measuring…";
    if (v == null) return undefined;
    const o = formatRate(v, other);
    return `≈ ${o.value} ${o.unit}`;
  };
  const d = formatRate(dl, unit);
  const u = formatRate(ul, unit);
  return (
    <Surface as="div">
      <SurfaceHeader icon={Gauge} title="Speed" actions={<UnitSwitch unit={unit} onChange={onUnit} />} />
      <dl className="grid grid-cols-2 divide-x divide-border">
        <Big metric="download" value={dl != null ? d.value : "—"} unit={d.unit} note={note(state.download, phase === "download")} active={phase === "download"} />
        <Big metric="upload" value={ul != null ? u.value : "—"} unit={u.unit} note={note(state.upload, phase === "upload")} active={phase === "upload"} />
      </dl>
      <div className="flex items-center justify-between border-t border-border px-5 py-2.5 text-xs text-muted-foreground sm:px-6">
        <span>Data used</span>
        <span className="font-mono font-medium text-foreground tabular-nums">{state.bytes > 0 ? formatBytes(state.bytes) : "—"}</span>
      </div>
    </Surface>
  );
});

function Small({ metric, value, note, active }: { metric: MetricKey; value: string; note?: string; active?: boolean }) {
  const m = METRICS[metric];
  return (
    <div className="min-w-0 px-5 py-4 sm:px-6">
      <dt className={LABEL}>
        <m.icon className={cn("size-3.5", m.text)} aria-hidden="true" />
        {"short" in m ? m.short : m.label}
        {active ? <LiveDot className={cn("ml-0.5", m.text)} /> : null}
      </dt>
      <dd className="mt-1.5 flex items-baseline gap-1">
        <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">ms</span>
      </dd>
      <dd className="mt-0.5 h-4 truncate text-[0.7rem] text-muted-foreground">{note}</dd>
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
      <SurfaceHeader
        icon={Timer}
        title="Responsiveness"
        actions={
          grade ? (
            <Chip tone={grade.tone} className="mr-2 font-mono">
              Bufferbloat {grade.grade}
            </Chip>
          ) : (
            <span className="pr-2 text-xs text-muted-foreground/70">Grade after the test</span>
          )
        }
      />
      <dl className="grid grid-cols-3 divide-x divide-border">
        <Small metric="ping" value={formatMs(state.latency)} active={state.phase === "latency"} />
        {state.liveLoaded != null ? (
          // Live: ping taken right now while the line is saturated.
          <Small metric="loaded" value={formatMs(state.liveLoaded)} note={`Live, while ${state.phase === "upload" ? "uploading" : "downloading"}`} active />
        ) : (
          <Small metric="loaded" value={formatMs(worst)} note={loaded.length ? `↓ ${formatMs(state.loadedDown)} · ↑ ${formatMs(state.loadedUp)}` : undefined} />
        )}
        <Small metric="jitter" value={formatMs(state.jitter)} />
      </dl>
    </Surface>
  );
});
