"use client";

import { useCallback, useEffect, useState } from "react";

type Updater<T> = T | ((prev: T) => T);

/**
 * useState persisted to localStorage (this browser only).
 * Reads after mount so server and client render the same HTML.
 * `isValid` must be a stable (module-level) function.
 */
export function useStoredState<T>(key: string, fallback: T, isValid: (v: unknown) => v is T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) {
        const parsed: unknown = JSON.parse(raw);
        if (isValid(parsed)) setValue(parsed);
      }
    } catch {
      /* storage unavailable or corrupt: keep fallback */
    }
    setReady(true);
  }, [key, isValid]);

  const update = useCallback(
    (next: Updater<T>) =>
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          if (v == null) localStorage.removeItem(key);
          else localStorage.setItem(key, JSON.stringify(v));
        } catch {
          /* ignore quota / private mode */
        }
        return v;
      }),
    [key],
  );

  return [value, update, ready] as const;
}
