import { daysFromSecs, formatUnits } from "@/lib/pacto/format";
import { mulBpsCeil, type GroupOrderView } from "@/lib/pacto/state";

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

/** The buyer-protection terms in plain words. Shown before anyone pays. */
export function GoTerms({ go, decimals = 6, qty = 1 }: { go: GroupOrderView; decimals?: number; qty?: number }) {
  const unit = BigInt(go.unitPrice);
  const total = unit * BigInt(qty);
  const advance = mulBpsCeil(total, go.advanceBps);
  const remainder = total - advance;
  const rows = [
    {
      k: "Organizer advance",
      v: `${go.advanceBps / 100}%`,
      d: `Paid to the organizer when the order locks so they can buy the goods. For ${qty} unit${qty === 1 ? "" : "s"} that is ${formatUnits(advance, decimals)} USDC. This is your maximum exposure.`,
    },
    {
      k: "Held until delivery",
      v: `${(10_000 - go.advanceBps) / 100}%`,
      d: `${formatUnits(remainder, decimals)} USDC stays in the vault and is released only when you confirm receipt, or refunded if the organizer never ships.`,
    },
    {
      k: "Ship-by window",
      v: plural(daysFromSecs(go.shipBySecs), "day"),
      d: "After locking, the organizer must mark the order shipped within this window, or you reclaim the held share.",
    },
    {
      k: "Delivery window",
      v: plural(daysFromSecs(go.deliveryWindowSecs), "day"),
      d: "After shipping, you have this long to confirm or dispute. Undisputed shares release automatically afterwards.",
    },
    {
      k: "Protocol fee",
      v: `${go.feeBps / 100}%`,
      d: "Charged to the organizer on each payout. Buyers pay nothing extra.",
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
