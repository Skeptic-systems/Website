"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { resolveRelativeUrl } from "@/lib/github";
import { cn } from "@/lib/utils";

export type MarkdownHeadingId = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type MarkdownContentOptions = {
  linkBase?: string | null;
  enableHeadingIds?: boolean;
  headingIds?: readonly MarkdownHeadingId[];
};

const flattenText = (value: ReactNode): string => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => flattenText(entry)).join("");
  }

  if (value && typeof value === "object" && "props" in value) {
    const props = value.props as { children?: ReactNode };
    return flattenText(props.children ?? "");
  }

  return "";
};

const slugifyHeading = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const isBadgeUrl = (url: string): boolean => {
  const badgeHosts = [
    "img.shields.io",
    "shields.io",
    "badge.fury.io",
    "badgen.net",
    "github.com/workflows",
    "codecov.io",
    "coveralls.io",
    "travis-ci.org",
    "travis-ci.com",
    "circleci.com",
    "dl.flathub.org/assets/badges",
    "img.badgesize.io",
  ];

  try {
    const parsed = new URL(url);
    return badgeHosts.some(
      (host) =>
        parsed.hostname === host ||
        parsed.hostname.endsWith(`.${host}`) ||
        parsed.pathname.includes(host),
    );
  } catch {
    return false;
  }
};

type ResolveHeadingId = (text: string, level: 2 | 3) => string | undefined;

export const createHeadingIdResolver = (
  headingIds: readonly MarkdownHeadingId[],
): ResolveHeadingId => {
  const duplicateOccurrences = new Map<string, number>();

  return (text: string, level: 2 | 3): string | undefined => {
    const normalized = text.trim();
    const matches = headingIds.filter(
      (heading) => heading.level === level && heading.text === normalized,
    );

    if (matches.length === 0) {
      return undefined;
    }

    if (matches.length === 1) {
      return matches[0]?.id;
    }

    const key = `${level}:${normalized}`;
    const occurrence = duplicateOccurrences.get(key) ?? 0;
    const matched = matches[occurrence];
    duplicateOccurrences.set(key, occurrence + 1);
    return matched?.id;
  };
};

type CreateMarkdownComponentsOptions = MarkdownContentOptions & {
  resolveHeadingId?: ResolveHeadingId;
};

export const createMarkdownComponents = ({
  linkBase = null,
  enableHeadingIds = false,
  resolveHeadingId,
}: CreateMarkdownComponentsOptions): Components => {
  const headingIdCounts = new Map<string, number>();

  const nextHeadingIdFromText = (text: string): string => {
    const baseId = slugifyHeading(text);
    const count = headingIdCounts.get(baseId) ?? 0;
    headingIdCounts.set(baseId, count + 1);
    return count === 0 ? baseId : `${baseId}-${count + 1}`;
  };

  const resolvePresetHeadingId = (text: string, level: 2 | 3): string | undefined => {
    if (!enableHeadingIds || !resolveHeadingId) {
      return undefined;
    }
    return resolveHeadingId(text, level);
  };

  return {
    h1: ({ node: _node, children, ...props }) => (
      <h1
        className="mt-8 border-b border-neutral-200 pb-2 text-2xl font-semibold text-neutral-900 first:mt-0 dark:border-neutral-700 dark:text-neutral-50"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ node: _node, children, ...props }) => {
      const text = flattenText(children);
      const id = resolvePresetHeadingId(text, 2) ?? (enableHeadingIds ? nextHeadingIdFromText(text) : undefined);
      return (
        <h2
          {...props}
          id={id}
          className="mt-8 scroll-mt-28 border-b border-neutral-200 pb-2 text-xl font-semibold text-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
        >
          {children}
        </h2>
      );
    },
    h3: ({ node: _node, children, ...props }) => {
      const text = flattenText(children);
      const id = resolvePresetHeadingId(text, 3) ?? (enableHeadingIds ? nextHeadingIdFromText(text) : undefined);
      return (
        <h3
          {...props}
          id={id}
          className="mt-6 scroll-mt-28 text-lg font-semibold text-neutral-900 dark:text-neutral-50"
        >
          {children}
        </h3>
      );
    },
    h4: ({ node: _node, ...props }) => (
      <h4 className="mt-6 text-base font-semibold text-neutral-900 dark:text-neutral-50" {...props} />
    ),
    p: ({ node: _node, ...props }) => (
      <p className="mt-4 text-sm leading-7 text-neutral-700 dark:text-neutral-200" {...props} />
    ),
    a: ({ node: _node, href, children, ...props }) => {
      const hrefValue = href ?? "";
      const isHashLink = hrefValue.startsWith("#");
      const isInternalSkill = hrefValue.startsWith("/skills/");
      const resolved = isInternalSkill ? hrefValue : resolveRelativeUrl(linkBase, hrefValue);

      if (isInternalSkill) {
        return (
          <Link
            href={resolved}
            className="text-[hsl(var(--accent))] underline decoration-dotted underline-offset-4 transition hover:opacity-80"
          >
            {children}
          </Link>
        );
      }

      return (
        <a
          {...props}
          href={resolved}
          target={isHashLink ? undefined : "_blank"}
          rel={isHashLink ? undefined : "noreferrer"}
          className="text-[hsl(var(--accent))] underline decoration-dotted underline-offset-4 transition hover:opacity-80"
        >
          {children}
        </a>
      );
    },
    code: ({ node, ...props }) => {
      const isInline = (node as { type?: string } | null | undefined)?.type === "inlineCode";
      return isInline ? (
        <code
          className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[0.85em] text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
          {...props}
        />
      ) : (
        <code
          className="block overflow-x-auto text-[0.85em] text-neutral-800 dark:text-neutral-200"
          {...props}
        />
      );
    },
    pre: ({ node: _node, ...props }) => (
      <pre
        className="mt-4 overflow-x-auto rounded-lg border border-neutral-200/70 bg-neutral-50 p-4 text-sm dark:border-neutral-700/60 dark:bg-neutral-900/80"
        {...props}
      />
    ),
    ul: ({ node: _node, ...props }) => (
      <ul className="mt-4 list-disc space-y-1 pl-6 text-sm text-neutral-700 dark:text-neutral-200" {...props} />
    ),
    ol: ({ node: _node, ...props }) => (
      <ol className="mt-4 list-decimal space-y-1 pl-6 text-sm text-neutral-700 dark:text-neutral-200" {...props} />
    ),
    li: ({ node: _node, ...props }) => <li className="leading-7" {...props} />,
    blockquote: ({ node: _node, ...props }) => (
      <blockquote
        className="mt-4 border-l-4 border-neutral-200 pl-4 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
        {...props}
      />
    ),
    hr: ({ node: _node, ...props }) => (
      <hr className="my-6 border-neutral-200 dark:border-neutral-700" {...props} />
    ),
    img: ({ node: _node, src, alt, ...props }) => {
      const srcString = typeof src === "string" ? src : "";
      const resolved = resolveRelativeUrl(linkBase, srcString);

      if (!resolved) {
        return null;
      }

      if (isBadgeUrl(resolved)) {
        return (
          <img
            src={resolved}
            alt={alt ?? ""}
            loading="lazy"
            decoding="async"
            className="inline-block h-5 align-middle"
            {...props}
          />
        );
      }

      return (
        <img
          src={resolved}
          alt={alt ?? ""}
          loading="lazy"
          decoding="async"
          className="mt-4 h-auto max-w-full rounded-lg border border-neutral-200/70 object-contain dark:border-neutral-700/60"
          {...props}
        />
      );
    },
    table: ({ node: _node, ...props }) => (
      <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200/70 dark:border-neutral-700/60">
        <table className="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-700" {...props} />
      </div>
    ),
    thead: ({ node: _node, ...props }) => (
      <thead className="bg-neutral-50 dark:bg-neutral-800/70" {...props} />
    ),
    tbody: ({ node: _node, ...props }) => (
      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700" {...props} />
    ),
    th: ({ node: _node, ...props }) => (
      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-200" {...props} />
    ),
    td: ({ node: _node, ...props }) => (
      <td className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300" {...props} />
    ),
  };
};

export type MarkdownContentProps = {
  content: string;
  className?: string;
  options?: MarkdownContentOptions;
};

export function MarkdownContent({ content, className, options }: MarkdownContentProps) {
  const linkBase = options?.linkBase ?? null;
  const enableHeadingIds = options?.enableHeadingIds ?? false;
  const headingIds = options?.headingIds ?? [];
  const headingKey =
    headingIds.length > 0
      ? headingIds.map((heading) => `${heading.level}:${heading.id}:${heading.text}`).join("\u241f")
      : "";

  const components = useMemo(
    () =>
      createMarkdownComponents({
        linkBase,
        enableHeadingIds,
        resolveHeadingId:
          enableHeadingIds && headingIds.length > 0
            ? createHeadingIdResolver(headingIds)
            : undefined,
      }),
    [linkBase, enableHeadingIds, headingKey],
  );

  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function useMarkdownComponents(options?: MarkdownContentOptions): Components {
  const linkBase = options?.linkBase ?? null;
  const enableHeadingIds = options?.enableHeadingIds ?? false;

  return useMemo(
    () => createMarkdownComponents({ linkBase, enableHeadingIds }),
    [enableHeadingIds, linkBase],
  );
}
