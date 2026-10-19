import { LogoMark } from "@/components/logo";

export function Footer() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-7xl px-4 pb-12 sm:px-6">
      <div className="glass-premium flex flex-col items-center justify-between gap-5 rounded-3xl px-6 py-7 text-center sm:flex-row sm:px-8 sm:text-left">
        <div className="flex items-center gap-3.5">
          <LogoMark className="size-9" />
          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground">SpeedShow</p>
            <p className="text-xs text-muted-foreground">
              Powered by <span className="text-gradient font-semibold">TalkNest</span>
            </p>
          </div>
        </div>
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
          Free · Ad-free · Private. Location is approximate. Weather by{" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-white/20 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground/40"
          >
            Open-Meteo
          </a>
          . Measurement engine by Cloudflare.
        </p>
      </div>
      <p className="mt-8 text-center text-[0.7rem] tracking-wide text-muted-foreground/80">
        © {new Date().getFullYear()} TalkNest. All rights reserved.
      </p>
    </footer>
  );
}
