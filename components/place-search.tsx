"use client";

import * as React from "react";
import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";

import { useGeocode } from "@/hooks/use-queries";
import type { GeoPlace } from "@/lib/types";
import { cn, flagEmoji } from "@/lib/utils";

interface Props {
  onSelect: (p: GeoPlace | null) => void;
  /** True when a searched city (not the detected location) is showing. */
  custom: boolean;
  className?: string;
}

/** Accessible city search combobox (WAI-ARIA 1.2 combobox with listbox popup). */
export function PlaceSearch({ onSelect, custom, className }: Props) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const listId = `places-${uid}`;
  const { data, isFetching, isError, debounced } = useGeocode(q);
  const results = data ?? [];
  const showList = open && debounced.length >= 2;

  React.useEffect(() => setActive(0), [data]);

  const pick = (p: GeoPlace) => {
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
    } else if (e.key === "Enter") {
      if (showList && results[active]) {
        e.preventDefault();
        pick(results[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={cn("relative flex items-center gap-1.5", className)}>
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/70" aria-hidden="true" />
        <input
          type="text"
          role="combobox"
          aria-label="Search city, district or country for weather"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          maxLength={80}
          placeholder="Search city, district or country…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className="h-10 w-full rounded-full border border-white/20 bg-white/10 pr-9 pl-9 text-sm text-white backdrop-blur-md transition-colors outline-none placeholder:text-white/60 focus:border-white/50 focus:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/40"
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

        {showList && (
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
                className={cn("flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm", i === active && "bg-white/12")}
              >
                <MapPin className="size-4 shrink-0 text-sky-300" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-white/60">{[r.admin1, r.country].filter(Boolean).length ? ` · ${[r.admin1, r.country].filter(Boolean).join(", ")}` : ""}</span>
                </span>
                {r.countryCode && <span aria-hidden="true">{flagEmoji(r.countryCode)}</span>}
              </li>
            ))}
            {!isFetching && results.length === 0 && (
              <li role="presentation" className="px-3 py-3 text-sm text-white/70">
                {isError ? "Search is unavailable right now." : `No places found for “${debounced}”.`}
              </li>
            )}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          onSelect(null);
          setQ("");
        }}
        aria-label="Use my detected location"
        title="Use my location"
        disabled={!custom}
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none",
          !custom && "opacity-50",
        )}
      >
        <LocateFixed className="size-4" />
      </button>
    </div>
  );
}
