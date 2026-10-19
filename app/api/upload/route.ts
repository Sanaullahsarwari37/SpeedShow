import { getClientIp } from "@/lib/ip";
import { RATE_MULT, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_MAX = 4_400_000; // Vercel limits request bodies to 4.5 MB
const MAX_BYTES = Math.max(
  10_000,
  Number.parseInt(process.env.SPEEDTEST_MAX_UPLOAD_BYTES ?? "", 10) || DEFAULT_MAX,
);

/** Per-IP upload budget: ~150 MB burst, refilled at 10 MB/s. */
const BUDGET = { capacity: 150_000_000 * RATE_MULT, refillPerSec: 10_000_000 * RATE_MULT };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

/** Receives bytes, discards them, reports how many arrived. Nothing is stored. */
export async function POST(req: Request): Promise<Response> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    return json({ error: "Payload too large" }, 413);
  }

  const rl = rateLimit(`up:${getClientIp(req) ?? "anon"}`, BUDGET, Math.max(1, Number.isFinite(declared) ? declared : 1_000_000));
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  if (!req.body) return json({ received: 0 });

  const reader = req.body.getReader();
  let received = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_BYTES) {
        await reader.cancel();
        return json({ error: "Payload too large" }, 413);
      }
    }
  } catch {
    return json({ error: "Upload interrupted" }, 400);
  }
  return json({ received });
}
