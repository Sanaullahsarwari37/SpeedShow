import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Class-name helper (clsx + tailwind-merge). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** ISO 3166-1 alpha-2 country code → flag emoji. */
export function flagEmoji(code: string | null | undefined): string {
  const up = code?.toUpperCase();
  if (!up || !/^[A-Z]{2}$/.test(up)) return "🌐";
  return String.fromCodePoint(...[...up].map((c) => 127397 + c.charCodeAt(0)));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Join the truthy parts of a place name: "Kabul, Kabul Province, Afghanistan". */
export const joinParts = (parts: (string | null | undefined)[], sep = ", ") => parts.filter(Boolean).join(sep);

/** Copy text to the clipboard; resolves false when the browser refuses. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
