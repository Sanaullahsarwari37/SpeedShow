import Link from "next/link";

import { LogoMark } from "@/components/logo";
import { siteConfig } from "@/lib/site";

const link = "underline decoration-current/30 underline-offset-2 transition-colors hover:text-foreground";

export function Footer() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-7xl px-4 pb-12 sm:px-6">
      <div className="glass flex flex-col items-center justify-between gap-5 rounded-[var(--radius-panel)] px-6 py-7 text-center sm:flex-row sm:px-8 sm:text-left">
        <div className="flex items-center gap-3.5">
          <LogoMark id="ftr" className="size-9" />
          <div>
            <p className="text-sm font-semibold tracking-tight">{siteConfig.name}</p>
            <p className="text-xs text-muted-foreground">
              Powered by <span className="text-gradient font-semibold">{siteConfig.brand}</span>
            </p>
          </div>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          Free · Ad-free · Private. Measurements by{" "}
          <a href="https://speed.cloudflare.com/" target="_blank" rel="noopener noreferrer" className={link}>
            Cloudflare
          </a>
          , weather by{" "}
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className={link}>
            Open-Meteo
          </a>
          . Location is approximate.{" "}
          <Link href="/privacy" className={link}>
            Privacy
          </Link>
        </p>
      </div>
      <p className="mt-8 text-center text-[0.7rem] tracking-wide text-muted-foreground/80">
        © {new Date().getFullYear()} {siteConfig.brand}. All rights reserved.
      </p>
    </footer>
  );
}
