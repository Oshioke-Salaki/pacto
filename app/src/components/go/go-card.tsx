import Link from "next/link";
import { StatusChip } from "@/components/ui/status-chip";
import { GoProgress } from "@/components/go/progress";
import { formatUnits, relativeTime, shortAddress } from "@/lib/pacto/format";
import type { GroupOrderView } from "@/lib/pacto/state";
import { cn } from "@/lib/utils";

export function GoCard({
  go,
  now,
  decimals = 6,
  className,
  priority,
}: {
  go: GroupOrderView;
  now: number;
  decimals?: number;
  className?: string;
  priority?: boolean;
}) {
  const deadlineText =
    go.status === "open"
      ? now < go.joinDeadline
        ? `Closes ${relativeTime(go.joinDeadline, now)}`
        : "Join window closed"
      : null;

  return (
    <Link
      href={`/go/${go.address}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-[var(--r-card)] border border-line bg-surface shadow-sm transition-[transform,box-shadow] duration-300 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-2">
        {go.imageUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={go.imageUri}
            alt=""
            loading={priority ? "eager" : "lazy"}
            className="size-full object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-accent-soft font-display text-5xl font-semibold text-accent-ink/50">
            {go.title.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display truncate text-[17px] font-semibold leading-snug text-ink">{go.title}</h3>
            <p className="mt-1 text-[13px] text-ink-3">
              by <span className="font-mono">{shortAddress(go.organizer)}</span>
            </p>
          </div>
          <StatusChip status={go.status} />
        </div>
        <GoProgress go={go} compact />
        <div className="mt-auto flex items-baseline justify-between border-t border-line pt-4">
          <span className="tnum font-display text-xl font-semibold text-ink">
            {formatUnits(go.unitPrice, decimals)} <span className="text-sm font-medium text-ink-3">USDC</span>
          </span>
          <span className="text-[13px] text-ink-2">{deadlineText ?? ""}</span>
        </div>
      </div>
    </Link>
  );
}
