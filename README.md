# SpeedShow — powered by TalkNest

A **premium, free** internet speed test built with **Next.js 16 (App Router)**, Tailwind CSS v4, shadcn/ui-style components, Radix Slot, TanStack Query, motion, next-themes and lucide-react.

**Shows:** real-time download / upload / latency / jitter with a live throughput chart, public IP, ISP + ASN, location, time zone, and local or searched-city weather (live, hourly curve, refined sun path, 5-day) — all in a liquid-glass UI with an animated gauge, dark/light themes and test history.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Requires Node 20.9+. The first `npm install` creates your lockfile.

## Deploy free on Vercel (recommended)

1. Push this folder to a GitHub repo.
2. Import it at https://vercel.com/new (framework auto-detected, no settings needed).
3. After you add a domain, set `NEXT_PUBLIC_SITE_URL=https://your-domain.com` in Project → Settings → Environment Variables and redeploy
   (used for canonical URL, sitemap and Open Graph).
4. Optional: submit `https://your-domain.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

Netlify, Cloudflare Pages and any Node host (`npm start`) also work.

## How the speed test works (official Cloudflare engine)

- **Engine**: Official `@cloudflare/speedtest` library — the same measurement engine that powers [speed.cloudflare.com](https://speed.cloudflare.com).
- **Endpoints**: `https://speed.cloudflare.com/__down` and `/__up` (nearest Cloudflare PoP).
- **Methodology** (per Cloudflare docs):
  - Latency via TTFB on small requests (`bytes=0`); median (50th percentile).
  - Download / upload with a **ramp-up** of increasing payload sizes.
  - Bandwidth = transferSize ÷ duration (server processing time excluded); **90th percentile** of samples.
  - Stops advancing to larger sizes once a request lasts ~1 s (`bandwidthFinishRequestDuration`).
- Result logging to Cloudflare is **disabled** (privacy). Packet-loss TURN is optional and not required for download/upload/latency.
- No reliance on your own servers — results match the official Cloudflare speed test path.

## VPN / proxy block page

`/api/network` screens your visitor’s IP (ipapi.is flags + VPN/hosting network-name heuristics). VPN, proxy, Tor and data-centre IPs get a “turn off your VPN” page instead of the dashboard. Crawlers (Googlebot, Bing…) are never blocked; lookup failures fail open.  
Optional env: `IPAPI_KEY` (free key, higher limits), `BLOCK_VPN=off` to disable. Detection is best-effort.

## Weather

Defaults to your detected location. Use the search box to look up any city (Open-Meteo geocoding with relevance ranking). The choice is remembered in this browser; the locate button returns to your own location.

**Sun path** shows daylight length, live countdown to sunrise/sunset, polar day/night handling, and a refined animated arc.

## Security

- Strict CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP (`next.config.ts`).
- API routes: input validation, bounded payloads, per-IP token-bucket rate limits, no CORS, IP read only from platform headers and validated with `net.isIP` before use, no IPs stored or logged.
- No cookies, accounts, ads or trackers. History lives in the browser’s localStorage.

## SEO

Metadata, Open Graph/Twitter (generated OG image), canonical URL, JSON-LD (Organization, WebSite, WebApplication, FAQPage), `sitemap.xml`, `robots.txt`, web manifest and PWA icons, semantic headings, server-rendered FAQ, skip link, reduced-motion support.

## Third-party data

- IP/ISP: ipwho.is, falling back to ipapi.co, then Vercel geo headers.
- Weather: Open-Meteo (free for non-commercial use; for commercial use get an API key and set `OPEN_METEO_API_KEY`). Attribution is shown in the UI.

## Project layout

```
app/          pages, API routes (/api/network|weather|geocode), SEO files
components/   UI (gauge, tiles, network & weather cards, history, FAQ) + ui/ (shadcn-style)
hooks/        useSpeedTest (TanStack mutation), queries, history
lib/          speed engine, IP lookup, weather normalisation, rate limit, formatting
```

## Customising

Brand text lives in `lib/site.ts`; colours and glass tokens in `app/globals.css`; FAQ in `lib/faq.ts`.
