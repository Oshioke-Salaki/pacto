import { NextResponse, type NextRequest } from "next/server";
import { PublicKey } from "@solana/web3.js";
import {
  fetchAllGroupOrders,
  fetchBuyerParticipations,
  fetchGroupOrdersByAddresses,
  fetchOrganizerOrders,
} from "@/lib/pacto/reads";

/**
 * GET /api/go                 -> all orders (cached)
 * GET /api/go?organizer=PK    -> orders created by PK
 * GET /api/go?buyer=PK        -> orders PK has joined, with their participation
 */
export async function GET(req: NextRequest) {
  const organizer = req.nextUrl.searchParams.get("organizer");
  const buyer = req.nextUrl.searchParams.get("buyer");
  try {
    if (organizer) new PublicKey(organizer);
    if (buyer) new PublicKey(buyer);
  } catch {
    return NextResponse.json({ error: "Invalid public key" }, { status: 400 });
  }
  const now = Math.floor(Date.now() / 1000);
  if (organizer) {
    const orders = await fetchOrganizerOrders(organizer);
    return NextResponse.json({ orders, now }, { headers: { "Cache-Control": "no-store" } });
  }
  if (buyer) {
    const participations = await fetchBuyerParticipations(buyer);
    const orders = await fetchGroupOrdersByAddresses(participations.map((p) => p.groupOrder));
    return NextResponse.json({ orders, participations, now }, { headers: { "Cache-Control": "no-store" } });
  }
  const orders = await fetchAllGroupOrders();
  return NextResponse.json({ orders, now });
}
