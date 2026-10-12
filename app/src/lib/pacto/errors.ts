import idl from "./idl.json";

const FRIENDLY: Record<string, string> = {
  Paused: "Pacto is paused for maintenance. Existing orders can still settle.",
  InvalidStatus: "This order moved to a new stage. Refresh and try again.",
  DeadlinePassed: "The join deadline has passed.",
  DeadlineNotReached: "The join deadline has not passed yet.",
  MinimumNotMet: "The minimum quantity has not been reached.",
  MinimumAlreadyMet: "The minimum is met, so only the organizer can cancel right now.",
  MaxQuantityExceeded: "Not enough units left in this order.",
  InvalidQuantity: "Quantity must be at least 1 and within the limits.",
  InvalidPrice: "Unit price must be greater than zero.",
  InvalidAdvance: "Advance exceeds the protocol maximum.",
  InvalidFee: "Fee exceeds the protocol maximum.",
  InvalidWindow: "One of the dates or windows is out of range.",
  TitleTooLong: "Title is too long (max 64 characters).",
  DescriptionTooLong: "Description is too long (max 280 characters).",
  UriTooLong: "Link is too long (max 200 characters).",
  RefTooLong: "Tracking reference is too long (max 96 characters).",
  Unauthorized: "Your wallet is not allowed to do that on this order.",
  AlreadyConfirmed: "You already confirmed receipt.",
  AlreadyDisputed: "You already opened a dispute.",
  InDispute: "This position is in dispute. Wait for the arbiter.",
  NotDisputed: "This position is not in dispute.",
  WindowNotExpired: "That window has not expired yet.",
  WindowExpired: "That window has closed.",
  MathOverflow: "Amount too large.",
  MintMismatch: "Token account does not match the order's currency.",
  VaultNotEmpty: "Some buyers have not settled yet.",
  MintNotAllowed: "This currency is not enabled on Pacto yet.",
  ArbiterIsOrganizer: "The organizer cannot be the arbiter of their own order.",
  Committed: "The deadline passed with the minimum met, so positions are committed.",
  WindDown: "Buyers already started reclaiming funds, so shipping is closed.",
};

const byCode = new Map<number, { name: string; msg: string }>();
for (const e of idl.errors ?? []) byCode.set(e.code, { name: e.name, msg: e.msg });

/** Turn any thrown error from a Solana send into a human sentence. */
export function explainError(err: unknown): string {
  const text = errorText(err);
  if (/user rejected|rejected the request|declined/i.test(text)) return "You cancelled the signature.";
  if (/insufficient funds for rent|insufficient lamports|Attempt to debit an account but found no record/i.test(text)) {
    return "Not enough SOL in your wallet to pay network fees. On devnet, request an airdrop.";
  }
  if (/insufficient funds/i.test(text) && /Transfer|0x1\b/.test(text)) return "Not enough USDC in your wallet.";
  if (/could not find account|AccountNotInitialized|0xbc4/i.test(text)) return "You do not have a USDC account yet. Get some test USDC first.";
  const named = text.match(/Error Code: (\w+)/)?.[1];
  if (named && FRIENDLY[named]) return FRIENDLY[named];
  const hex = text.match(/custom program error: 0x([0-9a-f]+)/i)?.[1];
  if (hex) {
    const entry = byCode.get(parseInt(hex, 16));
    if (entry) return FRIENDLY[entry.name] ?? entry.msg;
  }
  if (/blockhash not found|block height exceeded/i.test(text)) return "The network was slow and the transaction expired. Try again.";
  if (/WalletNotConnected/i.test(text)) return "Connect a wallet first.";
  return text.length > 160 ? "Transaction failed. Check the console for details." : text || "Transaction failed.";
}

function errorText(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  const e = err as { message?: string; logs?: string[]; error?: { errorMessage?: string } };
  const parts = [e.message ?? "", ...(e.logs ?? [])];
  if (e.error?.errorMessage) parts.push(e.error.errorMessage);
  return parts.join("\n");
}
