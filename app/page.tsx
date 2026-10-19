import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JsonLd } from "@/components/json-ld";
import { SpeedTest } from "@/components/speed-test";

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <Header />
      <main id="main" className="mx-auto w-full max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16 lg:max-w-7xl lg:pt-20">
        <header className="mx-auto mb-10 max-w-xl text-center sm:mb-14">
          <p className="glass-soft mx-auto mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[0.65rem] font-medium tracking-wide text-muted-foreground">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
            </span>
            Free · Private · Cloudflare
          </p>
          <h1 className="text-[2.35rem] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
            Measure your
            <br />
            <span className="text-gradient">internet speed</span>
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
            Download, upload &amp; latency — plus weather and connection details.
          </p>
        </header>

        <SpeedTest />
      </main>
      <Footer />
    </>
  );
}
