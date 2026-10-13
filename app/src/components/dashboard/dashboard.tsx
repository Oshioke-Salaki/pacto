"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "@phosphor-icons/react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { FaucetButton } from "@/components/wallet/faucet-button";
import { GettingStarted } from "@/components/dashboard/getting-started";
import { useNow } from "@/hooks/use-now";
import { formatUnits, relativeTime } from "@/lib/pacto/format";
import { allowedActions, type GroupOrderView, type ParticipationView } from "@/lib/pacto/state";
import { IS_DEVNET } from "@/lib/solana/cluster";
import { intlTag, useCount, useLocale, useT } from "@/lib/i18n/provider";

interface OrganizerResp {
  orders: GroupOrderView[];
}
interface BuyerResp {
  orders: GroupOrderView[];
  participations: ParticipationView[];
}

export function Dashboard() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const pk = publicKey?.toBase58() ?? null;
  const now = useNow();
  const t = useT();
  const count = useCount();

  const mine = useQuery<OrganizerResp>({
    queryKey: ["dash-organizer", pk],
    enabled: !!pk,
    queryFn: async () => (await fetch(`/api/go?organizer=${pk}`, { cache: "no-store" })).json(),
  });
  const joined = useQuery<BuyerResp>({
    queryKey: ["dash-buyer", pk],
    enabled: !!pk,
    queryFn: async () => (await fetch(`/api/go?buyer=${pk}`, { cache: "no-store" })).json(),
  });

  if (!pk) {
    return (
      <EmptyState
        title={t("dash.connectTitle")}
        body={t("dash.connectBody")}
        action={<Button onClick={() => setVisible(true)}>{t("wallet.connect")}</Button>}
      />
    );
  }

  const empty =
    !joined.isLoading && !mine.isLoading && (joined.data?.orders.length ?? 0) === 0 && (mine.data?.orders.length ?? 0) === 0;

  return (
    <div className="flex flex-col gap-10">
      {empty ? <GettingStarted /> : null}
      {IS_DEVNET && !empty ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
          <p className="text-[14px] text-ink-2">{t("dash.devnet")}</p>
          <FaucetButton />
        </div>
      ) : null}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">{t("dash.joined")}</h2>
        </div>
        {joined.isLoading ? (
          <ListSkeleton />
        ) : !joined.data || joined.data.orders.length === 0 ? (
          <p className="mt-3 text-[15px] text-ink-2">
            {t("dash.noneJoined")}{" "}
            <Link href="/explore" className="font-medium text-ink underline-offset-4 hover:underline">
              {t("dash.exploreLink")}
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {joined.data.orders.map((go) => {
              const p = joined.data!.participations.find((x) => x.groupOrder === go.address) ?? null;
              const next = allowedActions(go, { pubkey: pk, participation: p }, now).find((a) => a.id !== "join");
              return <Row key={go.address} go={go} now={now} next={next ? t(`act.${next.id}`) : undefined} sub={p ? t("dash.paidSub", { units: count("unit", p.qty), amount: formatUnits(p.paid) }) : undefined} />;
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">{t("dash.organized")}</h2>
          <ButtonLink href="/create" size="sm" variant="secondary">
            {t("dash.newOrder")}
          </ButtonLink>
        </div>
        {mine.isLoading ? (
          <ListSkeleton />
        ) : !mine.data || mine.data.orders.length === 0 ? (
          <p className="mt-3 text-[15px] text-ink-2">{t("dash.noneOrganized")}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {mine.data.orders.map((go) => {
              const next = allowedActions(go, { pubkey: pk, participation: null }, now).find((a) => a.id !== "join");
              return <Row key={go.address} go={go} now={now} next={next ? t(`act.${next.id}`) : undefined} sub={t("dash.pooledSub", { buyers: count("buyer", go.participants), amount: formatUnits(go.totalPaid) })} />;
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ go, now, next, sub }: { go: GroupOrderView; now: number; next?: string; sub?: string }) {
  const t = useT();
  const tag = intlTag(useLocale());
  const when =
    go.status === "open"
      ? now < go.joinDeadline
        ? t("dash.closes", { when: relativeTime(go.joinDeadline, now, tag) })
        : t("dash.deadlinePassed")
      : null;
  return (
    <li>
      <Link href={`/go/${go.address}`} className="flex items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3.5 transition-colors hover:bg-surface-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display truncate text-[16px] font-semibold text-ink">{go.title}</p>
            <StatusChip status={go.status} />
          </div>
          <p className="mt-0.5 text-[13px] text-ink-3">
            {sub}
            {when ? ` · ${when}` : ""}
          </p>
        </div>
        {next ? <span className="hidden rounded-full bg-accent-soft px-3 py-1 text-[13px] font-medium text-accent-ink sm:inline">{next}</span> : null}
        <ArrowRight size={18} className="shrink-0 text-ink-3" />
      </Link>
    </li>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
