/** Fixed premium backdrop — soft mesh, aurora, subtle grid. */
export function LiquidBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(65rem 40rem at 12% -8%, rgba(59,130,246,0.22), transparent 55%)",
            "radial-gradient(55rem 36rem at 96% 6%, rgba(99,102,241,0.26), transparent 55%)",
            "radial-gradient(48rem 32rem at 70% 105%, rgba(139,92,246,0.18), transparent 55%)",
            "radial-gradient(40rem 26rem at 0% 90%, rgba(14,165,233,0.12), transparent 50%)",
          ].join(","),
        }}
      />
      <div className="blob-a absolute -top-48 left-[6%] h-[28rem] w-[56rem] -rotate-12 rounded-full bg-gradient-to-r from-sky-400/18 via-indigo-500/18 to-transparent blur-[110px] dark:from-sky-500/14 dark:via-indigo-600/22" />
      <div className="blob-b absolute top-[40%] -right-48 size-[38rem] rounded-full bg-gradient-to-br from-indigo-500/16 to-fuchsia-500/8 blur-[130px] dark:from-indigo-600/22" />
      <div className="blob-c absolute -bottom-56 left-[20%] size-[40rem] rounded-full bg-violet-500/12 blur-[140px] dark:bg-violet-700/16" />
      <div
        className="absolute inset-0 opacity-[0.28] dark:opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(to bottom, #000 0%, transparent 48%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, transparent 48%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-50 dark:opacity-70"
        style={{
          background: "radial-gradient(ellipse 85% 70% at 50% 35%, transparent 35%, var(--background) 100%)",
        }}
      />
      <div className="noise absolute inset-0 opacity-[0.035] mix-blend-overlay dark:opacity-[0.05]" />
    </div>
  );
}
