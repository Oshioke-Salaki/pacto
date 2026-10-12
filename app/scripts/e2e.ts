/**
 * End-to-end check of the web client layer against a live cluster.
 * Drives the same PactoClient builders the UI uses, plus the Blink API and
 * faucet when SITE_URL points at a running app.
 *
 * Env: SOLANA_RPC_URL (default devnet), USDC_MINT (required), SITE_URL (optional)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  VersionedTransaction,
  sendAndConfirmTransaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PactoClient, type GoRef } from "../src/lib/pacto/instructions";
import { sendInstructions } from "../src/lib/pacto/tx";
import { getProgram } from "../src/lib/pacto/program";
import { configPda } from "../src/lib/pacto/pda";
import { toGroupOrderView, toParticipationView, allowedActions } from "../src/lib/pacto/state";
import { participationPda } from "../src/lib/pacto/pda";

const RPC = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const MINT = new PublicKey(process.env.USDC_MINT || process.env.NEXT_PUBLIC_USDC_MINT || "");
const SITE_URL = process.env.SITE_URL;

function keypairSender(kp: Keypair) {
  return {
    publicKey: kp.publicKey,
    sendTransaction: async (tx: VersionedTransaction, connection: Connection) => {
      tx.sign([kp]);
      return connection.sendTransaction(tx, { preflightCommitment: "confirmed" });
    },
  };
}

async function main() {
  const connection = new Connection(RPC, "confirmed");
  const deployer = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(path.join(os.homedir(), ".config/solana/id.json"), "utf8"))),
  );
  const organizer = deployer;
  const buyer = Keypair.generate();
  const program = getProgram(connection);
  const config = await program.account.config.fetch(configPda());
  const treasury = config.treasury;
  console.log("RPC", RPC);
  console.log("Organizer", organizer.publicKey.toBase58());
  console.log("Buyer", buyer.publicKey.toBase58());

  // Fund buyer with SOL and 500 test USDC (deployer is the mint authority).
  const sig = await connection.requestAirdrop(buyer.publicKey, 2 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(sig, "confirmed");
  const buyerAta = getAssociatedTokenAddressSync(MINT, buyer.publicKey);
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(deployer.publicKey, buyerAta, buyer.publicKey, MINT),
      createMintToInstruction(MINT, buyerAta, deployer.publicKey, 500_000_000n),
    ),
    [deployer],
  );

  const orgClient = new PactoClient(connection, organizer.publicKey);
  const buyerClient = new PactoClient(connection, buyer.publicKey);
  const now = Math.floor(Date.now() / 1000);

  const send = (kp: Keypair, ixs: TransactionInstruction | TransactionInstruction[]) =>
    sendInstructions(connection, keypairSender(kp), Array.isArray(ixs) ? ixs : [ixs]);

  const view = async (addr: PublicKey) => toGroupOrderView(addr.toBase58(), await program.account.groupOrder.fetch(addr));
  const part = async (go: PublicKey, b: PublicKey) => {
    const acc = await program.account.participation.fetchNullable(participationPda(go, b));
    return acc ? toParticipationView(participationPda(go, b).toBase58(), acc) : null;
  };

  /* ---------- Order 1: happy path ---------- */
  const { ix: createIx, groupOrder } = await orgClient.createGroupOrder(organizer.publicKey, MINT, {
    goId: BigInt(Date.now()),
    title: "E2E light stick order",
    description: "Automated end-to-end order. Bulk from Seoul, split shipping.",
    detailsUri: "https://x.com/pacto/status/1",
    imageUri: "",
    unitPrice: 40_000_000n,
    minQty: 1,
    maxQty: 10,
    advanceBps: 3000,
    joinDeadline: now + 7 * 86400,
    shipBySecs: 30 * 86400,
    deliveryWindowSecs: 14 * 86400,
    arbiter: null,
  });
  await send(organizer, createIx);
  let go = await view(groupOrder);
  assert.equal(go.status, "open");
  console.log("created", groupOrder.toBase58());

  const ref: GoRef = { address: groupOrder, organizer: organizer.publicKey, mint: MINT, arbiter: new PublicKey(go.arbiter) };

  // Buyer joins 2 units via the UI builder.
  await send(buyer, await buyerClient.join(ref, buyer.publicKey, 2));
  go = await view(groupOrder);
  assert.equal(go.totalQty, 2);
  const p = await part(groupOrder, buyer.publicKey);
  assert.equal(p?.paid, "80000000");
  console.log("joined 2 units");

  // Action rules: buyer sees leave, organizer sees lock + cancel.
  const buyerActions = allowedActions(go, { pubkey: buyer.publicKey.toBase58(), participation: p }, now).map((a) => a.id);
  assert.deepEqual(buyerActions, ["join", "leave"]);
  const orgActions = allowedActions(go, { pubkey: organizer.publicKey.toBase58(), participation: null }, now).map((a) => a.id);
  assert.deepEqual(orgActions, ["join", "lock", "cancel"]);

  // Blink: GET metadata, POST a join tx for the buyer, sign and send it.
  if (SITE_URL) {
    const url = `${SITE_URL}/api/actions/go/${groupOrder.toBase58()}`;
    const meta = await fetch(url).then((r) => r.json());
    assert.equal(meta.title, "E2E light stick order");
    assert.ok(meta.links.actions.length >= 1);
    const res = await fetch(`${url}?qty=1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account: buyer.publicKey.toBase58() }),
    });
    const body = (await res.json()) as { transaction: string; type: string };
    assert.equal(body.type, "transaction");
    const tx = VersionedTransaction.deserialize(Buffer.from(body.transaction, "base64"));
    tx.sign([buyer]);
    const s = await connection.sendTransaction(tx);
    await connection.confirmTransaction(s, "confirmed");
    go = await view(groupOrder);
    assert.equal(go.totalQty, 3);
    console.log("blink join ok", s);

    // Faucet
    const f = await fetch(`${SITE_URL}/api/faucet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: Keypair.generate().publicKey.toBase58() }),
    });
    assert.equal(f.status, 200, "faucet should mint");
    console.log("faucet ok");

    // API reads
    const api = await fetch(`${SITE_URL}/api/go/${groupOrder.toBase58()}?viewer=${buyer.publicKey.toBase58()}`).then((r) => r.json());
    assert.equal(api.go.address, groupOrder.toBase58());
    assert.equal(api.participation.buyer, buyer.publicKey.toBase58());
    console.log("api read ok");
  }

  // Lock, ship, confirm.
  const orgAtaBefore = await connection.getTokenAccountBalance(getAssociatedTokenAddressSync(MINT, organizer.publicKey)).then((b) => BigInt(b.value.amount)).catch(() => 0n);
  await send(organizer, await orgClient.lock(ref, treasury));
  go = await view(groupOrder);
  assert.equal(go.status, "locked");
  const orgAtaAfter = BigInt((await connection.getTokenAccountBalance(getAssociatedTokenAddressSync(MINT, organizer.publicKey))).value.amount);
  assert.ok(orgAtaAfter > orgAtaBefore, "organizer received advance");
  console.log("locked, advance", (orgAtaAfter - orgAtaBefore).toString());

  await send(organizer, await orgClient.markShipped(ref, "BR987654321"));
  go = await view(groupOrder);
  assert.equal(go.status, "shipped");

  await send(buyer, await buyerClient.confirmReceipt(ref, buyer.publicKey, treasury));
  go = await view(groupOrder);
  assert.equal(go.status, "completed");
  assert.equal(await part(groupOrder, buyer.publicKey), null);
  console.log("confirmed, order completed");

  await send(organizer, await orgClient.closeVault(ref));
  console.log("vault closed");

  /* ---------- Order 2: leave, then cancel and refund ---------- */
  const second = await orgClient.createGroupOrder(organizer.publicKey, MINT, {
    goId: BigInt(Date.now() + 1),
    title: "E2E cancel path",
    description: "Will be cancelled.",
    detailsUri: "",
    imageUri: "",
    unitPrice: 10_000_000n,
    minQty: 5,
    maxQty: 10,
    advanceBps: 5000,
    joinDeadline: now + 86400,
    shipBySecs: 86400,
    deliveryWindowSecs: 86400,
    arbiter: null,
  });
  await send(organizer, second.ix);
  const ref2: GoRef = { ...ref, address: second.groupOrder };
  await send(buyer, await buyerClient.join(ref2, buyer.publicKey, 1));
  await send(buyer, await buyerClient.leave(ref2, buyer.publicKey));
  assert.equal((await view(second.groupOrder)).participants, 0);
  await send(buyer, await buyerClient.join(ref2, buyer.publicKey, 2));
  await send(organizer, await orgClient.cancel(ref2, organizer.publicKey));
  assert.equal((await view(second.groupOrder)).status, "cancelled");
  const balBefore = BigInt((await connection.getTokenAccountBalance(buyerAta)).value.amount);
  await send(buyer, await buyerClient.claimRefund(ref2, buyer.publicKey));
  const balAfter = BigInt((await connection.getTokenAccountBalance(buyerAta)).value.amount);
  assert.equal(balAfter - balBefore, 20_000_000n);
  console.log("leave, cancel and refund ok");

  console.log("\nE2E PASSED");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
