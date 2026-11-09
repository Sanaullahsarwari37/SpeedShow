"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { copyText } from "@/lib/utils";

/** A unique id safe to use inside SVG `url(#…)` references. */
export function useSvgId(prefix = "s") {
  return prefix + useId().replace(/[^a-zA-Z0-9_-]/g, "");
}

/** Copy (or share) with a short-lived "done" flag for button feedback. */
export function useFlash(ms = 1600) {
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const flash = useCallback(() => {
    setOn(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOn(false), ms);
  }, [ms]);
  return [on, flash] as const;
}

export function useCopy(ms?: number) {
  const [copied, flash] = useFlash(ms);
  const copy = useCallback(
    async (text: string) => {
      if (await copyText(text)) flash();
    },
    [flash],
  );
  return [copied, copy] as const;
}
