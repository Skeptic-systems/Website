"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, type ComponentType } from "react";
import {
  IconCertificate,
  IconClock,
  IconBrandDocker,
  IconServer2,
  IconTerminal2,
} from "@tabler/icons-react";
import {
  Brain,
  CaretLeft,
  CaretRight,
  type IconWeight,
} from "phosphor-react";

import { geist } from "@/app/fonts";
import { sectionHeadingClass } from "@/components/common/section-heading";
import {
  type GsapSectionSetup,
  useGsapSection,
} from "@/lib/gsap-animations";
import {
  buildVaultToolHref,
  type VaultToolKey,
  VAULT_TOOLS,
} from "@/lib/vault";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<{ className?: string; stroke?: number; weight?: IconWeight; size?: number }>;

const TOOL_ICONS: Record<VaultToolKey, IconComponent> = {
  certConverter: IconCertificate,
  dockerCompose: IconBrandDocker,
  crontabConverter: IconClock,
  quickCommands: IconTerminal2,
  hostnameGenerator: IconServer2,
};

export function VaultPageContent() {
  const t = useTranslations("vault");

  const vaultAnimation = useCallback<GsapSectionSetup<HTMLDivElement>>(({ node, gsap }) => {
    const ease = "power2.out";

    const heroItems = node.querySelectorAll<HTMLElement>("[data-animate='vault-hero']");
    heroItems.forEach((item, index) => {
      gsap.fromTo(
        item,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease,
          delay: index * 0.06,
          clearProps: "all",
        },
      );
    });

    const sections = node.querySelectorAll<HTMLElement>("[data-animate='vault-section']");
    sections.forEach((section) => {
      gsap.fromTo(
        section,
        { y: 36, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.55,
          ease,
          scrollTrigger: { trigger: section, start: "top 84%", once: true },
          clearProps: "transform,opacity",
        },
      );

      const cards = section.querySelectorAll<HTMLElement>("[data-animate='vault-card']");
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { y: 18, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.35,
            ease: "back.out(1.4)",
            stagger: 0.05,
            scrollTrigger: { trigger: section, start: "top 80%", once: true },
            clearProps: "transform,opacity",
          },
        );
      }
    });
  }, []);

  const sectionRef = useGsapSection<HTMLDivElement>(vaultAnimation);

  return (
    <main ref={sectionRef} className="relative w-full min-h-screen overflow-hidden bg-transparent">
      <div className="accent-glow-layer-right" />
      <div className="accent-glow-layer-left-lower" />
      <div className="pointer-events-none absolute inset-0 bg-white/80 dark:bg-black/80 [mask-image:radial-gradient(ellipse_at_center,transparent_18%,black)]" />

      <section className="relative z-10 px-6 pb-28 pt-20 sm:pt-24">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <header className="relative overflow-hidden rounded-3xl border border-neutral-200/60 bg-white/70 p-8 shadow-xl backdrop-blur-xl dark:border-neutral-800/70 dark:bg-neutral-950/60 sm:p-10">
            <Link
              href="/"
              data-animate="vault-hero"
              className="relative z-10 mb-6 inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              <CaretLeft className="h-3 w-3" />
              {t("actions.back")}
            </Link>
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--accent-glow)]/20 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-violet-500/10 blur-[90px]" />

            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="space-y-5">
                <div className="space-y-3">
                  <h1
                    data-animate="vault-hero"
                    className={sectionHeadingClass("text-left")}
                  >
                    {t("meta.title")}
                  </h1>
                  <p
                    data-animate="vault-hero"
                    className="max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-300"
                  >
                    {t("meta.tagline")}
                  </p>
                </div>
              </div>

              <div
                data-animate="vault-hero"
                className="relative overflow-hidden rounded-2xl border border-neutral-200/60 bg-neutral-950 p-5 text-neutral-100 shadow-2xl dark:border-neutral-700/60"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_55%)]" />
                <div className="relative space-y-4">
                  <span className={`${geist.className} text-[0.6rem] uppercase tracking-[0.35em] text-neutral-400`}>
                    {t("meta.previewPath")}
                  </span>

                  <div className="space-y-2 font-mono text-sm leading-relaxed text-neutral-300">
                    <p className="text-emerald-300/90">$ ls /vault</p>
                    <Link href="/skills" className="block transition hover:text-white">
                      ai-skills/
                    </Link>
                    <Link href="/vault/cert-converter" className="block transition hover:text-white">
                      cert-converter/
                    </Link>
                    <Link href="/vault/docker-run-to-compose" className="block transition hover:text-white">
                      docker-run-to-compose/
                    </Link>
                    <Link href="/vault/crontab-converter" className="block transition hover:text-white">
                      crontab-converter/
                    </Link>
                    <Link href="/vault/quick-commands" className="block transition hover:text-white">
                      quick-commands/
                    </Link>
                    <Link href="/vault/hostname-generator" className="block transition hover:text-white">
                      hostname-generator/
                    </Link>
                  </div>

                </div>
              </div>
            </div>
          </header>

          <div data-animate="vault-section" className="grid gap-5 lg:grid-cols-2">
            <Link
              href="/skills"
              data-animate="vault-card"
              className="group relative flex items-center gap-5 overflow-hidden rounded-2xl border border-neutral-200/60 bg-white/70 p-6 shadow-lg backdrop-blur-xl transition hover:border-neutral-300 hover:shadow-xl dark:border-neutral-800/60 dark:bg-neutral-950/50 dark:hover:border-neutral-700"
            >
              <div className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-amber-500/10 blur-[80px]" />
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-900/90 text-amber-400 shadow-md ring-1 ring-white/10 dark:bg-white/10 dark:text-amber-300">
                <Brain className="h-6 w-6" weight="fill" />
              </div>
              <div className="relative min-w-0 flex-1">
                <h2 className={`${geist.className} text-lg font-bold text-neutral-900 dark:text-neutral-50`}>
                  {t("aiSkills.headline")}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {t("aiSkills.description")}
                </p>
              </div>
              <CaretRight className="h-5 w-5 shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300" weight="bold" />
            </Link>

            {VAULT_TOOLS.map((tool) => {
              const IconComponent = TOOL_ICONS[tool.key];
              const href = buildVaultToolHref(tool);

              return (
                <Link
                  key={tool.key}
                  href={href}
                  data-animate="vault-card"
                  className="group relative flex items-center gap-5 overflow-hidden rounded-2xl border border-neutral-200/60 bg-white/70 p-6 shadow-lg backdrop-blur-xl transition hover:border-neutral-300 hover:shadow-xl dark:border-neutral-800/60 dark:bg-neutral-950/50 dark:hover:border-neutral-700"
                >
                  <div
                    className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full blur-[80px]"
                    style={{ backgroundColor: tool.palette.glow }}
                  />
                  <div
                    className={cn(
                      "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-900/90 text-white shadow-md ring-1 ring-white/10 dark:bg-white/10",
                      tool.palette.accent,
                    )}
                  >
                    <IconComponent className="h-6 w-6" stroke={1.5} />
                  </div>
                  <div className="relative min-w-0 flex-1">
                    <h2 className={`${geist.className} text-lg font-bold text-neutral-900 dark:text-neutral-50`}>
                      {t(`tools.${tool.key}.title`)}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {t(`tools.${tool.key}.description`)}
                    </p>
                  </div>
                  <CaretRight className="h-5 w-5 shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300" weight="bold" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
