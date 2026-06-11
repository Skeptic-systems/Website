"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CaretLeft,
  Copy,
  DownloadSimple,
  FileText,
  FolderOpen,
  List,
  MagnifyingGlass,
} from "phosphor-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";

import { geist } from "@/app/fonts";
import { MarkdownContent } from "@/components/common/markdown-content";
import { SkillsUtilityBanner } from "@/components/pages/skills-utility-banner";
import {
  buildSkillDownloadHref,
  buildSkillPageHref,
  type SkillDocument,
  type SkillHeading,
  type SkillListItem,
} from "@/lib/skills.shared";
import { cn } from "@/lib/utils";

type SkillsBrowserProps = {
  skills: SkillListItem[];
  activeSkill: SkillDocument;
};

const SKILL_VIEWER_SCROLL_PADDING = 112;
const TOC_SCROLL_LOCK_MS = 900;

function getHeadingTopInScrollContainer(
  scrollContainer: HTMLElement,
  target: HTMLElement,
): number {
  const containerRect = scrollContainer.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  return scrollContainer.scrollTop + (targetRect.top - containerRect.top);
}

function computeScrollTopForHeading(
  scrollContainer: HTMLElement,
  target: HTMLElement,
  scrollPadding: number,
): number {
  const raw = getHeadingTopInScrollContainer(scrollContainer, target) - scrollPadding;
  const maxScrollTop = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
  return Math.min(Math.max(0, raw), maxScrollTop);
}

function resolveActiveHeadingId(
  scrollContainer: HTMLElement,
  headings: SkillHeading[],
  scrollPadding: number,
): string | null {
  const scrollLine = scrollContainer.scrollTop + scrollPadding + 1;
  let activeId: string | null = headings[0]?.id ?? null;

  for (const heading of headings) {
    const element = document.getElementById(heading.id);
    if (!element || !scrollContainer.contains(element)) {
      continue;
    }

    const top = getHeadingTopInScrollContainer(scrollContainer, element);
    if (top <= scrollLine) {
      activeId = heading.id;
    }
  }

  return activeId;
}

export function SkillsBrowser({ skills, activeSkill }: SkillsBrowserProps) {
  const t = useTranslations("skills");
  const scrollContainerNodeRef = useRef<HTMLDivElement | null>(null);
  const [scrollContainerReady, setScrollContainerReady] = useState(false);
  const isTocScrollingRef = useRef(false);
  const tocScrollEndTimerRef = useRef<number | null>(null);

  const scrollContainerRef = useCallback((node: HTMLDivElement | null) => {
    scrollContainerNodeRef.current = node;
    setScrollContainerReady(node !== null);
  }, []);
  const [filter, setFilter] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(
    activeSkill.headings[0]?.id ?? null,
  );

  const filteredSkills = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (query.length === 0) {
      return skills;
    }

    return skills.filter((skill) => {
      const haystack = `${skill.title} ${skill.summary} ${skill.slug}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [filter, skills]);

  useEffect(() => {
    const scrollContainer = scrollContainerNodeRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
    setActiveHeadingId(activeSkill.headings[0]?.id ?? null);
  }, [activeSkill.slug, activeSkill.headings[0]?.id]);

  useEffect(() => {
    const scrollContainer = scrollContainerNodeRef.current;
    if (!scrollContainer || !scrollContainerReady) {
      return;
    }

    const syncActiveHeading = () => {
      if (isTocScrollingRef.current) {
        return;
      }

      const nextId = resolveActiveHeadingId(
        scrollContainer,
        activeSkill.headings,
        SKILL_VIEWER_SCROLL_PADDING,
      );
      if (nextId) {
        setActiveHeadingId(nextId);
      }
    };

    scrollContainer.addEventListener("scroll", syncActiveHeading, { passive: true });
    syncActiveHeading();

    return () => {
      scrollContainer.removeEventListener("scroll", syncActiveHeading);
    };
  }, [activeSkill.headings, activeSkill.slug, scrollContainerReady]);

  const handleTocHeadingClick = useCallback((headingId: string) => {
    const scrollContainer = scrollContainerNodeRef.current;
    if (!scrollContainer) {
      return;
    }

    const target = document.getElementById(headingId);
    if (!target || !scrollContainer.contains(target)) {
      return;
    }

    if (tocScrollEndTimerRef.current !== null) {
      window.clearTimeout(tocScrollEndTimerRef.current);
      tocScrollEndTimerRef.current = null;
    }

    isTocScrollingRef.current = true;
    setActiveHeadingId(headingId);

    const top = computeScrollTopForHeading(
      scrollContainer,
      target,
      SKILL_VIEWER_SCROLL_PADDING,
    );

    scrollContainer.scrollTo({ top, behavior: "smooth" });

    const releaseTocScrollLock = () => {
      isTocScrollingRef.current = false;
      tocScrollEndTimerRef.current = null;
    };

    const onScrollEnd = () => {
      scrollContainer.removeEventListener("scrollend", onScrollEnd);
      if (tocScrollEndTimerRef.current !== null) {
        window.clearTimeout(tocScrollEndTimerRef.current);
      }
      releaseTocScrollLock();
    };

    if ("onscrollend" in scrollContainer) {
      scrollContainer.addEventListener("scrollend", onScrollEnd, { once: true });
    }

    tocScrollEndTimerRef.current = window.setTimeout(() => {
      scrollContainer.removeEventListener("scrollend", onScrollEnd);
      releaseTocScrollLock();
    }, TOC_SCROLL_LOCK_MS);
  }, []);

  const handleCopyRaw = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeSkill.raw);
      setCopyFailed(false);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
      setCopyFailed(true);
      window.setTimeout(() => {
        setCopyFailed(false);
      }, 1800);
    }
  }, [activeSkill.raw]);

  const downloadHref = buildSkillDownloadHref(activeSkill.slug);
  const downloadLabel = `${activeSkill.slug}.md`;

  return (
    <main className="relative flex min-h-screen w-full flex-col bg-transparent lg:h-screen lg:overflow-hidden">
      <div className="accent-glow-layer-right" />
      <div className="accent-glow-layer-left-lower" />
      <div className="pointer-events-none fixed inset-0 bg-white/80 dark:bg-black/80 [mask-image:radial-gradient(ellipse_at_center,transparent_18%,black)]" />

      <div className="relative z-10 flex flex-1 flex-col px-4 pt-16 pb-4 sm:px-6 sm:pt-20 lg:overflow-hidden">
        <div className="mx-auto flex w-full max-w-[1600px] shrink-0 flex-col gap-3 pb-3">
          <div className="flex items-center justify-between">
            <Link
              href="/vault"
              className="inline-flex items-center gap-1.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              <CaretLeft className="h-3 w-3" />
              {t("actions.backToVault")}
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-neutral-500 transition hover:text-neutral-900 lg:hidden dark:text-neutral-400 dark:hover:text-neutral-100"
              onClick={() => {
                setSidebarOpen((previous) => !previous);
              }}
            >
              <List className="h-3.5 w-3.5" />
              {t("sidebar.toggle")}
            </button>
          </div>

          <SkillsUtilityBanner />
        </div>

        <div className="mx-auto w-full max-w-[1600px] flex-1 lg:min-h-0">
          <div className="grid h-full gap-x-3 gap-y-0 lg:grid-cols-[260px_minmax(0,1fr)_200px]">
            <SkillsSidebar
              skills={filteredSkills}
              activeSlug={activeSkill.slug}
              filter={filter}
              totalCount={skills.length}
              isOpen={sidebarOpen}
              onFilterChange={setFilter}
              onNavigate={() => {
                setSidebarOpen(false);
              }}
              t={t}
            />

            <SkillsViewer
              skill={activeSkill}
              scrollContainerRef={scrollContainerRef}
              copied={copied}
              copyFailed={copyFailed}
              downloadHref={downloadHref}
              downloadLabel={downloadLabel}
              onCopyRaw={handleCopyRaw}
              t={t}
            />

            <SkillsToc
              headings={activeSkill.headings}
              activeHeadingId={activeHeadingId}
              onHeadingClick={handleTocHeadingClick}
              t={t}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

type SkillsTranslator = ReturnType<typeof useTranslations<"skills">>;

type SkillsSidebarProps = {
  skills: SkillListItem[];
  activeSlug: string;
  filter: string;
  totalCount: number;
  isOpen: boolean;
  onFilterChange: (value: string) => void;
  onNavigate: () => void;
  t: SkillsTranslator;
};

function SkillsSidebar({
  skills,
  activeSlug,
  filter,
  totalCount,
  isOpen,
  onFilterChange,
  onNavigate,
  t,
}: SkillsSidebarProps) {
  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-200/50 bg-white/70 shadow-lg backdrop-blur-xl dark:border-neutral-800/60 dark:bg-neutral-950/60",
        isOpen ? "flex" : "hidden lg:flex",
      )}
    >
      <div className="border-b border-neutral-200/50 p-3 dark:border-neutral-800/60">
        <label className="relative block">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={filter}
            onChange={(event) => {
              onFilterChange(event.target.value);
            }}
            placeholder={t("sidebar.filterPlaceholder")}
            className="w-full rounded-xl border border-neutral-200/60 bg-white/80 py-2 pl-9 pr-3 text-sm text-neutral-800 outline-none transition focus:border-neutral-400 dark:border-neutral-700/60 dark:bg-neutral-900/60 dark:text-neutral-100 dark:focus:border-neutral-500"
          />
        </label>
      </div>

      <div className="border-b border-neutral-200/50 px-4 py-2.5 dark:border-neutral-800/60">
        <div className="flex items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-neutral-500 dark:text-neutral-400">
          <FolderOpen className="h-3 w-3" />
          {t("sidebar.vaultRoot")}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className={`${geist.className} text-sm font-semibold text-neutral-900 dark:text-neutral-50`}>
            {t("sidebar.sectionLabel")}
          </p>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[0.6rem] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {t("sidebar.fileCount", { count: totalCount })}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5">
        {skills.length === 0 ? (
          <p className="px-3 py-6 text-sm text-neutral-500 dark:text-neutral-400">
            {filter.trim().length > 0 ? t("states.noMatches") : t("states.empty")}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {skills.map((skill) => {
              const isActive = skill.slug === activeSlug;
              return (
                <li key={skill.slug}>
                  <Link
                    href={buildSkillPageHref(skill.slug)}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-xl px-3 py-2 transition",
                      isActive
                        ? "bg-[hsl(var(--accent))]/10 text-neutral-900 dark:text-neutral-50"
                        : "text-neutral-700 hover:bg-neutral-100/80 dark:text-neutral-300 dark:hover:bg-white/5",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full transition",
                        isActive ? "bg-[hsl(var(--accent))]" : "bg-transparent",
                      )}
                    />
                    <FileText
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        isActive ? "text-[hsl(var(--accent))]" : "text-neutral-400",
                      )}
                      weight={isActive ? "fill" : "regular"}
                    />
                    <span className="min-w-0">
                      <span className={`${geist.className} block truncate text-[0.8rem] font-medium leading-tight`}>
                        {skill.title}
                      </span>
                      <span
                        className={cn(
                          "block truncate text-[0.65rem] leading-tight",
                          isActive ? "text-neutral-500 dark:text-neutral-400" : "text-neutral-400 dark:text-neutral-500",
                        )}
                      >
                        {skill.slug}.md
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

type SkillsViewerProps = {
  skill: SkillDocument;
  scrollContainerRef: React.RefCallback<HTMLDivElement | null>;
  copied: boolean;
  copyFailed: boolean;
  downloadHref: string;
  downloadLabel: string;
  onCopyRaw: () => void;
  t: SkillsTranslator;
};

function SkillsViewer({
  skill,
  scrollContainerRef,
  copied,
  copyFailed,
  downloadHref,
  downloadLabel,
  onCopyRaw,
  t,
}: SkillsViewerProps) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-200/50 bg-white/70 shadow-lg backdrop-blur-xl dark:border-neutral-800/60 dark:bg-neutral-950/60">
      <div className="shrink-0 border-b border-neutral-200/50 px-5 py-5 sm:px-6 dark:border-neutral-800/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className={`${geist.className} text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-3xl`}>
              {skill.frontmatter.title}
            </h1>
            {skill.summary.length > 0 ? (
              <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                {skill.summary}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
              {skill.frontmatter.created.length > 0 ? (
                <span>
                  {t("viewer.created")} · {skill.frontmatter.created}
                </span>
              ) : null}
              {skill.frontmatter.updated.length > 0 ? (
                <span>
                  {t("viewer.updated")} · {skill.frontmatter.updated}
                </span>
              ) : null}
            </div>

            {skill.frontmatter.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {skill.frontmatter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-neutral-200/60 bg-neutral-50 px-2.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-neutral-600 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-neutral-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={onCopyRaw}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200/60 bg-white/80 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-neutral-700 transition hover:border-neutral-300 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-neutral-200 dark:hover:border-neutral-600"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? t("actions.copied") : copyFailed ? t("actions.copyFailed") : t("actions.copyRaw")}
            </button>
            <a
              href={downloadHref}
              download={downloadLabel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-900/10 bg-neutral-900 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800 dark:border-neutral-600/30 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              <DownloadSimple className="h-3.5 w-3.5" />
              {downloadLabel}
            </a>
          </div>
        </div>
      </div>

      <motion.div
        key={skill.slug}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        ref={scrollContainerRef}
        id="skill-viewer-scroll"
        className="flex-1 overflow-y-auto px-5 py-6 sm:px-6"
      >
        <MarkdownContent
          content={skill.body}
          options={{ enableHeadingIds: true, headingIds: skill.headings }}
        />
      </motion.div>
    </section>
  );
}

type SkillsTocProps = {
  headings: SkillHeading[];
  activeHeadingId: string | null;
  onHeadingClick: (headingId: string) => void;
  t: SkillsTranslator;
};

function SkillsToc({ headings, activeHeadingId, onHeadingClick, t }: SkillsTocProps) {
  return (
    <aside className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-200/50 bg-white/70 shadow-lg backdrop-blur-xl lg:flex dark:border-neutral-800/60 dark:bg-neutral-950/60">
      <div className="shrink-0 border-b border-neutral-200/50 px-4 py-3 dark:border-neutral-800/60">
        <p className={`${geist.className} text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400`}>
          {t("toc.title")}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {headings.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">—</p>
        ) : (
          <ul className="space-y-0.5">
            {headings.map((heading) => {
              const isActive = heading.id === activeHeadingId;
              return (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      onHeadingClick(heading.id);
                    }}
                    className={cn(
                      "block rounded-lg px-2.5 py-1.5 text-[0.8rem] transition",
                      heading.level === 3 ? "pl-5" : "",
                      isActive
                        ? "bg-[hsl(var(--accent))]/10 font-medium text-neutral-900 dark:text-neutral-50"
                        : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-white/5",
                    )}
                  >
                    {heading.text}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
