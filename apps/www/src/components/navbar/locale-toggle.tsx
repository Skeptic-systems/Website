"use client";

import { IconLanguage } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const LOCALES = ["en", "de"] as const;
type AppLocale = (typeof LOCALES)[number];

const LOCALE_LABEL_KEYS: Record<AppLocale, string> = {
  en: "options.en",
  de: "options.de",
};

export function LocaleToggle() {
  const t = useTranslations("navbar.locale");
  const currentLocale = useLocale();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickAway = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 px-3"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("label")}
        title={t("label")}
        onClick={() => setOpen((v) => !v)}
      >
        <IconLanguage className="h-4 w-4" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {t(LOCALE_LABEL_KEYS[currentLocale as keyof typeof LOCALE_LABEL_KEYS])}
        </span>
      </Button>

      {open ? (
        <div
          role="menu"
          aria-label={t("label")}
          className="absolute right-0 z-50 mt-2 w-28 rounded-md border bg-popover p-1 text-popover-foreground shadow"
        >
          {LOCALES.map((loc) => (
            <button
              key={loc}
              role="menuitemradio"
              aria-checked={currentLocale === loc}
              onClick={() => {
                setOpen(false);
                try {
                  window.localStorage.setItem("www-locale", loc);
                } catch {}
                window.dispatchEvent(
                  new CustomEvent("app:locale-changed", { detail: { locale: loc } }),
                );
              }}
              className={`flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground ${
                currentLocale === loc ? "font-semibold" : ""
              }`}
            >
              <span className="uppercase">{t(LOCALE_LABEL_KEYS[loc])}</span>
              {currentLocale === loc ? (
                <span aria-hidden className="text-xs">✓</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
