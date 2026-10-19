import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("skeleton relative overflow-hidden rounded-lg bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
