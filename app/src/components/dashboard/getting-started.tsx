"use client";

import { Drop, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FaucetButton } from "@/components/wallet/faucet-button";
import { useT } from "@/lib/i18n/provider";
import { IS_DEVNET } from "@/lib/solana/cluster";

/** Shown to a connected wallet that has no orders yet. */
export function GettingStarted({ onFunded }: { onFunded?: () => void }) {
  const t = useT();
  const steps = [
    ...(IS_DEVNET
      ? [{ icon: Drop, title: t("gs.s1.t"), body: t("gs.s1.b"), action: <FaucetButton onDone={onFunded} /> }]
      : []),
    {
      icon: MagnifyingGlass,
      title: t("gs.s2.t"),
      body: t("gs.s2.b"),
      action: (
        <ButtonLink href="/explore" size="sm">
          {t("gs.s2.cta")}
        </ButtonLink>
      ),
    },
    {
      icon: Plus,
      title: t("gs.s3.t"),
      body: t("gs.s3.b"),
      action: (
        <ButtonLink href="/create" size="sm" variant="secondary">
          {t("gs.s3.cta")}
        </ButtonLink>
      ),
    },
  ];
  return (
    <Card className="p-6">
      <h2 className="font-display text-xl font-semibold text-ink">{t("gs.title")}</h2>
      <p className="mt-1 text-[15px] text-ink-2">{t("gs.sub")}</p>
      <ol className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex flex-col gap-3 rounded-xl border border-line p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                <s.icon size={18} weight="duotone" />
              </span>
              <p className="text-sm font-medium text-ink">
                <span className="tnum text-ink-3">{i + 1}.</span> {s.title}
              </p>
            </div>
            <p className="text-[13px] leading-relaxed text-ink-2">{s.body}</p>
            <div className="mt-auto">{s.action}</div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
