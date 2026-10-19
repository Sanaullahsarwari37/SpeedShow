function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && /^https?:\/\//.test(explicit)) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "SpeedShow",
  brand: "TalkNest",
  tagline: "Premium internet speed test — accurate, private, beautiful",
  title: "SpeedShow — Free Premium Internet Speed Test, IP, ISP & Weather | Powered by TalkNest",
  description:
    "SpeedShow is a free, ad-free, premium internet speed test. Measure real download, upload and latency on Cloudflare’s edge, see your IP, ISP, location and local weather — all in one elegant dashboard. Powered by TalkNest.",
  keywords: [
    "internet speed test",
    "speed test",
    "check internet speed",
    "download speed",
    "upload speed",
    "latency test",
    "ping test",
    "Cloudflare speed test",
    "what is my IP",
    "my IP address",
    "ISP lookup",
    "bandwidth test",
    "wifi speed test",
    "accurate speed test",
    "SpeedShow",
    "TalkNest",
  ],
  url: resolveSiteUrl(),
} as const;
