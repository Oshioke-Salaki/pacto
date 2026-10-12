import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { PublicKey } from "@solana/web3.js";
import { getServerConnection } from "@/lib/solana/connection";
import { getProgram } from "./program";
import { configPda } from "./pda";
import {
  toConfigView,
  toGroupOrderView,
  toParticipationView,
  type ConfigView,
  type GroupOrderView,
  type ParticipationView,
} from "./state";

function program() {
  return getProgram(getServerConnection());
}

const DISCRIMINATOR = 8;
const PUBKEY = 32;

export async function fetchAllGroupOrders(): Promise<GroupOrderView[]> {
  "use cache";
  cacheLife({ stale: 10, revalidate: 15, expire: 120 });
  cacheTag("group-orders");
  const all = await program().account.groupOrder.all();
  return all
    .map((a) => toGroupOrderView(a.publicKey.toBase58(), a.account))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function fetchGroupOrder(address: string): Promise<GroupOrderView | null> {
  let pk: PublicKey;
  try {
    pk = new PublicKey(address);
  } catch {
    return null;
  }
  try {
    const acc = await program().account.groupOrder.fetchNullable(pk, "confirmed");
    return acc ? toGroupOrderView(address, acc) : null;
  } catch {
    // Account exists but is not a GroupOrder (wrong discriminator) or RPC hiccup.
    return null;
  }
}

export async function fetchParticipations(groupOrder: string): Promise<ParticipationView[]> {
  const all = await program().account.participation.all([
    { memcmp: { offset: DISCRIMINATOR, bytes: groupOrder } },
  ]);
  return all
    .map((a) => toParticipationView(a.publicKey.toBase58(), a.account))
    .sort((a, b) => a.joinedAt - b.joinedAt);
}

export async function fetchBuyerParticipations(buyer: string): Promise<ParticipationView[]> {
  const all = await program().account.participation.all([
    { memcmp: { offset: DISCRIMINATOR + PUBKEY, bytes: buyer } },
  ]);
  return all.map((a) => toParticipationView(a.publicKey.toBase58(), a.account));
}

export async function fetchOrganizerOrders(organizer: string): Promise<GroupOrderView[]> {
  const all = await program().account.groupOrder.all([{ memcmp: { offset: DISCRIMINATOR, bytes: organizer } }]);
  return all
    .map((a) => toGroupOrderView(a.publicKey.toBase58(), a.account))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function fetchGroupOrdersByAddresses(addresses: string[]): Promise<GroupOrderView[]> {
  if (addresses.length === 0) return [];
  const pks = addresses.map((a) => new PublicKey(a));
  const accs = await program().account.groupOrder.fetchMultiple(pks, "confirmed");
  const out: GroupOrderView[] = [];
  accs.forEach((acc, i) => {
    if (acc) out.push(toGroupOrderView(addresses[i], acc));
  });
  return out;
}

export async function fetchConfig(): Promise<ConfigView | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  cacheTag("config");
  const acc = await program().account.config.fetchNullable(configPda(), "confirmed");
  return acc ? toConfigView(acc) : null;
}

export interface OrganizerStats {
  total: number;
  completed: number;
  active: number;
  cancelled: number;
  expired: number;
  disputesOpened: number;
  disputesLost: number;
  volumeSettled: string;
}

export function organizerStats(orders: GroupOrderView[]): OrganizerStats {
  let volume = 0n;
  const s: OrganizerStats = {
    total: orders.length,
    completed: 0,
    active: 0,
    cancelled: 0,
    expired: 0,
    disputesOpened: 0,
    disputesLost: 0,
    volumeSettled: "0",
  };
  for (const o of orders) {
    s.disputesOpened += o.disputesOpened;
    s.disputesLost += o.disputesLost;
    if (o.status === "completed") {
      s.completed += 1;
      volume += BigInt(o.totalPaid);
    } else if (o.status === "cancelled") s.cancelled += 1;
    else if (o.status === "expired") s.expired += 1;
    else s.active += 1;
  }
  s.volumeSettled = volume.toString();
  return s;
}

export async function fetchMintDecimals(mint: string): Promise<number> {
  "use cache";
  cacheLife("max");
  cacheTag(`mint:${mint}`);
  const info = await getServerConnection().getAccountInfo(new PublicKey(mint), "confirmed");
  if (!info) return 6;
  return info.data[44];
}
