import { ButtonLink } from "@/components/ui/button";
import { GoCard } from "@/components/go/go-card";
import { sampleGroupOrder } from "@/lib/sample";

export function Hero({ now }: { now: number }) {
  const sample = sampleGroupOrder(now);
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:pb-28 lg:pt-20">
      <div className="max-w-xl">
        <h1 className="font-display reveal text-4xl font-semibold leading-[1.02] text-ink sm:text-5xl lg:text-[64px]">
          Group buys, without the trust fall.
        </h1>
        <p className="reveal reveal-delay-1 mt-6 max-w-lg text-lg leading-relaxed text-ink-2">
          Pool money with people you follow. The organizer only gets paid as the goods arrive. Enforced on Solana.
        </p>
        <div className="reveal reveal-delay-2 mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/explore" size="lg">
            Explore open orders
          </ButtonLink>
          <ButtonLink href="/create" size="lg" variant="secondary">
            Start a group order
          </ButtonLink>
        </div>
      </div>
      <div className="reveal reveal-delay-2 relative mx-auto w-full max-w-md lg:max-w-none">
        <div className="pointer-events-none" aria-label="Example group order card">
          <GoCard go={sample} now={now} priority className="shadow-lg" />
        </div>
        <p className="mt-3 text-center text-xs text-ink-3">Example order. Real ones live under Explore.</p>
      </div>
    </section>
  );
}
