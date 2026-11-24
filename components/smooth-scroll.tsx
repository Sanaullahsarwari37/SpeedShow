"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** Height of the sticky masthead plus a little air, for in-page jumps. */
const HEADER_OFFSET = -72;

/**
 * Inertial wheel scrolling (Lenis) plus eased in-page anchor jumps.
 * Touch devices keep native scrolling; "reduce motion" turns smoothing off.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      stopInertiaOnNavigate: true,
      // Let nested scrollers (search results, wide tables) scroll themselves.
      allowNestedScroll: true,
    });

    // Same-page anchors (including "/#weather" from other pages' headers) glide instead of jumping.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank") return;
      const url = new URL(a.href, window.location.href);
      if (url.pathname !== window.location.pathname || !url.hash || url.hash === "#main") return; // skip link keeps native focus behaviour
      const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: HEADER_OFFSET, duration: 1.1 });
      window.history.pushState(null, "", url.hash);
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      lenis.destroy();
    };
  }, []);

  return null;
}
