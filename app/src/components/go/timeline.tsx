"use client";

import { Check } from "@phosphor-icons/react";
import { formatDate } from "@/lib/pacto/format";
import { deliverBy, shipBy, type GroupOrderView } from "@/lib/pacto/state";
import { intlTag, useLocale, useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

interface Step {
  key: string;
  label: string;
  detail: string;
  state: "done" | "current" | "todo" | "failed";
}

export function buildSteps(go: GroupOrderView, t: ReturnType<typeof useT>, tag: string): Step[] {
  const s = go.status;
  const openDone = s !== "open";
  const lockedDone = s === "shipped" || s === "completed";
  const shippedDone = s === "completed";
  const d = (unix: number) => formatDate(unix, undefined, tag);

  if (s === "cancelled") {
    return [
      { key: "open", label: t("tl.open"), detail: t("tl.created", { date: d(go.createdAt) }), state: "done" },
      { key: "cancel", label: t("tl.cancelled"), detail: t("tl.cancelledDetail"), state: "failed" },
    ];
  }
  if (s === "expired") {
    return [
      { key: "open", label: t("tl.open"), detail: t("tl.created", { date: d(go.createdAt) }), state: "done" },
      { key: "locked", label: t("tl.locked"), detail: d(go.lockedAt), state: "done" },
      { key: "expired", label: t("tl.neverShipped"), detail: t("tl.shipByWas", { date: d(shipBy(go)) }), state: "failed" },
    ];
  }
  return [
    {
      key: "open",
      label: t("tl.open"),
      detail: openDone ? t("tl.closed", { date: d(go.lockedAt || go.joinDeadline) }) : t("tl.until", { date: d(go.joinDeadline) }),
      state: openDone ? "done" : "current",
    },
    {
      key: "locked",
      label: t("tl.locked"),
      detail: lockedDone || s === "locked" ? t("tl.lockedDetail", { date: d(go.lockedAt), ship: d(shipBy(go)) }) : t("tl.whenMin"),
      state: lockedDone ? "done" : s === "locked" ? "current" : "todo",
    },
    {
      key: "shipped",
      label: t("tl.shipped"),
      detail: shippedDone || s === "shipped" ? t("tl.shippedDetail", { date: d(go.shippedAt), deliver: d(deliverBy(go)) }) : t("tl.addsTracking"),
      state: shippedDone ? "done" : s === "shipped" ? "current" : "todo",
    },
    {
      key: "completed",
      label: t("tl.completed"),
      detail: shippedDone ? t("tl.everyoneSettled") : t("tl.buyersConfirm"),
      state: shippedDone ? "done" : "todo",
    },
  ];
}

export function GoTimeline({ go }: { go: GroupOrderView }) {
  const t = useT();
  const steps = buildSteps(go, t, intlTag(useLocale()));
  return (
    <ol className="flex flex-col">
      {steps.map((st, i) => (
        <li key={st.key} className="relative flex gap-4 pb-6 last:pb-0">
          {i < steps.length - 1 ? (
            <span aria-hidden className={cn("absolute left-[11px] top-6 h-[calc(100%-12px)] w-px", st.state === "done" ? "bg-ink" : "bg-line-2")} />
          ) : null}
          <span
            className={cn(
              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px]",
              st.state === "done" && "border-ink bg-ink text-ink-inverse",
              st.state === "current" && "border-accent bg-accent-soft text-accent-ink",
              st.state === "todo" && "border-line-2 bg-surface text-ink-3",
              st.state === "failed" && "border-danger bg-danger-soft text-danger",
            )}
          >
            {st.state === "done" ? <Check size={13} weight="bold" /> : <span className="size-1.5 rounded-full bg-current" />}
          </span>
          <div className="min-w-0">
            <p className={cn("text-[15px] font-medium", st.state === "todo" ? "text-ink-3" : "text-ink")}>{st.label}</p>
            <p className="text-[13px] text-ink-2">{st.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
