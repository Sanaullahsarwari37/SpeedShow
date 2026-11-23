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
        <header className="rise-in mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <p className="glass-soft mx-auto mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[0.7rem] font-medium tracking-wide text-muted-foreground">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
            </span>
            Free · No ads · Private · Cloudflare network
          </p>
          <h1 className="text-[2.35rem] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            How fast is <span className="text-gradient">your internet?</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-pretty text-muted-foreground sm:text-[0.95rem]">
            Your download speed starts measuring instantly. Upload, ping and bufferbloat follow, plus your IP, local time and live weather.
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
