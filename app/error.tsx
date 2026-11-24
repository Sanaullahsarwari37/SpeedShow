"use client";

import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="glass max-w-md rounded-[var(--radius-panel)] p-8 text-center sm:p-10">
        <LogoMark id="er" className="mx-auto mb-6 size-14" />
        <h1 className="text-2xl font-semibold tracking-tight">This page hit an error</h1>
        <p className="mt-2 text-muted-foreground">Reload the page to start over. Your saved city and settings are not affected.</p>
        <Button variant="liquid" size="lg" className="mt-6" onClick={reset}>
          Reload
        </Button>
      </div>
    </main>
  );
}
