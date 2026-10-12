import { Hero } from "@/components/landing/hero";
import { FinalCta, HowItWorks, Problem, TwoSides, WhySolana } from "@/components/landing/sections";

// A fixed reference time keeps the landing page fully static; the sample card
// only needs a plausible "closes in 5 days" label, not a live clock.
const LANDING_NOW = Math.floor(new Date("2026-10-12T12:00:00Z").getTime() / 1000);

export default function Home() {
  return (
    <>
      <Hero now={LANDING_NOW} />
      <Problem />
      <HowItWorks />
      <TwoSides />
      <WhySolana />
      <FinalCta />
    </>
  );
}
