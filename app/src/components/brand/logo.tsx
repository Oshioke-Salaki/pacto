import Link from "next/link";
import { cn } from "@/lib/utils";

/** Two interlocking rings: a pact between buyer and organizer. */
export function Mark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={cn("shrink-0", className)}>
      <circle cx="24" cy="32" r="17" fill="none" stroke="var(--accent)" strokeWidth="6" />
      <circle cx="40" cy="32" r="17" fill="none" stroke="var(--ink)" strokeWidth="6" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="Pacto home">
      <Mark />
      <span className="font-display text-[20px] font-semibold tracking-tight text-ink">Pacto</span>
    </Link>
  );
}
