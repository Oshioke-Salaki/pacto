import Link from "next/link";
import { Mark } from "@/components/brand/logo";
import { T } from "@/lib/i18n/provider";
import { explorerUrl, PROGRAM_ID } from "@/lib/solana/cluster";

export function Footer() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] lg:px-8">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <Mark size={24} />
            <span className="font-display text-lg font-semibold text-ink">Pacto</span>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
            <T k="footer.about" />
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-ink"><T k="footer.product" /></h3>
          <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
            <li><Link href="/explore" className="hover:text-ink"><T k="footer.exploreOrders" /></Link></li>
            <li><Link href="/create" className="hover:text-ink"><T k="footer.create" /></Link></li>
            <li><Link href="/dashboard" className="hover:text-ink"><T k="footer.orders" /></Link></li>
            <li><Link href="/how-it-works" className="hover:text-ink"><T k="footer.how" /></Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-ink"><T k="footer.protocol" /></h3>
          <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
            <li>
              <a href={explorerUrl("address", PROGRAM_ID.toBase58())} target="_blank" rel="noreferrer" className="hover:text-ink">
                <T k="footer.program" />
              </a>
            </li>
            <li><a href="https://github.com/Oshioke-Salaki/pacto" target="_blank" rel="noreferrer" className="hover:text-ink"><T k="footer.source" /></a></li>
            <li><Link href="/how-it-works#safety" className="hover:text-ink"><T k="footer.safety" /></Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span><T k="footer.legal" /></span>
          <span><T k="footer.built" /></span>
        </div>
      </div>
    </footer>
  );
}
