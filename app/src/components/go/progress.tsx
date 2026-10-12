import { pct } from "@/lib/pacto/format";
import type { GroupOrderView } from "@/lib/pacto/state";
import { cn } from "@/lib/utils";

/** Progress toward the minimum (and max). Functional product UI, not decoration. */
export function GoProgress({ go, compact = false }: { go: GroupOrderView; compact?: boolean }) {
  const minPct = pct(go.totalQty, go.minQty);
  const maxPct = pct(go.totalQty, go.maxQty);
  const minMarker = Math.min(100, Math.round((go.minQty / go.maxQty) * 100));
  const reached = go.totalQty >= go.minQty;
  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out)]", reached ? "bg-accent" : "bg-ink")}
          style={{ width: `${maxPct}%` }}
        />
        <span
          aria-hidden
          className="absolute top-0 h-full w-px bg-ink-3"
          style={{ left: `${minMarker}%` }}
          title={`Minimum: ${go.minQty}`}
        />
      </div>
      <div className={cn("flex items-baseline justify-between text-ink-2", compact ? "text-xs" : "text-[13px]")}>
        <span className="tnum">
          <span className="font-medium text-ink">{go.totalQty}</span> of {go.maxQty} units
        </span>
        <span className="tnum">{reached ? "Minimum reached" : `${minPct}% to minimum (${go.minQty})`}</span>
      </div>
    </div>
  );
}
