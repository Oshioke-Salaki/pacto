import { NextResponse, type NextRequest } from "next/server";
import { PublicKey } from "@solana/web3.js";
import {
  fetchConfig,
  fetchGroupOrder,
  fetchMintDecimals,
  fetchParticipations,
} from "@/lib/pacto/reads";

export async function GET(req: NextRequest, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;
  const viewer = req.nextUrl.searchParams.get("viewer");
  if (viewer) {
    try {
      new PublicKey(viewer);
    } catch {
      return NextResponse.json({ error: "Invalid viewer" }, { status: 400 });
    }
  }
  const go = await fetchGroupOrder(address);
  if (!go) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [participations, config, decimals] = await Promise.all([
    fetchParticipations(address),
    fetchConfig(),
    fetchMintDecimals(go.mint),
  ]);
  const participation = viewer ? participations.find((p) => p.buyer === viewer) ?? null : null;
  return NextResponse.json(
    { go, participation, participations, config, decimals, now: Math.floor(Date.now() / 1000) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
