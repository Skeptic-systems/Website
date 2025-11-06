"use client";

import { useTranslations } from "next-intl";

export function SrSections() {
  const t = useTranslations("home.sections");

  return (
    <>
      <section id="features" className="sr-only">{t("features")}</section>
      <section id="contact" className="sr-only">{t("contact")}</section>
    </>
  );
}


