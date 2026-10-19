import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn/ui class-name helper. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Convert an ISO 3166-1 alpha-2 country code to its flag emoji. */
export function flagEmoji(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "🌐";
  const up = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(up)) return "🌐";
  return String.fromCodePoint(...[...up].map((c) => 127397 + c.charCodeAt(0)));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
