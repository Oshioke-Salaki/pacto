"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { CaretDown, Copy, SignOut, Wallet } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { shortAddress } from "@/lib/pacto/format";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function WalletButton({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const { publicKey, disconnect, connecting, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copy = useCallback(async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey.toBase58());
    toast.success(t("wallet.copied"));
    setOpen(false);
  }, [publicKey, t]);

  if (!publicKey) {
    return (
      <Button size={size} className={className} onClick={() => setVisible(true)} loading={connecting}>
        <Wallet size={18} weight="bold" />
        {t("wallet.connect")}
      </Button>
    );
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <Button variant="secondary" size={size} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu">
        {wallet?.adapter.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={wallet.adapter.icon} alt="" width={18} height={18} className="rounded-sm" />
        ) : (
          <Wallet size={18} weight="bold" />
        )}
        <span className="font-mono text-[13px]">{shortAddress(publicKey.toBase58())}</span>
        <CaretDown size={14} weight="bold" className={cn("transition-transform", open && "rotate-180")} />
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-40 w-56 overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-md"
        >
          <button role="menuitem" onClick={copy} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-ink hover:bg-surface-2">
            <Copy size={16} /> {t("wallet.copy")}
          </button>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void disconnect();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-ink hover:bg-surface-2"
          >
            <SignOut size={16} /> {t("wallet.disconnect")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
