export const faqs = [
  {
    q: "How does the SpeedShow internet speed test work?",
    a: "SpeedShow uses the official Cloudflare Speedtest engine (the same library that powers speed.cloudflare.com). It measures latency via TTFB, then ramps up download and upload with increasing payload sizes against Cloudflare’s edge. Bandwidth is calculated from transfer size and duration (90th percentile); latency uses the median of samples. No data is logged to Cloudflare from this app.",
  },
  {
    q: "Is the test accurate?",
    a: "Yes — it uses Cloudflare’s own measurement methodology and endpoints. Results reflect the path between your browser and the nearest Cloudflare edge (the same path many CDNs use). Real-world numbers still vary with Wi-Fi quality, other devices and background traffic. For the most reliable reading, use a wired connection and close other apps.",
  },
  {
    q: "What is a good internet speed?",
    a: "For most households, 25–50 Mbps handles HD and 4K streaming and video calls. 100+ Mbps comfortably supports several people at once, and 500 Mbps–1 Gbps is ideal for large downloads, cloud backups and busy smart homes.",
  },
  {
    q: "Why does SpeedShow ask me to turn off my VPN?",
    a: "A VPN or proxy routes your traffic through another server, so a test would measure the tunnel instead of your real internet connection. When SpeedShow detects a VPN, proxy or data-centre network it pauses the test and asks you to disconnect. Detection is automatic and occasionally wrong, so you can re-check after switching it off.",
  },
  {
    q: "Can I see the weather for another city?",
    a: "Yes. Use the search box in the weather card to find any city, then use the locate button to return to the weather at your detected location.",
  },
  {
    q: "Why do download and upload speeds differ?",
    a: "Many internet plans (cable, DSL, 4G/5G) are asymmetric: they allocate more capacity to downloads than uploads. Fibre plans are often symmetric. Upload speed matters for video calls, live streaming and sending large files.",
  },
  {
    q: "What does SpeedShow show about my IP address and ISP?",
    a: "SpeedShow displays your public IP address, your internet service provider and network (ASN), and an approximate location and time zone based on public IP geolocation data. City-level accuracy varies, and the location is never precise enough to find your home.",
  },
  {
    q: "Is my data private?",
    a: "Yes. SpeedShow has no accounts and no ads. Test history is stored only in your own browser and can be cleared at any time. Result logging to Cloudflare is disabled. Your IP is used only to look up connection details and is not stored.",
  },
  {
    q: "Why is my speed lower than what my provider advertises?",
    a: "Advertised speeds are usually maximums. Real-world results are affected by Wi-Fi signal and distance, router quality, congestion at peak hours, VPNs, and how many devices are using the connection. Try testing next to the router or over Ethernet to see your plan’s true ceiling.",
  },
] as const;
