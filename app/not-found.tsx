import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="glass max-w-md rounded-2xl p-10 text-center">
        <p className="text-gradient font-mono text-6xl font-semibold">404</p>
        <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">That page doesn’t exist. Let’s get you back to the speed test.</p>
        <Link href="/" className={cn(buttonVariants({ variant: "liquid", size: "lg" }), "mt-6")}>
          Back to SpeedShow
        </Link>
      </div>
    </main>
  );
}
