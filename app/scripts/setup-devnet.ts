/**
 * One-time devnet bootstrap:
 *   1. creates a 6-decimal "Pacto test USDC" mint (authority = deployer wallet)
 *   2. generates an arbiter keypair (saved to ../keys/arbiter.json, gitignored)
 *   3. initializes the protocol Config (fee 1.5%, max advance 50%)
 *
 * Usage: pnpm setup:devnet   (requires ~/.config/solana/id.json with devnet SOL)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@anchor-lang/core";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";
import idl from "../src/lib/pacto/idl.json";
import type { Pacto } from "../src/lib/pacto/types";

const RPC = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const root = path.resolve(__dirname, "..", "..");

function loadKeypair(p: string) {
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(p, "utf8")) as number[]));
}

async function main() {
  const connection = new Connection(RPC, "confirmed");
  const deployer = loadKeypair(path.join(os.homedir(), ".config", "solana", "id.json"));
  console.log("Deployer:", deployer.publicKey.toBase58());
  const bal = await connection.getBalance(deployer.publicKey);
  console.log("Balance:", bal / 1e9, "SOL");
  if (bal < 0.2e9) throw new Error("Need at least 0.2 SOL on devnet");

  // 1. Mint
  const existingMint = process.env.NEXT_PUBLIC_USDC_MINT;
  let mint: PublicKey;
  if (existingMint) {
    mint = new PublicKey(existingMint);
    console.log("Using existing mint", mint.toBase58());
  } else {
    const mintKp = Keypair.generate();
    const lamports = await getMinimumBalanceForRentExemptMint(connection);
    const tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: deployer.publicKey,
        newAccountPubkey: mintKp.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMint2Instruction(mintKp.publicKey, 6, deployer.publicKey, null),
    );
    await sendAndConfirmTransaction(connection, tx, [deployer, mintKp], { commitment: "confirmed" });
    mint = mintKp.publicKey;
    console.log("Created test USDC mint", mint.toBase58());
  }

  // 2. Arbiter
  const arbiterPath = path.join(root, "keys", "arbiter.json");
  let arbiter: Keypair;
  if (fs.existsSync(arbiterPath)) {
    arbiter = loadKeypair(arbiterPath);
  } else {
    arbiter = Keypair.generate();
    fs.mkdirSync(path.dirname(arbiterPath), { recursive: true });
    fs.writeFileSync(arbiterPath, JSON.stringify(Array.from(arbiter.secretKey)));
  }
  console.log("Arbiter:", arbiter.publicKey.toBase58());

  // 3. Config
  const provider = new AnchorProvider(connection, new Wallet(deployer), { commitment: "confirmed" });
  const program = new Program<Pacto>(idl as Pacto, provider);
  const [config] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);
  const existing = await program.account.config.fetchNullable(config);
  if (existing) {
    console.log("Config already initialized. Fee bps:", existing.feeBps, "allowed mint:", existing.allowedMint.toBase58());
  } else {
    const sig = await program.methods
      .initializeConfig({
        allowedMint: mint,
        feeBps: 150,
        maxAdvanceBps: 5000,
        treasury: deployer.publicKey,
        defaultArbiter: arbiter.publicKey,
      })
      .accountsStrict({ admin: deployer.publicKey, config, systemProgram: SystemProgram.programId })
      .rpc();
    console.log("Config initialized:", sig);
  }

  console.log("\nAdd to app/.env.local:");
  console.log(`NEXT_PUBLIC_USDC_MINT=${mint.toBase58()}`);
  console.log(`FAUCET_AUTHORITY_SECRET=${JSON.stringify(Array.from(deployer.secretKey))}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
