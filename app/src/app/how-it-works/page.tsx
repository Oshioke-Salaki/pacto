import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { explorerUrl, PROGRAM_ID } from "@/lib/solana/cluster";

export const metadata: Metadata = { title: "How Pacto works" };

const RULES: { title: string; body: string }[] = [
  { title: "Money goes to a vault, never to a person", body: "Each group order has its own token account controlled by the Pacto program. The organizer cannot withdraw from it. Only the rules below move money." },
  { title: "Leave anytime while the order is open", body: "Until the join deadline, any buyer can leave and get a full refund. Once the deadline passes with the minimum met, positions are committed so the organizer can safely place the order." },
  { title: "Minimum not met: everyone is refunded", body: "If the deadline passes below the minimum, anyone can cancel the order and every buyer claims their full payment back." },
  { title: "Advance is capped and visible", body: "When the order locks, the organizer receives a percentage chosen at creation (never above the protocol cap). That percentage is the most a buyer can lose, and it is displayed before paying." },
  { title: "Organizer goes silent: anyone can cancel", body: "If the minimum is met but the organizer does not lock within 7 days after the deadline, anyone can cancel and buyers claim full refunds." },
  { title: "Never shipped: reclaim the held share", body: "After locking, the organizer has a ship-by window. If it passes with no shipment, each buyer reclaims everything except the advance." },
  { title: "Confirm to release, dispute to pause", body: "Once shipped, each buyer confirms receipt to release their remaining share. A buyer who did not receive the goods opens a dispute, which freezes that share until the arbiter decides." },
  { title: "Silence after delivery is not a weapon", body: "If a buyer never confirms and never disputes within the delivery window, their share is released to the organizer. Anyone can trigger that release." },
  { title: "Arbiter cannot take the money", body: "The arbiter can only send a disputed share to the buyer or to the organizer. If the arbiter does nothing for 30 days after the delivery window, the buyer reclaims it." },
  { title: "Track record is permanent", body: "Completed orders, disputes opened and disputes lost are stored in the program's accounts for every organizer. Nobody can edit them, including Pacto." },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">How Pacto works</h1>
      <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink-2">
        Pacto is a Solana program plus this website. The program holds the money and enforces the rules. The website just makes them easy to use.
      </p>

      <section id="safety" className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink">Safety rules</h2>
        <ol className="mt-5 grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
          {RULES.map((r) => (
            <li key={r.title} className="border-t border-line pt-4">
              <h3 className="font-display text-lg font-semibold text-ink">{r.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{r.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink">Fees</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          Buyers pay nothing beyond the item price and Solana network fees (a fraction of a cent). Organizers pay a protocol fee on each payout, fixed at the moment the order is created so later changes never affect a running order.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink">Verify it yourself</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          The program is open source and deployed at{" "}
          <a href={explorerUrl("address", PROGRAM_ID.toBase58())} target="_blank" rel="noreferrer" className="break-all font-mono text-ink underline-offset-2 hover:underline">
            {PROGRAM_ID.toBase58()}
          </a>
          . Every order page links to its on-chain account.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/explore">Explore open orders</ButtonLink>
          <Link href="/create" className="inline-flex h-11 items-center px-2 text-[15px] font-medium text-ink underline-offset-4 hover:underline">
            Start a group order
          </Link>
        </div>
      </section>
    </div>
  );
}
