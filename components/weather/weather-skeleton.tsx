import { Skeleton } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const S = "bg-white/[0.08]";

/** Body placeholder that mirrors the real weather layout, so nothing jumps when data lands. */
export function WeatherBodySkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading weather">
      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-3">
          <Skeleton className={cn("h-4 w-52", S)} />
          <Skeleton className={cn("h-20 w-44 rounded-2xl sm:h-24", S)} />
          <Skeleton className={cn("h-5 w-28", S)} />
          <Skeleton className={cn("h-4 w-56", S)} />
          <div className="flex gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className={cn("h-4 w-16", S)} />
            ))}
          </div>
          <Skeleton className={cn("h-7 w-64 rounded-full", S)} />
        </div>
        <Skeleton className={cn("h-28 w-full rounded-[var(--radius-tile)] sm:w-60", S)} />
      </div>

      <div className="tile space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <Skeleton className={cn("h-3 w-28", S)} />
          <Skeleton className={cn("h-8 w-56 rounded-full", S)} />
        </div>
        <div className="flex h-28 items-end gap-3 overflow-hidden">
          {Array.from({ length: 16 }, (_, i) => (
            <Skeleton key={i} className={cn("w-8 shrink-0 rounded-md", S)} style={{ height: `${35 + Math.sin(i / 2.2) * 25 + 25}%` }} />
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <div className="tile space-y-3 p-4 lg:col-span-3">
          <Skeleton className={cn("h-3 w-28", S)} />
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className={cn("h-4 w-10", S)} />
              <Skeleton className={cn("size-5 rounded-full", S)} />
              <Skeleton className={cn("h-1.5 flex-1 rounded-full", S)} />
              <Skeleton className={cn("h-4 w-7", S)} />
            </div>
          ))}
        </div>
        <div className="tile space-y-4 p-4 lg:col-span-2">
          <Skeleton className={cn("h-3 w-24", S)} />
          <Skeleton className={cn("mx-auto h-28 w-full rounded-t-full", S)} />
          <Skeleton className={cn("h-4 w-full", S)} />
          <Skeleton className={cn("h-10 w-40", S)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="tile flex items-center gap-3 p-3">
            <Skeleton className={cn("size-12 shrink-0 rounded-full", S)} />
            <div className="flex-1 space-y-2">
              <Skeleton className={cn("h-3 w-16", S)} />
              <Skeleton className={cn("h-4 w-12", S)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Whole-card placeholder shown while the weather code itself is loading. */
export function WeatherCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="relative min-h-[28rem] overflow-hidden rounded-[var(--radius-panel)] border border-white/10 sm:min-h-[32rem]"
      style={{ background: "linear-gradient(150deg, #10162b 0%, #161c33 55%, #1c2238 100%)" }}
    >
      <div className="flex items-center gap-2 p-5 sm:p-6">
        <Skeleton className={cn("h-10 flex-1 rounded-full", S)} />
        <Skeleton className={cn("h-9 w-20 rounded-full", S)} />
        <Skeleton className={cn("size-10 rounded-full", S)} />
      </div>
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <WeatherBodySkeleton />
      </div>
    </div>
  );
}
