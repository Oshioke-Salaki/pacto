"use client";

import { daysFromSecs, formatUnits } from "@/lib/pacto/format";
import { mulBpsCeil, type GroupOrderView } from "@/lib/pacto/state";
import { useCount, useT } from "@/lib/i18n/provider";

/** The buyer-protection terms in plain words. Shown before anyone pays. */
export function GoTerms({ go, decimals = 6, qty = 1 }: { go: GroupOrderView; decimals?: number; qty?: number }) {
  const t = useT();
  const count = useCount();
  const unit = BigInt(go.unitPrice);
  const total = unit * BigInt(qty);
  const advance = mulBpsCeil(total, go.advanceBps);
  const remainder = total - advance;
  const rows = [
    {
      k: t("terms.advance"),
      v: `${go.advanceBps / 100}%`,
      d: t("terms.advanceDesc", { units: count("unit", qty), amount: formatUnits(advance, decimals) }),
    },
    {
      k: t("terms.held"),
      v: `${(10_000 - go.advanceBps) / 100}%`,
      d: t("terms.heldDesc", { amount: formatUnits(remainder, decimals) }),
    },
    {
      k: t("terms.shipWindow"),
      v: count("day", daysFromSecs(go.shipBySecs)),
      d: t("terms.shipWindowDesc"),
    },
    {
      k: t("terms.deliveryWindow"),
      v: count("day", daysFromSecs(go.deliveryWindowSecs)),
      d: t("terms.deliveryWindowDesc"),
    },
    {
      k: t("terms.fee"),
      v: `${go.feeBps / 100}%`,
      d: t("terms.feeDesc"),
    },
  ];
  return (
    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.k} className="flex flex-col gap-1">
          <dt className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-ink">{r.k}</span>
            <span className="tnum font-display text-lg font-semibold text-ink">{r.v}</span>
          </dt>
          <dd className="text-[13px] leading-relaxed text-ink-2">{r.d}</dd>
        </div>
      ))}
    </dl>
  );
}
