import { cacheLife } from "next/cache";

/** Used when the rate provider is unreachable, so BRL hints never disappear in a demo. */
export const FALLBACK_BRL_PER_USD = 5.0;

export interface BrlRate {
  brl: number;
  /** "live" when fetched from the provider, "fallback" when the constant is used. */
  source: "live" | "fallback";
}

/** USD to BRL, cached for an hour. USDC is treated as 1 USD. */
export async function fetchBrlRate(): Promise<BrlRate> {
  "use cache";
  cacheLife("hours");
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { rates?: { BRL?: number } };
    const brl = data.rates?.BRL;
    if (typeof brl === "number" && brl > 0) return { brl, source: "live" };
  } catch {
    // fall through to the constant
  }
  return { brl: FALLBACK_BRL_PER_USD, source: "fallback" };
}
