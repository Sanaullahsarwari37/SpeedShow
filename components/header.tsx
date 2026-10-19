import Link from "next/link";

import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-3 z-30 mx-auto mt-3 w-[calc(100%-1.25rem)] max-w-7xl sm:top-4 sm:mt-4">
      <div className="glass-premium flex items-center justify-between rounded-full py-2 pr-2 pl-3 sm:py-2.5 sm:pl-4">
        <Link href="/" className="group flex items-center gap-3 rounded-full" aria-label="SpeedShow home">
          <LogoMark className="size-9 transition-transform duration-300 group-hover:scale-105 sm:size-10" />
          <span className="flex flex-col leading-none">
            <span className="text-[0.95rem] font-semibold tracking-tight sm:text-base">SpeedShow</span>
            <span className="mt-0.5 text-[0.62rem] tracking-wide text-muted-foreground sm:text-[0.65rem]">
              powered by <span className="text-gradient font-semibold">TalkNest</span>
            </span>
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-1.5">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
