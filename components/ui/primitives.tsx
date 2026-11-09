import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { TONES, type Tone } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Pill label: ratings, IP version, "Your location"… */
export function Chip({ tone = "neutral", icon: Icon, className, children }: { tone?: Tone; icon?: LucideIcon; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[0.68rem] font-medium whitespace-nowrap", TONES[tone], className)}>
      {Icon ? <Icon className="size-3" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/** Square icon holder used in lists and feature tiles. */
export function IconTile({ icon: Icon, className, iconClassName }: { icon: LucideIcon; className?: string; iconClassName?: string }) {
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-primary", className)}>
      <Icon className={cn("size-4", iconClassName)} aria-hidden="true" />
    </span>
  );
}

/** Centered section title with one gradient phrase and a short lede. */
export function SectionHeading({ id, title, highlight, lede }: { id: string; title: string; highlight: string; lede: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <h2 id={id} className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">
        {title} <span className="text-gradient">{highlight}</span>
      </h2>
      <p className="mt-3 text-sm text-pretty text-muted-foreground sm:text-base">{lede}</p>
    </div>
  );
}

/** Small "live" pulse dot. */
export function LiveDot({ className, on = true }: { className?: string; on?: boolean }) {
  return (
    <span className={cn("relative flex size-1.5", className)} aria-hidden="true">
      {on ? <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" /> : null}
      <span className="relative inline-flex size-1.5 rounded-full bg-current" />
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton relative overflow-hidden rounded-lg bg-muted", className)} />;
}
