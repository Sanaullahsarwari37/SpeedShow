"use client";

import { useCallback, useEffect, useState } from "react";

import type { SpeedResult } from "@/lib/types";

const KEY = "speedshow:history:v1";
const MAX = 30;

function valid(x: unknown): x is SpeedResult {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.at === "number" &&
    typeof r.download === "number" &&
    typeof r.upload === "number"
  );
}

/** Test history kept only in this browser (localStorage). Nothing is sent to a server. */
export function useHistory() {
  const [items, setItems] = useState<SpeedResult[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.filter(valid).slice(0, MAX));
      }
    } catch {
      /* storage unavailable: run without history */
    }
    setReady(true);
  }, []);

  const add = useCallback((r: SpeedResult) => {
    setItems((prev) => {
      const next = [r, ...prev].slice(0, MAX);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { items, add, clear, ready };
}
