import { renderOgImage } from "@/lib/og";

export const alt = "SpeedShow: free internet speed test, powered by TalkNest";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage();
}
