import Link from "next/link";
import { Mark } from "@/components/brand/logo";
import { explorerUrl, PROGRAM_ID } from "@/lib/solana/cluster";

export function Footer() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <Mark size={24} />
            <span className="font-display text-lg font-semibold text-ink">Pacto</span>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
            Escrow for group orders. Money stays in a Solana vault until the goods arrive, and every finished order
            becomes the organizer&apos;s track record.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-ink">Product</h3>
          <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
            <li><Link href="/explore" className="hover:text-ink">Explore orders</Link></li>
            <li><Link href="/create" className="hover:text-ink">Start a group order</Link></li>
            <li><Link href="/dashboard" className="hover:text-ink">My orders</Link></li>
            <li><Link href="/how-it-works" className="hover:text-ink">How it works</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-ink">Protocol</h3>
          <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
            <li>
              <a href={explorerUrl("address", PROGRAM_ID.toBase58())} target="_blank" rel="noreferrer" className="hover:text-ink">
                Program on Solana Explorer
              </a>
            </li>
            <li><a href="https://github.com/Oshioke-Salaki/pacto" target="_blank" rel="noreferrer" className="hover:text-ink">Source code</a></li>
            <li><Link href="/how-it-works#safety" className="hover:text-ink">Safety rules</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>Pacto is non-custodial software. Funds are held by an on-chain program, not by Pacto.</span>
          <span>Built on Solana</span>
        </div>
      </div>
    </footer>
  );
}
