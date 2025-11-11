"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";

type IntlProviderProps = {
  defaultLocale: string;
  defaultMessages: AbstractIntlMessages;
  children: ReactNode;
};

export function IntlProvider({ defaultLocale, defaultMessages, children }: IntlProviderProps) {
  const [locale, setLocale] = useState<string>(defaultLocale);
  const [messages, setMessages] = useState<AbstractIntlMessages>(defaultMessages);
  const timeZone = "Europe/Berlin";
  const STORAGE_KEY = "www-locale";

  const resolvePreferredLocale = useMemo(() => {
    return (): string => {
      if (typeof window === "undefined") return defaultLocale;
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
      const nav = window.navigator?.language || "";
      const normalized = nav.toLowerCase();
      if (normalized.startsWith("de")) return "de";
      return "en";
    };
  }, [defaultLocale]);

  useEffect(() => {
    const nextLocale = resolvePreferredLocale();
    if (typeof document !== "undefined") {
      document.documentElement.lang = nextLocale;
    }
    if (typeof window !== "undefined") {
      try {
        if (!window.localStorage.getItem(STORAGE_KEY)) {
          window.localStorage.setItem(STORAGE_KEY, nextLocale);
        }
      } catch {}
    }
    if (nextLocale !== locale) {
      import(`../locals/${nextLocale}.json`).then((mod) => {
        setLocale(nextLocale);
        setMessages(mod.default as AbstractIntlMessages);
          setMessages(mod.default as AbstractIntlMessages);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue && event.newValue !== locale) {
        const nextLocale = event.newValue;
        import(`../locals/${nextLocale}.json`).then((mod) => {
          setLocale(nextLocale);
          setMessages(mod.default as AbstractIntlMessages);
          if (typeof document !== "undefined") {
            document.documentElement.lang = nextLocale;
          }
        });
      }
    };

    const onCustom = (event: Event) => {
      const custom = event as CustomEvent<{ locale: string }>;
      const nextLocale = custom.detail?.locale;
      if (nextLocale && nextLocale !== locale) {
        import(`../locals/${nextLocale}.json`).then((mod) => {
          setLocale(nextLocale);
          setMessages(mod.default as AbstractIntlMessages);
          if (typeof document !== "undefined") {
            document.documentElement.lang = nextLocale;
          }
        });
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("app:locale-changed", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("app:locale-changed", onCustom as EventListener);
    };
  }, [locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  );
}


