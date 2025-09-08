import { useCallback, useState } from "react";

const DEFAULT_KEY = "tryCount";

const parseCount = (raw: string | null): number => {
  const v = parseInt(raw || "0", 10);
  return Number.isFinite(v) ? v : 0;
};

export function useTries(storageKey: string = DEFAULT_KEY) {
  const [tries, setTriesState] = useState<number>(() =>
    parseCount(typeof window !== "undefined" ? localStorage.getItem(storageKey) : "0")
  );

  const write = useCallback(
    (next: number) => {
      const val = Math.max(0, Number.isFinite(next) ? next : 0);
      setTriesState(val);
      try {
        localStorage.setItem(storageKey, String(val));
      } catch {
        // ignore storage errors
      }
    },
    [storageKey]
  );

  const decrementTries = useCallback(
    (by: number = 1) => {
      setTriesState((prev) => {
        const next = Math.max(0, prev - by);
        try {
          localStorage.setItem(storageKey, String(next));
        } catch {
          // ignore storage errors
        }
        return next;
      });
    },
    [storageKey]
  );

  const setTries = useCallback((value: number) => write(value), [write]);
  const resetTries = useCallback((value: number = 0) => write(value), [write]);

  const noAttempts = tries <= 0;

  return { tries, noAttempts, decrementTries, setTries, resetTries } as const;
}
