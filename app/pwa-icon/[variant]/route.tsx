import { ImageResponse } from "next/og";

import { markSvg } from "@/lib/brand";

/** PWA icons rendered from the one brand mark at build time: /pwa-icon/192, /pwa-icon/512, /pwa-icon/maskable. */
export const dynamic = "force-static";

const VARIANTS = {
  "192": { size: 192, svg: () => markSvg({ rounded: false }) },
  "512": { size: 512, svg: () => markSvg({ rounded: false }) },
  // Maskable: full-bleed tile, gauge shrunk into the 80 % safe zone.
  maskable: { size: 512, svg: () => markSvg({ rounded: false, inset: 0.72 }) },
} as const;

type Variant = keyof typeof VARIANTS;

export function generateStaticParams() {
  return (Object.keys(VARIANTS) as Variant[]).map((variant) => ({ variant }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  const v = VARIANTS[variant as Variant];
  if (!v) return new Response("Not found", { status: 404 });
  const src = `data:image/svg+xml,${encodeURIComponent(v.svg())}`;
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} width={v.size} height={v.size} alt="" />
    ),
    { width: v.size, height: v.size, headers: { "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400" } },
  );
}
