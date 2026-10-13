"use client";

import type { GoStatus } from "@/lib/pacto/state";
import { useT } from "@/lib/i18n/provider";
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
  const t = useT();
  return (
    <span className={cn("inline-flex h-7 items-center rounded-full px-2.5 text-xs font-medium", tone[status], className)}>
      {t(`status.${status}`)}
    </span>
  );
}
