import idl from "./idl.json";
import { tNow } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/messages";

const friendly = (name: string): string | null => {
  const key = `err.${name}` as MessageKey;
  const text = tNow(key);
  return text ? text : null;
};

const byCode = new Map<number, { name: string; msg: string }>();
for (const e of idl.errors ?? []) byCode.set(e.code, { name: e.name, msg: e.msg });

/** Turn any thrown error from a Solana send into a human sentence. */
export function explainError(err: unknown): string {
  const text = errorText(err);
  if (/user rejected|rejected the request|declined/i.test(text)) return tNow("err.cancelledSig");
  if (/insufficient funds for rent|insufficient lamports|Attempt to debit an account but found no record/i.test(text)) {
    return tNow("err.noSol");
  }
  if (/insufficient funds/i.test(text) && /Transfer|0x1\b/.test(text)) return tNow("err.noUsdc");
  if (/could not find account|AccountNotInitialized|0xbc4/i.test(text)) return tNow("err.noAccount");
  const named = text.match(/Error Code: (\w+)/)?.[1];
  const namedText = named ? friendly(named) : null;
  if (namedText) return namedText;
  const hex = text.match(/custom program error: 0x([0-9a-f]+)/i)?.[1];
  if (hex) {
    const entry = byCode.get(parseInt(hex, 16));
    if (entry) return friendly(entry.name) ?? entry.msg;
  }
  if (/blockhash not found|block height exceeded/i.test(text)) return tNow("err.slow");
  if (/WalletNotConnected/i.test(text)) return tNow("err.connect");
  return text.length > 160 ? tNow("err.failedConsole") : text || tNow("err.failed");
}

function errorText(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  const e = err as { message?: string; logs?: string[]; error?: { errorMessage?: string } };
  const parts = [e.message ?? "", ...(e.logs ?? [])];
  if (e.error?.errorMessage) parts.push(e.error.errorMessage);
  return parts.join("\n");
}
