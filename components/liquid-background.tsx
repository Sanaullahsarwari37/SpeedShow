/** Fixed backdrop: deep near-black with a soft aurora (blobs on tablets/desktops only), fading grid and grain. */
export function LiquidBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(60rem 34rem at 50% -12%, rgba(99,102,241,0.18), transparent 60%)",
            "radial-gradient(40rem 26rem at 8% 4%, rgba(34,211,238,0.08), transparent 60%)",
            "radial-gradient(44rem 28rem at 96% 18%, rgba(168,85,247,0.09), transparent 60%)",
            "radial-gradient(50rem 30rem at 50% 110%, rgba(79,70,229,0.08), transparent 60%)",
          ].join(","),
        }}
      />
      <div className="blob-a absolute -top-56 left-[12%] hidden h-[26rem] w-[50rem] -rotate-12 rounded-full bg-gradient-to-r from-cyan-500/10 via-indigo-600/14 to-transparent blur-[120px] will-change-transform md:block" />
      <div className="blob-b absolute top-[42%] -right-56 hidden size-[34rem] rounded-full bg-gradient-to-br from-violet-600/12 to-fuchsia-600/5 blur-[140px] will-change-transform md:block" />
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, #000 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, #000 0%, transparent 75%)",
        }}
      />
      <div className="noise absolute inset-0 opacity-[0.04] mix-blend-overlay" />
    </div>
  );
}
