import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { LogoMark } from "@/components/logo";
import { siteConfig } from "@/lib/site";

/** Compact footer: brand, the privacy promise and the one link people need. Data credits live next to the data. */
export function Footer() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-7xl px-4 pb-10 sm:px-6">
      <div className="glass flex flex-col gap-5 rounded-[var(--radius-panel)] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <LogoMark id="ftr" className="size-9" />
          <div>
            <p className="text-sm font-semibold tracking-tight">{siteConfig.name}</p>
            <p className="text-xs text-muted-foreground">
              by <span className="text-gradient font-semibold">{siteConfig.brand}</span>
            </p>
          </div>
        </div>

        <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
          No accounts, no tracking. Results stay with you.
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <span>
            © {new Date().getFullYear()} {siteConfig.brand}
          </span>
        </div>
      </div>
    </footer>
  );
}
