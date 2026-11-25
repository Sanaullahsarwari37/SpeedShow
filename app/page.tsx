import { Footer } from "@/components/footer";
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
      <main id="main" className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6 sm:pt-12 lg:max-w-7xl lg:pt-14">
        <header className="rise-in mb-7 flex flex-col items-center text-center sm:mb-9">
          <h1 className="text-[2rem] font-semibold tracking-tight text-balance sm:text-[2.75rem] sm:leading-[1.1]">
            Internet speed test<span className="text-gradient">, instantly.</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm text-pretty text-muted-foreground sm:text-[0.95rem]">
            Download starts the moment you arrive. Upload, ping, bufferbloat grade, your IP, local time and live weather follow.
          </p>
        </header>

        <SpeedTest />
      </main>
      <Footer />
    </>
  );
}
