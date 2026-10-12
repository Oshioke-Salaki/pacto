import Link from "next/link";
import { ArrowRight, Lightning, LockKey, Receipt, ShieldCheck, Truck, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";

export function Problem() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8 lg:py-28">
        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            Fandom runs on group orders. Group orders run on hope.
          </h2>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-2">
            One organizer collects Pix from hundreds of strangers, orders abroad, and reships weeks later. When it works, everyone saves. When it does not, the money is simply gone.
          </p>
          <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-ink-2">
            Pix is instant and irreversible, and buyer protection does not cover a transfer to a person. Honest organizers pay for it too: every new order starts from zero trust.
          </p>
        </div>
        <dl className="grid gap-6 sm:grid-cols-2">
          <StatBlock
            value="R$ 460k"
            label="collected by one organizer for BTS light sticks in Bahia before vanishing, September 2026. About 1,000 fans."
            source="Aratu On"
            href="https://aratuon.com.br/entretenimento/fas-do-bts-denunciam-baiana-por-possivel-golpe-em-compra-coletiva-de-produtos-para-show-prejuizo-ultrapassa-r-460-mil/"
          />
          <StatBlock
            value="800+"
            label="fans in Lima paid for Army Bombs across three pre-orders that never shipped, October 2026."
            source="Infobae"
            href="https://www.infobae.com/peru/2026/10/05/bts-en-lima-mas-de-800-fanaticas-denuncian-presunta-estafa-por-army-bomb-en-el-centro-comercial-arenales/"
          />
          <StatBlock
            value="8%"
            label="of money contested as Pix fraud is actually returned to victims through the official dispute mechanism (MED), per Banco Central data."
            source="Finsiders Brasil, BC data"
            href="https://finsidersbrasil.com.br/noticias-sobre-fintechs/fraudes/mesmo-com-med-so-8-dos-valores-roubados-via-pix-sao-devolvidos/"
          />
          <StatBlock
            value="5th"
            label="Brazil&apos;s rank among K-pop streaming markets worldwide. Mexico is 6th."
            source="Spotify Wrapped 2025"
            href="https://www.bandwagon.asia/articles/bts-stray-kids-blackpink-huntr-x-twice-enhypen-katseye-more-top-spotify-s-2025-k-pop-wrapped"
          />
        </dl>
      </div>
    </section>
  );
}

function StatBlock({ value, label, source, href }: { value: string; label: string; source: string; href: string }) {
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-5">
      <dt className="tnum font-display text-4xl font-semibold text-ink">{value}</dt>
      <dd className="text-[15px] leading-relaxed text-ink-2">{label}</dd>
      <a href={href} target="_blank" rel="noreferrer" className="text-[13px] text-ink-3 underline-offset-2 hover:underline">
        {source}
      </a>
    </div>
  );
}

const STEPS = [
  {
    icon: UsersThree,
    title: "Buyers join and pay into a vault",
    body: "Each payment goes to an on-chain escrow account for that order, never to the organizer's wallet. Leave anytime before the deadline for a full refund.",
  },
  {
    icon: LockKey,
    title: "Minimum met, the order locks",
    body: "The organizer receives a capped advance to place the bulk order. The cap is set when the order is created and shown before anyone pays.",
  },
  {
    icon: Truck,
    title: "Shipped with proof",
    body: "The organizer adds a tracking reference. If they never ship within the window, every buyer reclaims the held share with one click.",
  },
  {
    icon: Receipt,
    title: "Confirm, and the rest releases",
    body: "Each buyer confirms receipt and their remaining share pays out. Did not arrive? Open a dispute and a neutral arbiter decides.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">Money moves only when the order does.</h2>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-2">Four steps, each one enforced by the program, not by promises.</p>
      </div>
      <ol className="mt-12 grid gap-px overflow-hidden rounded-[var(--r-card)] border border-line bg-line md:grid-cols-2">
        {STEPS.map((s) => (
          <li key={s.title} className="flex gap-5 bg-surface p-7 lg:p-9">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
              <s.icon size={22} weight="duotone" />
            </span>
            <div>
              <h3 className="font-display text-xl font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-8">
        <Link href="/how-it-works" className="inline-flex items-center gap-1.5 text-[15px] font-medium text-ink underline-offset-4 hover:underline">
          Read the full safety rules <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

export function TwoSides() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
        <div className="flex flex-col">
          <h2 className="font-display text-3xl font-semibold leading-tight text-ink">For buyers</h2>
          <ul className="mt-6 flex flex-col gap-4 text-[16px] leading-relaxed text-ink-2">
            <li className="flex gap-3"><ShieldCheck size={22} weight="fill" className="mt-0.5 shrink-0 text-accent" /> Your maximum exposure is the organizer advance, and you see it before you pay.</li>
            <li className="flex gap-3"><ShieldCheck size={22} weight="fill" className="mt-0.5 shrink-0 text-accent" /> Refunds are a button, not a WhatsApp argument. If the order fails, the program pays you back.</li>
            <li className="flex gap-3"><ShieldCheck size={22} weight="fill" className="mt-0.5 shrink-0 text-accent" /> Every organizer&apos;s history is on-chain. Completed orders and disputes lost cannot be edited.</li>
          </ul>
          <div className="mt-8">
            <ButtonLink href="/explore" variant="secondary">
              Browse open orders
            </ButtonLink>
          </div>
        </div>
        <div className="flex flex-col">
          <h2 className="font-display text-3xl font-semibold leading-tight text-ink">For organizers</h2>
          <ul className="mt-6 flex flex-col gap-4 text-[16px] leading-relaxed text-ink-2">
            <li className="flex gap-3"><Lightning size={22} weight="fill" className="mt-0.5 shrink-0 text-accent" /> Collect without chasing receipts. Share one link; it works as a pay button inside X and wallets.</li>
            <li className="flex gap-3"><Lightning size={22} weight="fill" className="mt-0.5 shrink-0 text-accent" /> Get working capital the moment the minimum is met, then the rest as items land.</li>
            <li className="flex gap-3"><Lightning size={22} weight="fill" className="mt-0.5 shrink-0 text-accent" /> Build a track record you own. Your reputation travels with your wallet, not with a platform.</li>
          </ul>
          <div className="mt-8">
            <ButtonLink href="/create">Start a group order</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhySolana() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <h2 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">Why this needs Solana, not a spreadsheet.</h2>
        <div className="grid gap-8 sm:grid-cols-2">
          <Point title="Fees under a cent" body="Per-buyer settlement on R$ 40 items only works when a transaction costs less than a text message." />
          <Point title="Final in seconds" body="Buyers who grew up on Pix expect instant. Refunds and payouts land before the toast disappears." />
          <Point title="Links that pay" body="Every order is a Blink. Paste it in a thread or a Discord and it renders as a join button." />
          <Point title="Reputation you own" body="Order history lives in program accounts. Any app can read it, and nobody can quietly delete it." />
        </div>
      </div>
    </section>
  );
}

function Point({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-t border-line pt-5">
      <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{body}</p>
    </div>
  );
}

export function FinalCta() {
  return (
    <section className="border-t border-line bg-ink text-ink-inverse">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-20 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-24">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">The next group order you join should not require faith.</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-inverse/75">Open on Solana devnet today. Test USDC is free.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/explore" size="lg" className="bg-ink-inverse text-ink hover:bg-white">
            Explore open orders
          </ButtonLink>
          <ButtonLink href="/create" size="lg" variant="ghost" className="text-ink-inverse hover:bg-white/10 hover:text-ink-inverse">
            Start a group order
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
