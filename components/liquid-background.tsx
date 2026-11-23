/** Fixed backdrop: solid near-black with a faint neutral light at the top and a fading grid. */
export function LiquidBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(56rem 28rem at 50% -10%, rgba(255,255,255,0.06), transparent 70%)" }} />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 40% at 50% 0%, #000 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 40% at 50% 0%, #000 0%, transparent 80%)",
        }}
      />
    </div>
  );
}
