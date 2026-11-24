"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** Header links that highlight the section currently in view. */
export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const ids = items.map((i) => i.href.split("#")[1]).filter(Boolean);
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        // The first section (in page order) whose band crosses the reading line wins.
        setActive(ids.find((id) => seen.get(id)) ?? null);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    const observe = () => ids.forEach((id) => document.getElementById(id) && io.observe(document.getElementById(id)!));
    observe();
    // Weather renders after hydration; pick it up when it appears.
    const t = setTimeout(observe, 1500);
    return () => {
      clearTimeout(t);
      io.disconnect();
    };
  }, [items]);

  return (
    <ul className="hidden items-center gap-0.5 sm:flex">
      {items.map((n) => {
        const on = active !== null && n.href.endsWith(`#${active}`);
        return (
          <li key={n.href}>
            <a
              href={n.href}
              aria-current={on ? "location" : undefined}
              className={cn(
                "relative rounded-full px-3.5 py-2 text-sm transition-colors duration-300",
                on ? "bg-foreground/[0.06] text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {n.label}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-4 -bottom-px h-px origin-center bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 transition-transform duration-500",
                  on ? "scale-x-100" : "scale-x-0",
                )}
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
