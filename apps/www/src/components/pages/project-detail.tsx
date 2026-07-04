"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CaretDown, CaretLeft, CaretRight, FileText, FolderSimple } from "phosphor-react";

import { geist } from "@/app/fonts";
import { MarkdownContent } from "@/components/common/markdown-content";
import { LanguageBadge } from "@/components/common/github-language-badge";
import { Button } from "@/components/ui/button";
import {
  type AsyncState,
  type GitHubContentEntry,
  type GitHubPinnedRepository,
  type GitHubReadme,
  type ContentsResponse,
  type ReadmeResponse,
  createAsyncState,
  formatCount,
  formatUpdatedDate,
  getAccentColor,
  hexToRgba,
} from "@/lib/github";
import { requestJson } from "@/lib/request";
import { cn } from "@/lib/utils";

type ProjectDetailProps = {
  repository: GitHubPinnedRepository;
};

type TreeState = Record<string, AsyncState<GitHubContentEntry[]>>;

export function ProjectDetail({ repository }: ProjectDetailProps) {
  const t = useTranslations("projects");
  const locale = useLocale();

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBase) {
    throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");
  }

  const [readmeState, setReadmeState] = useState<AsyncState<GitHubReadme>>(createAsyncState<GitHubReadme>());
  const [treeState, setTreeState] = useState<TreeState>({});
  const [expandedPaths, setExpandedPaths] = useState<string[]>([]);

  const accentColor = getAccentColor(repository.primaryLanguage);
  const updatedAt = formatUpdatedDate(repository.updatedAt, locale);
  const starLabel = t("card.stars", { count: repository.stargazerCount });
  const forkLabel = t("card.forks", { count: repository.forkCount });

  const fetchReadme = useCallback(
    (signal?: AbortSignal) => {
      setReadmeState({ status: "loading", data: null, error: null });
      const params = new URLSearchParams({ owner: repository.owner });
      const url = `${apiBase}/github/repos/${encodeURIComponent(repository.name)}/readme?${params.toString()}`;

      requestJson<ReadmeResponse>(url, { signal }).then((data) => {
        if (signal?.aborted) {
          return;
        }

        if (!data?.readme) {
          setReadmeState({
            status: "error",
            data: null,
            error: t("detail.errorReadme"),
          });
          return;
        }

        setReadmeState({
          status: "loaded",
          data: data.readme,
          error: null,
        });
      });
    },
    [apiBase, repository.name, repository.owner, t]
  );

  const fetchContents = useCallback(
    (path: string, signal?: AbortSignal) => {
      setTreeState((previous) => ({
        ...previous,
        [path]: {
          status: "loading",
          data: null,
          error: null,
        },
      }));

      const params = new URLSearchParams({ owner: repository.owner });
      if (path.length > 0) {
        params.set("path", path);
      }
      const search = params.toString();
      const url = `${apiBase}/github/repos/${encodeURIComponent(repository.name)}/contents${search.length > 0 ? `?${search}` : ""}`;

      requestJson<ContentsResponse>(url, { signal }).then((data) => {
        if (signal?.aborted) {
          return;
        }

        if (!data || !Array.isArray(data.entries)) {
          setTreeState((previous) => ({
            ...previous,
            [path]: {
              status: "error",
              data: null,
              error: t("detail.errorStructure"),
            },
          }));
          return;
        }

        setTreeState((previous) => ({
          ...previous,
          [path]: {
            status: "loaded",
            data: data.entries,
            error: null,
          },
        }));
      });
    },
    [apiBase, repository.name, repository.owner, t]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchReadme(controller.signal);
    fetchContents("", controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchContents, fetchReadme]);

  const readmeBase = useMemo(() => {
    if (!readmeState.data?.downloadUrl) {
      return null;
    }
    const url = readmeState.data.downloadUrl;
    const lastSlash = url.lastIndexOf("/");
    if (lastSlash === -1) {
      return url;
    }
    return url.slice(0, lastSlash + 1);
  }, [readmeState.data]);

  const handleTogglePath = useCallback(
    (entry: GitHubContentEntry) => {
      if (entry.type !== "dir") {
        return;
      }

      setExpandedPaths((previous) => {
        const isExpanded = previous.includes(entry.path);
        const next = isExpanded ? previous.filter((value) => value !== entry.path) : [...previous, entry.path];

        if (!isExpanded) {
          const state = treeState[entry.path];
          const shouldLoad = !state || (state.status !== "loading" && state.status !== "loaded");
          if (shouldLoad) {
            fetchContents(entry.path);
          }
        }

        return next;
      });
    },
    [fetchContents, treeState]
  );

  const handleReloadPath = useCallback(
    (path: string) => {
      fetchContents(path);
    },
    [fetchContents]
  );

  const expandedSet = useMemo(() => new Set(expandedPaths), [expandedPaths]);

  const renderEntries = useCallback(
    (path: string, state: AsyncState<GitHubContentEntry[]>, depth: number) => {
      if (state.status === "loading") {
        return (
          <div className="space-y-2 rounded-3xl border border-neutral-200/60 bg-neutral-100/60 p-4 text-xs text-neutral-500 dark:border-neutral-800/60 dark:bg-neutral-900/60 dark:text-neutral-400">
            {t("detail.loadingStructure")}
          </div>
        );
      }

      if (state.status === "error") {
        return (
          <div className="space-y-3 rounded-3xl border border-red-300/60 bg-red-50/70 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            <p>{state.error ?? t("detail.errorStructure")}</p>
            <button
              type="button"
              onClick={() => handleReloadPath(path)}
              className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-500 transition hover:text-emerald-400"
            >
              {t("detail.retry")}
            </button>
          </div>
        );
      }

      if (state.status === "loaded") {
        const entries = state.data ?? [];

        if (entries.length === 0) {
          return <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("detail.emptyStructure")}</p>;
        }

        const sortedEntries = [...entries].sort((a, b) => {
          const aIsDir = a.type === "dir";
          const bIsDir = b.type === "dir";

          if (aIsDir && !bIsDir) {
            return -1;
          }
          if (!aIsDir && bIsDir) {
            return 1;
          }

          return a.name.localeCompare(b.name, locale, { sensitivity: "base" });
        });

        return (
          <ul className="space-y-1.5">
            {sortedEntries.map((entry) => {
              const isDirectory = entry.type === "dir";
              const isExpanded = expandedSet.has(entry.path);
              const childState = treeState[entry.path] ?? createAsyncState<GitHubContentEntry[]>();

              return (
                <li key={entry.sha}>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-2 rounded-3xl border border-transparent px-3 py-2 text-sm transition",
                      isDirectory
                        ? "cursor-pointer hover:border-neutral-200/70 hover:bg-neutral-100/60 dark:hover:border-neutral-700/60 dark:hover:bg-neutral-900/60"
                        : "text-neutral-600 dark:text-neutral-300"
                    )}
                    style={{ paddingLeft: `${depth * 18}px` }}
                    onClick={isDirectory ? () => handleTogglePath(entry) : undefined}
                    aria-expanded={isDirectory ? isExpanded : undefined}
                  >
                    {isDirectory ? (
                      <span className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                        {isExpanded ? <CaretDown className="h-4 w-4" /> : <CaretRight className="h-4 w-4" />}
                        <FolderSimple className="h-4 w-4 text-emerald-400" weight="fill" />
                        <span className="font-medium text-neutral-700 dark:text-neutral-200">{entry.name}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-neutral-400" />
                        <span>{entry.name}</span>
                      </span>
                    )}
                  </button>
                  {isDirectory && isExpanded ? (
                    <div className="pl-6">
                      {renderEntries(entry.path, childState, depth + 1)}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        );
      }

      return null;
    },
    [expandedSet, handleReloadPath, handleTogglePath, locale, t, treeState]
  );

  const rootState = treeState[""] ?? createAsyncState<GitHubContentEntry[]>();

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 [background-size:28px_28px] [background-image:radial-gradient(#d4d4d4_1px,transparent_1px)] dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]" />
      <div className="accent-glow-layer-right" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="relative z-10 px-6 py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
          <div className="flex items-center justify-between">
            <Link
              href="/#projects"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-800/70 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-neutral-100"
            >
              <CaretLeft className="h-3.5 w-3.5" />
              {t("detail.back")}
            </Link>
            <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-300">
              <span>
                {formatCount(repository.stargazerCount, locale)} · {starLabel}
              </span>
              <span>
                {formatCount(repository.forkCount, locale)} · {forkLabel}
              </span>
            </div>
          </div>

          <div
            className="overflow-hidden rounded-[48px] border border-neutral-200/70 bg-white/80 shadow-2xl backdrop-blur-md transition dark:border-neutral-800/80 dark:bg-neutral-900/70"
            style={{
              borderColor: hexToRgba(accentColor, 0.35),
              boxShadow: `0 40px 90px -45px ${hexToRgba(accentColor, 0.45)}`,
            }}
          >
            <div className="flex flex-col gap-8 border-b border-neutral-200/70 bg-gradient-to-br from-white/70 via-white/40 to-transparent px-10 py-12 dark:border-neutral-800/70 dark:from-neutral-900/80 dark:via-neutral-900/60">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className={`${geist.className} text-xs uppercase tracking-[0.28em] text-neutral-500 dark:text-neutral-400`}>
                      {repository.owner}
                    </p>
                    <h1 className={`${geist.className} text-4xl sm:text-5xl font-semibold text-neutral-900 dark:text-neutral-50`}>
                      {repository.name}
                    </h1>
                  </div>
                  {repository.description ? (
                    <p className="max-w-3xl text-base text-neutral-600 dark:text-neutral-300">{repository.description}</p>
                  ) : null}
                  <p className="text-sm uppercase tracking-[0.32em] text-neutral-400">
                    {t("card.updated", { date: updatedAt })}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-3">
                  <Button
                    asChild
                    className="rounded-full bg-neutral-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
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
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {repository.languages.map((language) => (
                  <LanguageBadge key={language.name} language={language} />
                ))}
              </div>
            </div>

            <div className="grid gap-16 px-10 py-12 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
              <section className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className={`${geist.className} text-sm uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400`}>
                    {t("detail.readme")}
                  </h2>
                  {readmeState.status === "error" ? (
                    <button
                      type="button"
                      onClick={() => fetchReadme()}
                      className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-500 transition hover:text-emerald-400"
                    >
                      {t("detail.retry")}
                    </button>
                  ) : null}
                </div>

                {readmeState.status === "loading" ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={`readme-skeleton-${index}`} className="h-4 w-full animate-pulse rounded-full bg-neutral-200/80 dark:bg-neutral-800/70" />
                    ))}
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{t("detail.loadingReadme")}</div>
                  </div>
                ) : null}

                {readmeState.status === "error" ? (
                  <div className="rounded-3xl border border-red-300/60 bg-red-50/70 p-5 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                    {readmeState.error ?? t("detail.errorReadme")}
                  </div>
                ) : null}

                {readmeState.status === "loaded" && readmeState.data ? (
                  readmeState.data.content.trim().length > 0 ? (
                    <MarkdownContent content={readmeState.data.content} options={{ linkBase: readmeBase }} />
                  ) : (
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">{t("detail.emptyReadme")}</p>
                  )
                ) : null}
              </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className={`${geist.className} text-sm uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400`}>
                    {t("detail.structure")}
                  </h2>
                  {rootState.status === "error" ? (
                    <button
                      type="button"
                      onClick={() => fetchContents("")}
                      className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-500 transition hover:text-emerald-400"
                    >
                      {t("detail.retry")}
                    </button>
                  ) : null}
                </div>

                {renderEntries("", rootState, 0)}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


