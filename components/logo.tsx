import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-9", className)} aria-hidden="true">
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="0.55" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#lm-g)" />
      <path d="M14 40a18 18 0 1 1 36 0" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="5" strokeLinecap="round" />
      <path d="M14 40a18 18 0 0 1 24-17" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M32 40l11-14" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="32" cy="40" r="4.5" fill="#fff" />
    </svg>
  );
}
