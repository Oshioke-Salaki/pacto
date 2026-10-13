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

export function useT() {
  const locale = useLocale();
  return useCallback((key: MessageKey) => MESSAGES[locale][key], [locale]);
}

/** Renders one translated string. Usable from server components. */
export function T({ k }: { k: MessageKey }) {
  return <>{useT()(k)}</>;
}

export function LocaleSync({ children }: { children: ReactNode }) {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale === "pt" ? "pt-BR" : "en";
  }, [locale]);
  return <>{children}</>;
}
