import { Suspense } from "react";
import { Brl } from "@/components/ui/brl";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { StatusChip } from "@/components/ui/status-chip";
import { Card, Skeleton } from "@/components/ui/card";
import { GoProgress } from "@/components/go/progress";
import { GoTimeline } from "@/components/go/timeline";
import { OrganizerCard } from "@/components/go/organizer-card";
import { Participants } from "@/components/go/participants";
import { ShareRow } from "@/components/go/share";
import { ActionPanel } from "@/components/go/action-panel";
import { GoTerms } from "@/components/go/terms";
import { OrderTiming, StatusDescription } from "@/components/go/order-bits";
import { T } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  fetchGroupOrder,
  fetchMintDecimals,
  fetchOrganizerOrders,
  fetchParticipations,
  organizerStats,
} from "@/lib/pacto/reads";
import { formatUnits, shortAddress, unixNow } from "@/lib/pacto/format";
import { explorerUrl } from "@/lib/solana/cluster";

type Params = { params: Promise<{ address: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { address } = await params;
  const go = await fetchGroupOrder(address);
  if (!go) return { title: "Order not found" };
  return {
    title: go.title,
    description: go.description,
    openGraph: { title: go.title, description: go.description, images: go.imageUri ? [go.imageUri] : undefined },
  };
}

export default function GroupOrderPage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Params) {
  const { address } = await params;
  const go = await fetchGroupOrder(address);
  if (!go) notFound();
  const [decimals, participations, organizerOrders] = await Promise.all([
    fetchMintDecimals(go.mint),
    fetchParticipations(address),
    fetchOrganizerOrders(go.organizer),
  ]);
  const now = unixNow();
  const stats = organizerStats(organizerOrders);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <nav className="text-[13px] text-ink-3" aria-label="Breadcrumb">
        <Link href="/explore" className="hover:text-ink"><T k="go.breadcrumb" /></Link> <span aria-hidden>/</span> {shortAddress(go.address)}
      </nav>

      <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
        {/* Header: first everywhere */}
        <div className="lg:col-start-1">
          <div className="flex flex-wrap items-center gap-3">
            <StatusChip status={go.status} />
            <span className="text-[13px] text-ink-2"><StatusDescription status={go.status} /></span>
          </div>
          <h1 className="font-display mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl">{go.title}</h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-ink-2">{go.description}</p>
          {go.detailsUri ? (
            <a href={go.detailsUri} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-medium text-ink underline-offset-4 hover:underline">
              <T k="go.details" /> <ArrowSquareOut size={16} />
            </a>
          ) : null}
        </div>

        {/* Story: below the header on desktop, after the actions on phones */}
        <div className="order-3 flex flex-col gap-7 lg:order-none lg:col-start-1">
          {go.imageUri ? (
            <div className="overflow-hidden rounded-[var(--r-card)] border border-line bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={go.imageUri} alt="" className="aspect-[16/9] w-full object-cover" />
            </div>
          ) : null}

          <Card className="p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="tnum font-display text-3xl font-semibold text-ink">
                {formatUnits(go.unitPrice, decimals)} <span className="text-base font-medium text-ink-3"><T k="go.perUnit" /></span>
                <Brl amount={go.unitPrice} decimals={decimals} className="ml-3 text-sm font-normal text-ink-3" />
              </p>
              <OrderTiming go={go} now={now} />
            </div>
            <div className="mt-5">
              <GoProgress go={go} />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
              <Mini label="go.inEscrow" value={`${formatUnits(go.totalPaid, decimals)} USDC`} extra={<Brl amount={go.totalPaid} decimals={decimals} className="block text-xs font-normal text-ink-3" />} />
              <Mini label="go.buyers" value={String(go.participants)} />
              <Mini label="go.advance" value={`${go.advanceBps / 100}%`} />
              <Mini label="go.arbiter" value={shortAddress(go.arbiter)} mono />
            </dl>
          </Card>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink"><T k="go.whereTitle" /></h2>
            <div className="mt-5">
              <GoTimeline go={go} />
            </div>
            {go.shipmentRef ? (
              <p className="mt-4 rounded-lg bg-surface-2 px-4 py-3 text-[14px] text-ink-2">
                <T k="go.tracking" /> <span className="font-mono text-ink">{go.shipmentRef}</span>
              </p>
            ) : null}
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink"><T k="go.protectionTitle" /></h2>
            <div className="mt-5">
              <GoTerms go={go} decimals={decimals} />
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink"><T k="go.buyersTitle" params={{ n: participations.length }} /></h2>
            <div className="mt-4">
              <Participants list={participations} now={now} decimals={decimals} />
            </div>
          </section>

          <section className="border-t border-line pt-6">
            <h2 className="text-sm font-medium text-ink-3"><T k="go.share" /></h2>
            <div className="mt-3">
              <ShareRow address={go.address} title={go.title} />
            </div>
            <p className="mt-4 break-all text-[13px] text-ink-3">
              <T k="go.account" />{" "}
              <a href={explorerUrl("address", go.address)} target="_blank" rel="noreferrer" className="font-mono underline-offset-2 hover:underline">
                {go.address}
              </a>
            </p>
          </section>
        </div>

        {/* Actions: right after the header on phones, sticky right column on desktop */}
        <aside className="order-2 flex flex-col gap-4 lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24 lg:self-start">
          <ActionPanel address={go.address} initial={go} decimals={decimals} />
          <OrganizerCard organizer={go.organizer} stats={stats} decimals={decimals} />
        </aside>
      </div>
    </div>
  );
}

function Mini({ label, value, mono, extra }: { label: MessageKey; value: string; mono?: boolean; extra?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-3"><T k={label} /></dt>
      <dd className={mono ? "font-mono text-[15px] text-ink" : "tnum text-[15px] font-medium text-ink"}>{value}{extra}</dd>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Skeleton className="h-4 w-32" />
      <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="aspect-[16/9] w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
