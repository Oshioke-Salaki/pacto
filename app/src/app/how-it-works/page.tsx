import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { explorerUrl, PROGRAM_ID } from "@/lib/solana/cluster";
import { T } from "@/lib/i18n/provider";

export const metadata: Metadata = { title: "How Pacto works" };

const RULES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl"><T k="hiw.title" /></h1>
      <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink-2">
        <T k="hiw.sub" />
      </p>

      <section id="safety" className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink"><T k="hiw.safety" /></h2>
        <ol className="mt-5 grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
          {RULES.map((r) => (
            <li key={r} className="border-t border-line pt-4">
              <h3 className="font-display text-lg font-semibold text-ink"><T k={`hiw.r${r}.t`} /></h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2"><T k={`hiw.r${r}.b`} /></p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink"><T k="hiw.fees" /></h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          <T k="hiw.feesBody" />
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink"><T k="hiw.verify" /></h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          <T k="hiw.verifyBody" />{" "}
          <a href={explorerUrl("address", PROGRAM_ID.toBase58())} target="_blank" rel="noreferrer" className="break-all font-mono text-ink underline-offset-2 hover:underline">
            {PROGRAM_ID.toBase58()}
          </a>
          <T k="hiw.verifyTail" />
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/explore"><T k="hiw.explore" /></ButtonLink>
          <Link href="/create" className="inline-flex h-11 items-center px-2 text-[15px] font-medium text-ink underline-offset-4 hover:underline">
            <T k="hiw.create" />
          </Link>
        </div>
      </section>
    </div>
  );
}
