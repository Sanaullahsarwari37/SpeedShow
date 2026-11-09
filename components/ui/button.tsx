import * as React from "react";

import { cn } from "@/lib/utils";

const VARIANTS = {
  liquid: "btn-liquid",
  glass: "glass-soft text-foreground hover:bg-accent",
  ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
  /** For dark consoles and sky backgrounds in both themes. */
  onDark: "border border-white/20 bg-white/10 text-white hover:bg-white/20",
} as const;

const SIZES = {
  sm: "h-8 gap-1.5 px-3 text-xs [&_svg]:size-3.5",
  md: "h-10 gap-2 px-5 text-sm [&_svg]:size-4",
  lg: "h-14 gap-2 px-9 text-base font-semibold [&_svg]:size-4",
  icon: "size-10 [&_svg]:size-4",
  "icon-sm": "size-8 [&_svg]:size-4",
} as const;

export interface ButtonStyle {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Class string for anything that should look like a button (links included). */
export function buttonClass({ variant = "glass", size = "md", className }: ButtonStyle = {}) {
  return cn(
    "inline-flex shrink-0 touch-manipulation items-center justify-center rounded-full font-medium whitespace-nowrap transition-[background-color,color,box-shadow,transform,background-position] duration-200 select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({ variant, size, className, type = "button", ...props }: React.ComponentProps<"button"> & ButtonStyle) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...props} />;
}
