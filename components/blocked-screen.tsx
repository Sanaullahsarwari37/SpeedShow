"use client";

import { Bot, RefreshCw, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { NetworkRisk } from "@/lib/types";

interface Props {
  risk: NetworkRisk;
  isFetching: boolean;
  onRecheck: () => void;
}

/** Shown instead of the dashboard when the visitor's IP is a VPN / proxy / hosting network. */
export function BlockedScreen({ risk, isFetching, onRecheck }: Props) {
  return (
    <section
      aria-labelledby="blocked-title"
      className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl border border-rose-400/25 bg-gradient-to-br from-[#1a1033] via-[#120d2e] to-[#0a0a22] p-8 text-center text-white shadow-[0_30px_80px_-30px_rgba(244,63,94,0.5)] sm:p-12"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-rose-500/25 blur-3xl" />
      <div className="relative">
        <div className="mx-auto grid size-24 place-items-center rounded-3xl border border-white/15 bg-white/10 backdrop-blur-md">
          <Bot className="size-12 text-rose-300" aria-hidden="true" />
        </div>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold tracking-widest text-rose-200 uppercase">
          <ShieldAlert className="size-3.5" aria-hidden="true" /> Automated traffic check
        </p>
        <h2 id="blocked-title" className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Are you a robot? Turn off your VPN
        </h2>
        <p className="mx-auto mt-3 max-w-md text-pretty text-white/75">
          Your connection looks like it is going through a VPN, proxy or data-centre network. A speed test through one would
          measure the tunnel, not your real internet, so the test is paused.
        </p>

        {risk.reasons.length > 0 && (
          <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Why this was flagged">
            {risk.reasons.map((r) => (
              <li key={r} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium">
                {r}
              </li>
            ))}
          </ul>
        )}

        <ol className="mx-auto mt-6 max-w-sm space-y-1.5 text-left text-sm text-white/80">
          <li>1. Disconnect your VPN, proxy or private relay.</li>
          <li>2. Reload this page, or press the button below.</li>
        </ol>

        <Button variant="liquid" size="lg" onClick={onRecheck} disabled={isFetching} className="mt-7 min-w-56">
          <RefreshCw className={isFetching ? "animate-spin" : undefined} /> {isFetching ? "Checking…" : "I turned it off, check again"}
        </Button>
        <p className="mt-4 text-xs text-white/55">Using a normal home or mobile connection? Detection can be wrong, so just try again in a minute.</p>
      </div>
    </section>
  );
}
