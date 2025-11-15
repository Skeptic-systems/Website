import { notFound } from "next/navigation";

import { ProjectDetail } from "@/components/pages/project-detail";
import { buildRepositorySlug } from "@/lib/github";
import type { GitHubPinnedRepository, PinnedResponse } from "@/lib/github";

const requestConfig: RequestInit = {
  cache: "no-store",
  headers: {
    Accept: "application/json",
  },
};

const normalizeSlug = (value: string): string => decodeURIComponent(value).trim().toLowerCase();

const isPinnedResponse = (value: unknown): value is PinnedResponse => {
  if (value === null || typeof value !== "object") {
    return false;
  }

  return Array.isArray((value as { repositories?: unknown }).repositories);
};

const joinUrl = (base: string, path: string): string => {
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const collectApiBaseUrls = (): { bases: string[]; invalid: string[] } => {
  const bases: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  const pushBase = (value: string | undefined | null) => {
    if (typeof value !== "string") {
      return;
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return;
    }

    try {
      const normalized = new URL(trimmed).toString();
      const sanitized = normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;

      if (seen.has(sanitized)) {
        return;
      }

      seen.add(sanitized);
      bases.push(sanitized);
    } catch {
      invalid.push(trimmed);
    }
  };

  pushBase(process.env.NEXT_INTERNAL_API_URL ?? null);
  pushBase(process.env.NEXT_PUBLIC_API_URL ?? null);

  return { bases, invalid };
};

const readPinnedRepositories = async (): Promise<GitHubPinnedRepository[]> => {
  const { bases, invalid } = collectApiBaseUrls();

  if (bases.length === 0) {
    const invalidMessage = invalid.length > 0 ? ` Invalid values: ${invalid.join(", ")}.` : "";
    throw new Error(`Missing valid API base URL environment variable.${invalidMessage}`);
  }

  const failures = invalid.map((value) => `Invalid base URL provided: ${value}`);

  for (const base of bases) {
    const endpoint = joinUrl(base, "/github/pinned");

    try {
      const response = await fetch(endpoint, requestConfig);

      if (!response.ok) {
        failures.push(`${endpoint} responded with status ${response.status}`);
        continue;
      }

      const payload = (await response.json()) as unknown;

      if (!isPinnedResponse(payload)) {
        failures.push(`${endpoint} returned an unexpected payload shape`);
        continue;
      }

      return payload.repositories;
    } catch (error) {
      const messageParts: string[] = [];

      if (error instanceof Error) {
        messageParts.push(error.message);

        if (error.cause instanceof Error) {
          messageParts.push(error.cause.message);
        } else if (typeof error.cause === "string") {
          messageParts.push(error.cause);
        }
      } else {
        messageParts.push("Unknown error");
      }

      failures.push(`${endpoint} request failed: ${messageParts.join(": ")}`);
    }
  }

  const combinedMessage = failures.length > 0 ? ` Details: ${failures.join(" | ")}` : "";
  throw new Error(`Failed to load pinned repositories.${combinedMessage}`);
};

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const repositories = await readPinnedRepositories();

  const targetSlug = normalizeSlug(slug);
  const repository =
    repositories.find((repo) => buildRepositorySlug(repo) === targetSlug) ?? null;

  if (!repository) {
    notFound();
  }

  return <ProjectDetail repository={repository} />;
}


