"use client";

import { IconLanguage } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const LOCALE_KEYS = ["en", "de"] as const;

type LocaleKey = (typeof LOCALE_KEYS)[number];

const LOCALE_LABEL_KEYS: Record<LocaleKey, string> = {
  en: "options.en",
  de: "options.de",
};

export function LocaleToggle() {
  const t = useTranslations("navbar.locale");
  const [locale, setLocale] = useState<LocaleKey>("en");

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2 px-3"
      aria-label={t("label")}
      title={t("label")}
      onClick={() => {
        const index = LOCALE_KEYS.indexOf(locale);
        const nextLocale = LOCALE_KEYS[(index + 1) % LOCALE_KEYS.length];
        setLocale(nextLocale);
      }}
    >
      <IconLanguage className="h-4 w-4" aria-hidden />
      <span className="text-xs font-semibold uppercase tracking-wide">
        {t(LOCALE_LABEL_KEYS[locale])}
      </span>
    </Button>
  );
}
