import type { Metadata } from "next";
import Link from "next/link";

import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="glass max-w-md rounded-[var(--radius-panel)] p-8 text-center sm:p-10">
        <p className="text-gradient font-mono text-6xl font-semibold">404</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">This page doesn't exist</h1>
        <p className="mt-2 text-muted-foreground">The link may be old or mistyped.</p>
        <Link href="/" className={buttonClass({ variant: "liquid", size: "lg", className: "mt-6" })}>
          Go to the speed test
        </Link>
      </div>
    </main>
  );
}
