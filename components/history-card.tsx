"use client";

import * as React from "react";
import { History, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { Surface, SurfaceHeader } from "@/components/ui/surface";
import { useSvgId } from "@/hooks/use-ui";
import { formatDateTime, formatMs, formatSpeed } from "@/lib/format";
import { areaPath, smoothPath, toPoints } from "@/lib/svg";
import { METRICS } from "@/lib/theme";
import type { SpeedResult } from "@/lib/types";

const W = 400;
const H = 96;

function Sparkline({ items }: { items: SpeedResult[] }) {
  const id = useSvgId("h");
  const data = items.slice(0, 14).reverse();
  const max = Math.max(1, ...data.map((d) => Math.max(d.download ?? 0, d.upload ?? 0)));
  const box = { width: W, height: H, max, top: 6, bottom: 4 };
  const down = toPoints(data.map((d) => d.download ?? 0), box);
  const up = toPoints(data.map((d) => d.upload ?? 0), box);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-24 w-full overflow-visible" role="img" aria-label="Download and upload across your recent tests">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={METRICS.download.from} stopOpacity="0.32" />
          <stop offset="1" stopColor={METRICS.download.from} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 6" />
      ))}
      <path d={areaPath(down, H)} fill={`url(#${id})`} />
      <path d={smoothPath(up)} fill="none" stroke={METRICS.upload.from} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={smoothPath(down)} fill="none" stroke={METRICS.download.from} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Speed({ mbps }: { mbps: number | null }) {
  const s = formatSpeed(mbps);
  return mbps ? (
    <>
      {s.value} <span className="text-[0.7rem] text-muted-foreground">{s.unit}</span>
    </>
  ) : (
    <>—</>
  );
}

/** Recent tests, saved only in this browser. */
export const HistoryCard = React.memo(function HistoryCard({ items, ready, onClear }: { items: SpeedResult[]; ready: boolean; onClear: () => void }) {
  return (
    <Surface aria-labelledby="history-title" className="flex flex-col">
      <SurfaceHeader
        id="history-title"
        icon={History}
        title="Recent tests"
        description="Saved only in this browser. Never uploaded."
        divided
        actions={
          items.length ? (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <Trash2 /> Clear
            </Button>
          ) : null
        }
      />
      <div className="flex flex-1 flex-col px-5 py-5 sm:px-6">
        {!ready ? (
          <Skeleton className="h-40 w-full" />
        ) : !items.length ? (
          <p className="m-auto max-w-xs py-8 text-center text-sm text-muted-foreground">Your results appear here after each test, so you can compare rooms or times of day.</p>
        ) : (
          <>
            {items.length > 1 ? (
              <div className="mb-4">
                <div className="mb-2 flex gap-4 text-xs text-muted-foreground">
                  {(["download", "upload"] as const).map((k) => (
                    <span key={k} className="flex items-center gap-1.5">
                      <i className={`size-2 rounded-full ${METRICS[k].dot}`} /> {METRICS[k].label}
                    </span>
                  ))}
                </div>
                <Sparkline items={items} />
              </div>
            ) : null}
            <div>
              <table className="w-full text-sm">
                <caption className="sr-only">Your recent speed tests</caption>
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th scope="col" className="pb-2 font-medium">When</th>
                    <th scope="col" className="pb-2 font-medium">Download</th>
                    <th scope="col" className="pb-2 font-medium">Upload</th>
                    <th scope="col" className="pb-2 text-right font-medium">Ping</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 font-mono tabular-nums">
                  {items.slice(0, 5).map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 pr-2 font-sans text-xs text-muted-foreground sm:text-sm">{formatDateTime(r.at)}</td>
                      <td className="py-2.5"><Speed mbps={r.download} /></td>
                      <td className="py-2.5"><Speed mbps={r.upload} /></td>
                      <td className="py-2.5 text-right text-muted-foreground">{formatMs(r.latency)} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Surface>
  );
});
