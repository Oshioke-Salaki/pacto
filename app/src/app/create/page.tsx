import type { Metadata } from "next";
import { CreateForm } from "@/components/go/create-form";

export const metadata: Metadata = { title: "Start a group order" };

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Start a group order</h1>
        <p className="mt-2 text-[16px] leading-relaxed text-ink-2">
          Set the price, the minimum, and the trust terms. Buyers pay into escrow, and you get paid as the order moves.
        </p>
      </div>
      <div className="mt-10">
        <CreateForm />
      </div>
    </div>
  );
}
