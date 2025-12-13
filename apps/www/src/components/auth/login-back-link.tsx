"use client";

import Link from "next/link";
import { CaretLeft } from "phosphor-react";
import { useTranslations } from "next-intl";

export function LoginBackLink() {
  const t = useTranslations("auth.login.actions");

  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-full border border-neutral-200/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-800/70 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-neutral-100"
    >
      <CaretLeft className="h-3.5 w-3.5" />
      {t("back")}
    </Link>
  );
}





