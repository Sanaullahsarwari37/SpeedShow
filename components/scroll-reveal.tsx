"use client";

import { useEffect } from "react";

/**
 * Scroll reveals. Mark an element with `data-reveal` (fades and rises as one
 * block) or `data-reveal="stagger"` (its children follow one after another).
 * One shared IntersectionObserver; a MutationObserver picks up content that
 * renders later (weather, connection). Scrolling itself stays native, so it
 * runs on the compositor at full frame rate.
 *
 * Content is only hidden once this runs (`html.js-reveal`), so it is always
 * visible without JavaScript and to search engines. "Reduce motion" skips it.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    root.classList.add("js-reveal");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.shown = "";
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );

    const scan = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-shown])").forEach((el) => {
        if (el.dataset.reveal === "stagger") {
          Array.from(el.children).forEach((c, i) => (c as HTMLElement).style.setProperty("--i", String(Math.min(i, 8))));
        }
        io.observe(el); // observing twice is a no-op
      });
    };
    scan();

    let queued = 0;
    const mo = new MutationObserver(() => {
      if (!queued) queued = requestAnimationFrame(() => ((queued = 0), scan()));
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(queued);
      mo.disconnect();
      io.disconnect();
      root.classList.remove("js-reveal");
    };
  }, []);

  return null;
}
