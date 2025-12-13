import { Hono } from "hono";

import type {
  GitHubContentEntry,
  GitHubFileContent,
  GitHubPinnedRepository,
  GitHubReadme,
  GitHubRepositoryIdentifier,
} from "../services/github";
import {
  fetchGitHubPinnedRepositories,
  fetchGitHubRepositoryContents,
  fetchGitHubRepositoryFile,
  fetchGitHubRepositoryReadme,
} from "../services/github";
import { githubEnv } from "../config/env";
import { redis } from "../lib/redis";

export const githubRoutes = new Hono();

const PINNED_CACHE_KEY = "github:pinned:v1";
const PINNED_CACHE_TTL_SECONDS = 300;
const PINNED_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=60";

const readCachedPinnedRepositories = async (): Promise<GitHubPinnedRepository[] | null> => {
  try {
    const payload = await redis.get(PINNED_CACHE_KEY);
    if (!payload) {
      return null;
    }

    const parsed = JSON.parse(payload) as { repositories?: unknown };
    if (!parsed || !Array.isArray(parsed.repositories)) {
      await redis.del(PINNED_CACHE_KEY);
      return null;
    }

    return parsed.repositories as GitHubPinnedRepository[];
  } catch (error) {
    await redis.del(PINNED_CACHE_KEY).catch(() => undefined);
    console.warn("🐙 [github] Failed to parse pinned repositories cache", error);
    return null;
  }
};

const writeCachedPinnedRepositories = async (repositories: GitHubPinnedRepository[]): Promise<void> => {
  try {
    const payload = JSON.stringify({ repositories });
    await redis.set(PINNED_CACHE_KEY, payload, "EX", PINNED_CACHE_TTL_SECONDS);
  } catch (error) {
    console.warn("🐙 [github] Failed to persist pinned repositories cache", error);
  }
};

const sanitizeRepositoryName = (value: string): string => value.trim();

const isPlaceholder = (value: string): boolean =>
  value.startsWith(":") || value === "repo" || value === "owner";

const sanitizeOwner = (value: string | null): string => {
  if (value === null) {
    return githubEnv.username;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || isPlaceholder(trimmed)) {
    return githubEnv.username;
  }

  return trimmed;
};

const sanitizeRelativePath = (value: string): string => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "";
  }

  return trimmed.replace(/^\/+/, "");
};

const buildRepositoryIdentifier = (
  repoParam: string,
  ownerParam: string | null
): GitHubRepositoryIdentifier | null => {
  const name = sanitizeRepositoryName(repoParam);

  if (name.length === 0 || isPlaceholder(name)) {
    return null;
  }

  return {
    owner: sanitizeOwner(ownerParam),
    name,
  };
};

githubRoutes.get("/pinned", async (c) => {
  try {
    c.header("Cache-Control", PINNED_CACHE_CONTROL);
    const cachedRepositories = await readCachedPinnedRepositories();

    if (cachedRepositories) {
      c.header("X-Cache", "HIT");
      return c.json<{ repositories: GitHubPinnedRepository[] }>({ repositories: cachedRepositories });
    }

    const repositories = await fetchGitHubPinnedRepositories();
    await writeCachedPinnedRepositories(repositories);
    c.header("X-Cache", "MISS");

    return c.json<{ repositories: GitHubPinnedRepository[] }>({ repositories });
  } catch (error) {
    c.header("Cache-Control", "no-store");
    c.header("X-Cache", "ERROR");
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`🐙 [github] Failed to load pinned repositories: ${message}`);

    return c.json({ error: "Failed to fetch GitHub pinned repositories" }, 502);
  }
});

githubRoutes.get("/repos/:repo/contents", async (c) => {
  const repoParam = c.req.param("repo");
  const ownerParam = c.req.query("owner") ?? null;
  const pathParam = c.req.query("path") ?? "";
  const refParam = c.req.query("ref") ?? null;

  if (typeof repoParam !== "string") {
    return c.json({ error: "Repository name must be provided" }, 400);
  }

  const repository = buildRepositoryIdentifier(repoParam, typeof ownerParam === "string" ? ownerParam : null);

  if (repository === null) {
    return c.json(
      {
        error: "Repository placeholder must be replaced",
        hint: "Call /github/repos/<repository>/contents with a real repository name.",
      },
      400
    );
  }

  const rawPath = typeof pathParam === "string" ? pathParam : "";
  const path = sanitizeRelativePath(rawPath);
  const ref =
    typeof refParam === "string" && refParam.trim().length > 0
      ? refParam.trim()
      : null;

  try {
    const entries = await fetchGitHubRepositoryContents(repository, path, ref);
    return c.json<{ entries: GitHubContentEntry[] }>({ entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `🐙 [github] Failed to load contents for ${repository.owner}/${repository.name}: ${message}`
    );

    return c.json({ error: "Failed to fetch GitHub repository contents" }, 502);
  }
});

githubRoutes.get("/repos/:repo/file", async (c) => {
  const repoParam = c.req.param("repo");
  const ownerParam = c.req.query("owner") ?? null;
  const pathParam = c.req.query("path");
  const refParam = c.req.query("ref") ?? null;

  if (typeof repoParam !== "string") {
    return c.json({ error: "Repository name must be provided" }, 400);
  }

  const repository = buildRepositoryIdentifier(repoParam, typeof ownerParam === "string" ? ownerParam : null);

  if (repository === null) {
    return c.json(
      {
        error: "Repository placeholder must be replaced",
        hint: "Call /github/repos/<repository>/file with a real repository name.",
      },
      400
    );
  }

  if (typeof pathParam !== "string") {
    return c.json({ error: "File path must be provided" }, 400);
  }

  const sanitizedPath = sanitizeRelativePath(pathParam);

  if (sanitizedPath.length === 0) {
    return c.json({ error: "File path must not be empty" }, 400);
  }

  const ref =
    typeof refParam === "string" && refParam.trim().length > 0
      ? refParam.trim()
      : null;

  try {
    const file = await fetchGitHubRepositoryFile(repository, sanitizedPath, ref);
    return c.json<{ file: GitHubFileContent }>({ file });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `🐙 [github] Failed to load file ${repository.owner}/${repository.name}/${sanitizedPath}: ${message}`
    );

    return c.json({ error: "Failed to fetch GitHub file contents" }, 502);
  }
});

githubRoutes.get("/repos/:repo/readme", async (c) => {
  const repoParam = c.req.param("repo");
  const ownerParam = c.req.query("owner") ?? null;
  const refParam = c.req.query("ref") ?? null;

  if (typeof repoParam !== "string") {
    return c.json({ error: "Repository name must be provided" }, 400);
  }

  const repository = buildRepositoryIdentifier(repoParam, typeof ownerParam === "string" ? ownerParam : null);

  if (repository === null) {
    return c.json(
      {
        error: "Repository placeholder must be replaced",
        hint: "Call /github/repos/<repository>/readme with a real repository name.",
      },
      400
    );
  }

  const ref =
    typeof refParam === "string" && refParam.trim().length > 0
      ? refParam.trim()
      : null;

  try {
    const readme = await fetchGitHubRepositoryReadme(repository, ref);
    return c.json<{ readme: GitHubReadme }>({ readme });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `🐙 [github] Failed to load README for ${repository.owner}/${repository.name}: ${message}`
    );

    return c.json({ error: "Failed to fetch GitHub README" }, 502);
  }
});


