import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent text-foreground",
        outline: "border-border text-muted-foreground",
        success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
        warning: "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-300",
        danger: "border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
