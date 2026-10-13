"use client";

import { useState } from "react";
import Link from "next/link";
import { List, X } from "@phosphor-icons/react";
import { WalletButton } from "@/components/wallet/wallet-button";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/messages";

const LINKS: { href: string; label: MessageKey }[] = [
  { href: "/explore", label: "nav.explore" },
  { href: "/create", label: "nav.create" },
  { href: "/dashboard", label: "nav.orders" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <div className="md:hidden">
      <button
        aria-label={open ? t("nav.menuClose") : t("nav.menuOpen")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-10 items-center justify-center rounded-full text-ink hover:bg-surface-2"
      >
        {open ? <X size={22} /> : <List size={22} />}
      </button>
      {open ? (
        <div className="absolute inset-x-0 top-16 z-30 border-b border-line bg-bg px-4 pb-6 pt-2 shadow-md">
          <nav className="flex flex-col" aria-label="Mobile">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-[15px] text-ink hover:bg-surface-2"
              >
                {t(l.label)}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-3 px-3">
            <LanguageToggle className="self-start" />
            <WalletButton className="w-full" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
