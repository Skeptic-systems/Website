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

export const githubRoutes = new Hono();

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
    const repositories = await fetchGitHubPinnedRepositories();

    return c.json<{ repositories: GitHubPinnedRepository[] }>({ repositories });
  } catch (error) {
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


