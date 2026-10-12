import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/dashboard";

export const metadata: Metadata = { title: "My orders" };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">My orders</h1>
      <p className="mt-2 text-[16px] text-ink-2">Everything you joined or organize, with the next step surfaced.</p>
      <div className="mt-10">
        <Dashboard />
      </div>
    </div>
  );
}
