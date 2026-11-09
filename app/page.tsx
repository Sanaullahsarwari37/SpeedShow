import { Footer } from "@/components/footer";
import { Guide } from "@/components/guide";
import { Header } from "@/components/header";
import { HomeJsonLd } from "@/components/json-ld";
import { SpeedTest } from "@/components/speed/speed-test";

/** Fully static (SSG): HTML and copy ship pre-rendered; only the test widgets hydrate. */
export const dynamic = "force-static";

export default function HomePage() {
  return (
    <>
      <HomeJsonLd />
      <Header />
      <main id="main" className="mx-auto w-full max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16 lg:max-w-7xl lg:pt-20">
        <header className="rise-in mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <p className="glass-soft mx-auto mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[0.7rem] font-medium tracking-wide text-muted-foreground">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
            </span>
            Free · Private · Cloudflare network
          </p>
          <h1 className="text-[2.35rem] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
            Internet speed test
            <br />
            <span className="text-gradient">fast, accurate, private</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-pretty text-muted-foreground sm:text-[0.95rem]">
            Download, upload, ping and bufferbloat in seconds, plus your IP, local time and live weather.
          </p>
        </header>

        <SpeedTest />

        <div className="mt-24 sm:mt-28">
          <Guide />
        </div>
      </main>
      <Footer />
    </>
  );
}
