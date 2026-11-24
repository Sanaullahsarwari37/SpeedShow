"use client";

import { useEffect } from "react";

const CARD = ".glass, .console";

/**
 * A soft light that follows the pointer across cards. One document listener,
 * at most one update per frame; it only moves two CSS variables (--mx/--my)
 * on the card under the pointer, which the `glass` / `console` backgrounds use.
 * Mouse and pen only (no effect on touch); off with "reduce motion".
 */
export function PointerSpotlight() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let card: HTMLElement | null = null;
    let raf = 0;
    let x = 0;
    let y = 0;

    const clear = (el: HTMLElement | null) => {
      el?.style.removeProperty("--mx");
      el?.style.removeProperty("--my");
    };
    const paint = () => {
      raf = 0;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${x - r.left}px`);
      card.style.setProperty("--my", `${y - r.top}px`);
    };
    const onMove = (e: PointerEvent) => {
      const next = (e.target as Element | null)?.closest?.(CARD) as HTMLElement | null;
      if (next !== card) {
        clear(card);
        card = next;
      }
      x = e.clientX;
      y = e.clientY;
      if (card && !raf) raf = requestAnimationFrame(paint);
    };
    const onLeave = () => {
      clear(card);
      card = null;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      clear(card);
    };
  }, []);

  return null;
}
