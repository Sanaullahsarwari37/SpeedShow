function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && /^https?:\/\//.test(explicit)) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

/** Single source of truth for brand, SEO copy and URLs. */
export const siteConfig = {
  name: "SpeedShow",
  brand: "TalkNest",
  /** ~60 characters: fits Google's title width. */
  title: "Internet Speed Test: Download, Upload & Ping | SpeedShow",
  /** ~155 characters: fits Google's snippet width. */
  description:
    "Free, ad-free internet speed test. Check download, upload, ping and jitter in seconds on Cloudflare's network, plus your IP, ISP, local time and weather.",
  keywords: [
    "internet speed test",
    "speed test",
    "wifi speed test",
    "check internet speed",
    "download speed test",
    "upload speed test",
    "ping test",
    "latency test",
    "jitter test",
    "bufferbloat test",
    "what is my IP",
    "ISP lookup",
    "local time",
    "weather",
    "SpeedShow",
  ],
  locale: "en_US",
  url: resolveSiteUrl(),
  themeColor: { light: "#eef1ff", dark: "#04060f" },
} as const;

export const absoluteUrl = (path = "/") => `${siteConfig.url}${path === "/" ? "" : path}`;
