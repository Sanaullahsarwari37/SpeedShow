import { Skeleton } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/** A card shell with a header row, matching `Surface` + `SurfaceHeader`. */
function CardShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("glass overflow-hidden rounded-[var(--radius-panel)]", className)}>
      <div className="flex min-h-13 items-center gap-2 border-b border-border px-5 sm:px-6">
        <Skeleton className="size-4 rounded" />
        <Skeleton className="h-3.5 w-28" />
      </div>
      {children}
    </div>
  );
}

/** Mirrors the weather grid (Now card, hourly, details, 10-day, sun & moon), so nothing jumps when data lands. */
export function WeatherBodySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12" aria-busy="true" aria-label="Loading weather">
      <div className="flex min-h-[26rem] flex-col gap-3 rounded-[var(--radius-panel)] border border-white/10 bg-gradient-to-br from-[#161b2e] to-[#11141f] p-5 sm:p-6 lg:col-span-5 lg:row-span-2">
        <Skeleton className="h-4 w-48 bg-white/[0.07]" />
        <Skeleton className="mt-2 h-20 w-40 rounded-2xl bg-white/[0.07]" />
        <Skeleton className="h-5 w-28 bg-white/[0.07]" />
        <Skeleton className="h-4 w-52 bg-white/[0.07]" />
        <Skeleton className="mt-auto h-24 w-full rounded-[var(--radius-tile)] bg-white/[0.07]" />
      </div>
      <CardShell className="lg:col-span-7">
        <div className="flex h-44 items-end gap-3 overflow-hidden px-5 pb-5">
          {Array.from({ length: 14 }, (_, i) => (
            <Skeleton key={i} className="w-8 shrink-0 rounded-md" style={{ height: `${45 + Math.sin(i / 2.2) * 25}%` }} />
          ))}
        </div>
      </CardShell>
      <CardShell className="lg:col-span-7">
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 bg-[var(--surface)] px-4 py-4">
              <Skeleton className="size-12 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-4 w-10" />
              </div>
            </div>
          ))}
        </div>
      </CardShell>
      <CardShell className="lg:col-span-7">
        <div className="space-y-4 p-5">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-1.5 flex-1 rounded-full" />
              <Skeleton className="h-4 w-7" />
            </div>
          ))}
        </div>
      </CardShell>
      <CardShell className="lg:col-span-5">
        <div className="space-y-4 p-5 sm:px-6">
          <Skeleton className="mx-auto h-28 w-full max-w-72 rounded-t-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </CardShell>
    </div>
  );
}

/** Whole-section placeholder shown while the weather code itself is loading. */
export function WeatherCardSkeleton() {
  return (
    <div aria-hidden="true" className="pt-10 sm:pt-14">
      <div className="mb-4 flex flex-col gap-3 px-1 sm:mb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-52" />
        </div>
        <Skeleton className="h-10 w-full rounded-full lg:w-[28rem]" />
      </div>
      <WeatherBodySkeleton />
    </div>
  );
}
