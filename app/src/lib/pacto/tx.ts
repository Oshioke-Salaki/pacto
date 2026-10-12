"use client";
import {
  TransactionMessage,
  VersionedTransaction,
  type Connection,
  type PublicKey,
  type TransactionInstruction,
} from "@solana/web3.js";

export interface Sender {
  publicKey: PublicKey | null;
  sendTransaction: (
    tx: VersionedTransaction,
    connection: Connection,
    options?: { preflightCommitment?: "processed" | "confirmed"; skipPreflight?: boolean },
  ) => Promise<string>;
}

/** Build a v0 transaction, ask the wallet to sign and send, wait for confirmation. */
export async function sendInstructions(connection: Connection, wallet: Sender, ixs: TransactionInstruction[]) {
  if (!wallet.publicKey) throw new Error("WalletNotConnected");
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const message = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: blockhash,
    instructions: ixs,
  }).compileToV0Message();
  const tx = new VersionedTransaction(message);
  const signature = await wallet.sendTransaction(tx, connection, { preflightCommitment: "confirmed" });
  const res = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  if (res.value.err) throw new Error(`Transaction failed on-chain: ${JSON.stringify(res.value.err)}`);
  return signature;
}
