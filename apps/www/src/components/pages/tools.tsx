"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import type { ComponentType } from "react";
import {
  IconAppWindow,
  IconApps,
  IconBrandDocker,
  IconBrandFigma,
  IconBrandGit,
  IconBrandGithub,
  IconBrandJavascript,
  IconBrandNextjs,
  IconBrandNodejs,
  IconBrandPython,
  IconBrandReact,
  IconBrandRust,
  IconBrandTypescript,
  IconBrandUbuntu,
  IconBrandVscode,
  IconBrandWindows,
  IconCircleLetterD,
  IconCloud,
  IconCpu,
  IconDatabase,
  IconDatabaseCog,
  IconFlame,
  IconNetwork,
  IconServer,
  IconTerminal2,
} from "@tabler/icons-react";

import { geist } from "@/app/fonts";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<{ className?: string; stroke?: number }>;

const ICON_COMPONENTS = {
  typescript: IconBrandTypescript,
  javascript: IconBrandJavascript,
  rust: IconBrandRust,
  python: IconBrandPython,
  database: IconDatabase,
  terminal: IconTerminal2,
  nextjs: IconBrandNextjs,
  react: IconBrandReact,
  node: IconBrandNodejs,
  tauri: IconAppWindow,
  drizzle: IconDatabaseCog,
  hono: IconFlame,
  vscode: IconBrandVscode,
  git: IconBrandGit,
  docker: IconBrandDocker,
  github: IconBrandGithub,
  figma: IconBrandFigma,
  cloud: IconCloud,
  windows: IconBrandWindows,
  ubuntu: IconBrandUbuntu,
  debian: IconCircleLetterD,
  proxmox: IconServer,
  hyperv: IconCpu,
  vmware: IconNetwork,
  fallback: IconApps,
} as const satisfies Record<string, IconComponent>;

type IconRegistryKey = keyof typeof ICON_COMPONENTS;
type IconKey = Exclude<IconRegistryKey, "fallback">;
type CategoryKey = "languages" | "frameworks" | "tooling" | "operatingSystems";

type ToolImage = {
  src: string;
  alt?: string;
};

type ToolItemDefinition = {
  key: string;
  icon?: IconKey;
  image?: ToolImage;
  accentClass: string;
};

type ToolCategoryDefinition = {
  key: CategoryKey;
  accentClass: string;
  gradientClass: string;
  glowClass: string;
  items: readonly ToolItemDefinition[];
};

const TOOL_CATEGORIES = [
  {
    key: "languages",
    accentClass: "text-emerald-500 dark:text-emerald-400",
    gradientClass: "from-emerald-400/35 via-emerald-400/10 to-transparent",
    glowClass: "bg-emerald-400/30",
    items: [
      {
        key: "typescript",
        icon: "typescript",
        accentClass: "from-sky-500/25 via-sky-500/10 to-transparent",
      },
      {
        key: "javascript",
        icon: "javascript",
        accentClass: "from-amber-500/25 via-amber-500/10 to-transparent",
      },
      {
        key: "rust",
        icon: "rust",
        accentClass: "from-orange-500/30 via-orange-500/15 to-transparent",
      },
      {
        key: "python",
        icon: "python",
        accentClass: "from-indigo-500/25 via-indigo-500/10 to-transparent",
      },
      {
        key: "sql",
        icon: "database",
        accentClass: "from-emerald-500/25 via-emerald-500/10 to-transparent",
      },
      {
        key: "shell",
        icon: "terminal",
        accentClass: "from-neutral-500/25 via-neutral-500/10 to-transparent",
      },
    ],
  },
  {
    key: "frameworks",
    accentClass: "text-sky-500 dark:text-sky-400",
    gradientClass: "from-sky-400/35 via-sky-400/10 to-transparent",
    glowClass: "bg-sky-400/30",
    items: [
      {
        key: "nextjs",
        icon: "nextjs",
        accentClass: "from-neutral-500/30 via-neutral-500/10 to-transparent",
      },
      {
        key: "react",
        icon: "react",
        accentClass: "from-sky-500/30 via-sky-500/10 to-transparent",
      },
      {
        key: "node",
        icon: "node",
        accentClass: "from-lime-500/25 via-lime-500/10 to-transparent",
      },
      {
        key: "tauri",
        icon: "tauri",
        accentClass: "from-amber-500/25 via-amber-500/10 to-transparent",
      },
      {
        key: "drizzle",
        icon: "drizzle",
        accentClass: "from-emerald-500/25 via-emerald-500/10 to-transparent",
      },
      {
        key: "hono",
        icon: "hono",
        accentClass: "from-orange-500/25 via-orange-500/10 to-transparent",
      },
    ],
  },
  {
    key: "tooling",
    accentClass: "text-amber-500 dark:text-amber-400",
    gradientClass: "from-amber-400/35 via-amber-400/10 to-transparent",
    glowClass: "bg-amber-400/30",
    items: [
      {
        key: "vscode",
        icon: "vscode",
        accentClass: "from-sky-500/25 via-sky-500/10 to-transparent",
      },
      {
        key: "git",
        icon: "git",
        accentClass: "from-rose-500/25 via-rose-500/10 to-transparent",
      },
      {
        key: "docker",
        icon: "docker",
        accentClass: "from-blue-500/25 via-blue-500/10 to-transparent",
      },
      {
        key: "github",
        icon: "github",
        accentClass: "from-neutral-500/25 via-neutral-500/10 to-transparent",
      },
      {
        key: "figma",
        icon: "figma",
        accentClass: "from-purple-500/25 via-purple-500/10 to-transparent",
      },
      {
        key: "cloudflare",
        icon: "cloud",
        accentClass: "from-orange-500/25 via-orange-500/10 to-transparent",
      },
    ],
  },
  {
    key: "operatingSystems",
    accentClass: "text-violet-500 dark:text-violet-400",
    gradientClass: "from-violet-400/35 via-violet-400/10 to-transparent",
    glowClass: "bg-violet-400/30",
    items: [
      {
        key: "windows",
        icon: "windows",
        accentClass: "from-sky-500/25 via-sky-500/10 to-transparent",
      },
      {
        key: "ubuntu",
        icon: "ubuntu",
        accentClass: "from-orange-500/25 via-orange-500/10 to-transparent",
      },
      {
        key: "debian",
        icon: "debian",
        accentClass: "from-rose-500/25 via-rose-500/10 to-transparent",
      },
      {
        key: "proxmox",
        icon: "proxmox",
        accentClass: "from-amber-500/25 via-amber-500/10 to-transparent",
      },
      {
        key: "hyperv",
        icon: "hyperv",
        accentClass: "from-indigo-500/25 via-indigo-500/10 to-transparent",
      },
      {
        key: "vmware",
        icon: "vmware",
        accentClass: "from-blue-500/25 via-blue-500/10 to-transparent",
      },
    ],
  },
] satisfies readonly ToolCategoryDefinition[];

export function Tools() {
  const t = useTranslations("tools");
  const accentLabel = t("accent");
  const showAccentLabel = accentLabel.trim().length > 0;

  return (
    <section id="tools" className="relative w-full min-h-[70vh] sm:min-h-[80vh] md:min-h-screen">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 [background-size:36px_36px] [background-image:linear-gradient(to_right,rgba(212,212,216,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(212,212,216,0.35)_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,rgba(63,63,70,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(63,63,70,0.6)_1px,transparent_1px)]" />
        <div className="accent-glow-layer-right" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-white/60 to-white dark:from-neutral-950 dark:via-neutral-950/60 dark:to-neutral-950 [mask-image:radial-gradient(ellipse_at_center,transparent_18%,black)]" />
        <div className="pointer-events-none absolute left-[-10%] top-[15%] h-[420px] w-[420px] rounded-full bg-emerald-400/20 blur-[140px] dark:bg-emerald-500/10" />
        <div className="pointer-events-none absolute right-[-12%] bottom-[12%] h-[380px] w-[380px] rounded-full bg-sky-400/20 blur-[140px] dark:bg-sky-500/10" />
      </div>

      <div className="relative min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh]">
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
          {showAccentLabel ? (
            <p
              className={cn(
                geist.className,
                "text-[0.65rem] uppercase tracking-[0.3em] text-emerald-500/80 dark:text-emerald-400/80 mt-20 sm:mt-24 md:mt-28"
              )}
            >
              {accentLabel}
            </p>
          ) : (
            <div className="mt-20 sm:mt-24 md:mt-28" />
          )}
          <h2
            className={cn(
              geist.className,
              "text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50"
            )}
          >
            {t("title")}
          </h2>
          <p className="max-w-2xl text-sm sm:text-base text-neutral-600 dark:text-neutral-300">{t("subtitle")}</p>
        </div>
      </div>

      <div className="relative z-10 px-6 -mt-12 sm:-mt-16 md:-mt-24 pb-24">
        <div className="mx-auto w-full max-w-7xl space-y-12">
          <p className="mx-auto max-w-3xl text-center text-sm text-neutral-600 dark:text-neutral-300">{t("description")}</p>
          <div className="grid gap-8 lg:grid-cols-2">
            {TOOL_CATEGORIES.map((category, index) => (
              <ToolCategoryCard key={category.key} category={category} index={index} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

type ToolCategoryCardProps = {
  category: ToolCategoryDefinition;
  index: number;
  t: ReturnType<typeof useTranslations>;
};

function ToolCategoryCard({ category, index, t }: ToolCategoryCardProps) {
  const label = t(`categories.${category.key}.label`);
  const headline = t(`categories.${category.key}.headline`);
  const description = t(`categories.${category.key}.description`);

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-[32px] border border-neutral-200/70 bg-white/80 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.55)] backdrop-blur-xl transition hover:shadow-[0_50px_140px_-60px_rgba(15,23,42,0.65)] dark:border-neutral-800/80 dark:bg-neutral-900/60"
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60", category.gradientClass)} />
      <div
        className={cn(
          "pointer-events-none absolute inset-x-[-10%] top-[-35%] h-[70%] rounded-full opacity-0 blur-3xl transition duration-700 group-hover:opacity-70",
          category.glowClass
        )}
      />
      <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-white/20 dark:border-white/5" />
      <div className="relative flex flex-col gap-8 p-8 sm:p-10">
        <header className="space-y-4">
          <p
            className={cn(
              geist.className,
              "text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400",
              category.accentClass
            )}
          >
            {label}
          </p>
          <h3
            className={cn(
              geist.className,
              "text-2xl sm:text-[1.7rem] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
            )}
          >
            {headline}
          </h3>
          <p className="max-w-lg text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
        </header>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {category.items.map((item) => (
            <SkillBadge key={`${category.key}-${item.key}`} item={item} label={t(`categories.${category.key}.items.${item.key}`)} />
          ))}
        </div>
      </div>
    </motion.article>
  );
}

type SkillBadgeProps = {
  item: ToolItemDefinition;
  label: string;
};

function SkillBadge({ item, label }: SkillBadgeProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white/80 p-4 text-center shadow-sm backdrop-blur-md transition dark:border-neutral-800/70 dark:bg-neutral-950/60"
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/30 dark:border-white/10" />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition duration-500 group-hover:opacity-100",
          item.accentClass
        )}
      />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-lg ring-1 ring-white/15 transition group-hover:-translate-y-0.5 dark:bg-white/10 dark:text-white">
        {item.image ? (
          <Image
            src={item.image.src}
            alt={item.image.alt ?? label}
            width={48}
            height={48}
            loading="lazy"
            className="h-6 w-6 object-contain"
            draggable={false}
          />
        ) : (
          renderIcon(item.icon, "h-6 w-6")
        )}
      </div>
      <span className="relative text-sm font-medium text-neutral-700 transition group-hover:text-neutral-900 dark:text-neutral-200 dark:group-hover:text-neutral-50">
        {label}
      </span>
    </motion.div>
  );
}

function renderIcon(iconKey: IconKey | undefined, className: string) {
  const registryKey: IconRegistryKey = iconKey ?? "fallback";
  const IconComponent = ICON_COMPONENTS[registryKey];
  return <IconComponent className={className} stroke={1.6} />;
}

