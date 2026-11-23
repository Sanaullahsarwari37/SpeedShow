/**
 * Fixed backdrop: near-black with a static aurora and a fading grid.
 * Pure gradients (no animated blur blobs or blend layers), so it costs
 * nothing to scroll on any device.
 */
export function LiquidBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(60rem 34rem at 50% -12%, rgba(99,102,241,0.2), transparent 60%)",
            "radial-gradient(40rem 26rem at 6% 2%, rgba(34,211,238,0.09), transparent 60%)",
            "radial-gradient(44rem 28rem at 98% 16%, rgba(168,85,247,0.1), transparent 60%)",
            "radial-gradient(50rem 30rem at 50% 110%, rgba(79,70,229,0.08), transparent 60%)",
          ].join(","),
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, #000 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, #000 0%, transparent 75%)",
        }}
      />
    </div>
  );
}
