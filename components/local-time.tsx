"use client";

import { useNow } from "@/hooks/use-now";
import { formatZoned, offsetLabel, offsetRelation, safeZone, zoneOffset, zonedParts } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Live wall-clock time for a place (re-renders once per second, only where used). */
export function useLocalTime(tz: string | null | undefined) {
  const now = useNow(1000);
  if (now === null) return null;
  const zone = safeZone(tz);
  const date = new Date(now);
  const offset = zoneOffset(date, zone);
  return {
    date,
    time: formatZoned(date, zone, { hour: "numeric", minute: "2-digit" }),
    seconds: String(zonedParts(date, zone).second).padStart(2, "0"),
    day: formatZoned(date, zone, { weekday: "long", day: "numeric", month: "long" }),
    offset: offsetLabel(offset),
    relation: offsetRelation(offset, -date.getTimezoneOffset()),
  };
}

/** Large live clock block used in the weather card. */
export function LocalClock({ tz, className }: { tz: string; className?: string }) {
  const t = useLocalTime(tz);
  return (
    <div className={className}>
      <p className="text-[0.7rem] font-semibold tracking-wide text-white/70 uppercase">Local time</p>
      <p className="font-mono text-4xl font-semibold tracking-tight tabular-nums sm:text-[2.6rem]">
        {t ? (
          <time dateTime={t.date.toISOString()}>
            {t.time}
            <span className="ml-1 text-lg text-white/60">{t.seconds}</span>
          </time>
        ) : (
          <span className="text-white/50">--:--</span>
        )}
      </p>
      <p className="mt-0.5 min-h-8 text-xs leading-relaxed text-white/75">
        {t ? (
          <>
            {t.day}
            <br />
            {t.offset} · {t.relation}
          </>
        ) : null}
      </p>
    </div>
  );
}
