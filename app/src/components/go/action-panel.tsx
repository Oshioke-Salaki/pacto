"use client";

import { useMemo, useState } from "react";
import { Brl } from "@/components/ui/brl";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PublicKey, type TransactionInstruction } from "@solana/web3.js";
import { ArrowSquareOut, ShieldCheck } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card, Skeleton } from "@/components/ui/card";
import { FaucetButton } from "@/components/wallet/faucet-button";
import { GoTerms } from "@/components/go/terms";
import { useNow } from "@/hooks/use-now";
import { PactoClient, type GoRef } from "@/lib/pacto/instructions";
import { sendInstructions } from "@/lib/pacto/tx";
import { explainError } from "@/lib/pacto/errors";
import { ata } from "@/lib/pacto/pda";
import { formatUnits, shortAddress } from "@/lib/pacto/format";
import {
  allowedActions,
  mulBpsCeil,
  remainderOf,
  roles,
  type ActionId,
  type ConfigView,
  type GroupOrderView,
  type ParticipationView,
} from "@/lib/pacto/state";
import { explorerUrl, IS_DEVNET } from "@/lib/solana/cluster";
import { useCount, useT } from "@/lib/i18n/provider";

interface GoResponse {
  go: GroupOrderView;
  participation: ParticipationView | null;
  participations: ParticipationView[];
  config: ConfigView | null;
  decimals: number;
  now: number;
}

export function ActionPanel({ address, initial, decimals: initialDecimals }: { address: string; initial: GroupOrderView; decimals: number }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const qc = useQueryClient();
  const now = useNow();
  const viewer = wallet.publicKey?.toBase58() ?? null;
  const t = useT();
  const count = useCount();

  const query = useQuery<GoResponse>({
    queryKey: ["go", address, viewer],
    queryFn: async () => {
      const res = await fetch(`/api/go/${address}${viewer ? `?viewer=${viewer}` : ""}`, { cache: "no-store" });
      if (!res.ok) throw new Error(t("ap.loadFail"));
      return res.json();
    },
    refetchInterval: 20_000,
  });

  const go = query.data?.go ?? initial;
  const decimals = query.data?.decimals ?? initialDecimals;
  const participation = query.data?.participation ?? null;
  const config = query.data?.config ?? null;
  const participations = query.data?.participations ?? [];

  const balance = useQuery({
    queryKey: ["usdc-balance", viewer, go.mint],
    enabled: !!viewer,
    queryFn: async () => {
      try {
        const bal = await connection.getTokenAccountBalance(ata(new PublicKey(go.mint), new PublicKey(viewer!)), "confirmed");
        return { amount: BigInt(bal.value.amount), exists: true };
      } catch {
        return { amount: 0n, exists: false };
      }
    },
  });

  const ready = now > 0 && (!viewer || !!query.data);
  const actions = useMemo(
    () => (ready ? allowedActions(go, { pubkey: viewer, participation }, now) : []),
    [ready, go, viewer, participation, now],
  );
  const r = roles(go, { pubkey: viewer, participation });
  const [busy, setBusy] = useState<ActionId | null>(null);

  const goRef: GoRef = useMemo(
    () => ({
      address: new PublicKey(go.address),
      organizer: new PublicKey(go.organizer),
      mint: new PublicKey(go.mint),
      arbiter: new PublicKey(go.arbiter),
    }),
    [go.address, go.organizer, go.mint, go.arbiter],
  );

  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["go", address] }),
      qc.invalidateQueries({ queryKey: ["usdc-balance"] }),
    ]);
    router.refresh();
  };

  const run = async (id: ActionId, build: (c: PactoClient) => Promise<TransactionInstruction | TransactionInstruction[]>, success: string) => {
    if (!wallet.publicKey) {
      setVisible(true);
      return;
    }
    setBusy(id);
    try {
      const client = new PactoClient(connection, wallet.publicKey);
      const built = await build(client);
      const ixs = Array.isArray(built) ? built : [built];
      const sig = await sendInstructions(connection, wallet, ixs);
      toast.success(success, {
        action: { label: "View tx", onClick: () => window.open(explorerUrl("tx", sig), "_blank") },
      });
      await refresh();
    } catch (e) {
      console.error(e);
      toast.error(explainError(e));
    } finally {
      setBusy(null);
    }
  };

  const treasury = config ? new PublicKey(config.treasury) : null;
  const has = (id: ActionId) => actions.some((a) => a.id === id);

  return (
    <div className="flex flex-col gap-4">
      {/* Primary: join */}
      {has("join") ? (
        <JoinCard
          go={go}
          decimals={decimals}
          participation={participation}
          connected={!!viewer}
          balance={balance.data}
          busy={busy === "join"}
          onConnect={() => setVisible(true)}
          onRefreshBalance={() => qc.invalidateQueries({ queryKey: ["usdc-balance"] })}
          onJoin={(qty) => run("join", (c) => c.join(goRef, wallet.publicKey!, qty), t("ap.joinedUnits", { units: count("unit", qty) }))}
        />
      ) : null}

      {/* Buyer position */}
      {participation ? (
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <ShieldCheck size={18} weight="fill" className="text-accent" /> {t("ap.yourPosition")}
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-3">
            <div>
              <dt className="text-xs text-ink-3">{t("ap.units")}</dt>
              <dd className="tnum font-display text-lg font-semibold">{participation.qty}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-3">{t("ap.paid")}</dt>
              <dd className="tnum font-display text-lg font-semibold">{formatUnits(participation.paid, decimals)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-3">{go.status === "open" ? t("ap.refundable") : t("ap.heldForYou")}</dt>
              <dd className="tnum font-display text-lg font-semibold">
                {go.status === "open" || go.status === "cancelled"
                  ? formatUnits(participation.paid, decimals)
                  : formatUnits(remainderOf(BigInt(participation.paid), go.advanceBps), decimals)}
              </dd>
            </div>
          </dl>
          {participation.disputed ? (
            <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-[13px] text-warn">
              {t("ap.inDispute", { arbiter: shortAddress(go.arbiter) })}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {has("confirm_receipt") ? (
              <Button
                loading={busy === "confirm_receipt"}
                onClick={() => run("confirm_receipt", (c) => c.confirmReceipt(goRef, wallet.publicKey!, treasury!), t("ap.receiptDone"))}
                disabled={!treasury}
              >
                {t("ap.confirmReceipt")}
              </Button>
            ) : null}
            {has("open_dispute") ? (
              <ConfirmButton
                variant="danger"
                label={t("ap.openDispute")}
                confirmLabel={t("ap.openDisputeYes")}
                busy={busy === "open_dispute"}
                description={t("ap.openDisputeDesc")}
                onConfirm={() => run("open_dispute", (c) => c.openDispute(goRef, wallet.publicKey!), t("ap.disputeOpened"))}
              />
            ) : null}
            {has("leave") ? (
              <Button variant="secondary" loading={busy === "leave"} onClick={() => run("leave", (c) => c.leave(goRef, wallet.publicKey!), t("ap.leftDone"))}>
                {t("ap.leave")}
              </Button>
            ) : null}
            {has("claim_refund") ? (
              <Button loading={busy === "claim_refund"} onClick={() => run("claim_refund", (c) => c.claimRefund(goRef, wallet.publicKey!), t("ap.refundSent"))}>
                {go.status === "cancelled" ? t("ap.claimFull") : t("ap.reclaim")}
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* Organizer controls */}
      {r.isOrganizer ? (
        <Card className="p-5">
          <p className="text-sm font-medium text-ink">{t("ap.youOrganize")}</p>
          <p className="mt-1 text-[13px] text-ink-2">
            {go.status === "open"
              ? go.totalQty >= go.minQty
                ? t("ap.org.minReached")
                : t("ap.org.needMore", { units: count("unit", go.minQty - go.totalQty) })
              : go.status === "locked"
                ? t("ap.org.locked")
                : go.status === "shipped"
                  ? t("ap.org.shipped", { settled: go.settled, total: go.participants })
                  : t("ap.org.finished")}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {has("lock") ? (
              <ConfirmButton
                label={t("ap.lock")}
                confirmLabel={t("ap.lockYes", { amount: formatUnits(
                  (BigInt(go.totalPaid) * BigInt(go.advanceBps)) / 10_000n -
                    ((BigInt(go.totalPaid) * BigInt(go.advanceBps)) / 10_000n) * BigInt(go.feeBps) / 10_000n,
                  decimals,
                ) })}
                busy={busy === "lock"}
                description={t("ap.lockDesc")}
                onConfirm={() => run("lock", (c) => c.lock(goRef, treasury!), t("ap.lockedDone"))}
                disabled={!treasury}
              />
            ) : null}
            {has("mark_shipped") ? <ShipForm busy={busy === "mark_shipped"} onSubmit={(ref) => run("mark_shipped", (c) => c.markShipped(goRef, ref), t("ap.shipped"))} /> : null}
            {has("cancel") ? (
              <ConfirmButton
                variant="danger"
                label={t("ap.cancel")}
                confirmLabel={t("ap.cancelYes")}
                busy={busy === "cancel"}
                description={t("ap.cancelDesc")}
                onConfirm={() => run("cancel", (c) => c.cancel(goRef, wallet.publicKey!), t("ap.cancelled"))}
              />
            ) : null}
            {has("close_vault") ? (
              <Button variant="secondary" loading={busy === "close_vault"} onClick={() => run("close_vault", (c) => c.closeVault(goRef), t("ap.vaultClosed"))}>
                {t("ap.closeVault")}
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* Public safety valves */}
      {!r.isOrganizer && has("cancel") ? (
        <Card className="p-5">
          <p className="text-sm font-medium text-ink">{t("ap.canCancel")}</p>
          <p className="mt-1 text-[13px] text-ink-2">{go.totalQty < go.minQty ? t("ap.canCancelHintMin") : t("ap.canCancelHintLate")} {t("ap.canCancelTail")}</p>
          <Button className="mt-4" variant="secondary" loading={busy === "cancel"} onClick={() => run("cancel", (c) => c.cancel(goRef, wallet.publicKey!), t("ap.cancelledBuyers"))}>
            {t("ap.cancelUnlock")}
          </Button>
        </Card>
      ) : null}

      {/* Arbiter */}
      {r.isArbiter && go.status === "shipped" ? (
        <Card className="p-5">
          <p className="text-sm font-medium text-ink">{t("ap.youArbiter")}</p>
          <DisputeList
            list={participations.filter((p) => p.disputed)}
            decimals={decimals}
            go={go}
            busy={busy === "resolve_dispute"}
            onResolve={(buyer, refund) =>
              run(
                "resolve_dispute",
                (c) => c.resolveDispute(goRef, new PublicKey(buyer), refund, treasury!),
                refund ? t("ap.refunded") : t("ap.releasedOrg"),
              )
            }
          />
        </Card>
      ) : null}

      {/* Release expired (anyone) */}
      {has("release_expired") ? (
        <Card className="p-5">
          <p className="text-sm font-medium text-ink">{t("ap.windowClosed")}</p>
          <p className="mt-1 text-[13px] text-ink-2">{t("ap.windowClosedDesc")}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {participations.filter((p) => !p.disputed).length === 0 ? (
              <li className="text-[13px] text-ink-3">{t("ap.nothingRelease")}</li>
            ) : (
              participations
                .filter((p) => !p.disputed)
                .map((p) => (
                  <li key={p.address} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                    <span className="font-mono text-[13px]">{shortAddress(p.buyer, 5)}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={busy === "release_expired"}
                      disabled={!treasury}
                      onClick={() => run("release_expired", (c) => c.releaseExpired(goRef, new PublicKey(p.buyer), wallet.publicKey!, treasury!), t("ap.shareReleased"))}
                    >
                      {t("ap.release", { amount: formatUnits(remainderOf(BigInt(p.paid), go.advanceBps), decimals) })}
                    </Button>
                  </li>
                ))
            )}
          </ul>
        </Card>
      ) : null}

      {!ready ? (
        <Card className="flex flex-col gap-3 p-5">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
      ) : null}
    </div>
  );
}

/* ---------------- sub components ---------------- */

function JoinCard({
  go,
  decimals,
  participation,
  connected,
  balance,
  busy,
  onConnect,
  onJoin,
  onRefreshBalance,
}: {
  go: GroupOrderView;
  decimals: number;
  participation: ParticipationView | null;
  connected: boolean;
  balance?: { amount: bigint; exists: boolean };
  busy: boolean;
  onConnect: () => void;
  onJoin: (qty: number) => void;
  onRefreshBalance: () => void;
}) {
  const t = useT();
  const remaining = go.maxQty - go.totalQty;
  const [qty, setQty] = useState(1);
  const unit = BigInt(go.unitPrice);
  const total = unit * BigInt(qty);
  const exposure = mulBpsCeil(total, go.advanceBps);
  const insufficient = connected && balance ? balance.amount < total : false;
  const valid = qty >= 1 && qty <= remaining;

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-lg font-semibold text-ink">{participation ? t("ap.addMore") : t("ap.join")}</p>
        <p className="tnum text-sm text-ink-2">
          <span className="font-medium text-ink">{formatUnits(unit, decimals)}</span> {t("ap.each")}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <Field label={t("ap.unitsLabel")} htmlFor="qty" hint={t("ap.left", { n: remaining })} error={!valid ? t("ap.range", { n: remaining }) : undefined}>
          <Input
            id="qty"
            type="number"
            inputMode="numeric"
            min={1}
            max={remaining}
            value={qty}
            onChange={(e) => setQty(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          />
        </Field>
        <div className="pb-7 text-right">
          <p className="text-xs text-ink-3">{t("ap.total")}</p>
          <p className="tnum font-display text-2xl font-semibold text-ink">{formatUnits(total, decimals)}</p>
          <Brl amount={total} decimals={decimals} className="text-xs text-ink-3" />
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
        {t("ap.escrowNote", { amount: formatUnits(exposure, decimals), pct: go.advanceBps / 100 })}
      </p>
      {connected && balance ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-[13px]">
          <span className="text-ink-2">
            {t("ap.balance")} <span className="tnum font-medium text-ink">{formatUnits(balance.amount, decimals)} USDC</span>{" "}
            <Brl amount={balance.amount} decimals={decimals} className="text-xs text-ink-3" />
          </span>
          {IS_DEVNET && (insufficient || !balance.exists) ? <FaucetButton onDone={onRefreshBalance} /> : null}
        </div>
      ) : null}
      <div className="mt-4">
        {connected ? (
          <Button className="w-full" size="lg" loading={busy} disabled={!valid || insufficient} onClick={() => onJoin(qty)}>
            {insufficient ? t("ap.notEnough") : t("ap.pay", { amount: formatUnits(total, decimals) })}
          </Button>
        ) : (
          <Button className="w-full" size="lg" onClick={onConnect}>
            {t("ap.connectJoin")}
          </Button>
        )}
      </div>
      <details className="group mt-4 border-t border-line pt-4">
        <summary className="cursor-pointer list-none text-sm font-medium text-ink-2 hover:text-ink">
          {t("ap.terms")}
        </summary>
        <div className="mt-4">
          <GoTerms go={go} decimals={decimals} qty={Math.max(1, qty)} />
        </div>
      </details>
    </Card>
  );
}

function ShipForm({ busy, onSubmit }: { busy: boolean; onSubmit: (ref: string) => void }) {
  const t = useT();
  const [ref, setRef] = useState("");
  const valid = ref.trim().length > 0 && ref.length <= 96;
  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-line bg-surface-2/60 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(ref.trim());
      }}
    >
      <Field label={t("ap.trackingLabel")} htmlFor="ship-ref" hint={t("ap.trackingHint")}>
        <Input id="ship-ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="BR123456789 or https://..." maxLength={96} />
      </Field>
      <Button type="submit" loading={busy} disabled={!valid}>
        {t("ap.markShipped")}
      </Button>
    </form>
  );
}

function ConfirmButton({
  label,
  confirmLabel,
  description,
  onConfirm,
  busy,
  variant = "primary",
  disabled,
}: {
  label: string;
  confirmLabel: string;
  description: string;
  onConfirm: () => void;
  busy: boolean;
  variant?: "primary" | "danger" | "secondary";
  disabled?: boolean;
}) {
  const t = useT();
  const [arm, setArm] = useState(false);
  if (!arm) {
    return (
      <Button variant={variant} onClick={() => setArm(true)} disabled={disabled} loading={busy}>
        {label}
      </Button>
    );
  }
  return (
    <div className="rounded-xl border border-line bg-surface-2/60 p-4">
      <p className="text-[13px] leading-relaxed text-ink-2">{description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant={variant} loading={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="ghost" onClick={() => setArm(false)} disabled={busy}>
          {t("ap.notNow")}
        </Button>
      </div>
    </div>
  );
}

function DisputeList({
  list,
  decimals,
  go,
  busy,
  onResolve,
}: {
  list: ParticipationView[];
  decimals: number;
  go: GroupOrderView;
  busy: boolean;
  onResolve: (buyer: string, refund: boolean) => void;
}) {
  const t = useT();
  if (list.length === 0) return <p className="mt-1 text-[13px] text-ink-2">{t("ap.noDisputes")}</p>;
  return (
    <ul className="mt-3 flex flex-col gap-3">
      {list.map((p) => (
        <li key={p.address} className="rounded-xl border border-line p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[13px] text-ink">{shortAddress(p.buyer, 5)}</span>
            <span className="tnum text-[13px] text-ink-2">{t("ap.atStake", { amount: formatUnits(remainderOf(BigInt(p.paid), go.advanceBps), decimals) })}</span>
          </div>
          <p className="mt-2 text-[13px] text-ink-2">
            {t("ap.evidence", { tracking: go.shipmentRef || t("ap.none") })}{" "}
            <a href={go.detailsUri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink underline">
              {t("ap.orderPost")} <ArrowSquareOut size={12} />
            </a>
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="danger" loading={busy} onClick={() => onResolve(p.buyer, true)}>
              {t("ap.refundBuyer")}
            </Button>
            <Button size="sm" variant="secondary" loading={busy} onClick={() => onResolve(p.buyer, false)}>
              {t("ap.releaseOrg")}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
