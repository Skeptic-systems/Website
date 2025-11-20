"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { CaretRight, GitFork, Star } from "phosphor-react";

import { geist } from "@/app/fonts";
import { LanguageBadge } from "@/components/github-language-badge";
import { Button } from "@/components/ui/button";
import {
  type GitHubPinnedRepository,
  buildRepositorySlug,
  type PinnedResponse,
  formatUpdatedDate,
  getAccentColor,
  hexToRgba,
} from "@/lib/github";
import { requestJson } from "@/lib/request";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  repository: GitHubPinnedRepository;
  locale: string;
  t: ReturnType<typeof useTranslations>;
};

export function Projects() {
  const t = useTranslations("projects");
  const locale = useLocale();

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBase) {
    throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");
  }

  const repositoriesQuery = useQuery({
    queryKey: ["github", "pinned"],
    queryFn: async ({ signal }) => fetchPinnedRepositories(apiBase, signal),
  });

  const repositories = repositoriesQuery.data ?? [];
  const hasError = repositoriesQuery.status === "error";
  const isLoading = repositoriesQuery.status === "pending";

  return (
    <section id="projects" className="relative w-full min-h-[70vh] sm:min-h-[80vh] md:min-h-screen">
      <div className="absolute inset-0 [background-size:40px_40px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]" />
      <div className="accent-glow-layer-right" />
      <div className="accent-glow-layer-left-lower" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="relative min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh]">
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <h2 className={`${geist.className} text-[2.7rem] sm:text-[3.5rem] md:text-7xl lg:text-8xl font-bold tracking-tight mt-16 sm:mt-20 md:mt-24`}>
            {t("title")}
          </h2>
        </div>
      </div>

      <div className="relative z-10 px-6 -mt-10 sm:-mt-16 md:-mt-24 pb-24">
        <div className="mx-auto w-full max-w-7xl space-y-12">
          <div className="space-y-3">
            <p className={`${geist.className} text-xs uppercase tracking-[0.32em] text-emerald-500/80`}>{t("accent")}</p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h3 className={`${geist.className} text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50`}>
                {t("subtitle")}
              </h3>
              <div className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
                <p>{t("description")}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {isLoading ? (
              <div className="space-y-8">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`project-skeleton-${index}`}
                    className="relative flex h-[260px] w-full overflow-hidden rounded-[40px] border border-neutral-200/70 bg-white/60 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/60"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 via-neutral-200 to-neutral-100 opacity-70 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-800" />
                    <div className="relative h-full w-full animate-pulse bg-transparent" />
                  </div>
                ))}
              </div>
            ) : null}

            {hasError ? (
              <div className="rounded-[40px] border border-red-300/60 bg-red-50/70 p-6 text-red-700 backdrop-blur dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                {t("states.error")}
              </div>
            ) : null}

            {repositoriesQuery.status === "success" && repositories.length === 0 ? (
              <div className="rounded-[40px] border border-neutral-200/70 bg-white/70 p-6 text-neutral-600 backdrop-blur dark:border-neutral-800/80 dark:bg-neutral-900/70 dark:text-neutral-300">
                {t("states.empty")}
              </div>
            ) : null}

            {repositories.map((repository) => (
              <ProjectCard key={repository.id} repository={repository} locale={locale} t={t} />
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

function ProjectCard({ repository, locale, t }: ProjectCardProps) {
  const accentColor = getAccentColor(repository.primaryLanguage);
  const updatedAt = formatUpdatedDate(repository.updatedAt, locale);
  const starLabel = t("card.stars", { count: repository.stargazerCount });
  const forkLabel = t("card.forks", { count: repository.forkCount });
  const topics = repository.topics.slice(0, 5);
  const detailHref = `/projects/${encodeURIComponent(buildRepositorySlug(repository))}`;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[32px] border border-neutral-200/70 bg-white/70 backdrop-blur-md shadow-xl transition hover:shadow-2xl dark:border-neutral-800/80 dark:bg-neutral-900/70"
      )}
    >
      <div
        className="absolute inset-0 opacity-80 transition duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.24)}, transparent 55%)`,
        }}
      />
      <div className="relative flex flex-col gap-8 p-8 sm:p-9 lg:p-10">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
              <span>{t("card.updated", { date: updatedAt })}</span>
            </div>
            <div className="space-y-1.5">
              <p className={`${geist.className} text-xs uppercase tracking-[0.26em] text-neutral-500 dark:text-neutral-400`}>
                {repository.owner}
              </p>
              <h4 className={`${geist.className} text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-neutral-50`}>
                {repository.name}
              </h4>
            </div>
            {repository.description ? (
              <p className="max-w-3xl text-sm text-neutral-600 dark:text-neutral-300">{repository.description}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-3">
            <Button
              asChild
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400 dark:text-neutral-950"
            >
              <Link href={repository.url} target="_blank" rel="noreferrer">
                {t("card.openExternal")}
              </Link>
            </Button>
            {repository.homepageUrl ? (
              <Link
                href={repository.homepageUrl}
                className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                target="_blank"
                rel="noreferrer"
              >
                {t("card.homepage")}
              </Link>
            ) : null}
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          {repository.languages.map((language) => (
            <LanguageBadge key={language.name} language={language} />
          ))}
        </div>

        {topics.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-semibold uppercase tracking-[0.28em]">{t("card.topics")}</span>
            {topics.map((topic) => (
              <span
                key={topic.name}
                className="rounded-full border border-neutral-200/80 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-neutral-600 transition group-hover:border-neutral-300 group-hover:text-neutral-900 dark:border-neutral-700/60 dark:text-neutral-400 dark:group-hover:border-neutral-600 dark:group-hover:text-neutral-200"
              >
                {topic.name}
              </span>
            ))}
          </div>
        ) : null}

        <footer className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Star weight="fill" className="h-4 w-4 text-amber-400" />
              <span className="font-medium text-neutral-700 dark:text-neutral-200">
                {starLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <GitFork weight="bold" className="h-4 w-4 text-emerald-400" />
              <span className="font-medium text-neutral-700 dark:text-neutral-200">
                {forkLabel}
              </span>
            </div>
          </div>
          <Link
            href={detailHref}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            <span>{t("card.open")}</span>
            <CaretRight className="h-4 w-4" />
          </Link>
        </footer>
      </div>
    </article>
  );
}

