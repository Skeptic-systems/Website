import { notFound } from "next/navigation";

import { ProjectDetail } from "@/components/pages/project-detail";
import { buildRepositorySlug } from "@/lib/github";
import type { GitHubPinnedRepository, PinnedResponse } from "@/lib/github";

const cacheBuster = (): RequestInit => ({
  cache: "no-store",
  headers: {
    Accept: "application/json",
  },
});

const normalizeSlug = (value: string): string => decodeURIComponent(value).trim().toLowerCase();

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const apiBase = process.env.NEXT_INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL;

  if (!apiBase) {
    throw new Error("Missing API base URL environment variable");
  }

  const { slug } = await params;

  const response = await fetch(`${apiBase}/github/pinned`, cacheBuster());

  if (!response.ok) {
    throw new Error("Failed to load pinned repositories");
  }

  const data = (await response.json()) as PinnedResponse;
  const repositories = Array.isArray(data.repositories) ? data.repositories : [];

  const targetSlug = normalizeSlug(slug);
  const repository =
    repositories.find((repo) => buildRepositorySlug(repo) === targetSlug) ?? null;

  if (!repository) {
    notFound();
  }

  return <ProjectDetail repository={repository} />;
}


