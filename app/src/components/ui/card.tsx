import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[var(--r-card)] border border-line bg-surface shadow-sm", className)} {...rest} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-lg bg-surface-3", className)} />;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--r-card)] border border-dashed border-line-2 bg-surface px-6 py-14 text-center">
      <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ink-2">{body}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] text-ink-3">{label}</span>
      <span className="tnum font-display text-2xl font-semibold text-ink">{value}</span>
      {sub ? <span className="text-[13px] text-ink-2">{sub}</span> : null}
    </div>
  );
}
