import { STATUS_LABEL, type GoStatus } from "@/lib/pacto/state";
import { cn } from "@/lib/utils";

const tone: Record<GoStatus, string> = {
  open: "bg-accent-soft text-accent-ink",
  locked: "bg-warn-soft text-warn",
  shipped: "bg-surface-3 text-ink",
  completed: "bg-ink text-ink-inverse",
  cancelled: "bg-danger-soft text-danger",
  expired: "bg-danger-soft text-danger",
};

export function StatusChip({ status, className }: { status: GoStatus; className?: string }) {
  return (
    <span className={cn("inline-flex h-7 items-center rounded-full px-2.5 text-xs font-medium", tone[status], className)}>
      {STATUS_LABEL[status]}
    </span>
  );
}
