"use client";

import {
  IconBrandDocker,
  IconCertificate,
  IconClock,
  IconServer2,
  IconTerminal2,
} from "@tabler/icons-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CaretLeft } from "phosphor-react";
import type { ComponentType } from "react";

import { geist } from "@/app/fonts";
import { CertConverter } from "@/components/pages/vault-tools/cert-converter";
import { CrontabConverter } from "@/components/pages/vault-tools/crontab-converter";
import { DockerComposeConverter } from "@/components/pages/vault-tools/docker-compose-converter";
import { HostnameGenerator } from "@/components/pages/vault-tools/hostname-generator";
import { QuickCommands } from "@/components/pages/vault-tools/quick-commands";
import { cn } from "@/lib/utils";
import type { VaultToolDefinition, VaultToolKey } from "@/lib/vault";

type IconComponent = ComponentType<{ className?: string; stroke?: number }>;

const TOOL_ICONS: Record<VaultToolKey, IconComponent> = {
  certConverter: IconCertificate,
  dockerCompose: IconBrandDocker,
  crontabConverter: IconClock,
  quickCommands: IconTerminal2,
  hostnameGenerator: IconServer2,
};

type VaultToolPageContentProps = {
  tool: VaultToolDefinition;
};

const TOOL_COMPONENTS: Partial<Record<VaultToolKey, React.ComponentType>> = {
  certConverter: CertConverter,
  dockerCompose: DockerComposeConverter,
  crontabConverter: CrontabConverter,
  quickCommands: QuickCommands,
  hostnameGenerator: HostnameGenerator,
};

export function VaultToolPageContent({ tool }: VaultToolPageContentProps) {
  const t = useTranslations("vault");
  const IconComponent = TOOL_ICONS[tool.key];
  const ToolComponent = TOOL_COMPONENTS[tool.key];
  const hasImplementation = !!ToolComponent;

  return (
    <main className="relative w-full min-h-screen overflow-hidden bg-transparent">
      <div className="accent-glow-layer-right" />
      <div className="accent-glow-layer-left-lower" />
      <div className="pointer-events-none absolute inset-0 bg-white/80 dark:bg-black/80 [mask-image:radial-gradient(ellipse_at_center,transparent_18%,black)]" />

      <section className="relative z-10 px-6 py-24 sm:py-28">
        <div
          className={cn(
            "mx-auto w-full space-y-10",
            hasImplementation ? "max-w-6xl xl:max-w-7xl" : "max-w-3xl"
          )}
        >
          <div className="relative overflow-hidden rounded-3xl border border-neutral-200/60 bg-white/70 p-8 shadow-xl backdrop-blur-xl dark:border-neutral-800/70 dark:bg-neutral-950/60 sm:p-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--accent-glow)]/20 blur-[100px]" />

            <Link
              href="/vault"
              className="relative z-10 mb-6 inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              <CaretLeft className="h-3 w-3" />
              {t("actions.backToVault")}
            </Link>

            <div className="relative space-y-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-4">
                  <h1
                    className={`${geist.className} text-3xl font-bold text-neutral-900 dark:text-neutral-50 sm:text-4xl`}
                  >
                    {t(`tools.${tool.key}.title`)}
                  </h1>
                  <p className="max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {t(`tools.${tool.key}.description`)}
                  </p>
                </div>

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-neutral-900/90 text-[hsl(var(--accent))] shadow-xl ring-1 ring-white/10 dark:bg-white/10">
                  <IconComponent className="h-8 w-8" stroke={1.5} />
                </div>
              </div>

              {ToolComponent ? (
                <ToolComponent />
              ) : (
                <div className="rounded-[28px] border border-dashed border-neutral-200/80 bg-neutral-50/80 p-8 text-center dark:border-neutral-700/70 dark:bg-neutral-950/40">
                  <p
                    className={`${geist.className} text-xs uppercase tracking-[0.35em] text-neutral-500 dark:text-neutral-400`}
                  >
                    {t("toolPage.status")}
                  </p>
                  <h2
                    className={`${geist.className} mt-4 text-2xl font-semibold text-neutral-900 dark:text-neutral-50`}
                  >
                    {t("toolPage.comingSoonTitle")}
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {t("toolPage.comingSoonBody")}
                  </p>
                  <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {t(`tools.${tool.key}.comingSoon`)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
