"use client";

import { formatDateTime, relativeTime } from "@/lib/pacto/format";
import { deliverBy, shipBy, type GroupOrderView } from "@/lib/pacto/state";
import { intlTag, useLocale, useT } from "@/lib/i18n/provider";

export function StatusDescription({ status }: { status: GroupOrderView["status"] }) {
  const t = useT();
  return <>{t(`status.desc.${status}`)}</>;
}

/** The one deadline that matters for the order's current stage. */
export function OrderTiming({ go, now }: { go: GroupOrderView; now: number }) {
  const t = useT();
  const tag = intlTag(useLocale());
  const dt = (unix: number) => formatDateTime(unix, tag);
  const text =
    go.status === "open"
      ? now < go.joinDeadline
        ? t("timing.joinsClose", { when: relativeTime(go.joinDeadline, now, tag), date: dt(go.joinDeadline) })
        : t("timing.joinClosed")
      : go.status === "locked"
        ? t("timing.shipBy", { date: dt(shipBy(go)) })
        : go.status === "shipped"
          ? t("timing.confirmBy", { date: dt(deliverBy(go)) })
          : null;
  return text ? <p className="text-[13px] text-ink-2">{text}</p> : null;
}
