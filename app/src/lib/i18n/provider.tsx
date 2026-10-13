"use client";

import { useCallback, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { MESSAGES, type Locale, type MessageKey } from "./messages";

const STORAGE_KEY = "pacto-locale";
const listeners = new Set<() => void>();

function read(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "pt") return saved;
  } catch {
    // storage blocked: fall through to the browser language
  }
  return typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("pt") ? "pt" : "en";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function setLocale(next: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore; the choice just will not persist
  }
  listeners.forEach((l) => l());
}

/** Server and first client render use English, then the saved or browser locale applies. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, read, () => "en");
}

export type Params = Record<string, string | number>;

function interpolate(text: string, params?: Params) {
  return params ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m)) : text;
}

export function useT() {
  const locale = useLocale();
  return useCallback((key: MessageKey, params?: Params) => interpolate(MESSAGES[locale][key], params), [locale]);
}

/** Counted label, e.g. count("unit", 2) gives "2 units". */
export function useCount() {
  const t = useT();
  return useCallback((base: "unit" | "day" | "buyer", n: number) => {
    const p = plural(base, n);
    return t(p.key, p.params);
  }, [t]);
}

/** Renders one translated string. Usable from server components. */
export function T({ k, params }: { k: MessageKey; params?: Params }) {
  return <>{useT()(k, params)}</>;
}

/** Translate outside React (toasts, error helpers). Client only. */
export function tNow(key: MessageKey, params?: Params): string {
  return interpolate(MESSAGES[read()][key], params);
}

/** Picks the "one" or "other" variant of a counted message, e.g. plural("unit", 2). */
export function plural(base: "unit" | "day" | "buyer", n: number): { key: MessageKey; params: Params } {
  return { key: `${base}.${n === 1 ? "one" : "other"}`, params: { n } };
}

/** BCP 47 tag for Intl formatting. */
export function intlTag(locale: Locale) {
  return locale === "pt" ? "pt-BR" : "en-US";
}

export function LocaleSync({ children }: { children: ReactNode }) {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale === "pt" ? "pt-BR" : "en";
  }, [locale]);
  return <>{children}</>;
}
