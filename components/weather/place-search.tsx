"use client";

import * as React from "react";
import { Loader2, LocateFixed, Search, X } from "lucide-react";

import { useGeocode } from "@/hooks/use-queries";
import type { GeoPlace } from "@/lib/types";
import { cn, flagEmoji, joinParts } from "@/lib/utils";
import { SKY_CONTROL } from "@/components/weather/styles";

interface Props {
  onSelect: (p: GeoPlace | null) => void;
  /** True when a searched place (not the detected location) is showing. */
  custom: boolean;
  className?: string;
}

/** Accessible place search (WAI-ARIA combobox + listbox). */
export function PlaceSearch({ onSelect, custom, className }: Props) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const listId = React.useId();
  const { data, isFetching, isError, debounced } = useGeocode(q);
  const results = data ?? [];
  const showList = open && q.trim().length >= 2 && debounced.length >= 2;

  React.useEffect(() => setActive(0), [data]);

  const pick = (p: GeoPlace | null) => {
    onSelect(p);
    setQ("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && showList && results[active]) {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/70" aria-hidden="true" />
        <input
          type="search"
          role="combobox"
          aria-label="Search any city or town for its weather and local time"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          maxLength={80}
          placeholder="Search a city"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className={cn(
            SKY_CONTROL,
            "h-10 w-full appearance-none rounded-full pr-9 pl-10 text-[16px] placeholder:text-white/60 sm:text-sm [&::-webkit-search-cancel-button]:hidden",
          )}
        />
        {isFetching ? (
          <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-white/70" aria-hidden="true" />
        ) : q ? (
          <button
            type="button"
            aria-label="Clear search"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setQ("")}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-0.5 text-white/70 hover:text-white"
          >
            <X className="size-4" />
          </button>
        ) : null}

        {showList ? (
          <ul
            id={listId}
            role="listbox"
            aria-label="Matching places"
            className="absolute inset-x-0 top-12 z-30 max-h-80 overflow-auto rounded-2xl border border-white/15 bg-slate-950/95 p-1.5 text-white shadow-2xl backdrop-blur-xl"
          >
            {results.map((r, i) => (
              <li
                key={r.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(r)}
                onMouseEnter={() => setActive(i)}
                className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm", i === active && "bg-white/12")}
              >
                <span aria-hidden="true">{flagEmoji(r.countryCode)}</span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-white/60"> {joinParts([r.admin1, r.country])}</span>
                </span>
              </li>
            ))}
            {!isFetching && results.length === 0 ? (
              <li role="presentation" className="px-3 py-3 text-sm text-white/70">
                {isError ? "Search isn't responding. Try again in a moment." : `No places match "${debounced}". Check the spelling or try a nearby city.`}
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
      {custom ? (
        <button
          type="button"
          onClick={() => pick(null)}
          aria-label="Back to my location"
          title="Back to my location"
          className={cn(SKY_CONTROL, "grid size-10 shrink-0 place-items-center rounded-full")}
        >
          <LocateFixed className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
