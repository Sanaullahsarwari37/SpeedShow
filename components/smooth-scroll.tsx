"use client";

import { useEffect } from "react";
import type Lenis from "lenis";

/** Height of the sticky header plus a little air, for in-page jumps. */
const HEADER_OFFSET = -72;

/**
 * Inertial wheel scrolling (Lenis) plus eased in-page anchor jumps.
 * Lenis loads when the browser is idle, so it never competes with the first
 * paint or the speed test start. Touch devices keep native scrolling;
 * "reduce motion" turns smoothing off.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lenis: Lenis | null = null;
    let cancelled = false;

    const startLenis = async () => {
      const { default: LenisCtor } = await import("lenis");
      if (cancelled) return;
      lenis = new LenisCtor({
        autoRaf: true,
        lerp: 0.085,
        smoothWheel: true,
        wheelMultiplier: 0.95,
        stopInertiaOnNavigate: true,
        // Let nested scrollers (search results, wide tables) scroll themselves.
        allowNestedScroll: true,
      });
    };
    const hasIdle = "requestIdleCallback" in window;
    const handle = hasIdle ? window.requestIdleCallback(() => void startLenis(), { timeout: 2000 }) : window.setTimeout(() => void startLenis(), 300);

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
      if (lenis) lenis.scrollTo(el, { offset: HEADER_OFFSET, duration: 1.1 });
      else el.scrollIntoView({ behavior: "smooth" }); // before Lenis has loaded
      window.history.pushState(null, "", url.hash);
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelled = true;
      if (hasIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      document.removeEventListener("click", onClick);
      lenis?.destroy();
    };
  }, []);

  return null;
}
