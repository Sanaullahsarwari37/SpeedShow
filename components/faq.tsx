import { ChevronDown } from "lucide-react";

import { faqs } from "@/lib/faq";

/** Server-rendered accordion using native <details>: crawlable, accessible, zero JS. */
export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="scroll-mt-28">
      <div className="mb-10 text-center">
        <h2 id="faq-title" className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
          Frequently asked <span className="text-gradient">questions</span>
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
          Everything about testing your internet speed.
        </p>
      </div>
      <div className="mx-auto max-w-2xl space-y-2.5">
        {faqs.map((f) => (
          <details
            key={f.q}
            className="glass-premium group rounded-2xl transition-shadow open:shadow-[0_0_40px_-16px_var(--blue-glow)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left font-medium marker:hidden [&::-webkit-details-marker]:hidden">
              <h3 className="text-sm font-medium sm:text-[0.95rem]">{f.q}</h3>
              <ChevronDown className="size-4.5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
