"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  ArrowSquareOut,
  TerminalWindow,
} from "phosphor-react";

import { SKILLS_SETUP_REGISTRY_URL } from "@/lib/skills-setup";

export function SkillsUtilityBanner() {
  const t = useTranslations("skills");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200/50 bg-white/70 px-5 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800/60 dark:bg-neutral-950/50">
      <Link
        href="/skills/setup"
        className="group flex items-center gap-3 transition"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
          <TerminalWindow className="h-4 w-4" weight="fill" />
        </div>
        <span className="text-sm font-semibold text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-white">
          {t("intro.setup.title")}
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-400 transition group-hover:translate-x-0.5" weight="bold" />
      </Link>
      <a
        href={SKILLS_SETUP_REGISTRY_URL}
        target="_blank"
        rel="noreferrer"
        className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        {t("intro.registry.cta")}
        <ArrowSquareOut className="h-3.5 w-3.5" weight="bold" />
      </a>
    </div>
  );
}
