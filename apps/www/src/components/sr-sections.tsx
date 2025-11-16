"use client";

import { useTranslations } from "next-intl";

export function SrSections() {
  const t = useTranslations("home.sections");

  return (
    <>
      <section id="tools" className="sr-only">{t("tools")}</section>
      <section id="selfhosted" className="sr-only">{t("selfhosted")}</section>
    </>
  );
}


