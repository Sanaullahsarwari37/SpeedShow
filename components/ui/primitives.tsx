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

/** Left-aligned section intro: eyebrow, title and an optional note on the right. */
export function SectionIntro({ id, eyebrow, title, aside }: { id: string; eyebrow: string; title: string; aside?: React.ReactNode }) {
  return (
    <div data-reveal="" className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-1 sm:mb-5">
      <div>
        <p className="flex items-center gap-2 text-[0.7rem] font-semibold tracking-[0.16em] text-primary uppercase">
          <span aria-hidden="true" className="h-px w-6 bg-gradient-to-r from-cyan-400 to-violet-400" />
          {eyebrow}
        </p>
        <h2 id={id} className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h2>
      </div>
      {aside ? <div className="text-xs text-muted-foreground">{aside}</div> : null}
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

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden="true" style={style} className={cn("skeleton relative overflow-hidden rounded-lg bg-muted", className)} />;
}
