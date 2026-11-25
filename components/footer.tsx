import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { LogoMark } from "@/components/logo";
import { siteConfig } from "@/lib/site";

const link = "text-muted-foreground transition-colors hover:text-foreground";
const external = { target: "_blank", rel: "noopener noreferrer" } as const;

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Speed test", href: "/#test" },
      { label: "Weather & local time", href: "/#weather" },
      { label: "Your connection", href: "/#network" },
      { label: "Speed guide", href: "/#guide" },
    ],
  },
  {
    title: "Data sources",
    links: [
      { label: "Cloudflare speed test", href: "https://speed.cloudflare.com/", external: true },
      { label: "Open-Meteo weather", href: "https://open-meteo.com/", external: true },
      { label: "OpenStreetMap places", href: "https://www.openstreetmap.org/copyright", external: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: siteConfig.brand, href: "/" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-7xl px-4 pb-10 sm:px-6">
      <div className="glass rounded-[var(--radius-panel)] px-6 py-8 sm:px-8 sm:py-10">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <LogoMark id="ftr" className="size-10" />
              <div>
                <p className="font-semibold tracking-tight">{siteConfig.name}</p>
                <p className="text-xs text-muted-foreground">
                  by <span className="text-gradient font-semibold">{siteConfig.brand}</span>
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              A fast, honest internet speed test with live weather and local time. Free and ad-free.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1 text-xs text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              No accounts · no tracking · results stay with you
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-xs font-semibold tracking-[0.14em] text-foreground/80 uppercase">{col.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {"external" in l && l.external ? (
                      <a href={l.href} className={link} {...external}>
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className={link}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.brand}. All rights reserved.
          </p>
          <p>Location and weather are approximate, based on your IP address.</p>
        </div>
      </div>
    </footer>
  );
}
