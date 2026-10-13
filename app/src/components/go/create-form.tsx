"use client";

import { useMemo, useState } from "react";
import { Brl } from "@/components/ui/brl";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, InputAdornment, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { useNow } from "@/hooks/use-now";
import { PactoClient } from "@/lib/pacto/instructions";
import { sendInstructions } from "@/lib/pacto/tx";
import { explainError } from "@/lib/pacto/errors";
import { formatUnits, parseUnits } from "@/lib/pacto/format";
import type { ConfigView } from "@/lib/pacto/state";
import { USDC_MINT } from "@/lib/solana/cluster";
import { tNow, useT } from "@/lib/i18n/provider";

const DAY = 86_400;

const buildSchema = () =>
  z
    .object({
      title: z.string().trim().min(3, tNow("v.min3")).max(64, tNow("v.max64")),
      description: z.string().trim().min(10, tNow("v.desc10")).max(280, tNow("v.max280")),
      detailsUri: z.union([z.literal(""), z.string().trim().url(tNow("v.link")).max(200, tNow("v.max200"))]),
      imageUri: z.union([z.literal(""), z.string().trim().url(tNow("v.link")).max(200, tNow("v.max200"))]),
      unitPrice: z.string().refine((v) => {
        try {
          return parseUnits(v) > 0n;
        } catch {
          return false;
        }
      }, tNow("v.price")),
      minQty: z.coerce.number().int().min(1, tNow("v.atLeast1")),
      maxQty: z.coerce.number().int().min(1, tNow("v.atLeast1")),
      advancePct: z.coerce.number().min(0).max(80),
      deadline: z.string().min(1, tNow("v.pickDate")),
      shipDays: z.coerce.number().int().min(1, tNow("v.day1")).max(120, tNow("v.ship120")),
      deliveryDays: z.coerce.number().int().min(1, tNow("v.day1")).max(90, tNow("v.deliver90")),
      arbiter: z.string().trim(),
    })
    .refine((v) => v.maxQty >= v.minQty, { message: tNow("v.maxMin"), path: ["maxQty"] })
    .refine((v) => new Date(v.deadline).getTime() > Date.now() + 3600_000, { message: tNow("v.hourAway"), path: ["deadline"] })
    .refine((v) => new Date(v.deadline).getTime() < Date.now() + 180 * DAY * 1000, { message: tNow("v.within180"), path: ["deadline"] })
    .refine(
      (v) => {
        if (!v.arbiter) return true;
        try {
          new PublicKey(v.arbiter);
          return true;
        } catch {
          return false;
        }
      },
      { message: tNow("v.address"), path: ["arbiter"] },
    );

type Values = z.infer<ReturnType<typeof buildSchema>>;
type Errors = Partial<Record<keyof Values, string>>;

function defaultDeadline(nowSecs: number) {
  const d = new Date((nowSecs + 7 * DAY) * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateForm() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [values, setValues] = useState<Values>({
    title: "",
    description: "",
    detailsUri: "",
    imageUri: "",
    unitPrice: "",
    minQty: 10,
    maxQty: 50,
    advancePct: 30,
    deadline: "",
    shipDays: 30,
    deliveryDays: 14,
    arbiter: "",
  });
  // Default deadline is derived from the client clock (0 on the server) so the
  // prerender stays deterministic and no effect has to set state.
  const now = useNow();
  const deadline = values.deadline || (now ? defaultDeadline(now) : "");
  const effective = { ...values, deadline };

  const config = useQuery<{ config: ConfigView | null }>({
    queryKey: ["config"],
    queryFn: async () => (await fetch("/api/config")).json(),
    staleTime: 60_000,
  });
  const maxAdvancePct = config.data?.config ? config.data.config.maxAdvanceBps / 100 : 50;
  const feePct = config.data?.config ? config.data.config.feeBps / 100 : 1.5;
  const paused = config.data?.config?.paused ?? false;

  const set = <K extends keyof Values>(k: K, v: Values[K]) => {
    setValues((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const preview = useMemo(() => {
    try {
      const unit = parseUnits(values.unitPrice || "0");
      const atMin = unit * BigInt(values.minQty || 0);
      const advance = (atMin * BigInt(Math.round(values.advancePct * 100))) / 10_000n;
      return { unit, atMin, advance };
    } catch {
      return null;
    }
  }, [values.unitPrice, values.minQty, values.advancePct]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = buildSchema().safeParse(effective);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof Values;
        if (!next[k]) next[k] = issue.message;
      }
      setErrors(next);
      return;
    }
    if (parsed.data.advancePct > maxAdvancePct) {
      setErrors({ advancePct: t("cf.maxAdvance", { max: maxAdvancePct }) });
      return;
    }
    if (!wallet.publicKey) {
      setVisible(true);
      return;
    }
    setBusy(true);
    try {
      const d = parsed.data;
      const client = new PactoClient(connection, wallet.publicKey);
      const goId = BigInt(Date.now());
      const { ix, groupOrder } = await client.createGroupOrder(wallet.publicKey, USDC_MINT, {
        goId,
        title: d.title,
        description: d.description,
        detailsUri: d.detailsUri,
        imageUri: d.imageUri,
        unitPrice: parseUnits(d.unitPrice),
        minQty: d.minQty,
        maxQty: d.maxQty,
        advanceBps: Math.round(d.advancePct * 100),
        joinDeadline: Math.floor(new Date(d.deadline).getTime() / 1000),
        shipBySecs: d.shipDays * DAY,
        deliveryWindowSecs: d.deliveryDays * DAY,
        arbiter: d.arbiter ? new PublicKey(d.arbiter) : null,
      });
      await sendInstructions(connection, wallet, [ix]);
      toast.success(t("cf.created"));
      router.push(`/go/${groupOrder.toBase58()}`);
    } catch (err) {
      console.error(err);
      toast.error(explainError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-5 p-6">
          <h2 className="font-display text-lg font-semibold text-ink">{t("cf.what")}</h2>
          <Field label={t("cf.title")} htmlFor="title" error={errors.title} right={`${values.title.length}/64`}>
            <Input id="title" value={values.title} maxLength={64} onChange={(e) => set("title", e.target.value)} placeholder={t("cf.titlePh")} />
          </Field>
          <Field label={t("cf.description")} htmlFor="description" error={errors.description} right={`${values.description.length}/280`} hint={t("cf.descriptionHint")}>
            <Textarea id="description" value={values.description} maxLength={280} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("cf.details")} htmlFor="details" error={errors.detailsUri} hint={t("cf.detailsHint")}>
              <Input id="details" inputMode="url" value={values.detailsUri} onChange={(e) => set("detailsUri", e.target.value)} placeholder="https://x.com/you/status/..." />
            </Field>
            <Field label={t("cf.image")} htmlFor="image" error={errors.imageUri} hint={t("cf.imageHint")}>
              <Input id="image" inputMode="url" value={values.imageUri} onChange={(e) => set("imageUri", e.target.value)} placeholder="https://..." />
            </Field>
          </div>
        </Card>

        <Card className="flex flex-col gap-5 p-6">
          <h2 className="font-display text-lg font-semibold text-ink">{t("cf.pricing")}</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label={t("cf.price")} htmlFor="price" error={errors.unitPrice}>
              <InputAdornment id="price" inputMode="decimal" value={values.unitPrice} onChange={(e) => set("unitPrice", e.target.value)} placeholder="72.00">
                USDC
              </InputAdornment>
            </Field>
            <Field label={t("cf.min")} htmlFor="min" error={errors.minQty} hint={t("cf.minHint")}>
              <Input id="min" type="number" min={1} value={values.minQty} onChange={(e) => set("minQty", Number(e.target.value))} />
            </Field>
            <Field label={t("cf.max")} htmlFor="max" error={errors.maxQty}>
              <Input id="max" type="number" min={1} value={values.maxQty} onChange={(e) => set("maxQty", Number(e.target.value))} />
            </Field>
          </div>
          <Field label={t("cf.deadline")} htmlFor="deadline" error={errors.deadline} hint={t("cf.deadlineHint")}>
            <Input id="deadline" type="datetime-local" value={deadline} onChange={(e) => set("deadline", e.target.value)} className="sm:max-w-xs" />
          </Field>
        </Card>

        <Card className="flex flex-col gap-5 p-6">
          <h2 className="font-display text-lg font-semibold text-ink">{t("cf.trust")}</h2>
          <p className="-mt-3 text-[14px] leading-relaxed text-ink-2">{t("cf.trustSub")}</p>
          <Field
            label={t("cf.advance")}
            htmlFor="advance"
            error={errors.advancePct}
            right={t("cf.advanceRight", { pct: values.advancePct, max: maxAdvancePct })}
            hint={t("cf.advanceHint")}
          >
            <input
              id="advance"
              type="range"
              min={0}
              max={maxAdvancePct}
              step={5}
              value={Math.min(values.advancePct, maxAdvancePct)}
              onChange={(e) => set("advancePct", Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("cf.shipDays")} htmlFor="ship" error={errors.shipDays} hint={t("cf.shipDaysHint")}>
              <Input id="ship" type="number" min={1} max={120} value={values.shipDays} onChange={(e) => set("shipDays", Number(e.target.value))} />
            </Field>
            <Field label={t("cf.deliveryDays")} htmlFor="delivery" error={errors.deliveryDays} hint={t("cf.deliveryDaysHint")}>
              <Input id="delivery" type="number" min={1} max={90} value={values.deliveryDays} onChange={(e) => set("deliveryDays", Number(e.target.value))} />
            </Field>
          </div>
          <details className="border-t border-line pt-4">
            <summary className="cursor-pointer list-none text-sm font-medium text-ink-2 hover:text-ink">{t("cf.customArbiter")} <span aria-hidden className="ml-1 text-ink-3">+</span></summary>
            <div className="mt-4">
              <Field label={t("cf.arbiter")} htmlFor="arbiter" error={errors.arbiter} hint={t("cf.arbiterHint")}>
                <Input id="arbiter" value={values.arbiter} onChange={(e) => set("arbiter", e.target.value)} placeholder={t("cf.arbiterPh")} className="font-mono" />
              </Field>
            </div>
          </details>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-24">
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-ink">{t("cf.summary")}</h2>
          <dl className="mt-4 flex flex-col gap-3 text-[14px]">
            <Row k={t("cf.perUnit")} v={preview ? `${formatUnits(preview.unit)} USDC` : "-"} brl={preview?.unit} />
            <Row k={t("cf.pool")} v={preview ? `${formatUnits(preview.atMin)} USDC` : "-"} brl={preview?.atMin} />
            <Row k={t("cf.yourAdvance")} v={preview ? `${formatUnits(preview.advance)} USDC` : "-"} brl={preview?.advance} />
            <Row k={t("cf.fee")} v={t("cf.feeValue", { pct: feePct })} />
            <Row k={t("cf.currency")} v={t("cf.currencyValue")} />
          </dl>
          <p className="mt-5 text-[13px] leading-relaxed text-ink-2">
            {t("cf.rentNote")}
          </p>
          {paused ? <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-[13px] text-warn">{t("cf.paused")}</p> : null}
          <Button type="submit" size="lg" className="mt-5 w-full" loading={busy} disabled={paused}>
            {wallet.publicKey ? t("cf.submit") : t("cf.connect")}
          </Button>
        </Card>
      </aside>
    </form>
  );
}

function Row({ k, v, brl }: { k: string; v: string; brl?: bigint }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
      <dt className="text-ink-2">{k}</dt>
      <dd className="tnum text-right font-medium text-ink">
        {v}
        {brl !== undefined ? <Brl amount={brl} className="block text-xs font-normal text-ink-3" /> : null}
      </dd>
    </div>
  );
}
