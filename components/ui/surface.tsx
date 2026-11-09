import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const VARIANT = {
  glass: "glass",
  console: "console",
  soft: "glass-soft",
} as const;

type SurfaceProps<T extends React.ElementType> = {
  as?: T;
  variant?: keyof typeof VARIANT;
  /** Inner padding preset. */
  pad?: "none" | "md" | "lg";
} & Omit<React.ComponentPropsWithoutRef<T>, "as">;

const PAD = { none: "", md: "p-4 sm:p-5", lg: "p-5 sm:p-6" } as const;

/** The one card surface used across the page: same radius, border, shadow everywhere. */
export function Surface<T extends React.ElementType = "section">({ as, variant = "glass", pad = "none", className, ...props }: SurfaceProps<T>) {
  const Comp = (as ?? "section") as React.ElementType;
  return <Comp className={cn("relative overflow-hidden rounded-[var(--radius-panel)]", VARIANT[variant], PAD[pad], className)} {...props} />;
}

/** Card header row: icon + title (+ optional description) on the left, actions on the right. */
export function SurfaceHeader({
  id,
  icon: Icon,
  title,
  description,
  actions,
  divided = false,
  className,
}: {
  id: string;
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  divided?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 py-4 sm:px-6", divided && "border-b border-border/70", className)}>
      <div className="min-w-0">
        <h2 id={id} className="flex items-center gap-2 text-[0.95rem] font-semibold tracking-tight">
          {Icon ? <Icon className="size-4 text-primary" aria-hidden="true" /> : null}
          {title}
        </h2>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="-my-1 -mr-2 flex shrink-0 items-center gap-0.5">{actions}</div> : null}
    </div>
  );
}
