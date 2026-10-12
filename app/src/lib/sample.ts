import type { GroupOrderView } from "@/lib/pacto/state";

/** Illustrative order used on the landing page. Clearly sample data. */
export function sampleGroupOrder(now: number): GroupOrderView {
  return {
    address: "sample",
    organizer: "7Yk2mNXqLqz1gZc8hXfR9pT4vWJ3bQe5UaHdK6sPLR2M",
    goId: "1",
    mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    vault: "",
    arbiter: "",
    title: "ARMY Bomb Ver. 4 group order, Sao Paulo",
    description: "Bulk order from Seoul with split shipping to SP, RJ and BH.",
    detailsUri: "",
    imageUri: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=960&q=80",
    unitPrice: "72000000",
    minQty: 40,
    maxQty: 120,
    feeBps: 150,
    advanceBps: 3000,
    joinDeadline: now + 5 * 86400 + 3600 * 7,
    shipBySecs: 30 * 86400,
    deliveryWindowSecs: 14 * 86400,
    status: "open",
    totalQty: 87,
    totalPaid: "6264000000",
    participants: 61,
    settled: 0,
    advancePaid: "0",
    disputesOpened: 0,
    disputesLost: 0,
    createdAt: now - 3 * 86400,
    lockedAt: 0,
    shippedAt: 0,
    shipmentRef: "",
  };
}
