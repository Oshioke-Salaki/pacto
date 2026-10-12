/**
 * Instruction builders shared by the web UI and the Blink endpoints.
 * Every builder returns unsigned TransactionInstructions; nothing here signs.
 */
import { BN } from "@anchor-lang/core";
import { PublicKey, SystemProgram, type Connection, type TransactionInstruction } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getProgram, type PactoProgram } from "./program";
import { ata, configPda, groupOrderPda, participationPda } from "./pda";

export interface MintInfo {
  decimals: number;
  programId: PublicKey;
}

/** Reads a mint's decimals and owning token program (SPL Token or Token-2022). */
export async function getMintInfo(connection: Connection, mint: PublicKey): Promise<MintInfo> {
  const info = await connection.getAccountInfo(mint, "confirmed");
  if (!info) throw new Error("Mint not found");
  const programId = info.owner.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  // Mint layout: decimals is the byte at offset 44.
  const decimals = info.data[44];
  return { decimals, programId };
}

export interface GoRef {
  address: PublicKey;
  organizer: PublicKey;
  mint: PublicKey;
  arbiter: PublicKey;
}

export interface CreateGroupOrderParams {
  goId: bigint;
  title: string;
  description: string;
  detailsUri: string;
  imageUri: string;
  unitPrice: bigint;
  minQty: number;
  maxQty: number;
  advanceBps: number;
  joinDeadline: number;
  shipBySecs: number;
  deliveryWindowSecs: number;
  arbiter: PublicKey | null;
}

export class PactoClient {
  readonly program: PactoProgram;

  constructor(readonly connection: Connection, readonly payer: PublicKey) {
    this.program = getProgram(connection, null, payer);
  }

  async createGroupOrder(organizer: PublicKey, mint: PublicKey, p: CreateGroupOrderParams) {
    const { programId } = await getMintInfo(this.connection, mint);
    const groupOrder = groupOrderPda(organizer, p.goId);
    const ix = await this.program.methods
      .createGroupOrder({
        goId: new BN(p.goId.toString()),
        title: p.title,
        description: p.description,
        detailsUri: p.detailsUri,
        imageUri: p.imageUri,
        unitPrice: new BN(p.unitPrice.toString()),
        minQty: p.minQty,
        maxQty: p.maxQty,
        advanceBps: p.advanceBps,
        joinDeadline: new BN(p.joinDeadline),
        shipBySecs: new BN(p.shipBySecs),
        deliveryWindowSecs: new BN(p.deliveryWindowSecs),
        arbiter: p.arbiter,
      })
      .accountsStrict({
        organizer,
        config: configPda(),
        groupOrder,
        mint,
        vault: ata(mint, groupOrder, programId),
        tokenProgram: programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    return { ix, groupOrder };
  }

  async join(go: GoRef, buyer: PublicKey, qty: number): Promise<TransactionInstruction> {
    const { programId } = await getMintInfo(this.connection, go.mint);
    return this.program.methods
      .join(qty)
      .accountsStrict({
        buyer,
        config: configPda(),
        groupOrder: go.address,
        participation: participationPda(go.address, buyer),
        mint: go.mint,
        vault: ata(go.mint, go.address, programId),
        buyerTokenAccount: ata(go.mint, buyer, programId),
        tokenProgram: programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  private async buyerExitAccounts(go: GoRef, buyer: PublicKey) {
    const { programId } = await getMintInfo(this.connection, go.mint);
    return {
      buyer,
      groupOrder: go.address,
      participation: participationPda(go.address, buyer),
      mint: go.mint,
      vault: ata(go.mint, go.address, programId),
      buyerTokenAccount: ata(go.mint, buyer, programId),
      tokenProgram: programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };
  }

  async leave(go: GoRef, buyer: PublicKey) {
    return this.program.methods.leave().accountsStrict(await this.buyerExitAccounts(go, buyer)).instruction();
  }

  async claimRefund(go: GoRef, buyer: PublicKey) {
    return this.program.methods.claimRefund().accountsStrict(await this.buyerExitAccounts(go, buyer)).instruction();
  }

  async lock(go: GoRef, treasury: PublicKey) {
    const { programId } = await getMintInfo(this.connection, go.mint);
    return this.program.methods
      .lock()
      .accountsStrict({
        organizer: go.organizer,
        config: configPda(),
        groupOrder: go.address,
        treasury,
        mint: go.mint,
        vault: ata(go.mint, go.address, programId),
        organizerTokenAccount: ata(go.mint, go.organizer, programId),
        treasuryTokenAccount: ata(go.mint, treasury, programId),
        tokenProgram: programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async cancel(go: GoRef, signer: PublicKey) {
    return this.program.methods.cancel().accountsStrict({ signer, groupOrder: go.address }).instruction();
  }

  async markShipped(go: GoRef, shipmentRef: string) {
    return this.program.methods
      .markShipped(shipmentRef)
      .accountsStrict({ organizer: go.organizer, groupOrder: go.address })
      .instruction();
  }

  private async settleAccounts(go: GoRef, buyer: PublicKey, signer: PublicKey, treasury: PublicKey) {
    const { programId } = await getMintInfo(this.connection, go.mint);
    return {
      signer,
      config: configPda(),
      groupOrder: go.address,
      participation: participationPda(go.address, buyer),
      buyer,
      organizer: go.organizer,
      treasury,
      mint: go.mint,
      vault: ata(go.mint, go.address, programId),
      buyerTokenAccount: ata(go.mint, buyer, programId),
      organizerTokenAccount: ata(go.mint, go.organizer, programId),
      treasuryTokenAccount: ata(go.mint, treasury, programId),
      tokenProgram: programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };
  }

  async confirmReceipt(go: GoRef, buyer: PublicKey, treasury: PublicKey) {
    return this.program.methods
      .confirmReceipt()
      .accountsStrict(await this.settleAccounts(go, buyer, buyer, treasury))
      .instruction();
  }

  async releaseExpired(go: GoRef, buyer: PublicKey, signer: PublicKey, treasury: PublicKey) {
    return this.program.methods
      .releaseExpired()
      .accountsStrict(await this.settleAccounts(go, buyer, signer, treasury))
      .instruction();
  }

  async resolveDispute(go: GoRef, buyer: PublicKey, refundBuyer: boolean, treasury: PublicKey) {
    return this.program.methods
      .resolveDispute(refundBuyer)
      .accountsStrict(await this.settleAccounts(go, buyer, go.arbiter, treasury))
      .instruction();
  }

  async openDispute(go: GoRef, buyer: PublicKey) {
    return this.program.methods
      .openDispute()
      .accountsStrict({ buyer, groupOrder: go.address, participation: participationPda(go.address, buyer) })
      .instruction();
  }

  async closeVault(go: GoRef) {
    const { programId } = await getMintInfo(this.connection, go.mint);
    return this.program.methods
      .closeVault()
      .accountsStrict({
        organizer: go.organizer,
        groupOrder: go.address,
        mint: go.mint,
        vault: ata(go.mint, go.address, programId),
        organizerTokenAccount: ata(go.mint, go.organizer, programId),
        tokenProgram: programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }
}
