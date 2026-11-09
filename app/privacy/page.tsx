import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JsonLdScript } from "@/components/json-ld";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const dynamic = "force-static";

const description = `How ${siteConfig.name} handles your data: no accounts, no ads, no tracking, and test history kept only in your browser.`;

export const metadata: Metadata = {
  title: "Privacy",
  description,
  alternates: { canonical: "/privacy" },
  openGraph: { url: "/privacy", title: `Privacy | ${siteConfig.name}`, description },
};

const SECTIONS = [
  {
    h: "What we measure",
    p: "Speed tests run directly between your browser and Cloudflare's nearest data centre. Result logging to Cloudflare is turned off, and SpeedShow never receives your test results.",
  },
  {
    h: "Your IP address",
    p: "To show your provider and approximate location, our server sends your IP address to ipwho.is (or ipapi.co as a fallback) and ipapi.is for VPN screening. We don't store or log it.",
  },
  {
    h: "Weather and place search",
    p: "We send rounded coordinates (about 1 km precision) or the place name you type to Open-Meteo. Nothing that identifies you is attached.",
  },
  {
    h: "What stays on your device",
    p: "Your recent tests, the city you picked for weather, your temperature unit and theme are saved in your browser's local storage. Clear them any time with the Clear button or your browser settings.",
  },
  {
    h: "What we don't do",
    p: "No accounts, cookies for tracking, advertising, analytics profiles or selling of data.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: siteConfig.name, item: siteConfig.url },
            { "@type": "ListItem", position: 2, name: "Privacy", item: absoluteUrl("/privacy") },
          ],
        }}
      />
      <Header />
      <main id="main" className="mx-auto w-full max-w-3xl px-4 pt-12 sm:px-6 sm:pt-16">
        <div className="glass rounded-[var(--radius-panel)] p-6 sm:p-10">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Speed test
          </Link>{" "}
          / Privacy
        </nav>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          <span className="text-gradient">Privacy</span>
        </h1>
        <p className="mt-3 text-muted-foreground">{description}</p>
        <div className="mt-10 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold">{s.h}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.p}</p>
            </section>
          ))}
        </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
