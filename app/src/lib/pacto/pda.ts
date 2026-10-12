import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PROGRAM_ID } from "@/lib/solana/cluster";

const enc = new TextEncoder();
export const CONFIG_SEED = enc.encode("config");
export const GROUP_ORDER_SEED = enc.encode("group_order");
export const PARTICIPATION_SEED = enc.encode("participation");

export function u64le(value: bigint | number | string): Uint8Array {
  const v = BigInt(value);
  const out = new Uint8Array(8);
  new DataView(out.buffer).setBigUint64(0, v, true);
  return out;
}

export function configPda(): PublicKey {
  return PublicKey.findProgramAddressSync([CONFIG_SEED], PROGRAM_ID)[0];
}

export function groupOrderPda(organizer: PublicKey, goId: bigint | number | string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [GROUP_ORDER_SEED, organizer.toBytes(), u64le(goId)],
    PROGRAM_ID,
  )[0];
}

export function participationPda(groupOrder: PublicKey, buyer: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [PARTICIPATION_SEED, groupOrder.toBytes(), buyer.toBytes()],
    PROGRAM_ID,
  )[0];
}

export function ata(mint: PublicKey, owner: PublicKey, tokenProgram: PublicKey = TOKEN_PROGRAM_ID): PublicKey {
  return getAssociatedTokenAddressSync(mint, owner, true, tokenProgram);
}
