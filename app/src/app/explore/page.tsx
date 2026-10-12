import { Suspense } from "react";
import type { Metadata } from "next";
import { unixNow } from "@/lib/pacto/format";
import { GoCard } from "@/components/go/go-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/card";
import { fetchAllGroupOrders, fetchMintDecimals } from "@/lib/pacto/reads";
import type { GroupOrderView } from "@/lib/pacto/state";

export const metadata: Metadata = { title: "Explore group orders" };

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Open group orders</h1>
          <p className="mt-2 max-w-lg text-[16px] text-ink-2">Every order below holds buyer money in escrow. Join with USDC, leave before the deadline for a full refund.</p>
        </div>
        <ButtonLink href="/create" variant="secondary">
          Start a group order
        </ButtonLink>
      </div>
      <Suspense fallback={<GridSkeleton />}>
        <Orders />
      </Suspense>
    </div>
  );
}

async function Orders() {
  const orders = await fetchAllGroupOrders();
  const now = unixNow();
  const decimals = orders.length ? await fetchMintDecimals(orders[0].mint) : 6;
  const open = orders.filter((o) => o.status === "open" && now < o.joinDeadline);
  const rest = orders.filter((o) => !(o.status === "open" && now < o.joinDeadline));

  if (orders.length === 0) {
    return (
      <div className="mt-10">
        <EmptyState
          title="No orders yet"
          body="Be the first organizer. Create an order, share the link, and watch the vault fill."
          action={<ButtonLink href="/create">Start a group order</ButtonLink>}
        />
      </div>
    );
  }
  return (
    <>
      <Grid title="Accepting buyers" orders={open} now={now} decimals={decimals} empty="Nothing open right now. Check back soon or start your own." />
      {rest.length ? <Grid title="Ordering, shipped and finished" orders={rest} now={now} decimals={decimals} /> : null}
    </>
  );
}

function Grid({ title, orders, now, decimals, empty }: { title: string; orders: GroupOrderView[]; now: number; decimals: number; empty?: string }) {
  return (
    <section className="mt-10">
      <h2 className="text-sm font-medium text-ink-3">{title}</h2>
      {orders.length === 0 ? (
        <p className="mt-3 text-[15px] text-ink-2">{empty}</p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((o) => (
            <GoCard key={o.address} go={o} now={now} decimals={decimals} />
          ))}
        </div>
      )}
    </section>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[var(--r-card)] border border-line bg-surface">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="flex flex-col gap-3 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-1.5 w-full" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
