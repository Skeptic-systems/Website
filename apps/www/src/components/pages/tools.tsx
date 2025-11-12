"use client";

import Image from "next/image";
import Link from "next/link";
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
  href: string;
  accentClass: string;
};

type ToolSectionDefinition = {
  key: CategoryKey;
  accentClass: string;
  backgroundClass: string;
  haloClass: string;
  borderClass: string;
  items: readonly ToolItemDefinition[];
};

const TOOL_SECTIONS = [
  {
    key: "languages",
    accentClass: "text-emerald-500 dark:text-emerald-300",
    backgroundClass: "from-emerald-500/14 via-emerald-500/6 to-transparent",
    haloClass: "bg-emerald-400/18",
    borderClass: "border-emerald-400/30 dark:border-emerald-400/25",
    items: [
      {
        key: "typescript",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-plain.svg",
          alt: "TypeScript",
        },
        href: "https://www.typescriptlang.org/",
        accentClass: "from-sky-500/25 via-sky-500/10 to-transparent",
      },
      {
        key: "javascript",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-plain.svg",
          alt: "JavaScript",
        },
        href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        accentClass: "from-amber-500/25 via-amber-500/10 to-transparent",
      },
      {
        key: "rust",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg",
          alt: "Rust",
        },
        href: "https://www.rust-lang.org/",
        accentClass: "from-orange-500/30 via-orange-500/15 to-transparent",
      },
      {
        key: "python",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-plain.svg",
          alt: "Python",
        },
        href: "https://www.python.org/",
        accentClass: "from-indigo-500/25 via-indigo-500/10 to-transparent",
      },
      {
        key: "sql",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-plain.svg",
          alt: "SQL",
        },
        href: "https://www.postgresql.org/",
        accentClass: "from-emerald-500/25 via-emerald-500/10 to-transparent",
      },
      {
        key: "shell",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/powershell/powershell-original.svg",
          alt: "Shell & PowerShell",
        },
        href: "https://learn.microsoft.com/powershell/",
        accentClass: "from-neutral-400/25 via-neutral-400/10 to-transparent",
      },
    ],
  },
  {
    key: "frameworks",
    accentClass: "text-sky-500 dark:text-sky-300",
    backgroundClass: "from-sky-500/16 via-sky-500/7 to-transparent",
    haloClass: "bg-sky-400/18",
    borderClass: "border-sky-400/30 dark:border-sky-400/25",
    items: [
      {
        key: "nextjs",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
          alt: "Next.js",
        },
        href: "https://nextjs.org/",
        accentClass: "from-neutral-500/30 via-neutral-500/10 to-transparent",
      },
      {
        key: "react",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
          alt: "React",
        },
        href: "https://react.dev/",
        accentClass: "from-sky-500/30 via-sky-500/10 to-transparent",
      },
      {
        key: "node",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-plain.svg",
          alt: "Node.js",
        },
        href: "https://nodejs.org/",
        accentClass: "from-lime-500/25 via-lime-500/10 to-transparent",
      },
      {
        key: "tauri",
        image: {
          src: "/asstes/tools/tauri.png",
          alt: "Tauri",
        },
        href: "https://tauri.app/",
        accentClass: "from-amber-500/25 via-amber-500/10 to-transparent",
      },
      {
        key: "drizzle",
        image: {
          src: "/asstes/tools/drizzle.svg",
          alt: "Drizzle ORM",
        },
        href: "https://orm.drizzle.team/",
        accentClass: "from-emerald-500/25 via-emerald-500/10 to-transparent",
      },
      {
        key: "hono",
        image: {
          src: "/asstes/tools/hono.svg",
          alt: "Hono",
        },
        href: "https://hono.dev/",
        accentClass: "from-orange-500/25 via-orange-500/10 to-transparent",
      },
    ],
  },
  {
    key: "tooling",
    accentClass: "text-amber-500 dark:text-amber-300",
    backgroundClass: "from-amber-500/16 via-amber-500/7 to-transparent",
    haloClass: "bg-amber-400/20",
    borderClass: "border-amber-400/30 dark:border-amber-400/25",
    items: [
      {
        key: "vscode",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg",
          alt: "Visual Studio Code",
        },
        href: "https://code.visualstudio.com/",
        accentClass: "from-sky-500/24 via-sky-500/10 to-transparent",
      },
      {
        key: "cursor",
        image: { src: "/asstes/tools/cursor.png", alt: "Cursor" },
        href: "https://www.cursor.com/",
        accentClass: "from-violet-500/28 via-violet-500/12 to-transparent",
      },
      {
        key: "tabby",
        image: { src: "/asstes/tools/tabby.png", alt: "Tabby" },
        href: "https://tabby.sh/",
        accentClass: "from-emerald-500/25 via-emerald-500/10 to-transparent",
      },
      {
        key: "podmanDesktop",
        image: { src: "/asstes/tools/podmandesktop.png", alt: "Podman Desktop" },
        href: "https://podman-desktop.io/",
        accentClass: "from-blue-500/25 via-blue-500/10 to-transparent",
      },
      {
        key: "lmStudio",
        image: { src: "/asstes/tools/lmstudio.png", alt: "LM Studio" },
        href: "https://lmstudio.ai/",
        accentClass: "from-purple-500/28 via-purple-500/12 to-transparent",
      },
      {
        key: "beekeeperStudio",
        image: { src: "/asstes/tools/beekeeperstudio.png", alt: "Beekeeper Studio" },
        href: "https://www.beekeeperstudio.io/",
        accentClass: "from-amber-500/28 via-amber-500/12 to-transparent",
      },
      {
        key: "git",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-plain.svg",
          alt: "Git",
        },
        href: "https://git-scm.com/",
        accentClass: "from-rose-500/25 via-rose-500/10 to-transparent",
      },
      {
        key: "docker",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-plain.svg",
          alt: "Docker",
        },
        href: "https://www.docker.com/",
        accentClass: "from-blue-500/25 via-blue-500/10 to-transparent",
      },
      {
        key: "figma",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
          alt: "Figma",
        },
        href: "https://www.figma.com/",
        accentClass: "from-fuchsia-500/25 via-fuchsia-500/10 to-transparent",
      },
      {
        key: "cloudflare",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cloudflare/cloudflare-plain.svg",
          alt: "Cloudflare",
        },
        href: "https://www.cloudflare.com/",
        accentClass: "from-orange-500/30 via-orange-500/12 to-transparent",
      },
      {
        key: "github",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
          alt: "GitHub",
        },
        href: "https://github.com/",
        accentClass: "from-neutral-500/24 via-neutral-500/10 to-transparent",
      },
    ],
  },
  {
    key: "operatingSystems",
    accentClass: "text-violet-500 dark:text-violet-300",
    backgroundClass: "from-violet-500/15 via-violet-500/6 to-transparent",
    haloClass: "bg-violet-400/20",
    borderClass: "border-violet-400/30 dark:border-violet-400/25",
    items: [
      {
        key: "windows",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/windows8/windows8-original.svg",
          alt: "Windows",
        },
        href: "https://www.microsoft.com/windows",
        accentClass: "from-sky-500/25 via-sky-500/10 to-transparent",
      },
      {
        key: "debian",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/debian/debian-plain.svg",
          alt: "Debian",
        },
        href: "https://www.debian.org/",
        accentClass: "from-rose-500/25 via-rose-500/10 to-transparent",
      },
      {
        key: "kubernetes",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg",
          alt: "Kubernetes",
        },
        href: "https://kubernetes.io/",
        accentClass: "from-sky-500/25 via-sky-500/10 to-transparent",
      },
      {
        key: "proxmox",
        image: {
          src: "https://cdn.simpleicons.org/proxmox/F15A24",
          alt: "Proxmox VE",
        },
        href: "https://www.proxmox.com/",
        accentClass: "from-amber-500/25 via-amber-500/10 to-transparent",
      },
      {
        key: "hyperv",
        image: {
          src: "/asstes/tools/hyperv.svg",
          alt: "Hyper-V",
        },
        href: "https://learn.microsoft.com/windows-server/virtualization/hyper-v/hyper-v-technology-overview",
        accentClass: "from-indigo-500/25 via-indigo-500/10 to-transparent",
      },
      {
        key: "vmware",
        image: {
          src: "https://cdn.simpleicons.org/vmware/607078",
          alt: "VMware ESXi",
        },
        href: "https://www.vmware.com/products/esxi-and-esx.html",
        accentClass: "from-blue-500/25 via-blue-500/10 to-transparent",
      },
    ],
  },
] satisfies readonly ToolSectionDefinition[];

export function Tools() {
  const t = useTranslations("tools");
  const accentLabel = t("accent");
  const showAccentLabel = accentLabel.trim().length > 0;

  return (
    <section id="tools" className="relative overflow-hidden py-24 sm:py-28 lg:py-36">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/65 to-white dark:from-neutral-950 dark:via-neutral-950/70 dark:to-neutral-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.1),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(147,197,253,0.12),transparent_55%),radial-gradient(circle_at_bottom,_rgba(52,211,153,0.1),transparent_55%)]" />
        <div className="absolute inset-0 [background-image:radial-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:34px_34px] dark:[background-image:radial-gradient(rgba(148,163,184,0.12)_1px,transparent_1px)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 text-center">
        {showAccentLabel ? (
          <p
            className={cn(
              geist.className,
              "inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-50/60 px-4 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-500/90 backdrop-blur-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
            )}
          >
            {accentLabel}
          </p>
        ) : null}
        <div className="space-y-6">
          <h2
            className={cn(
              geist.className,
              "text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl lg:text-[4.25rem] dark:text-neutral-50"
            )}
          >
            {t("title")}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-neutral-600 sm:text-lg dark:text-neutral-300">{t("subtitle")}</p>
          <p className="mx-auto max-w-3xl text-sm text-neutral-500 sm:text-base dark:text-neutral-400">{t("description")}</p>
        </div>
      </div>

      <div className="relative mx-auto mt-20 flex w-full max-w-6xl flex-col gap-14 px-6 sm:gap-16 lg:gap-20">
        {TOOL_SECTIONS.map((section, index) => (
          <ToolSection key={section.key} section={section} index={index} t={t} />
        ))}
      </div>
    </section>
  );
}

type ToolSectionProps = {
  section: ToolSectionDefinition;
  index: number;
  t: ReturnType<typeof useTranslations>;
};

function ToolSection({ section, index, t }: ToolSectionProps) {
  const label = t(`categories.${section.key}.label`);
  const headline = t(`categories.${section.key}.headline`);
  const description = t(`categories.${section.key}.description`);

  return (
    <motion.section
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, delay: index * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/80 shadow-[0_50px_140px_-80px_rgba(15,23,42,0.65)] backdrop-blur-xl transition-transform duration-500 hover:-translate-y-1.5 hover:shadow-[0_60px_160px_-80px_rgba(15,23,42,0.7)] dark:border-neutral-800/70 dark:bg-neutral-950/40",
        section.borderClass
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90", section.backgroundClass)} />
      <div className="pointer-events-none absolute inset-0">
        <div className={cn("absolute -left-24 top-[-30%] h-72 w-72 rounded-full blur-[140px]", section.haloClass)} />
        <div className={cn("absolute -right-16 bottom-[-35%] h-72 w-72 rounded-full blur-[160px]", section.haloClass)} />
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/20 dark:border-white/10" />

      <div className="relative grid gap-10 px-8 py-12 sm:px-12 lg:grid-cols-[minmax(0,0.78fr)_1fr] xl:grid-cols-[minmax(0,0.72fr)_1fr]">
        <header className="flex flex-col gap-4 text-left">
          <span
            className={cn(
              geist.className,
              "inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400",
              section.accentClass
            )}
          >
            {label}
          </span>
          <h3
            className={cn(
              geist.className,
              "text-3xl font-semibold tracking-tight text-neutral-900 sm:text-[2.1rem] dark:text-neutral-50"
            )}
          >
            {headline}
          </h3>
          <p className="max-w-xl text-sm text-neutral-600 sm:text-base dark:text-neutral-300">{description}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {section.items.map((item) => (
            <ToolLinkCard
              key={`${section.key}-${item.key}`}
              item={item}
              label={t(`categories.${section.key}.items.${item.key}`)}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

type ToolLinkCardProps = {
  item: ToolItemDefinition;
  label: string;
};

function ToolLinkCard({ item, label }: ToolLinkCardProps) {
  const isPlaceholder = item.href.trim().length === 0 || item.href === "#";

  return (
    <Link
      href={item.href}
      prefetch={false}
      target={isPlaceholder ? undefined : "_blank"}
      rel={isPlaceholder ? undefined : "noreferrer noopener"}
      className="group/card relative block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-neutral-100/60 dark:focus-visible:ring-offset-neutral-950"
    >
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-neutral-200/60 bg-white/85 p-4 text-center shadow-sm backdrop-blur-md transition dark:border-neutral-800/60 dark:bg-neutral-900/60"
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/25 dark:border-white/10" />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition duration-500 group-hover/card:opacity-100",
            item.accentClass
          )}
        />
        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-lg ring-1 ring-white/20 transition group-hover/card:-translate-y-0.5 dark:bg-white/10 dark:text-white">
          {item.image ? (
            <Image
              src={item.image.src}
              alt={item.image.alt ?? label}
              width={48}
              height={48}
              loading="lazy"
              className="h-8 w-8 object-contain"
              draggable={false}
            />
          ) : (
            renderIcon(item.icon, "h-6 w-6")
          )}
        </div>
        <span className="text-sm font-medium text-neutral-700 transition group-hover/card:text-neutral-900 dark:text-neutral-200 dark:group-hover/card:text-neutral-50">
          {label}
        </span>
      </motion.div>
    </Link>
  );
}

function renderIcon(iconKey: IconKey | undefined, className: string) {
  const registryKey: IconRegistryKey = iconKey ?? "fallback";
  const IconComponent = ICON_COMPONENTS[registryKey];
  return <IconComponent className={className} stroke={1.6} />;
}

