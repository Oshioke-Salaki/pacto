import { PublicKey, clusterApiUrl } from "@solana/web3.js";
import idl from "@/lib/pacto/idl.json";

export type Cluster = "devnet" | "mainnet-beta";

export const CLUSTER: Cluster =
  process.env.NEXT_PUBLIC_SOLANA_CLUSTER === "mainnet-beta" ? "mainnet-beta" : "devnet";

/** Circle's canonical USDC mints. */
export const CIRCLE_USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const CIRCLE_USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PACTO_PROGRAM_ID ?? idl.address);

export const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT ||
    (CLUSTER === "devnet" ? CIRCLE_USDC_DEVNET : CIRCLE_USDC_MAINNET),
);

export const PUBLIC_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(CLUSTER);

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** CAIP-2 identifiers used by the Solana Actions spec. */
export const BLOCKCHAIN_ID =
  CLUSTER === "devnet"
    ? "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"
    : "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

export function explorerUrl(kind: "tx" | "address", id: string) {
  const suffix = CLUSTER === "devnet" ? "?cluster=devnet" : "";
  return `https://explorer.solana.com/${kind}/${id}${suffix}`;
}

export const IS_DEVNET = CLUSTER === "devnet";
