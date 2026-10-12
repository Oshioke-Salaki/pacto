import { type NextRequest } from "next/server";
import { PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import {
  ACTIONS_CORS_HEADERS,
  type ActionGetResponse,
  type ActionPostRequest,
  type ActionPostResponse,
} from "@solana/actions";
import { fetchConfig, fetchGroupOrder, fetchMintDecimals } from "@/lib/pacto/reads";
import { getServerConnection } from "@/lib/solana/connection";
import { PactoClient } from "@/lib/pacto/instructions";
import { formatUnits, relativeTime } from "@/lib/pacto/format";
import { BLOCKCHAIN_ID, SITE_URL } from "@/lib/solana/cluster";

const headers = {
  ...ACTIONS_CORS_HEADERS,
  "X-Action-Version": "2.4",
  "X-Blockchain-Ids": BLOCKCHAIN_ID,
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

export async function OPTIONS() {
  return new Response(null, { headers });
}

/** Blink metadata: renders as a card with a "Join" button wherever Blinks unfurl. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;
  const go = await fetchGroupOrder(address);
  if (!go) return json({ message: "Group order not found" }, 404);
  const decimals = await fetchMintDecimals(go.mint);
  const now = Math.floor(Date.now() / 1000);
  const price = formatUnits(go.unitPrice, decimals);
  const remaining = go.maxQty - go.totalQty;
  const open = go.status === "open" && now < go.joinDeadline && remaining > 0;

  const body: ActionGetResponse = {
    type: "action",
    icon: go.imageUri || `${SITE_URL}/brand/og-default.svg`,
    title: go.title,
    description: `${go.description}\n\n${price} USDC per unit. ${go.totalQty}/${go.maxQty} units filled, minimum ${go.minQty}. ${
      open ? `Closes ${relativeTime(go.joinDeadline, now)}.` : "Joins are closed."
    } Funds stay in escrow until you confirm delivery; organizer advance is ${go.advanceBps / 100}%.`,
    label: open ? `Join for ${price} USDC` : "Closed",
    disabled: !open,
    links: open
      ? {
          actions: [
            { type: "transaction", label: `Join 1 unit (${price} USDC)`, href: `/api/actions/go/${address}?qty=1` },
            {
              type: "transaction",
              label: "Join",
              href: `/api/actions/go/${address}?qty={qty}`,
              parameters: [
                {
                  name: "qty",
                  label: `Units (max ${Math.min(remaining, 50)})`,
                  type: "number",
                  required: true,
                  min: 1,
                  max: Math.min(remaining, 50),
                },
              ],
            },
          ],
        }
      : undefined,
  };
  return json(body);
}

/** Builds the unsigned `join` transaction for the wallet that called. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;
  let account: PublicKey;
  try {
    const body = (await req.json()) as ActionPostRequest;
    account = new PublicKey(body.account);
  } catch {
    return json({ message: "Invalid account" }, 400);
  }
  const qty = Number(req.nextUrl.searchParams.get("qty") ?? "1");
  if (!Number.isInteger(qty) || qty < 1 || qty > 10_000) return json({ message: "Invalid quantity" }, 400);

  const go = await fetchGroupOrder(address);
  if (!go) return json({ message: "Group order not found" }, 404);
  const now = Math.floor(Date.now() / 1000);
  if (go.status !== "open" || now >= go.joinDeadline) return json({ message: "This order is no longer accepting joins" }, 400);
  if (go.totalQty + qty > go.maxQty) return json({ message: `Only ${go.maxQty - go.totalQty} units left` }, 400);
  const config = await fetchConfig();
  if (config?.paused) return json({ message: "Pacto is paused" }, 503);

  const connection = getServerConnection();
  const client = new PactoClient(connection, account);
  const ix = await client.join(
    {
      address: new PublicKey(go.address),
      organizer: new PublicKey(go.organizer),
      mint: new PublicKey(go.mint),
      arbiter: new PublicKey(go.arbiter),
    },
    account,
    qty,
  );
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const message = new TransactionMessage({ payerKey: account, recentBlockhash: blockhash, instructions: [ix] }).compileToV0Message();
  const tx = new VersionedTransaction(message);
  const decimals = await fetchMintDecimals(go.mint);
  const total = BigInt(go.unitPrice) * BigInt(qty);

  const body: ActionPostResponse = {
    type: "transaction",
    transaction: Buffer.from(tx.serialize()).toString("base64"),
    message: `Joining "${go.title}" for ${qty} unit${qty === 1 ? "" : "s"} (${formatUnits(total, decimals)} USDC into escrow).`,
  };
  return json(body);
}
