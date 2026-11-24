"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { id: "system", label: "System theme", icon: Monitor },
  { id: "light", label: "Light theme", icon: Sun },
  { id: "dark", label: "Dark theme", icon: Moon },
] as const;

/** System / Light / Dark. Renders a neutral placeholder until mounted, so server and client HTML match. */
export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = mounted ? (theme ?? "system") : null;

  return (
    <div role="radiogroup" aria-label="Colour theme" className={cn("flex items-center rounded-full border border-border bg-muted p-0.5", className)}>
      {OPTIONS.map(({ id, label, icon: Icon }) => {
        const on = current === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={label}
            title={label}
            onClick={() => setTheme(id)}
            className={cn(
              "grid size-7 place-items-center rounded-full transition-colors",
              on ? "bg-surface text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
