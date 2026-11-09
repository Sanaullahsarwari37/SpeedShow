"use client";

import * as React from "react";
import { Check, Clock, Copy, Eye, EyeOff, Globe2, MapPin, Network, RefreshCw, Server, type LucideIcon } from "lucide-react";

import { LocalTimeInline } from "@/components/local-time";
import { Button } from "@/components/ui/button";
import { Chip, IconTile, Skeleton } from "@/components/ui/primitives";
import { Surface, SurfaceHeader } from "@/components/ui/surface";
import { useCopy } from "@/hooks/use-ui";
import type { NetworkInfo } from "@/lib/types";
import { cn, flagEmoji, joinParts } from "@/lib/utils";

interface Props {
  data: NetworkInfo | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
}

function Row({ icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3 py-3.5 first:pt-0 last:pb-0">
      <IconTile icon={icon} />
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium break-words">{children}</dd>
      </div>
    </div>
  );
}

/** IP, provider, location and the live local time there. */
export const NetworkCard = React.memo(function NetworkCard({ data, isLoading, isError, isFetching, onRetry }: Props) {
  const [hidden, setHidden] = React.useState(false);
  const [copied, copy] = useCopy();

  return (
    <Surface aria-labelledby="connection-title">
      <SurfaceHeader
        id="connection-title"
        icon={Network}
        title="Your connection"
        description="What any website can see about you."
        divided
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
      <div className="px-5 py-5 sm:px-6">
        {isLoading ? (
          <div className="space-y-5" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : isError || !data ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <p>We couldn't detect your network details. The speed test still works.</p>
            <Button size="sm" className="mt-3" onClick={onRetry}>
              <RefreshCw /> Try again
            </Button>
          </div>
        ) : (
          <dl className="divide-y divide-border/70">
            <Row icon={Globe2} label="IP address">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[0.9rem] tracking-tight">{hidden ? data.ip.replace(/[0-9a-f]/gi, "•") : data.ip}</span>
                {data.version ? <Chip>IPv{data.version}</Chip> : null}
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => void copy(data.ip)} aria-label="Copy IP address">
                  {copied ? <Check className="text-emerald-500" /> : <Copy />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </span>
            </Row>
            <Row icon={Server} label="Provider">
              {data.isp ?? data.org ?? "Unknown"}
              {data.asn ? <span className="ml-1.5 font-mono text-[0.7rem] text-muted-foreground">{data.asn}</span> : null}
            </Row>
            <Row icon={MapPin} label="Location">
              <span aria-hidden="true" className="mr-1.5">
                {flagEmoji(data.countryCode)}
              </span>
              {joinParts([data.city, data.region, data.country]) || "Unknown"}
            </Row>
            <Row icon={Clock} label="Local time">
              <LocalTimeInline tz={data.timezone} />
              {data.timezone ? <span className="block text-xs font-normal text-muted-foreground">{data.timezone.replace(/_/g, " ")}</span> : null}
            </Row>
          </dl>
        )}
      </div>
    </Surface>
  );
});
