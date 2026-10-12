import { AnchorProvider, Program } from "@anchor-lang/core";
import { Connection, Keypair, PublicKey, type Transaction, type VersionedTransaction } from "@solana/web3.js";
import idlJson from "./idl.json";
import type { Pacto } from "./types";
import { PROGRAM_ID } from "@/lib/solana/cluster";

export interface AnchorWalletLike {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
}

/** A wallet that can build instructions but never signs. Used server-side and for reads. */
function readonlyWallet(publicKey?: PublicKey): AnchorWalletLike {
  const pk = publicKey ?? Keypair.generate().publicKey;
  return {
    publicKey: pk,
    signTransaction: async () => {
      throw new Error("Read-only wallet cannot sign");
    },
    signAllTransactions: async () => {
      throw new Error("Read-only wallet cannot sign");
    },
  };
}

const idl = { ...(idlJson as Pacto), address: PROGRAM_ID.toBase58() } as Pacto;

export function getProgram(connection: Connection, wallet?: AnchorWalletLike | null, payer?: PublicKey): Program<Pacto> {
  const provider = new AnchorProvider(connection, wallet ?? readonlyWallet(payer), {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  return new Program<Pacto>(idl, provider);
}

export type PactoProgram = Program<Pacto>;
