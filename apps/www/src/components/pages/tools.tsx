"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { useCallback, type ComponentType } from "react";
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
import { sectionHeadingClass } from "@/components/common/section-heading";
import {
  type GsapSectionSetup,
  useGsapSection,
} from "@/lib/gsap-animations";
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

const HOVER_GRADIENTS = {
  amber: "from-amber-500/35 via-amber-500/18 to-amber-500/6 dark:from-amber-400/28 dark:via-amber-400/14 dark:to-amber-400/7",
  blue: "from-blue-500/35 via-blue-500/18 to-blue-500/7 dark:from-blue-400/28 dark:via-blue-400/14 dark:to-blue-400/7",
  emerald: "from-emerald-500/35 via-emerald-500/18 to-emerald-500/6 dark:from-emerald-400/28 dark:via-emerald-400/14 dark:to-emerald-400/6",
  fuchsia: "from-fuchsia-500/35 via-fuchsia-500/18 to-fuchsia-500/7 dark:from-fuchsia-400/28 dark:via-fuchsia-400/14 dark:to-fuchsia-400/7",
  indigo: "from-indigo-500/35 via-indigo-500/18 to-indigo-500/7 dark:from-indigo-400/28 dark:via-indigo-400/14 dark:to-indigo-400/7",
  lime: "from-lime-500/35 via-lime-500/18 to-lime-500/6 dark:from-lime-400/26 dark:via-lime-400/13 dark:to-lime-400/6",
  neutral: "from-neutral-500/30 via-neutral-500/15 to-neutral-500/6 dark:from-neutral-400/22 dark:via-neutral-400/12 dark:to-neutral-400/6",
  orange: "from-orange-500/40 via-orange-500/20 to-orange-500/8 dark:from-orange-400/30 dark:via-orange-400/16 dark:to-orange-400/8",
  purple: "from-purple-500/35 via-purple-500/18 to-purple-500/7 dark:from-purple-400/26 dark:via-purple-400/13 dark:to-purple-400/6",
  rose: "from-rose-500/35 via-rose-500/18 to-rose-500/6 dark:from-rose-400/28 dark:via-rose-400/14 dark:to-rose-400/6",
  sky: "from-sky-500/35 via-sky-500/18 to-sky-500/6 dark:from-sky-400/28 dark:via-sky-400/14 dark:to-sky-400/6",
  slate: "from-slate-500/30 via-slate-500/15 to-slate-500/6 dark:from-slate-400/24 dark:via-slate-400/12 dark:to-slate-400/6",
  violet: "from-violet-500/35 via-violet-500/18 to-violet-500/7 dark:from-violet-400/28 dark:via-violet-400/14 dark:to-violet-400/7",
} as const satisfies Record<string, string>;

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
            accentClass: HOVER_GRADIENTS.sky,
      },
      {
        key: "javascript",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-plain.svg",
          alt: "JavaScript",
        },
        href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
            accentClass: HOVER_GRADIENTS.amber,
      },
      {
        key: "rust",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg",
          alt: "Rust",
        },
        href: "https://www.rust-lang.org/",
            accentClass: HOVER_GRADIENTS.orange,
      },
      {
        key: "python",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-plain.svg",
          alt: "Python",
        },
        href: "https://www.python.org/",
            accentClass: HOVER_GRADIENTS.indigo,
      },
      {
        key: "sql",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-plain.svg",
          alt: "SQL",
        },
        href: "https://www.postgresql.org/",
            accentClass: HOVER_GRADIENTS.emerald,
      },
      {
        key: "shell",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/powershell/powershell-original.svg",
          alt: "Shell & PowerShell",
        },
        href: "https://learn.microsoft.com/powershell/",
            accentClass: HOVER_GRADIENTS.slate,
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
            accentClass: HOVER_GRADIENTS.neutral,
      },
      {
        key: "react",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
          alt: "React",
        },
        href: "https://react.dev/",
            accentClass: HOVER_GRADIENTS.sky,
      },
      {
        key: "node",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-plain.svg",
          alt: "Node.js",
        },
        href: "https://nodejs.org/",
            accentClass: HOVER_GRADIENTS.lime,
      },
      {
        key: "tauri",
        image: {
          src: "/asstes/tools/tauri.png",
          alt: "Tauri",
        },
        href: "https://tauri.app/",
            accentClass: HOVER_GRADIENTS.amber,
      },
      {
        key: "drizzle",
        image: {
          src: "/asstes/tools/drizzle.svg",
          alt: "Drizzle ORM",
        },
        href: "https://orm.drizzle.team/",
            accentClass: HOVER_GRADIENTS.emerald,
      },
      {
        key: "hono",
        image: {
          src: "/asstes/tools/hono.svg",
          alt: "Hono",
        },
        href: "https://hono.dev/",
            accentClass: HOVER_GRADIENTS.orange,
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
            accentClass: HOVER_GRADIENTS.sky,
      },
      {
        key: "cursor",
        image: { src: "/asstes/tools/cursor.png", alt: "Cursor" },
        href: "https://www.cursor.com/",
            accentClass: HOVER_GRADIENTS.violet,
      },
      {
        key: "tabby",
        image: { src: "/asstes/tools/tabby.png", alt: "Tabby" },
        href: "https://tabby.sh/",
            accentClass: HOVER_GRADIENTS.emerald,
      },
      {
        key: "podmanDesktop",
        image: { src: "/asstes/tools/podmandesktop.png", alt: "Podman Desktop" },
        href: "https://podman-desktop.io/",
            accentClass: HOVER_GRADIENTS.blue,
      },
      {
        key: "lmStudio",
        image: { src: "/asstes/tools/lmstudio.png", alt: "LM Studio" },
        href: "https://lmstudio.ai/",
            accentClass: HOVER_GRADIENTS.purple,
      },
      {
        key: "beekeeperStudio",
        image: { src: "/asstes/tools/beekeeperstudio.png", alt: "Beekeeper Studio" },
        href: "https://www.beekeeperstudio.io/",
            accentClass: HOVER_GRADIENTS.amber,
      },
      {
        key: "git",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-plain.svg",
          alt: "Git",
        },
        href: "https://git-scm.com/",
            accentClass: HOVER_GRADIENTS.orange,
      },
      {
        key: "docker",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-plain.svg",
          alt: "Docker",
        },
        href: "https://www.docker.com/",
            accentClass: HOVER_GRADIENTS.blue,
      },
      {
        key: "figma",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
          alt: "Figma",
        },
        href: "https://www.figma.com/",
            accentClass: HOVER_GRADIENTS.fuchsia,
      },
      {
        key: "cloudflare",
        image: {
              src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cloudflare/cloudflare-original.svg",
          alt: "Cloudflare",
        },
        href: "https://www.cloudflare.com/",
            accentClass: HOVER_GRADIENTS.orange,
      },
      {
        key: "github",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
          alt: "GitHub",
        },
        href: "https://github.com/",
            accentClass: HOVER_GRADIENTS.neutral,
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
            accentClass: HOVER_GRADIENTS.blue,
      },
      {
        key: "debian",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/debian/debian-plain.svg",
          alt: "Debian",
        },
        href: "https://www.debian.org/",
            accentClass: HOVER_GRADIENTS.rose,
      },
      {
        key: "kubernetes",
        image: {
          src: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg",
          alt: "Kubernetes",
        },
        href: "https://kubernetes.io/",
            accentClass: HOVER_GRADIENTS.sky,
      },
      {
        key: "proxmox",
        image: {
          src: "https://cdn.simpleicons.org/proxmox/F15A24",
          alt: "Proxmox VE",
        },
        href: "https://www.proxmox.com/",
            accentClass: HOVER_GRADIENTS.orange,
      },
      {
        key: "hyperv",
        image: {
          src: "/asstes/tools/hyperv.svg",
          alt: "Hyper-V",
        },
        href: "https://learn.microsoft.com/windows-server/virtualization/hyper-v/hyper-v-technology-overview",
            accentClass: HOVER_GRADIENTS.indigo,
      },
      {
        key: "vmware",
        image: {
          src: "https://cdn.simpleicons.org/vmware/607078",
          alt: "VMware ESXi",
        },
        href: "https://www.vmware.com/products/esxi-and-esx.html",
            accentClass: HOVER_GRADIENTS.blue,
      },
    ],
  },
] satisfies readonly ToolSectionDefinition[];

export function Tools() {
  const t = useTranslations("tools");
  const toolsAnimation = useCallback<GsapSectionSetup<HTMLDivElement>>(({ node, gsap }) => {
    const ease = "power2.out";

    const heading = node.querySelector<HTMLElement>("[data-animate='section-heading']");
    if (heading) {
      gsap.fromTo(heading, { y: 20, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.45, ease,
        scrollTrigger: { trigger: heading, start: "top 88%", once: true },
        clearProps: "all",
      });
    }

    const copies = node.querySelectorAll<HTMLElement>("[data-animate='section-copy']");
    copies.forEach((copy, index) => {
      gsap.fromTo(copy, { y: 12, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.3, ease, delay: index * 0.04,
        scrollTrigger: { trigger: copy, start: "top 88%", once: true },
        clearProps: "all",
      });
    });

    const sections = node.querySelectorAll<HTMLElement>("[data-animate='tool-section']");
    sections.forEach((block) => {
      gsap.fromTo(block, { y: 35, opacity: 0, scale: 0.98 }, {
        y: 0, opacity: 1, scale: 1, duration: 0.5, ease,
        scrollTrigger: { trigger: block, start: "top 82%", once: true },
        clearProps: "transform,opacity",
      });

      const cards = block.querySelectorAll<HTMLElement>("[data-animate='tool-card']");
      if (cards.length > 0) {
        gsap.fromTo(cards, { y: 16, opacity: 0, scale: 0.95 }, {
          y: 0, opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.4)",
          stagger: 0.03,
          scrollTrigger: { trigger: block, start: "top 80%", once: true },
          clearProps: "transform,opacity",
        });
      }
    });
  }, []);
  const sectionRef = useGsapSection<HTMLDivElement>(toolsAnimation);

  return (
    <section
      ref={sectionRef}
      id="tools"
      className="relative w-full min-h-[70vh] sm:min-h-[80vh] md:min-h-screen overflow-hidden"
    >
      <div className="absolute inset-0 [background-size:28px_28px] [background-image:radial-gradient(#b9b9b9_1px,transparent_1px)] dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]" />
      <div className="accent-glow-layer-right" />
      <div className="accent-glow-layer-left-lower" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="relative min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh]">
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <h2
            data-animate="section-heading"
            className={sectionHeadingClass("mt-16 text-center sm:mt-20 md:mt-24")}
          >
            {t("title")}
          </h2>
          <div className="max-w-3xl space-y-2">
            <p
              data-animate="section-copy"
              className="text-base leading-relaxed text-neutral-600 sm:text-lg dark:text-neutral-300"
            >
              {t("subtitle")}
            </p>
            <p
              data-animate="section-copy"
              className="text-base leading-relaxed text-neutral-500 sm:text-lg dark:text-neutral-400"
            >
              {t("description")}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-6 pb-28 pt-10 sm:pt-16">
        <div className="mx-auto w-full max-w-6xl space-y-16">
          {TOOL_SECTIONS.map((section) => (
            <ToolSection key={section.key} section={section} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

type ToolSectionProps = {
  section: ToolSectionDefinition;
  t: ReturnType<typeof useTranslations>;
};

function ToolSection({ section, t }: ToolSectionProps) {
  const label = t(`categories.${section.key}.label`);
  const headline = t(`categories.${section.key}.headline`);
  const description = t(`categories.${section.key}.description`);

  return (
    <section
      data-animate="tool-section"
      className="group relative overflow-hidden rounded-2xl transition-transform duration-500 hover:-translate-y-1"
    >
      <div className="relative flex flex-col gap-0 lg:flex-row">
        <div
          className={cn(
            "relative flex flex-col justify-center gap-4 rounded-t-2xl border border-b-0 px-8 py-10 backdrop-blur-xl sm:px-10 sm:py-12 lg:w-[340px] lg:shrink-0 lg:rounded-l-2xl lg:rounded-tr-none lg:border-b lg:border-r-0 xl:w-[380px]",
            "bg-white/70 dark:bg-neutral-950/60",
            section.borderClass,
          )}
        >
          <div className="pointer-events-none absolute inset-0 rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none">
            <div className={cn("absolute -left-16 -top-16 h-48 w-48 rounded-full blur-[100px] opacity-60", section.haloClass)} />
          </div>
          <div className="relative">
            <span
              className={cn(
                geist.className,
                "inline-block text-[0.65rem] font-semibold uppercase tracking-[0.35em]",
                section.accentClass,
              )}
            >
              {label}
            </span>
            <h3
              className={cn(
                geist.className,
                "mt-3 text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.75rem] dark:text-neutral-50",
              )}
            >
              {headline}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{description}</p>
          </div>
        </div>

        <div
          className={cn(
            "flex-1 rounded-b-2xl border border-t-0 bg-white/50 px-6 py-8 backdrop-blur-xl sm:px-8 sm:py-10 lg:rounded-r-2xl lg:rounded-bl-none lg:border-l-0 lg:border-t",
            "dark:bg-neutral-950/30",
            section.borderClass,
          )}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {section.items.map((item) => (
              <ToolLinkCard
                key={`${section.key}-${item.key}`}
                item={item}
                label={t(`categories.${section.key}.items.${item.key}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
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
      className="group/card relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/60 focus-visible:ring-offset-1 dark:focus-visible:ring-neutral-100/60"
    >
      <motion.div
        data-animate="tool-card"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="relative flex flex-col items-center gap-2.5 overflow-hidden rounded-xl p-3 text-center transition sm:p-4"
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-xl opacity-0 transition duration-300 group-hover/card:opacity-100",
            "bg-neutral-100/70 dark:bg-white/5",
          )}
        />
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-neutral-900/90 shadow-md ring-1 ring-white/10 transition-transform group-hover/card:-translate-y-0.5 dark:bg-white/10 sm:h-12 sm:w-12">
          {item.image ? (
            <Image
              src={item.image.src}
              alt={item.image.alt ?? label}
              width={48}
              height={48}
              loading="lazy"
              className="h-7 w-7 object-contain sm:h-8 sm:w-8"
              draggable={false}
            />
          ) : (
            renderIcon(item.icon, "h-5 w-5 sm:h-6 sm:w-6")
          )}
        </div>
        <span className="relative text-[0.7rem] font-medium leading-tight text-neutral-600 transition group-hover/card:text-neutral-900 dark:text-neutral-400 dark:group-hover/card:text-neutral-100 sm:text-xs">
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


