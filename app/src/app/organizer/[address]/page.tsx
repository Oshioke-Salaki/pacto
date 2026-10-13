import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { GoCard } from "@/components/go/go-card";
import { ShareOrganizer } from "@/components/go/share-organizer";
import { Card, EmptyState, Skeleton, Stat } from "@/components/ui/card";
import { fetchMintDecimals, fetchOrganizerOrders, organizerStats } from "@/lib/pacto/reads";
import { formatUnits, shortAddress, unixNow } from "@/lib/pacto/format";
import { explorerUrl } from "@/lib/solana/cluster";

type Params = { params: Promise<{ address: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { address } = await params;
  return {
    title: `Organizer ${shortAddress(address)}`,
    description: "Group order track record, read directly from Solana. Money stays in escrow until it arrives.",
  };
}

export default function OrganizerPage({ params }: Params) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="mt-6 h-32 w-full" />
        </div>
      }
    >
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Params) {
  const { address } = await params;
  try {
    new PublicKey(address);
  } catch {
    notFound();
  }
  const orders = await fetchOrganizerOrders(address);
  const stats = organizerStats(orders);
  const decimals = orders.length ? await fetchMintDecimals(orders[0].mint) : 6;
  const now = unixNow();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <p className="text-[13px] text-ink-3">Organizer</p>
      <h1 className="font-display mt-1 break-all font-mono text-2xl font-semibold text-ink sm:text-3xl">{address}</h1>
      <a href={explorerUrl("address", address)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[13px] text-ink-2 underline-offset-2 hover:underline">
        View on Solana Explorer
      </a>
      <ShareOrganizer address={address} completed={stats.completed} />

      <Card className="mt-6 grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Completed orders" value={stats.completed} />
        <Stat label="Active" value={stats.active} />
        <Stat label="Volume settled" value={`${formatUnits(stats.volumeSettled, decimals, 0)} USDC`} />
        <Stat label="Disputes opened" value={stats.disputesOpened} />
        <Stat label="Disputes lost" value={stats.disputesLost} sub={stats.disputesLost === 0 && stats.completed > 0 ? "Clean record" : undefined} />
      </Card>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Orders</h2>
        {orders.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No orders yet" body="This wallet has not organized a group order on Pacto." />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((o) => (
              <GoCard key={o.address} go={o} now={now} decimals={decimals} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
