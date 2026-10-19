import { ImageResponse } from "next/og";

export const alt = "SpeedShow — free internet speed test, powered by TalkNest";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          color: "white",
          background:
            "radial-gradient(circle at 15% 20%, rgba(56,189,248,0.4), transparent 45%), radial-gradient(circle at 90% 80%, rgba(124,58,237,0.45), transparent 45%), radial-gradient(circle at 70% 10%, rgba(99,102,241,0.5), transparent 40%), #050716",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #38bdf8, #4f46e5 55%, #7c3aed)",
            }}
          >
            <svg width="60" height="60" viewBox="0 0 64 64">
              <path d="M10 44a22 22 0 1 1 44 0" fill="none" stroke="white" strokeOpacity="0.45" strokeWidth="6" strokeLinecap="round" />
              <path d="M10 44a22 22 0 0 1 28-21" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" />
              <path d="M32 44l13-17" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
              <circle cx="32" cy="44" r="5.5" fill="white" />
            </svg>
          </div>
          <div style={{ fontSize: 40, fontWeight: 600, opacity: 0.9, display: "flex" }}>SpeedShow</div>
        </div>
        <div style={{ fontSize: 92, fontWeight: 700, lineHeight: 1.05, marginTop: 48, letterSpacing: -2, display: "flex" }}>
          Test your internet speed
        </div>
        <div style={{ fontSize: 36, marginTop: 24, opacity: 0.75, display: "flex" }}>
          Download · Upload · IP · ISP · Weather
        </div>
        <div style={{ fontSize: 30, marginTop: 56, display: "flex", gap: 12, color: "#a5b4fc" }}>Powered by TalkNest</div>
      </div>
    ),
    { ...size },
  );
}
