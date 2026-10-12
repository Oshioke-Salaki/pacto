import { Check } from "@phosphor-icons/react/dist/ssr";
import { formatDate } from "@/lib/pacto/format";
import { deliverBy, shipBy, type GroupOrderView } from "@/lib/pacto/state";
import { cn } from "@/lib/utils";

interface Step {
  key: string;
  label: string;
  detail: string;
  state: "done" | "current" | "todo" | "failed";
}

export function buildSteps(go: GroupOrderView): Step[] {
  const s = go.status;
  const openDone = s !== "open";
  const lockedDone = s === "shipped" || s === "completed";
  const shippedDone = s === "completed";

  if (s === "cancelled") {
    return [
      { key: "open", label: "Open for joins", detail: `Created ${formatDate(go.createdAt)}`, state: "done" },
      { key: "cancel", label: "Cancelled", detail: "Buyers claim full refunds", state: "failed" },
    ];
  }
  if (s === "expired") {
    return [
      { key: "open", label: "Open for joins", detail: `Created ${formatDate(go.createdAt)}`, state: "done" },
      { key: "locked", label: "Locked, advance paid", detail: formatDate(go.lockedAt), state: "done" },
      { key: "expired", label: "Never shipped", detail: `Ship-by was ${formatDate(shipBy(go))}`, state: "failed" },
    ];
  }
  return [
    {
      key: "open",
      label: "Open for joins",
      detail: openDone ? `Closed ${formatDate(go.lockedAt || go.joinDeadline)}` : `Until ${formatDate(go.joinDeadline)}`,
      state: openDone ? "done" : "current",
    },
    {
      key: "locked",
      label: "Locked, advance paid",
      detail: lockedDone || s === "locked" ? `${formatDate(go.lockedAt)}, ship by ${formatDate(shipBy(go))}` : "When minimum is met",
      state: lockedDone ? "done" : s === "locked" ? "current" : "todo",
    },
    {
      key: "shipped",
      label: "Shipped",
      detail: shippedDone || s === "shipped" ? `${formatDate(go.shippedAt)}, confirm by ${formatDate(deliverBy(go))}` : "Organizer adds tracking",
      state: shippedDone ? "done" : s === "shipped" ? "current" : "todo",
    },
    {
      key: "completed",
      label: "Completed",
      detail: shippedDone ? "Every buyer settled" : "Buyers confirm receipt",
      state: shippedDone ? "done" : "todo",
    },
  ];
}

export function GoTimeline({ go }: { go: GroupOrderView }) {
  const steps = buildSteps(go);
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
