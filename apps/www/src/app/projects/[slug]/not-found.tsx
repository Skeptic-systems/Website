"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CaretLeft } from "phosphor-react";

import { geist } from "@/app/fonts";

export default function ProjectNotFound() {
  const t = useTranslations("projects");

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center px-6 py-24">
      <div className="absolute inset-0 [background-size:28px_28px] [background-image:radial-gradient(#d4d4d4_1px,transparent_1px)] dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]" />
      <div className="accent-glow-layer-right" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center gap-6 rounded-[40px] border border-neutral-200/70 bg-white/80 p-12 text-center shadow-2xl backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/70">
        <p className={`${geist.className} text-xs uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400`}>
          {t("detail.notFoundAccent")}
        </p>
        <h1 className={`${geist.className} text-3xl font-semibold text-neutral-900 dark:text-neutral-50`}>
          {t("detail.notFoundTitle")}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{t("detail.notFoundBody")}</p>
        <Link
          href="/#projects"
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-800/70 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-neutral-100"
        >
          <CaretLeft className="h-4 w-4" />
          {t("detail.back")}
        </Link>
      </div>
    </div>
  );
}


