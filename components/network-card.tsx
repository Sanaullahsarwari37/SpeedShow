"use client";

import * as React from "react";
import { Check, Clock, Copy, Eye, EyeOff, Globe2, MapPin, Network, RefreshCw, Server } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { NetworkInfo } from "@/lib/types";
import { cn, flagEmoji } from "@/lib/utils";

interface Props {
  data: NetworkInfo | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
}

function Cell({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <div className="mt-0.5 text-sm font-medium break-words">{children}</div>
      </div>
    </div>
  );
}

/** Compact premium connection strip — sits below weather. */
export function NetworkCard({ data, isLoading, isError, isFetching, onRetry }: Props) {
  const [hidden, setHidden] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    if (!data?.ip) return;
    try {
      await navigator.clipboard.writeText(data.ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const mask = (ip: string) => (hidden ? ip.replace(/[0-9a-fA-F]/g, "•") : ip);
  const place = data ? [data.city, data.region, data.country].filter(Boolean).join(", ") : "";

  return (
    <section
      aria-label="Your connection"
      className="glass-premium overflow-hidden rounded-[1.75rem] sm:rounded-[2rem]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-5 py-3.5 sm:px-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Network className="size-4 text-primary" aria-hidden="true" />
          Your connection
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={hidden ? "Show IP address" : "Hide IP address"}
            onClick={() => setHidden((v) => !v)}
          >
            {hidden ? <EyeOff /> : <Eye />}
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Refresh connection details" onClick={onRetry}>
            <RefreshCw className={cn(isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-2.5 w-14" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : isError || !data ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            <p>Couldn’t detect network details.</p>
            <Button variant="glass" size="sm" className="mt-3" onClick={onRetry}>
              <RefreshCw /> Try again
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Cell icon={Globe2} label="IP address">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[0.9rem] tracking-tight">{mask(data.ip)}</span>
                {data.version && (
                  <Badge variant="outline" className="text-[0.6rem]">
                    IPv{data.version}
                  </Badge>
                )}
                <Button variant="ghost" size="icon-sm" aria-label="Copy IP" onClick={copy} className="size-6">
                  {copied ? <Check className="text-emerald-500" /> : <Copy />}
                </Button>
              </span>
            </Cell>
            <Cell icon={Server} label="ISP">
              {data.isp ?? data.org ?? "Unknown"}
              {data.asn && <span className="ml-1.5 font-mono text-[0.65rem] text-muted-foreground">{data.asn}</span>}
            </Cell>
            <Cell icon={MapPin} label="Location">
              <span className="mr-1" aria-hidden="true">
                {flagEmoji(data.countryCode)}
              </span>
              {place || "Unknown"}
            </Cell>
            <Cell icon={Clock} label="Time zone">
              {data.timezone ?? "Unknown"}
            </Cell>
          </div>
        )}
      </div>
    </section>
  );
}
