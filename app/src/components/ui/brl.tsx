"use client";

import { useQuery } from "@tanstack/react-query";
import type { BrlRate } from "@/lib/pacto/rate";
import { intlTag, useLocale } from "@/lib/i18n/provider";

export function useBrlRate() {
  return useQuery<BrlRate>({
    queryKey: ["brl-rate"],
    queryFn: async () => (await fetch("/api/rate")).json(),
    staleTime: 60 * 60 * 1000,
  });
}

/** "≈ R$ 360,00" next to a USDC amount. Renders nothing until the rate loads. */
export function Brl({
  amount,
  decimals = 6,
  className,
}: {
  amount: bigint | string | number;
  decimals?: number;
  className?: string;
}) {
  const { data } = useBrlRate();
  const tag = intlTag(useLocale());
  if (!data) return null;
  const value = (Number(BigInt(amount)) / 10 ** decimals) * data.brl;
  const text = new Intl.NumberFormat(tag, { style: "currency", currency: "BRL" }).format(value);
  return <span className={className ?? "text-ink-3"}>≈ {text}</span>;
}
