import { faqs } from "@/lib/faq";
import { siteConfig } from "@/lib/site";

/** Structured data (schema.org) for rich results. Escapes "<" as recommended by the Next.js docs. */
export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.brand,
        url: siteConfig.url,
        logo: `${siteConfig.url}/icons/icon-512.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
        inLanguage: "en",
        publisher: { "@id": `${siteConfig.url}/#organization` },
      },
      {
        "@type": "WebApplication",
        "@id": `${siteConfig.url}/#app`,
        name: `${siteConfig.name} Internet Speed Test`,
        url: siteConfig.url,
        description: siteConfig.description,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        creator: { "@id": `${siteConfig.url}/#organization` },
        featureList: ["Download speed", "Upload speed", "Cloudflare edge servers", "IP address and ISP lookup", "Local weather"],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
