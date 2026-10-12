import { NextResponse, type NextRequest } from "next/server";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createAssociatedTokenAccountIdempotentInstruction, createMintToInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { getServerConnection } from "@/lib/solana/connection";
import { IS_DEVNET, USDC_MINT } from "@/lib/solana/cluster";

const AMOUNT = 100n * 1_000_000n; // 100 test USDC
const COOLDOWN_MS = 10 * 60 * 1000;
const lastDrip = new Map<string, number>();

function authority(): Keypair | null {
  const raw = process.env.FAUCET_AUTHORITY_SECRET;
  if (!raw) return null;
  try {
    const arr = raw.trim().startsWith("[") ? (JSON.parse(raw) as number[]) : null;
    if (arr) return Keypair.fromSecretKey(Uint8Array.from(arr));
    // base58
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bs58 = require("bs58") as { decode: (s: string) => Uint8Array };
    return Keypair.fromSecretKey(bs58.decode(raw.trim()));
  } catch {
    return null;
  }
}

/** Devnet only: mints test USDC to the caller so judges and testers can try the flow. */
export async function POST(req: NextRequest) {
  if (!IS_DEVNET) return NextResponse.json({ error: "Faucet is devnet only" }, { status: 404 });
  const auth = authority();
  if (!auth) return NextResponse.json({ error: "Faucet not configured" }, { status: 503 });

  let address: PublicKey;
  try {
    const body = (await req.json()) as { address?: string };
    address = new PublicKey(body.address ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }
  const key = address.toBase58();
  const last = lastDrip.get(key) ?? 0;
  if (Date.now() - last < COOLDOWN_MS) {
    return NextResponse.json({ error: "Try again in a few minutes" }, { status: 429 });
  }

  const connection = getServerConnection();
  const ata = getAssociatedTokenAddressSync(USDC_MINT, address, true);
  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(auth.publicKey, ata, address, USDC_MINT),
    createMintToInstruction(USDC_MINT, ata, auth.publicKey, AMOUNT),
  );
  try {
    const signature = await sendAndConfirmTransaction(connection, tx, [auth], { commitment: "confirmed" });
    lastDrip.set(key, Date.now());
    return NextResponse.json({ signature, amount: AMOUNT.toString() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Mint failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
