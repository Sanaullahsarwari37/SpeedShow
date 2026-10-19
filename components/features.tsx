import { Activity, Cloud, Fingerprint, Gauge, ShieldCheck, Zap, type LucideIcon } from "lucide-react";

const features: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Gauge,
    title: "Real, multi-stream measurement",
    text: "Parallel connections saturate your line the way real downloads do, with a warm-up phase excluded so the number reflects sustained speed.",
  },
  {
    icon: Activity,
    title: "Ping & jitter included",
    text: "See latency and its stability, the two numbers that decide whether gaming and video calls feel smooth.",
  },
  {
    icon: Fingerprint,
    title: "IP, ISP & location",
    text: "Instantly see your public IP address, internet provider, network number and approximate location in one glance.",
  },
  {
    icon: Cloud,
    title: "Local weather",
    text: "A live forecast for your detected location: hourly outlook, five-day trend, wind, humidity and rain chance.",
  },
  {
    icon: ShieldCheck,
    title: "Private & secure",
    text: "No accounts, no ads, no trackers. History stays in your browser, and the site ships with a strict security policy.",
  },
  {
    icon: Zap,
    title: "Fast & beautiful",
    text: "Built with Next.js for instant loading, with liquid-glass design, smooth motion and a dark or light theme.",
  },
];

export function Features() {
  return (
    <section id="how-it-works" aria-labelledby="features-title" className="scroll-mt-24">
      <div className="mb-8 text-center">
        <h2 id="features-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything about your connection, <span className="text-gradient">in one place</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          SpeedShow measures download speed, upload speed, ping and jitter, then adds the context you actually want.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <li key={f.title} className="glass spotlight group rounded-xl p-6 transition-transform duration-500 hover:-translate-y-1">
            <span className="mb-4 grid size-11 place-items-center rounded-xl bg-gradient-to-br from-sky-400/25 to-indigo-500/30 text-primary ring-1 ring-white/10">
              <f.icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="font-semibold tracking-tight">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
