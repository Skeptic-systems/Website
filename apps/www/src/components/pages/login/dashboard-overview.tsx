"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

type DashboardOverviewSectionProps = {
  userName?: string;
  onSignOut: () => void;
  isSigningOut: boolean;
  signOutError: string | null;
};

export function DashboardOverviewSection({
  userName,
  onSignOut,
  isSigningOut,
  signOutError,
}: DashboardOverviewSectionProps) {
  const t = useTranslations("dashboard");

  return (
    <section className="rounded-[32px] border border-neutral-200/70 bg-white/90 p-8 shadow-xl backdrop-blur-lg transition dark:border-neutral-800/70 dark:bg-neutral-900/80">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[hsl(var(--accent))] opacity-90">
        {t("accent")}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{t("title")}</h1>
      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{t("subtitle")}</p>
      <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
        {t("access.signedInAs", { name: userName })}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" asChild variant="secondary">
          <Link href="/">{t("actions.back")}</Link>
        </Button>
        <Button type="button" onClick={onSignOut} disabled={isSigningOut}>
          {isSigningOut ? t("actions.signingOut") : t("actions.signOut")}
        </Button>
        {signOutError ? <span className="text-sm text-red-500 dark:text-red-400">{signOutError}</span> : null}
      </div>
    </section>
  );
}



