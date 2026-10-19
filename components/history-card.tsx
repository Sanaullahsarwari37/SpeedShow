"use client";

import * as React from "react";
import { History, Trash2 } from "lucide-react";

import { GlowCard } from "@/components/glow-card";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatSpeed } from "@/lib/format";
import type { SpeedResult } from "@/lib/types";

function linePath(values: number[], w: number, h: number, max: number) {
  if (values.length === 0) return "";
  const step = values.length > 1 ? w / (values.length - 1) : 0;
  const pts = values.map((v, i) => [i * step, h - (v / max) * (h - 8) - 4] as const);
  // Smooth the line with simple quadratic midpoints.
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` Q${x0 + (mx - x0)},${y0} ${mx},${(y0 + y1) / 2} T${x1},${y1}`;
  }
  return d;
}

function Sparkline({ items }: { items: SpeedResult[] }) {
  const id = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const data = [...items].reverse().slice(-14);
  const W = 400;
  const H = 120;
  const max = Math.max(1, ...data.map((d) => Math.max(d.download, d.upload)));
  const down = data.map((d) => d.download);
  const up = data.map((d) => d.upload);
  const dPath = linePath(down, W, H, max);
  const uPath = linePath(up, W, H, max);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full overflow-visible" role="img" aria-label="Download and upload speed over your recent tests" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`d-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#60a5fa" stopOpacity="0.35" />
          <stop offset="1" stopColor="#60a5fa" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 6" />
      ))}
      {dPath && data.length > 1 && <path d={`${dPath} L${W},${H} L0,${H} Z`} fill={`url(#d-${id})`} />}
      {uPath && <path d={uPath} fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
      {dPath && <path d={dPath} fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

export function HistoryCard({ items, ready, onClear }: { items: SpeedResult[]; ready: boolean; onClear: () => void }) {
  return (
    <GlowCard className="flex-1 rounded-xl">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <History className="size-4 text-primary" aria-hidden="true" /> Test history
          </CardTitle>
          <CardDescription>Saved only in this browser. Never uploaded.</CardDescription>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} aria-label="Clear test history">
            <Trash2 /> Clear
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!ready ? (
          <div className="h-28" aria-hidden="true" />
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Run your first test and your results will appear here.</p>
        ) : (
          <>
            <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-400" /> Download</span>
              <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-indigo-400" /> Upload</span>
            </div>
            <Sparkline items={items} />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <caption className="sr-only">Recent speed tests</caption>
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th scope="col" className="pb-2 font-medium">When</th>
                    <th scope="col" className="pb-2 font-medium">Download</th>
                    <th scope="col" className="pb-2 font-medium">Upload</th>
                    <th scope="col" className="pb-2 font-medium">Latency</th>
                    <th scope="col" className="pb-2 font-medium">Server</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {items.slice(0, 6).map((r) => {
                    const d = formatSpeed(r.download);
                    const u = formatSpeed(r.upload);
                    const lat =
                      r.latency != null && r.latency > 0
                        ? r.latency < 10
                          ? r.latency.toFixed(1)
                          : String(Math.round(r.latency))
                        : "—";
                    return (
                      <tr key={r.id}>
                        <td className="py-2 text-muted-foreground">{formatDateTime(r.at)}</td>
                        <td className="py-2 font-mono tabular-nums">{d.value} <span className="text-xs text-muted-foreground">{d.unit}</span></td>
                        <td className="py-2 font-mono tabular-nums">{u.value} <span className="text-xs text-muted-foreground">{u.unit}</span></td>
                        <td className="py-2 font-mono tabular-nums text-muted-foreground">{lat}{lat !== "—" ? " ms" : ""}</td>
                        <td className="py-2 text-muted-foreground">{r.server}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </GlowCard>
  );
}
