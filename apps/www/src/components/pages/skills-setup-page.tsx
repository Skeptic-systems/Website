"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CaretLeft } from "phosphor-react";

import { geist } from "@/app/fonts";
import { ScriptTerminal } from "@/components/common/script-terminal";
import {
  SKILLS_SETUP_AGENT_TARGETS,
  SKILLS_SETUP_DOWNLOAD_PATH,
  SKILLS_SETUP_FILENAME,
} from "@/lib/skills-setup";

type SkillsSetupPageProps = {
  script: string;
};

export function SkillsSetupPage({ script }: SkillsSetupPageProps) {
  const t = useTranslations("skills");

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent px-4 pb-8 pt-16 sm:px-6 sm:pt-20">
      <div className="accent-glow-layer-right" />
      <div className="accent-glow-layer-left-lower" />
      <div className="pointer-events-none fixed inset-0 bg-white/80 dark:bg-black/80 [mask-image:radial-gradient(ellipse_at_center,transparent_18%,black)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-10">
        <Link
          href="/skills"
          className="inline-flex w-fit items-center gap-1.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <CaretLeft className="h-3 w-3" />
          {t("setup.actions.back")}
        </Link>

        <header className="space-y-5">
          <h1 className={`${geist.className} text-3xl font-bold leading-tight text-neutral-950 dark:text-neutral-50 sm:text-4xl`}>
            {t("setup.hero.title")}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
            {t("setup.hero.description")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SKILLS_SETUP_AGENT_TARGETS.map((target) => (
              <span
                key={target}
                className="rounded-full border border-neutral-200/60 bg-neutral-50/80 px-2.5 py-0.5 font-mono text-[0.65rem] text-neutral-500 dark:border-neutral-800/60 dark:bg-neutral-900/50 dark:text-neutral-400"
              >
                {target}
              </span>
            ))}
          </div>
        </header>

        <ScriptTerminal
          content={script}
          copiedLabel={t("setup.actions.copied")}
          copyLabel={t("setup.actions.copy")}
          downloadHref={SKILLS_SETUP_DOWNLOAD_PATH}
          downloadLabel={SKILLS_SETUP_FILENAME}
          downloadText={t("setup.actions.download")}
          language="powershell"
          title={SKILLS_SETUP_FILENAME}
        />
      </div>
    </main>
  );
}
