"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="glass max-w-md rounded-2xl p-10 text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">An unexpected error occurred. Please try again.</p>
        <Button variant="liquid" size="lg" className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
