"use client";

import { useMemo, useState } from "react";
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

const DAY = 86_400;

const schema = z
  .object({
    title: z.string().trim().min(3, "At least 3 characters").max(64, "Max 64 characters"),
    description: z.string().trim().min(10, "Tell buyers what they get").max(280, "Max 280 characters"),
    detailsUri: z.union([z.literal(""), z.string().trim().url("Must be a valid link").max(200, "Max 200 characters")]),
    imageUri: z.union([z.literal(""), z.string().trim().url("Must be a valid link").max(200, "Max 200 characters")]),
    unitPrice: z.string().refine((v) => {
      try {
        return parseUnits(v) > 0n;
      } catch {
        return false;
      }
    }, "Enter a price above zero"),
    minQty: z.coerce.number().int().min(1, "At least 1"),
    maxQty: z.coerce.number().int().min(1, "At least 1"),
    advancePct: z.coerce.number().min(0).max(80),
    deadline: z.string().min(1, "Pick a date"),
    shipDays: z.coerce.number().int().min(1, "At least 1 day").max(120, "Max 120 days"),
    deliveryDays: z.coerce.number().int().min(1, "At least 1 day").max(90, "Max 90 days"),
    arbiter: z.string().trim(),
  })
  .refine((v) => v.maxQty >= v.minQty, { message: "Max must be at least the minimum", path: ["maxQty"] })
  .refine((v) => new Date(v.deadline).getTime() > Date.now() + 3600_000, { message: "Deadline must be at least an hour away", path: ["deadline"] })
  .refine((v) => new Date(v.deadline).getTime() < Date.now() + 180 * DAY * 1000, { message: "Deadline must be within 180 days", path: ["deadline"] })
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
    { message: "Not a valid Solana address", path: ["arbiter"] },
  );

type Values = z.infer<typeof schema>;
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
    const parsed = schema.safeParse(effective);
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
      setErrors({ advancePct: `Protocol maximum is ${maxAdvancePct}%` });
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
      toast.success("Group order created");
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
          <h2 className="font-display text-lg font-semibold text-ink">What are you ordering?</h2>
          <Field label="Title" htmlFor="title" error={errors.title} right={`${values.title.length}/64`}>
            <Input id="title" value={values.title} maxLength={64} onChange={(e) => set("title", e.target.value)} placeholder="ARMY Bomb Ver. 4 group order, Sao Paulo" />
          </Field>
          <Field label="Description" htmlFor="description" error={errors.description} right={`${values.description.length}/280`} hint="What is included, where you ship, how re-shipping works.">
            <Textarea id="description" value={values.description} maxLength={280} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Link to your order post" htmlFor="details" error={errors.detailsUri} hint="X, Instagram or Discord post with the full details.">
              <Input id="details" inputMode="url" value={values.detailsUri} onChange={(e) => set("detailsUri", e.target.value)} placeholder="https://x.com/you/status/..." />
            </Field>
            <Field label="Cover image URL" htmlFor="image" error={errors.imageUri} hint="Optional. Direct link to a JPG or PNG.">
              <Input id="image" inputMode="url" value={values.imageUri} onChange={(e) => set("imageUri", e.target.value)} placeholder="https://..." />
            </Field>
          </div>
        </Card>

        <Card className="flex flex-col gap-5 p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Pricing and size</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Price per unit" htmlFor="price" error={errors.unitPrice}>
              <InputAdornment id="price" inputMode="decimal" value={values.unitPrice} onChange={(e) => set("unitPrice", e.target.value)} placeholder="72.00">
                USDC
              </InputAdornment>
            </Field>
            <Field label="Minimum units" htmlFor="min" error={errors.minQty} hint="Below this, everyone is refunded.">
              <Input id="min" type="number" min={1} value={values.minQty} onChange={(e) => set("minQty", Number(e.target.value))} />
            </Field>
            <Field label="Maximum units" htmlFor="max" error={errors.maxQty}>
              <Input id="max" type="number" min={1} value={values.maxQty} onChange={(e) => set("maxQty", Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Join deadline" htmlFor="deadline" error={errors.deadline} hint="After this, nobody can join. You can lock earlier once the minimum is met.">
            <Input id="deadline" type="datetime-local" value={deadline} onChange={(e) => set("deadline", e.target.value)} className="sm:max-w-xs" />
          </Field>
        </Card>

        <Card className="flex flex-col gap-5 p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Trust terms</h2>
          <p className="-mt-3 text-[14px] leading-relaxed text-ink-2">Buyers see these before they pay. Lower advance and shorter windows win more buyers.</p>
          <Field
            label="Advance you receive at lock"
            htmlFor="advance"
            error={errors.advancePct}
            right={`${values.advancePct}%  (max ${maxAdvancePct}%)`}
            hint="Working capital to place the bulk order. The rest is released per buyer on delivery."
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
            <Field label="Days to ship after lock" htmlFor="ship" error={errors.shipDays} hint="Miss it and buyers can reclaim their held share.">
              <Input id="ship" type="number" min={1} max={120} value={values.shipDays} onChange={(e) => set("shipDays", Number(e.target.value))} />
            </Field>
            <Field label="Days for buyers to confirm" htmlFor="delivery" error={errors.deliveryDays} hint="After shipping. Unconfirmed, undisputed shares release to you afterwards.">
              <Input id="delivery" type="number" min={1} max={90} value={values.deliveryDays} onChange={(e) => set("deliveryDays", Number(e.target.value))} />
            </Field>
          </div>
          <details className="border-t border-line pt-4">
            <summary className="cursor-pointer list-none text-sm font-medium text-ink-2 hover:text-ink">Advanced: custom arbiter <span aria-hidden className="ml-1 text-ink-3">+</span></summary>
            <div className="mt-4">
              <Field label="Arbiter wallet" htmlFor="arbiter" error={errors.arbiter} hint="Leave empty to use the Pacto arbiter. Cannot be your own wallet.">
                <Input id="arbiter" value={values.arbiter} onChange={(e) => set("arbiter", e.target.value)} placeholder="Solana address" className="font-mono" />
              </Field>
            </div>
          </details>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-24">
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Summary</h2>
          <dl className="mt-4 flex flex-col gap-3 text-[14px]">
            <Row k="Per unit" v={preview ? `${formatUnits(preview.unit)} USDC` : "-"} />
            <Row k="Pool at minimum" v={preview ? `${formatUnits(preview.atMin)} USDC` : "-"} />
            <Row k="Your advance at lock" v={preview ? `${formatUnits(preview.advance)} USDC` : "-"} />
            <Row k="Protocol fee" v={`${feePct}% of payouts`} />
            <Row k="Currency" v="USDC on Solana" />
          </dl>
          <p className="mt-5 text-[13px] leading-relaxed text-ink-2">
            Creating an order costs a small amount of SOL for account rent. Buyers pay into an escrow vault controlled by the program, never your wallet.
          </p>
          {paused ? <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-[13px] text-warn">Pacto is paused. New orders are temporarily disabled.</p> : null}
          <Button type="submit" size="lg" className="mt-5 w-full" loading={busy} disabled={paused}>
            {wallet.publicKey ? "Create group order" : "Connect wallet to create"}
          </Button>
        </Card>
      </aside>
    </form>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
      <dt className="text-ink-2">{k}</dt>
      <dd className="tnum font-medium text-ink">{v}</dd>
    </div>
  );
}
