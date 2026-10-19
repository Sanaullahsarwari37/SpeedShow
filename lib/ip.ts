import { isIP } from "node:net";

/**
 * Resolve the caller's IP from platform headers.
 * On Vercel, x-forwarded-for / x-real-ip are set by the platform and cannot be
 * spoofed by clients. Elsewhere, put your reverse proxy in front and make sure
 * it overwrites these headers.
 */
export function getClientIp(req: Request): string | null {
  const h = req.headers;
  const candidates = [
    h.get("x-vercel-forwarded-for"),
    h.get("cf-connecting-ip"),
    h.get("x-real-ip"),
    h.get("x-forwarded-for")?.split(",")[0],
  ];
  for (const c of candidates) {
    const ip = c?.trim();
    if (ip && isIP(ip)) return ip;
  }
  return null;
}

/** True for loopback / private / link-local / unique-local addresses. */
export function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  if (v === 6) {
    const l = ip.toLowerCase();
    if (l === "::1" || l === "::") return true;
    if (l.startsWith("fe8") || l.startsWith("fe9") || l.startsWith("fea") || l.startsWith("feb")) return true;
    if (l.startsWith("fc") || l.startsWith("fd")) return true;
    if (l.startsWith("::ffff:")) {
      const tail = l.slice(7);
      return isIP(tail) === 4 ? isPrivateIp(tail) : false;
    }
  }
  return false;
}

export function ipVersion(ip: string): 4 | 6 | null {
  const v = isIP(ip);
  return v === 4 || v === 6 ? v : null;
}
