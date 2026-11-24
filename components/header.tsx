import Link from "next/link";

import { LogoMark } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";
import { siteConfig } from "@/lib/site";

const NAV = [
  { href: "/#test", label: "Speed test" },
  { href: "/#weather", label: "Weather" },
  { href: "/#guide", label: "Guide" },
];

export function Header() {
  return (
    <header className="sticky top-3 z-30 mx-auto mt-3 w-[calc(100%-1.25rem)] max-w-7xl sm:top-4 sm:mt-4">
      <div className="frosted relative flex items-center justify-between overflow-hidden rounded-full py-2 pr-2 pl-3 sm:py-2.5 sm:pl-4">
        {/* How far down the page you are (pure CSS scroll timeline; hidden where unsupported) */}
        <span aria-hidden="true" className="scroll-progress pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400" />
        <Link href="/" className="group flex items-center gap-3 rounded-full" aria-label={`${siteConfig.name} home`}>
          <LogoMark id="hdr" className="size-9 transition-transform duration-300 group-hover:scale-105 sm:size-10" />
          <span className="flex flex-col leading-none">
            <span className="text-[0.95rem] font-semibold tracking-tight sm:text-base">{siteConfig.name}</span>
            <span className="mt-0.5 text-[0.62rem] tracking-wide text-muted-foreground sm:text-[0.65rem]">
              powered by <span className="text-gradient font-semibold">{siteConfig.brand}</span>
            </span>
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1">
          <NavLinks items={NAV} />
          <a href="/#test" className="btn-liquid ml-1 rounded-full px-4 py-2 text-sm font-semibold sm:hidden">
            Test
          </a>
        </nav>
      </div>
    </header>
  );
}
