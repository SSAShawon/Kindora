import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Kindora brand mark — two strokes meeting in a heart (connection + kindness)
 * with a small rose "spark" of positive impact.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden className={cn("h-9 w-9", className)}>
      <rect width="40" height="40" rx="12" className="fill-primary" />
      <path
        d="M20 28.6c-4.7-3-8.1-6.1-8.1-9.9 0-2.5 1.9-4.5 4.4-4.5 1.5 0 2.9.7 3.7 2 .8-1.3 2.2-2 3.7-2 2.5 0 4.4 2 4.4 4.5 0 3.8-3.4 6.9-8.1 9.9z"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2.1"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="29.6" cy="10.4" r="2.3" fill="#C76B88" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Kindora home">
      <LogoMark className="transition-transform duration-300 group-hover:scale-105" />
      <span className="font-display text-[22px] font-extrabold tracking-tight text-foreground">
        Kindora
      </span>
    </Link>
  );
}
