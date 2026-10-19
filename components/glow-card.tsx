"use client";

import * as React from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Glass card with a cursor-following spotlight glow. */
export function GlowCard({ className, onPointerMove, ...props }: React.ComponentProps<"div">) {
  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
    onPointerMove?.(e);
  };
  return <Card className={cn("spotlight overflow-hidden", className)} onPointerMove={handleMove} {...props} />;
}
