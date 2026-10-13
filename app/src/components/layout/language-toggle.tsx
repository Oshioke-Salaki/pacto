"use client";

import { LOCALES } from "@/lib/i18n/messages";
import { setLocale, useLocale, useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useT();
  return (
    <div role="group" aria-label={t("nav.language")} className={cn("inline-flex rounded-full border border-line-2 p-0.5", className)}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            "h-7 rounded-full px-2.5 text-xs font-medium uppercase transition-colors",
            locale === l ? "bg-ink text-ink-inverse" : "text-ink-2 hover:text-ink",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
