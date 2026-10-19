import { randomBytes } from "node:crypto";
import { getClientIp } from "@/lib/ip";
import { RATE_MULT, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_MAX = 4_000_000; // Vercel limits function payloads to 4.5 MB
const MAX_BYTES = Math.max(
  10_000,
  Number.parseInt(process.env.SPEEDTEST_MAX_DOWNLOAD_BYTES ?? "", 10) || DEFAULT_MAX,
);
const CHUNK = 64 * 1024;
// Incompressible random payload, generated once per process and re-sent in slices.
const PAYLOAD = new Uint8Array(randomBytes(CHUNK * 4));

/** Per-IP data budget: ~400 MB burst (one full test), refilled at 20 MB/s. */
const BUDGET = { capacity: 400_000_000 * RATE_MULT, refillPerSec: 20_000_000 * RATE_MULT };

function parseBytes(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return Math.min(1_000_000, MAX_BYTES);
  return Math.min(Math.floor(n), MAX_BYTES);
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const bytes = parseBytes(url.searchParams.get("bytes"));

  const rl = rateLimit(`down:${getClientIp(req) ?? "anon"}`, BUDGET, Math.max(1, bytes));
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  let sent = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= bytes) {
        controller.close();
        return;
      }
      const size = Math.min(CHUNK, bytes - sent);
      // Rotate the start offset so consecutive chunks are not byte-identical.
      const offset = (Math.floor(sent / CHUNK) % 3) * CHUNK;
      controller.enqueue(PAYLOAD.subarray(offset, offset + size));
      sent += size;
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(bytes),
      "Content-Encoding": "identity", // never compress: we are measuring raw throughput
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
