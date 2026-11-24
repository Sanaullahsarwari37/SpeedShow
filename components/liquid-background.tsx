/** Fixed backdrop: a soft light at the top and a fading grid, both following the theme. */
export function LiquidBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(56rem 28rem at 50% -10%, var(--glow-top), transparent 70%)" }} />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 40% at 50% 0%, #000 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 40% at 50% 0%, #000 0%, transparent 80%)",
        }}
      />
    </div>
  );
}
