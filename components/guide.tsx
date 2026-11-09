import { IconTile, SectionHeading } from "@/components/ui/primitives";
import { Surface } from "@/components/ui/surface";
import { NEEDS } from "@/lib/rating";
import { METRICS, type MetricKey } from "@/lib/theme";

const ORDER: MetricKey[] = ["download", "upload", "ping", "loaded", "jitter"];

/** Server-rendered explainer: useful to people, indexable by search engines. */
export function Guide() {
  return (
    <section id="guide" aria-labelledby="guide-title" className="scroll-mt-28">
      <SectionHeading id="guide-title" title="Understand your" highlight="results" lede="Speed is only half the story. Ping decides how responsive your connection feels." />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ORDER.map((k) => {
          const m = METRICS[k];
          return (
            <Surface as="li" key={k} pad="md" className="rounded-[var(--radius-tile)] last:sm:col-span-2 last:lg:col-span-1">
              <IconTile icon={m.icon} className="mb-3 size-10" iconClassName={`size-5 ${m.text}`} />
              <h3 className="font-semibold tracking-tight">{m.label}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">{m.help}</p>
            </Surface>
          );
        })}
      </ul>

      <Surface as="div" className="mt-5">
        <div className="no-scrollbar overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <caption className="px-6 pt-5 text-left font-semibold">What speed do you need?</caption>
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th scope="col" className="px-6 py-3 font-medium">Activity, per device</th>
                <th scope="col" className="py-3 pr-4 font-medium">Download</th>
                <th scope="col" className="py-3 pr-4 font-medium">Upload</th>
                <th scope="col" className="py-3 pr-6 font-medium">Ping</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {NEEDS.map((n) => (
                <tr key={n.activity} className="transition-colors hover:bg-accent">
                  <th scope="row" className="px-6 py-3 text-left font-medium">{n.activity}</th>
                  <td className="py-3 pr-4 font-mono tabular-nums">{n.down}</td>
                  <td className="py-3 pr-4 font-mono tabular-nums">{n.up}</td>
                  <td className="py-3 pr-6 text-muted-foreground">{n.ping}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border/70 px-6 py-3 text-xs text-muted-foreground">Add up the needs of everyone online at the same time.</p>
      </Surface>
    </section>
  );
}
