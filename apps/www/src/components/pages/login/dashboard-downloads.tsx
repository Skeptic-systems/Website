"use client";

import { useTranslations } from "next-intl";

export function DashboardDownloadsSection() {
  const t = useTranslations("dashboard");

  return (
    <section className="rounded-[32px] border border-dashed border-[hsl(var(--accent)_/_0.4)] bg-white/70 p-8 text-left shadow-inner backdrop-blur-lg dark:border-[hsl(var(--accent)_/_0.35)] dark:bg-neutral-900/50">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[hsl(var(--accent))]">
        {t("nav.placeholders.downloads.badge")}
      </p>
      <h2 className="mt-3 text-2xl font-semibold">{t("nav.placeholders.downloads.title")}</h2>
      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{t("nav.placeholders.downloads.body")}</p>
    </section>
  );
}



