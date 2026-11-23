import { ImageResponse } from "next/og";

import { markSvg } from "@/lib/brand";
import { siteConfig } from "@/lib/site";

/** Shared social card for Open Graph and Twitter (one design, one source). */
export const ogSize = { width: 1200, height: 630 };

const CHIPS = [
  { label: "Download", color: "#22d3ee" },
  { label: "Upload", color: "#a78bfa" },
  { label: "Ping", color: "#34d399" },
  { label: "Bufferbloat", color: "#fbbf24" },
  { label: "Weather", color: "#93c5fd" },
];

export function renderOgImage() {
  const mark = `data:image/svg+xml,${encodeURIComponent(markSvg())}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          color: "#fafafa",
          background: "radial-gradient(ellipse 900px 420px at 50% -80px, rgba(255,255,255,0.09), transparent 70%), #09090b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} width={84} height={84} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>{siteConfig.name}</div>
            <div style={{ fontSize: 22, color: "#a1a1aa", display: "flex" }}>{`by ${siteConfig.brand}`}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3, display: "flex" }}>Internet speed test,</div>
          <div style={{ fontSize: 92, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3, color: "#a1a1aa", display: "flex" }}>instantly.</div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {CHIPS.map((c) => (
            <div
              key={c.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 22px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                fontSize: 26,
                color: "#e4e4e7",
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: 999, background: c.color }} />
              {c.label}
            </div>
          ))}
        </div>
      </div>
    ),
    ogSize,
  );
}
