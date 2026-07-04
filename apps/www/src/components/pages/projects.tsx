"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, CaretRight, GitFork, Star } from "phosphor-react";
import { useCallback } from "react";
import { motion } from "motion/react";

import { geist } from "@/app/fonts";
import { sectionHeadingClass } from "@/components/common/section-heading";
import {
  type GsapSectionSetup,
  useGsapSection,
} from "@/lib/gsap-animations";
import {
  type GitHubPinnedRepository,
  buildRepositorySlug,
  type PinnedResponse,
  formatUpdatedDate,
  getAccentColor,
  hexToRgba,
} from "@/lib/github";
import { requestJson } from "@/lib/request";
import { useSectionIntersection } from "@/lib/use-section-intersection";
import { cn } from "@/lib/utils";

const CARD_HOVER_PALETTES = [
  { glow: "rgba(52, 211, 153, 0.18)", border: "rgba(52, 211, 153, 0.35)" },
  { glow: "rgba(129, 140, 248, 0.18)", border: "rgba(129, 140, 248, 0.35)" },
  { glow: "rgba(251, 191, 36, 0.18)", border: "rgba(251, 191, 36, 0.35)" },
  { glow: "rgba(244, 114, 182, 0.18)", border: "rgba(244, 114, 182, 0.35)" },
  { glow: "rgba(56, 189, 248, 0.18)", border: "rgba(56, 189, 248, 0.35)" },
  { glow: "rgba(167, 139, 250, 0.18)", border: "rgba(167, 139, 250, 0.35)" },
  { glow: "rgba(251, 146, 60, 0.18)", border: "rgba(251, 146, 60, 0.35)" },
  { glow: "rgba(45, 212, 191, 0.18)", border: "rgba(45, 212, 191, 0.35)" },
] as const;

type ProjectCardProps = {
  repository: GitHubPinnedRepository;
  locale: string;
  t: ReturnType<typeof useTranslations>;
  index: number;
};

export function Projects() {
  const t = useTranslations("projects");
  const locale = useLocale();

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const shouldLoadProjects = useSectionIntersection("projects", { rootMargin: "30%" });

  if (!apiBase) {
    throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");
  }

  const repositoriesQuery = useQuery({
    queryKey: ["github", "pinned"],
    queryFn: async ({ signal }) => fetchPinnedRepositories(apiBase, signal),
    enabled: shouldLoadProjects,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const repositories = repositoriesQuery.data ?? [];
  const hasError = repositoriesQuery.isError;
  const isLoading = shouldLoadProjects && repositoriesQuery.isPending;
  const repositoriesSignature = repositories.map((repository) => repository.id).join("|");

  const projectsAnimation = useCallback<GsapSectionSetup<HTMLDivElement>>(
    ({ node, gsap }) => {
      const ease = "power2.out";

      const heading = node.querySelector<HTMLElement>("[data-animate='section-heading']");
      if (heading) {
        gsap.fromTo(heading, { y: 24, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.5, ease,
          scrollTrigger: { trigger: heading, start: "top 85%", once: true },
          clearProps: "all",
        });
      }

      const cards = node.querySelectorAll<HTMLElement>("[data-animate='project-card']");
      const grid = node.querySelector<HTMLElement>("[data-animate='projects-grid']");
      if (cards.length > 0) {
        gsap.fromTo(cards, { y: 30, opacity: 0, scale: 0.97 }, {
          y: 0, opacity: 1, scale: 1, duration: 0.45, ease,
          stagger: 0.06,
          scrollTrigger: { trigger: grid ?? node, start: "top 82%", once: true },
          clearProps: "transform,opacity",
        });
      }
    },
    [repositoriesSignature],
  );

  const sectionRef = useGsapSection<HTMLDivElement>(projectsAnimation);

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="relative w-full min-h-[70vh] sm:min-h-[80vh] md:min-h-screen"
    >
      <div className="absolute inset-0 [background-size:28px_28px] [background-image:radial-gradient(#b9b9b9_1px,transparent_1px)] dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]" />
      <div className="accent-glow-layer-right" />
      <div className="accent-glow-layer-left-lower" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="relative min-h-[32vh] sm:min-h-[36vh] md:min-h-[40vh]">
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <h2
            data-animate="section-heading"
            className={sectionHeadingClass("mt-16 sm:mt-20 md:mt-24")}
          >
            {t("title")}
          </h2>
          <p
            data-animate="section-heading"
            className="text-base text-neutral-500 dark:text-neutral-400 sm:text-lg"
          >
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="relative z-10 px-6 -mt-4 sm:-mt-8 md:-mt-12 pb-24">
        <div className="mx-auto w-full max-w-7xl">

          <div data-animate="projects-grid" className="grid gap-6 md:grid-cols-2">
            {isLoading ? (
              <>
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`project-skeleton-${index}`}
                    className="relative flex h-[280px] w-full flex-col overflow-hidden rounded-2xl border border-neutral-200/50 bg-neutral-50/80 backdrop-blur-md dark:border-neutral-800/60 dark:bg-neutral-900/50"
                  >
                    <div className="flex flex-1 flex-col gap-4 p-6">
                      <div className="flex items-center justify-between">
                        <div className="h-3 w-24 rounded-full bg-neutral-200/60 dark:bg-neutral-700/40" />
                        <div className="h-7 w-7 rounded-full bg-neutral-200/50 dark:bg-neutral-700/30" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-6 w-2/3 rounded-lg bg-neutral-200/70 dark:bg-neutral-700/50" />
                        <div className="h-3 w-full rounded-full bg-neutral-200/50 dark:bg-neutral-700/30" />
                        <div className="h-3 w-4/5 rounded-full bg-neutral-200/40 dark:bg-neutral-700/20" />
                      </div>
                      <div className="mt-auto flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-300/40 dark:bg-emerald-500/20" />
                        <div className="h-2.5 w-2.5 rounded-full bg-sky-300/40 dark:bg-sky-500/20" />
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-300/40 dark:bg-amber-500/20" />
                        <div className="ml-auto flex gap-3">
                          <div className="h-3 w-12 rounded-full bg-neutral-200/50 dark:bg-neutral-700/30" />
                          <div className="h-3 w-12 rounded-full bg-neutral-200/50 dark:bg-neutral-700/30" />
                        </div>
                      </div>
                    </div>
                    <div className="animate-shimmer absolute inset-0" />
                  </div>
                ))}
              </>
            ) : null}

            {hasError ? (
              <div className="col-span-full rounded-2xl border border-red-300/60 bg-red-50/70 p-6 text-red-700 backdrop-blur dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                {t("states.error")}
              </div>
            ) : null}

            {repositoriesQuery.status === "success" && repositories.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-neutral-200/70 bg-white/70 p-6 text-neutral-600 backdrop-blur dark:border-neutral-800/80 dark:bg-neutral-900/70 dark:text-neutral-300">
                {t("states.empty")}
              </div>
            ) : null}

            {repositories.map((repository, index) => (
              <ProjectCard key={repository.id} repository={repository} locale={locale} t={t} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

async function fetchPinnedRepositories(apiBase: string, signal?: AbortSignal): Promise<GitHubPinnedRepository[]> {
  const response = await requestJson<PinnedResponse>(`${apiBase}/github/pinned`, { signal });

  if (!response || !Array.isArray(response.repositories)) {
    throw new Error("Pinned repositories unavailable");
  }

  return response.repositories;
}

function ProjectCard({ repository, locale, t, index }: ProjectCardProps) {
  const updatedAt = formatUpdatedDate(repository.updatedAt, locale);
  const starLabel = t("card.stars", { count: repository.stargazerCount });
  const forkLabel = t("card.forks", { count: repository.forkCount });
  const topics = repository.topics.slice(0, 4);
  const detailHref = `/projects/${encodeURIComponent(buildRepositorySlug(repository))}`;
  const palette = CARD_HOVER_PALETTES[index % CARD_HOVER_PALETTES.length];

  return (
    <motion.article
      data-animate="project-card"
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/50 bg-white/80 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] dark:border-neutral-800/60 dark:bg-neutral-900/60 dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at 50% 0%, ${palette.glow}, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          boxShadow: `inset 0 0 0 1px ${palette.border}`,
        }}
      />

      <div className="relative flex flex-1 flex-col gap-5 p-6">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className={`${geist.className} text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500`}>
              {repository.owner} / {t("card.updated", { date: updatedAt })}
            </p>
            <h4 className={`${geist.className} truncate text-xl font-bold text-neutral-900 dark:text-neutral-50 sm:text-2xl`}>
              {repository.name}
            </h4>
          </div>
          <Link
            href={repository.url}
            target="_blank"
            rel="noreferrer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200/70 text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-700/60 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-100"
            title={t("card.openExternal")}
          >
            <ArrowUpRight size={16} weight="bold" />
          </Link>
        </header>

        {repository.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
            {repository.description}
          </p>
        ) : null}

        <div className="mt-auto space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {repository.languages.map((language) => {
              const color = getAccentColor(language);
              return (
                <span
                  key={language.name}
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.65rem] font-medium text-neutral-600 dark:text-neutral-300"
                  style={{ backgroundColor: hexToRgba(color, 0.1) }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {language.name}
                </span>
              );
            })}
          </div>

          {topics.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {topics.map((topic) => (
                <span
                  key={topic.name}
                  className="rounded-md bg-neutral-100/80 px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wider text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400"
                >
                  {topic.name}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-neutral-100/80 pt-4 dark:border-neutral-800/60">
            <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="inline-flex items-center gap-1.5">
                <Star weight="fill" className="h-3.5 w-3.5 text-amber-400" />
                {starLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GitFork weight="bold" className="h-3.5 w-3.5 text-emerald-400" />
                {forkLabel}
              </span>
              {repository.homepageUrl ? (
                <Link
                  href={repository.homepageUrl}
                  className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-neutral-400 transition hover:text-neutral-700 dark:hover:text-neutral-200"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("card.homepage")}
                </Link>
              ) : null}
            </div>
            <Link
              href={detailHref}
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {t("card.open")}
              <CaretRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

