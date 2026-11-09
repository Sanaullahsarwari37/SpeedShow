"use client";

import { RefreshCw, ShieldAlert, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { NetworkRisk } from "@/lib/types";

interface Props {
  risk: NetworkRisk;
  isFetching: boolean;
  onRecheck: () => void;
}

/** Shown instead of the test when the visitor's IP is a VPN, proxy or hosting network. */
export function BlockedScreen({ risk, isFetching, onRecheck }: Props) {
  return (
    <section
      aria-labelledby="blocked-title"
      className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl border border-rose-400/25 bg-gradient-to-br from-[#1a1033] via-[#120d2e] to-[#0a0a22] p-8 text-center text-white shadow-[0_30px_80px_-30px_rgba(244,63,94,0.5)] sm:p-12"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-rose-500/25 blur-3xl" />
      <div className="relative">
        <div className="mx-auto grid size-20 place-items-center rounded-3xl border border-white/15 bg-white/10">
          <ShieldOff className="size-10 text-rose-300" aria-hidden="true" />
        </div>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-200">
          <ShieldAlert className="size-3.5" aria-hidden="true" /> Test paused
        </p>
        <h2 id="blocked-title" className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Turn off your VPN to test your real connection
        </h2>
        <p className="mx-auto mt-3 max-w-md text-pretty text-white/75">
          Your traffic looks like it goes through a VPN, proxy or data-centre network. A test through it would measure that server, not your
          internet.
        </p>
        {risk.reasons.length ? (
          <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Why the test is paused">
            {risk.reasons.map((r) => (
              <li key={r} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium">
                {r}
              </li>
            ))}
          </ul>
        ) : null}
        <ol className="mx-auto mt-6 max-w-sm list-decimal space-y-1.5 pl-5 text-left text-sm text-white/80">
          <li>Disconnect your VPN, proxy or private relay.</li>
          <li>Press Check again below.</li>
        </ol>
        <Button variant="liquid" size="lg" onClick={onRecheck} disabled={isFetching} className="mt-7 min-w-56">
          <RefreshCw className={isFetching ? "animate-spin" : undefined} /> {isFetching ? "Checking…" : "Check again"}
        </Button>
        <p className="mt-4 text-xs text-white/55">On a normal home or mobile connection? Detection is occasionally wrong. Wait a minute and check again.</p>
      </div>
    </section>
  );
}
