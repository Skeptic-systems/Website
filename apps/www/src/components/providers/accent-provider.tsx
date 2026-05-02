"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ACCENT_ATTRIBUTE = "data-accent";
const ACCENT_STORAGE_KEY = "www-accent";

export const ACCENT_KEYS = ["default", "blue", "green", "orange", "purple", "red", "white", "black"] as const;

export type AccentKey = (typeof ACCENT_KEYS)[number];

type AccentContextValue = {
  accent: AccentKey;
  setAccent: (value: AccentKey) => void;
  isReady: boolean;
};

const AccentContext = createContext<AccentContextValue | null>(null);

const DEFAULT_ACCENT: AccentKey = "default";

const isAccentKey = (value: unknown): value is AccentKey =>
  typeof value === "string" && (ACCENT_KEYS as readonly string[]).includes(value as AccentKey);

export function AccentProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentKey>(DEFAULT_ACCENT);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedAccent = window.localStorage.getItem(ACCENT_STORAGE_KEY);
    if (isAccentKey(storedAccent)) {
      setAccentState(storedAccent);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined" || !isReady) {
      return;
    }

    if (accent === "default") {
      document.documentElement.removeAttribute(ACCENT_ATTRIBUTE);
      window.localStorage.removeItem(ACCENT_STORAGE_KEY);
      return;
    }

    document.documentElement.setAttribute(ACCENT_ATTRIBUTE, accent);
    window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  }, [accent, isReady]);

  const setAccent = useCallback((value: AccentKey) => {
    setAccentState(value);
  }, []);

  const value = useMemo<AccentContextValue>(
    () => ({ accent, setAccent, isReady }),
    [accent, isReady, setAccent]
  );

  return <AccentContext.Provider value={value}>{children}</AccentContext.Provider>;
}

export function useAccent() {
  const context = useContext(AccentContext);
  if (!context) {
    throw new Error("useAccent must be used within an AccentProvider");
  }
  return context;
}
