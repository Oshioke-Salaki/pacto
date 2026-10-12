import { formatUnits, relativeTime, shortAddress } from "@/lib/pacto/format";
import type { ParticipationView } from "@/lib/pacto/state";

export function Participants({ list, now, decimals = 6 }: { list: ParticipationView[]; now: number; decimals?: number }) {
  if (list.length === 0) {
    return <p className="text-[15px] text-ink-2">No buyers yet. Share the link to get the first one.</p>;
  }
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {list.map((p) => (
        <li key={p.address} className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[13px] text-ink">{shortAddress(p.buyer, 5)}</p>
            <p className="text-xs text-ink-3">
              joined {relativeTime(p.joinedAt, now)}
              {p.disputed ? " · in dispute" : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="tnum text-[13px] font-medium text-ink">{p.qty} unit{p.qty === 1 ? "" : "s"}</p>
            <p className="tnum text-xs text-ink-3">{formatUnits(p.paid, decimals)} USDC</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
