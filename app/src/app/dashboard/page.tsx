import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/dashboard";
import { T } from "@/lib/i18n/provider";

export const metadata: Metadata = { title: "My orders" };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl"><T k="dash.title" /></h1>
      <p className="mt-2 text-[16px] text-ink-2"><T k="dash.sub" /></p>
      <div className="mt-8">
        <Dashboard />
      </div>
    </div>
  );
}
