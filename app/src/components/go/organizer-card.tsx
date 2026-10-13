"use client";

import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import type { OrganizerStats } from "@/lib/pacto/reads";
import { formatUnits, shortAddress } from "@/lib/pacto/format";
import { explorerUrl } from "@/lib/solana/cluster";
import { useT } from "@/lib/i18n/provider";

export function OrganizerCard({ organizer, stats, decimals = 6 }: { organizer: string; stats: OrganizerStats; decimals?: number }) {
  const t = useT();
  const trust =
    stats.completed === 0
      ? t("org.new")
      : stats.disputesLost === 0
        ? t(stats.completed === 1 ? "org.clean.one" : "org.clean.other", { n: stats.completed })
        : t(stats.disputesLost === 1 ? "org.lost.one" : "org.lost.other", { n: stats.completed, d: stats.disputesLost });
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-ink-3">{t("org.label")}</p>
          <Link href={`/organizer/${organizer}`} className="font-mono text-[15px] font-medium text-ink hover:underline">
            {shortAddress(organizer, 6)}
          </Link>
        </div>
        <a
          href={explorerUrl("address", organizer)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink"
          aria-label={t("org.explorer")}
        >
          <ArrowUpRight size={16} />
        </a>
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{trust}</p>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
        <div>
          <dt className="text-xs text-ink-3">{t("org.completed")}</dt>
          <dd className="tnum font-display text-lg font-semibold text-ink">{stats.completed}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-3">{t("org.settled")}</dt>
          <dd className="tnum font-display text-lg font-semibold text-ink">{formatUnits(stats.volumeSettled, decimals, 0)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-3">{t("org.disputesLost")}</dt>
          <dd className="tnum font-display text-lg font-semibold text-ink">{stats.disputesLost}</dd>
        </div>
      </dl>
    </Card>
  );
}
