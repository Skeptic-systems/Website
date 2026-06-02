"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, type ComponentType } from "react";
import { motion } from "motion/react";
import {
  IconCertificate,
  IconClock,
  IconBrandDocker,
} from "@tabler/icons-react";
import { Brain, CaretRight } from "phosphor-react";

import { geist } from "@/app/fonts";
import { sectionHeadingClass } from "@/components/common/section-heading";
import {
  type GsapSectionSetup,
  useGsapSection,
} from "@/lib/gsap-animations";
import { buildVaultToolHref, VAULT_TOOLS } from "@/lib/vault";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = ComponentType<Record<string, any>>;

type VaultHighlightItem = {
  key: string;
  href: string;
  icon: IconComponent;
  accent: string;
  glow: string;
};

const HIGHLIGHT_ITEMS: readonly VaultHighlightItem[] = [
  {
    key: "aiSkills",
    href: "/skills",
    icon: Brain,
    accent: "text-amber-500 dark:text-amber-300",
    glow: "rgba(245, 158, 11, 0.15)",
  },
  {
    key: "certConverter",
    href: buildVaultToolHref(VAULT_TOOLS[0]),
    icon: IconCertificate,
    accent: VAULT_TOOLS[0].palette.accent,
    glow: VAULT_TOOLS[0].palette.glow,
  },
  {
    key: "dockerCompose",
    href: buildVaultToolHref(VAULT_TOOLS[1]),
    icon: IconBrandDocker,
    accent: VAULT_TOOLS[1].palette.accent,
    glow: VAULT_TOOLS[1].palette.glow,
  },
  {
    key: "crontabConverter",
    href: buildVaultToolHref(VAULT_TOOLS[2]),
    icon: IconClock,
    accent: VAULT_TOOLS[2].palette.accent,
    glow: VAULT_TOOLS[2].palette.glow,
  },
] as const;

export function VaultHighlight() {
  const t = useTranslations("vaultHighlight");

  const vaultAnimation = useCallback<GsapSectionSetup<HTMLDivElement>>(({ node, gsap }) => {
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

    const cards = node.querySelectorAll<HTMLElement>("[data-animate='vault-hl-card']");
    if (cards.length > 0) {
      gsap.fromTo(cards, { y: 18, opacity: 0, scale: 0.96 }, {
        y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.4)",
        stagger: 0.05,
        scrollTrigger: { trigger: cards[0], start: "top 84%", once: true },
        clearProps: "transform,opacity",
      });
    }
  }, []);

  const sectionRef = useGsapSection<HTMLDivElement>(vaultAnimation);

  return (
    <section
      ref={sectionRef}
      id="vault"
      className="relative w-full overflow-hidden"
    >
      <div className="absolute inset-0 [background-size:40px_40px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]" />
      <div className="accent-glow-layer-right" />
      <div className="accent-glow-layer-left-lower" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="relative z-10 px-6 py-24 sm:py-28">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2
              data-animate="section-heading"
              className={sectionHeadingClass("text-center text-neutral-900 dark:text-neutral-50")}
            >
              {t("headline")}
            </h2>

            <p
              data-animate="section-copy"
              className="max-w-3xl text-base leading-relaxed text-neutral-600 sm:text-lg dark:text-neutral-300"
            >
              {t("description")}
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHT_ITEMS.map((item) => (
              <VaultHighlightCard key={item.key} item={item} t={t} />
            ))}
          </div>

          <div className="mt-10 flex justify-center" data-animate="section-copy">
            <Link
              href="/vault"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-900/10 bg-neutral-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800 dark:border-white/10 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {t("cta")}
              <CaretRight className="h-4 w-4" weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

type VaultHighlightCardProps = {
  item: VaultHighlightItem;
  t: ReturnType<typeof useTranslations<"vaultHighlight">>;
};

function VaultHighlightCard({ item, t }: VaultHighlightCardProps) {
  return (
    <Link href={item.href} className="group block">
      <motion.article
        data-animate="vault-hl-card"
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 350, damping: 24 }}
        className="relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-neutral-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.18)] transition dark:border-neutral-800/70 dark:bg-neutral-900/60"
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(400px circle at 50% 0%, ${item.glow}, transparent 70%)`,
          }}
        />

        <div className="relative flex items-center justify-between gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900/90 text-white shadow-md ring-1 ring-white/10 dark:bg-white/10",
              item.accent,
            )}
          >
            <item.icon className="h-5 w-5" stroke={1.5} weight="fill" size={20} />
          </div>
          <CaretRight
            className="h-4 w-4 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300"
            weight="bold"
          />
        </div>

        <div className="relative min-w-0 flex-1 space-y-1.5">
          <h3 className={`${geist.className} text-base font-bold text-neutral-900 dark:text-neutral-50`}>
            {t(`items.${item.key}.title`)}
          </h3>
          <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t(`items.${item.key}.description`)}
          </p>
        </div>
      </motion.article>
    </Link>
  );
}
