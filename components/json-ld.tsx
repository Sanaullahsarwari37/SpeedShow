import { absoluteUrl, siteConfig } from "@/lib/site";

const id = (frag: string) => `${siteConfig.url}/#${frag}`;

/** Render any schema.org object safely (escapes "<" as the Next.js docs recommend). */
export function JsonLdScript({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** Structured data for the home page: organisation, site and app. */
export function HomeJsonLd() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": id("organization"),
            name: siteConfig.brand,
            url: siteConfig.url,
            logo: absoluteUrl("/icons/icon-512.png"),
          },
          {
            "@type": "WebSite",
            "@id": id("website"),
            url: siteConfig.url,
            name: siteConfig.name,
            description: siteConfig.description,
            inLanguage: "en",
            publisher: { "@id": id("organization") },
          },
          {
            "@type": "WebApplication",
            "@id": id("app"),
            name: `${siteConfig.name} Internet Speed Test`,
            url: siteConfig.url,
            description: siteConfig.description,
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Any",
            browserRequirements: "Requires JavaScript",
            isAccessibleForFree: true,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            publisher: { "@id": id("organization") },
            featureList: [
              "Download and upload speed",
              "Idle and loaded latency (bufferbloat)",
              "Jitter",
              "IP address and ISP lookup",
              "Live local time for any city",
              "Weather, air quality and UV index",
            ],
          },
        ],
      }}
    />
  );
}
