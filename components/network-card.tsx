"use client";

import * as React from "react";
import { Check, Clock, Copy, Eye, EyeOff, Hash, MapPin, Network, RefreshCw, Server, ShieldAlert, ShieldCheck, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip, Skeleton } from "@/components/ui/primitives";
import { Surface, SurfaceHeader } from "@/components/ui/surface";
import { useCopy } from "@/hooks/use-ui";
import type { NetworkInfo } from "@/lib/types";
import { cn, cssVars, flagEmoji, joinParts } from "@/lib/utils";

interface Props {
  data: NetworkInfo | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
}

function Cell({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3 bg-[var(--surface)] px-5 py-4 sm:px-6">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium break-words">{children}</dd>
      </div>
    </div>
  );
}

/** Your public IP as the headline, then provider, network, location and time zone. */
export const NetworkCard = React.memo(function NetworkCard({ data, isLoading, isError, isFetching, onRetry }: Props) {
  const [hidden, setHidden] = React.useState(false);
  const [copied, copy] = useCopy();

  return (
    <Surface aria-labelledby="connection-title" className="flex flex-col">
      <SurfaceHeader
        id="connection-title"
        icon={Network}
        title="Detected from your IP address"
        actions={
          <>
            <Button variant="ghost" size="icon-sm" aria-label={hidden ? "Show IP address" : "Hide IP address"} onClick={() => setHidden((v) => !v)}>
              {hidden ? <EyeOff /> : <Eye />}
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Refresh connection details" onClick={onRetry}>
              <RefreshCw className={cn(isFetching && "animate-spin")} />
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div aria-busy="true">
          <div className="space-y-3 px-5 py-6 sm:px-6">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="grid grid-cols-1 gap-px border-t border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 bg-[var(--surface)] px-5 py-4 sm:px-6">
                <Skeleton className="size-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : isError || !data ? (
        <div className="px-6 py-10 text-center text-sm text-muted-foreground">
          <p>We couldn't detect your network details. The speed test still works.</p>
          <Button size="sm" className="mt-3" onClick={onRetry}>
            <RefreshCw /> Try again
          </Button>
        </div>
      ) : (
        <>
          {/* Headline: the public IP */}
          <div className="px-5 py-6 sm:px-6">
            <p className="text-xs text-muted-foreground">Public IP address</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span
                className="value-gradient font-mono text-2xl font-semibold tracking-tight break-all sm:text-[1.75rem]"
                style={cssVars({ "--from": "#22d3ee", "--to": "#a78bfa" })}
              >
                {hidden ? data.ip.replace(/[0-9a-f]/gi, "•") : data.ip}
              </span>
              <Button variant="glass" size="sm" onClick={() => void copy(data.ip)} aria-label="Copy IP address">
                {copied ? <Check className="text-emerald-400" /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {data.version ? <Chip>IPv{data.version}</Chip> : null}
              {data.vpn.detected ? (
                <Chip tone="warning" icon={ShieldAlert}>
                  {data.vpn.reasons[0] ?? "VPN / proxy"}
                </Chip>
              ) : (
                <Chip tone="success" icon={ShieldCheck}>
                  Direct connection
                </Chip>
              )}
            </div>
          </div>

          <dl className="grid flex-1 grid-cols-1 gap-px border-t border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            <Cell icon={Server} label="Provider">
              {data.isp ?? data.org ?? "Unknown"}
            </Cell>
            <Cell icon={Hash} label="Network">
              <span className="font-mono text-[0.85rem]">{data.asn ?? "—"}</span>
              {data.org && data.org !== data.isp ? <span className="block truncate text-xs font-normal text-muted-foreground">{data.org}</span> : null}
            </Cell>
            <Cell icon={MapPin} label="Location">
              <span aria-hidden="true" className="mr-1.5">
                {flagEmoji(data.countryCode)}
              </span>
              {joinParts([data.city, data.region, data.country]) || "Unknown"}
            </Cell>
            <Cell icon={Clock} label="Time zone">
              {data.timezone ? data.timezone.replace(/_/g, " ") : "Unknown"}
            </Cell>
          </dl>
        </>
      )}
    </Surface>
  );
});
