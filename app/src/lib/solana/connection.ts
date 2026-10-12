import "server-only";
import { Connection } from "@solana/web3.js";
import { PUBLIC_RPC_URL } from "./cluster";

let cached: Connection | null = null;

/** Server-side connection. Uses the private RPC when configured. */
export function getServerConnection(): Connection {
  if (!cached) {
    cached = new Connection(process.env.SOLANA_RPC_URL || PUBLIC_RPC_URL, {
      commitment: "confirmed",
    });
  }
  return cached;
}
