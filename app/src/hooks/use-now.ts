"use client";
import { useCallback, useSyncExternalStore } from "react";

let cached = 0;
const secs = () => Math.floor(Date.now() / 1000);

/**
 * Unix seconds, ticking every `intervalMs`. Returns 0 during server render and
 * hydration so the prerender never reads the clock; callers treat 0 as "not ready".
 */
export function useNow(intervalMs = 30_000) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      cached = secs();
      const id = setInterval(() => {
        cached = secs();
        onChange();
      }, intervalMs);
      return () => clearInterval(id);
    },
    [intervalMs],
  );
  return useSyncExternalStore(subscribe, () => cached, () => 0);
}
