import Link from "next/link";
import { ArrowRight, Lightning, LockKey, Receipt, ShieldCheck, Truck, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";
import { T } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/messages";

export function Problem() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            <T k="problem.title" />
          </h2>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-2">
            <T k="problem.p1" />
          </p>
          <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-ink-2">
            <T k="problem.p2" />
          </p>
        </div>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <StatBlock
            value="R$ 460k"
            label="problem.stat1"
            source="Aratu On"
            href="https://aratuon.com.br/entretenimento/fas-do-bts-denunciam-baiana-por-possivel-golpe-em-compra-coletiva-de-produtos-para-show-prejuizo-ultrapassa-r-460-mil/"
          />
          <StatBlock
            value="800+"
            label="problem.stat2"
            source="Infobae"
            href="https://www.infobae.com/peru/2026/10/05/bts-en-lima-mas-de-800-fanaticas-denuncian-presunta-estafa-por-army-bomb-en-el-centro-comercial-arenales/"
          />
          <StatBlock
            value="8%"
            label="problem.stat3"
            source="Finsiders Brasil, BC data"
            href="https://finsidersbrasil.com.br/noticias-sobre-fintechs/fraudes/mesmo-com-med-so-8-dos-valores-roubados-via-pix-sao-devolvidos/"
          />
          <StatBlock
            value="5th"
            label="problem.stat4"
            source="Spotify Wrapped 2025"
            href="https://www.bandwagon.asia/articles/bts-stray-kids-blackpink-huntr-x-twice-enhypen-katseye-more-top-spotify-s-2025-k-pop-wrapped"
          />
        </dl>
      </div>
    </section>
  );
}

function StatBlock({ value, label, source, href }: { value: string; label: MessageKey; source: string; href: string }) {
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-5">
      <dt className="tnum font-display text-4xl font-semibold text-ink">{value}</dt>
      <dd className="text-[15px] leading-relaxed text-ink-2"><T k={label} /></dd>
      <a href={href} target="_blank" rel="noreferrer" className="text-[13px] text-ink-3 underline-offset-2 hover:underline">
        {source}
      </a>
    </div>
  );
}

const STEPS: { icon: typeof UsersThree; key: "how.s1" | "how.s2" | "how.s3" | "how.s4" }[] = [
  {
    icon: UsersThree,
    key: "how.s1",
  },
  {
    icon: LockKey,
    key: "how.s2",
  },
  {
    icon: Truck,
    key: "how.s3",
  },
  {
    icon: Receipt,
    key: "how.s4",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl"><T k="how.title" /></h2>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-2"><T k="how.sub" /></p>
      </div>
      <ol className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-[var(--r-card)] border border-line bg-line md:grid-cols-2">
        {STEPS.map((s) => (
          <li key={s.key} className="flex gap-5 bg-surface p-7 lg:p-9">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
              <s.icon size={22} weight="duotone" />
            </span>
            <div>
              <h3 className="font-display text-xl font-semibold text-ink"><T k={`${s.key}.title`} /></h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2"><T k={`${s.key}.body`} /></p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-6">
        <Link href="/how-it-works" className="inline-flex items-center gap-1.5 text-[15px] font-medium text-ink underline-offset-4 hover:underline">
          <T k="how.link" /> <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

export function TwoSides() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-20">
        <div className="flex flex-col">
          <h2 className="font-display text-3xl font-semibold leading-tight text-ink"><T k="sides.buyers" /></h2>
          <ul className="mt-6 flex flex-col gap-4 text-[16px] leading-relaxed text-ink-2">
            <li className="flex gap-3"><ShieldCheck size={22} weight="fill" className="mt-0.5 shrink-0 text-accent" /> <T k="sides.b1" /></li>
            <li className="flex gap-3"><ShieldCheck size={22} weight="fill" className="mt-0.5 shrink-0 text-accent" /> <T k="sides.b2" /></li>
            <li className="flex gap-3"><ShieldCheck size={22} weight="fill" className="mt-0.5 shrink-0 text-accent" /> <T k="sides.b3" /></li>
          </ul>
          <div className="mt-8">
            <ButtonLink href="/explore" variant="secondary">
              <T k="sides.browse" />
            </ButtonLink>
          </div>
        </div>
        <div className="flex flex-col">
          <h2 className="font-display text-3xl font-semibold leading-tight text-ink"><T k="sides.organizers" /></h2>
          <ul className="mt-6 flex flex-col gap-4 text-[16px] leading-relaxed text-ink-2">
            <li className="flex gap-3"><Lightning size={22} weight="fill" className="mt-0.5 shrink-0 text-accent" /> <T k="sides.o1" /></li>
            <li className="flex gap-3"><Lightning size={22} weight="fill" className="mt-0.5 shrink-0 text-accent" /> <T k="sides.o2" /></li>
            <li className="flex gap-3"><Lightning size={22} weight="fill" className="mt-0.5 shrink-0 text-accent" /> <T k="sides.o3" /></li>
          </ul>
          <div className="mt-8">
            <ButtonLink href="/create"><T k="sides.create" /></ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhySolana() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <h2 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl"><T k="why.title" /></h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Point k="why.p1" />
          <Point k="why.p2" />
          <Point k="why.p3" />
          <Point k="why.p4" />
        </div>
      </div>
    </section>
  );
}

function Point({ k }: { k: "why.p1" | "why.p2" | "why.p3" | "why.p4" }) {
  return (
    <div className="border-t border-line pt-5">
      <h3 className="font-display text-xl font-semibold text-ink"><T k={`${k}.title`} /></h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2"><T k={`${k}.body`} /></p>
    </div>
  );
}

export function FinalCta() {
  return (
    <section className="border-t border-line bg-ink text-ink-inverse">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl"><T k="cta.title" /></h2>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-inverse/75"><T k="cta.body" /></p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/explore" size="lg" className="bg-ink-inverse text-ink hover:bg-white">
            <T k="cta.explore" />
          </ButtonLink>
          <ButtonLink href="/create" size="lg" variant="ghost" className="text-ink-inverse hover:bg-white/10 hover:text-ink-inverse">
            <T k="cta.create" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
