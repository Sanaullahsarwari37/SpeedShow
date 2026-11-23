import { ImageResponse } from "next/og";

import { markSvg } from "@/lib/brand";

/** iOS home-screen icon from the brand mark (square: iOS rounds the corners itself). */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const src = `data:image/svg+xml,${encodeURIComponent(markSvg({ rounded: false }))}`;
  // eslint-disable-next-line @next/next/no-img-element
  return new ImageResponse(<img src={src} width={180} height={180} alt="" />, size);
}
