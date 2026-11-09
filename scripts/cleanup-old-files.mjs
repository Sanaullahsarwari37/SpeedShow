// Removes files from SpeedShow v1 that no longer exist in v2+.
// Run once from the project root after copying the new files over an old checkout:
//   node scripts/cleanup-old-files.mjs
// Safe to run more than once.
import { existsSync, rmSync } from "node:fs";

const OLD = [
  "app/api/download",
  "app/api/ping",
  "app/api/upload",
  "components.json",
  "components/blocked-screen.tsx",
  "components/faq.tsx",
  "components/features.tsx",
  "components/glow-card.tsx",
  "components/live-chart.tsx",
  "components/place-search.tsx",
  "components/speed-gauge.tsx",
  "components/speed-test.tsx",
  "components/stat-tiles.tsx",
  "components/ui/badge.tsx",
  "components/ui/card.tsx",
  "components/ui/skeleton.tsx",
  "components/weather-card.tsx",
  "components/weather-scene.tsx",
  "hooks/use-history.ts",
  "hooks/use-weather-location.ts",
  "lib/faq.ts",
  "lib/weather-codes.ts",
  "lib/weather-normalize.ts",
];

let removed = 0;
for (const path of OLD) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    console.log(`removed  ${path}`);
    removed++;
  }
}
console.log(removed ? `\nDone: ${removed} old file(s) removed. Commit the deletions (git add -A).` : "Nothing to remove: the project is clean.");
