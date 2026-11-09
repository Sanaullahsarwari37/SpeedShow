# SpeedShow by TalkNest

A fast, private internet speed test (Next.js 16, App Router, Tailwind CSS 4) in the original liquid-glass design: orb gauge, live throughput chart and sky weather card. It starts by itself like fast.com and adds live local time, weather and connection details.

**Measures:** download, upload, idle latency, jitter and **loaded latency** (bufferbloat), with a live trace.
**Also shows:** public IP, ISP + ASN, location, a live local clock for any city, weather (now, 24 h, 7 days), UV, air quality, sun position and moon phase.

## Upgrading from v1

Copying the new files over an old checkout leaves old files behind (for example `app/api/download`), and the build fails on them. Remove them once, then commit:

```bash
node scripts/cleanup-old-files.mjs
git add -A && git commit -m "Remove old SpeedShow v1 files"
```

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

Node 20.9+. Set `NEXT_PUBLIC_SITE_URL=https://your-domain.com` in production (canonical URLs, sitemap, Open Graph).

## How the test works

- Engine: the official `@cloudflare/speedtest` library (same as speed.cloudflare.com), loaded on idle so the first test starts instantly. `preconnect` warms the connection.
- Order: latency → download → upload. Payloads grow until a request takes ~1 s, so slow lines finish quickly and gigabit lines still saturate.
- Final bandwidth = 90th percentile of samples; latency = median. Loaded latency is measured during transfers.
- Works on any connection, including VPNs and proxies (they just see a short note that results measure the VPN server).
- Reliability: starts immediately, a 20 s stall watchdog, clean abort, clear error messages, and the Cloudflare edge name (e.g. "Frankfurt (FRA)").
- Result logging to Cloudflare is disabled.

## Weather and local time

Open-Meteo forecast + air quality, fetched in parallel on the server and cached (10 / 30 min). The sky follows the live conditions: clear shows full sun, partly cloudy shows the sun with a few clouds, overcast shows a grey cloud deck, fog shows drifting mist, and drizzle, rain and snow fall with the reported intensity. Thunderstorms add lightning bolts. Cloud count comes from the real cloud-cover %. Colours follow the time of day at that place (dawn, day, dusk, night), and the sun and moon are drawn where they actually are, glowing through or hidden by cloud. The local clock ticks live from the place's IANA time zone (DST-correct) and shows how far ahead or behind you it is. Search any city; the choice is remembered in the browser.

## Performance

- Home and privacy pages are static (SSG); only the test widgets hydrate. The weather card is code-split and the test engine preloads when the browser is idle.
- Live numbers ease inside the gauge and tiles only, so the rest of the page doesn't re-render 60×/s. Cards below the test are memoised with stable callbacks.
- Clocks tick per second; the sun position updates per minute (shared timers).
- No animation library, no Radix, no CVA (removed `motion`, `@radix-ui/react-slot`, `class-variance-authority`).
- Glass blur is lighter on phones and the animated background blobs only run on tablets/desktops (the main mobile GPU cost before). One shared 1 s ticker for all clocks.
- Server: VPN check runs in parallel with the ISP lookup; per-IP results cached for 10 minutes.

## SEO

Metadata API (title ≈60 chars, description ≈155), canonical URLs, Open Graph + Twitter images, `sitemap.ts`, `robots.ts`, manifest, JSON-LD (Organization, WebSite, WebApplication, BreadcrumbList on /privacy), server-rendered guide content, semantic headings, `next/font` via Geist.

## Project layout

```
app/                 pages (/, /privacy), API (/api/network|weather|geocode), SEO files, OG image
components/
  ui/                button, surface (+ header), primitives (chip, icon tile, section heading, live dot, skeleton)
  speed/             speed-test (orchestrator), gauge, stat-tiles, live-chart
  weather/           weather-card, sky, instruments, panels (hourly, sun & moon, 7-day), place-search, use-sun
  network-card, history-card, local-time, guide, header, footer
hooks/               use-speed-test, use-live (eased value + chart samples), use-now (shared tickers),
                     use-stored (localStorage state), use-queries, use-ui (svg ids, copy feedback)
lib/                 theme (metric labels/colours/tones), svg (chart paths), speedtest engine,
                     weather (codes, parsing, sky, moon), format (units, time zones), http helpers
```

## Design system

- **One metric config** (`lib/theme.ts`): label, icon and colours for download, upload, ping, loaded ping and jitter. The gauge, tiles, chart, progress steps, history and guide all read from it.
- **Surfaces** are Tailwind 4 utilities in `app/globals.css`: `glass` (cards), `console` (dark gauge/chart panels), `tile` (on sky/console), `glass-soft`. Radius scale: `--radius-panel` and `--radius-tile`.
- **`<Surface>` + `<SurfaceHeader>`** render every card the same way; `<SectionHeading>`, `<Chip>`, `<IconTile>` cover the repeated bits.

Brand copy: `lib/site.ts`. Colours: tokens at the top of `app/globals.css`.

## Environment

See `.env.example`: `NEXT_PUBLIC_SITE_URL`, optional `IPAPI_KEY`, `VPN_CHECK=off` to skip VPN detection, optional `OPEN_METEO_API_KEY` for commercial use.
