"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Drop } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { explorerUrl, IS_DEVNET } from "@/lib/solana/cluster";

export function FaucetButton({ onDone, size = "sm" }: { onDone?: () => void; size?: "sm" | "md" }) {
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  if (!IS_DEVNET || !publicKey) return null;

  const drip = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: publicKey.toBase58() }),
      });
      const data = (await res.json()) as { signature?: string; error?: string };
      if (!res.ok || !data.signature) throw new Error(data.error ?? "Faucet failed");
      toast.success("100 test USDC sent", {
        action: { label: "View", onClick: () => window.open(explorerUrl("tx", data.signature!), "_blank") },
      });
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Faucet failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" size={size} onClick={drip} loading={loading}>
      <Drop size={16} /> Get 100 test USDC
    </Button>
  );
}
