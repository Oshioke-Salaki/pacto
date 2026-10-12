import { Suspense } from "react";
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
import {
  fetchGroupOrder,
  fetchMintDecimals,
  fetchOrganizerOrders,
  fetchParticipations,
  organizerStats,
} from "@/lib/pacto/reads";
import { formatDateTime, formatUnits, relativeTime, shortAddress, unixNow } from "@/lib/pacto/format";
import { STATUS_DESCRIPTION, deliverBy, shipBy } from "@/lib/pacto/state";
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

  const timing =
    go.status === "open"
      ? now < go.joinDeadline
        ? `Joins close ${relativeTime(go.joinDeadline, now)} (${formatDateTime(go.joinDeadline)})`
        : "Join window closed. Waiting for the organizer to lock."
      : go.status === "locked"
        ? `Ship by ${formatDateTime(shipBy(go))}`
        : go.status === "shipped"
          ? `Confirm or dispute by ${formatDateTime(deliverBy(go))}`
          : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <nav className="text-[13px] text-ink-3" aria-label="Breadcrumb">
        <Link href="/explore" className="hover:text-ink">Explore</Link> <span aria-hidden>/</span> {shortAddress(go.address)}
      </nav>

      <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
        {/* Left: story */}
        <div className="flex flex-col gap-7">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusChip status={go.status} />
              <span className="text-[13px] text-ink-2">{STATUS_DESCRIPTION[go.status]}</span>
            </div>
            <h1 className="font-display mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl">{go.title}</h1>
            <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-ink-2">{go.description}</p>
            {go.detailsUri ? (
              <a href={go.detailsUri} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-medium text-ink underline-offset-4 hover:underline">
                Full details on the organizer&apos;s post <ArrowSquareOut size={16} />
              </a>
            ) : null}
          </div>

          {go.imageUri ? (
            <div className="overflow-hidden rounded-[var(--r-card)] border border-line bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={go.imageUri} alt="" className="aspect-[16/9] w-full object-cover" />
            </div>
          ) : null}

          <Card className="p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="tnum font-display text-3xl font-semibold text-ink">
                {formatUnits(go.unitPrice, decimals)} <span className="text-base font-medium text-ink-3">USDC per unit</span>
              </p>
              {timing ? <p className="text-[13px] text-ink-2">{timing}</p> : null}
            </div>
            <div className="mt-5">
              <GoProgress go={go} />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
              <Mini label="In escrow" value={`${formatUnits(go.totalPaid, decimals)} USDC`} />
              <Mini label="Buyers" value={String(go.participants)} />
              <Mini label="Advance to organizer" value={`${go.advanceBps / 100}%`} />
              <Mini label="Arbiter" value={shortAddress(go.arbiter)} mono />
            </dl>
          </Card>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Where this order is</h2>
            <div className="mt-5">
              <GoTimeline go={go} />
            </div>
            {go.shipmentRef ? (
              <p className="mt-4 rounded-lg bg-surface-2 px-4 py-3 text-[14px] text-ink-2">
                Tracking: <span className="font-mono text-ink">{go.shipmentRef}</span>
              </p>
            ) : null}
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Buyer protection on this order</h2>
            <div className="mt-5">
              <GoTerms go={go} decimals={decimals} />
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Buyers ({participations.length})</h2>
            <div className="mt-4">
              <Participants list={participations} now={now} decimals={decimals} />
            </div>
          </section>

          <section className="border-t border-line pt-6">
            <h2 className="text-sm font-medium text-ink-3">Share</h2>
            <div className="mt-3">
              <ShareRow address={go.address} title={go.title} />
            </div>
            <p className="mt-4 break-all text-[13px] text-ink-3">
              Order account{" "}
              <a href={explorerUrl("address", go.address)} target="_blank" rel="noreferrer" className="font-mono underline-offset-2 hover:underline">
                {go.address}
              </a>
            </p>
          </section>
        </div>

        {/* Right: actions */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <ActionPanel address={go.address} initial={go} decimals={decimals} />
          <OrganizerCard organizer={go.organizer} stats={stats} decimals={decimals} />
        </aside>
      </div>
    </div>
  );
}

function Mini({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className={mono ? "font-mono text-[15px] text-ink" : "tnum text-[15px] font-medium text-ink"}>{value}</dd>
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
