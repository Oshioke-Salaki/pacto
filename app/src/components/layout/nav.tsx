import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { WalletButton } from "@/components/wallet/wallet-button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { IS_DEVNET } from "@/lib/solana/cluster";

export const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/create", label: "Start a group order" },
  { href: "/dashboard", label: "My orders" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-3.5 py-2 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {IS_DEVNET ? (
            <span className="hidden h-7 items-center rounded-full border border-line-2 px-2.5 text-xs font-medium text-ink-2 sm:inline-flex">
              Devnet
            </span>
          ) : null}
          <div className="hidden sm:block">
            <WalletButton size="sm" />
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
