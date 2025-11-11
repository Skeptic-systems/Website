import { githubEnv } from "../config/env";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const GITHUB_REST_BASE_URL = "https://api.github.com";

type CacheEntry<T> = {
  value: T;
  fetchedAt: number;
};

const createCachedFetcher = <Args extends unknown[], Result>(
  fetcher: (...args: Args) => Promise<Result>,
  ttlMs: number
) => {
  const cache = new Map<string, CacheEntry<Result>>();
  const inflight = new Map<string, Promise<Result>>();

  return async (...args: Args): Promise<Result> => {
    const key = JSON.stringify(args);
    const now = Date.now();

    const cached = cache.get(key);
    if (cached && now - cached.fetchedAt < ttlMs) {
      return cached.value;
    }

    const pending = inflight.get(key);
    if (pending) {
      return pending;
    }

    const promise = fetcher(...args)
      .then((result) => {
        cache.set(key, { value: result, fetchedAt: Date.now() });
        return result;
      })
      .finally(() => {
        inflight.delete(key);
      });

    inflight.set(key, promise);
    return promise;
  };
};

type GitHubGraphQlError = {
  message: string;
};

type GitHubGraphQlResponse<T> = {
  data?: T;
  errors?: GitHubGraphQlError[];
};

type GitHubGraphQlLanguageNode = {
  name: string;
  color?: string | null;
};

type GitHubGraphQlTopicNode = {
  topic: {
    name: string;
  };
};

type GitHubGraphQlRepositoryNode = {
  id: string;
  name: string;
  description?: string | null;
  url: string;
  homepageUrl?: string | null;
  stargazerCount: number;
  forkCount: number;
  diskUsage?: number | null;
  updatedAt: string;
  owner: {
    login: string;
  };
  primaryLanguage?: GitHubGraphQlLanguageNode | null;
  languages: {
    nodes: GitHubGraphQlLanguageNode[];
  };
  repositoryTopics: {
    nodes: GitHubGraphQlTopicNode[];
  };
};

type GitHubGraphQlPinnedItems = {
  user: {
    pinnedItems: {
      nodes: GitHubGraphQlRepositoryNode[];
    };
  };
};

type GitHubContentType = "file" | "dir" | "symlink" | "submodule";

type GitHubContentPayload = {
  type: GitHubContentType;
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url?: string | null;
  git_url?: string | null;
  download_url?: string | null;
};

type GitHubFilePayload = GitHubContentPayload & {
  type: "file";
  content?: string;
  encoding?: string;
};

type GitHubReadmePayload = {
  sha: string;
  size: number;
  url: string;
  html_url?: string | null;
  download_url?: string | null;
  content?: string;
  encoding?: string;
  path: string;
};

export type GitHubRepositoryLanguage = {
  name: string;
  color: string | null;
};

export type GitHubRepositoryTopic = {
  name: string;
};

export type GitHubPinnedRepository = {
  id: string;
  owner: string;
  name: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  stargazerCount: number;
  forkCount: number;
  diskUsageKb: number | null;
  updatedAt: string;
  primaryLanguage: GitHubRepositoryLanguage | null;
  languages: GitHubRepositoryLanguage[];
  topics: GitHubRepositoryTopic[];
};

export type GitHubRepositoryIdentifier = {
  owner: string;
  name: string;
};

export type GitHubContentEntry = {
  type: GitHubContentType;
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  htmlUrl: string | null;
  downloadUrl: string | null;
};

export type GitHubFileContent = {
  path: string;
  sha: string;
  size: number;
  content: string;
  url: string;
  htmlUrl: string | null;
  downloadUrl: string | null;
};

export type GitHubReadme = {
  path: string;
  sha: string;
  size: number;
  content: string;
  url: string;
  htmlUrl: string | null;
  downloadUrl: string | null;
};

const PINNED_CACHE_TTL_MS = 5 * 60 * 1000;
const CONTENTS_CACHE_TTL_MS = 60 * 1000;
const FILE_CACHE_TTL_MS = 60 * 1000;
const README_CACHE_TTL_MS = 5 * 60 * 1000;

const decodeBase64 = (value: string): string => {
  const buffer = Buffer.from(value, "base64");
  return buffer.toString("utf-8");
};

const sanitizeGitHubError = (status: number, body: string): string => {
  try {
    const parsed = JSON.parse(body) as { message?: unknown; errors?: unknown };
    if (typeof parsed.message === "string" && parsed.message.length > 0) {
      return parsed.message;
    }
    if (Array.isArray(parsed.errors) && parsed.errors.length > 0) {
      const first = parsed.errors[0];
      if (first && typeof first.message === "string") {
        return first.message;
      }
    }
  } catch {
    // Ignore parsing issues and fall back to body truncation.
  }

  const threshold = 200;
  if (body.length > threshold) {
    return `${body.slice(0, threshold)}…`;
  }
  return body || `GitHub API returned status ${status}`;
};

const githubGraphQlFetch = async <T>(query: string, variables: Record<string, unknown>): Promise<T> => {
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubEnv.token}`,
      "Content-Type": "application/json",
      "User-Agent": githubEnv.username,
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed: ${response.status} ${response.statusText} - ${sanitizeGitHubError(response.status, text)}`);
  }

  const payload = JSON.parse(text) as GitHubGraphQlResponse<T>;

  if (payload.errors && payload.errors.length > 0) {
    const message = payload.errors.map((error) => error.message).join("; ");
    throw new Error(`GitHub GraphQL response contained errors: ${message}`);
  }

  if (!payload.data) {
    throw new Error("GitHub GraphQL response did not include data");
  }

  return payload.data;
};

const githubRestFetch = async (path: string, searchParams: Record<string, string | null>): Promise<Response> => {
  const url = new URL(`${GITHUB_REST_BASE_URL}${path}`);
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== null) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${githubEnv.token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": githubEnv.username,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitHub REST request failed (${url.toString()}): ${response.status} ${response.statusText} - ${sanitizeGitHubError(response.status, body)}`
    );
  }

  return response;
};

const mapLanguage = (language: GitHubGraphQlLanguageNode): GitHubRepositoryLanguage => ({
  name: language.name,
  color: language.color ?? null,
});

const mapPinnedRepository = (node: GitHubGraphQlRepositoryNode): GitHubPinnedRepository => ({
  id: node.id,
  owner: node.owner.login,
  name: node.name,
  description: node.description ?? null,
  url: node.url,
  homepageUrl: node.homepageUrl ?? null,
  stargazerCount: node.stargazerCount,
  forkCount: node.forkCount,
  diskUsageKb: typeof node.diskUsage === "number" ? node.diskUsage : null,
  updatedAt: node.updatedAt,
  primaryLanguage: node.primaryLanguage ? mapLanguage(node.primaryLanguage) : null,
  languages: node.languages.nodes.map(mapLanguage),
  topics: node.repositoryTopics.nodes.map((topic) => ({
    name: topic.topic.name,
  })),
});

const mapContentEntry = (payload: GitHubContentPayload): GitHubContentEntry => ({
  type: payload.type,
  name: payload.name,
  path: payload.path,
  sha: payload.sha,
  size: payload.size,
  url: payload.url,
  htmlUrl: payload.html_url ?? null,
  downloadUrl: payload.download_url ?? null,
});

const fetchPinnedRepositoriesLive = async (): Promise<GitHubPinnedRepository[]> => {
  const data = await githubGraphQlFetch<GitHubGraphQlPinnedItems>(
    `
      query PinnedRepositories($username: String!) {
        user(login: $username) {
          pinnedItems(first: 6, types: REPOSITORY) {
            nodes {
              ... on Repository {
                id
                name
                description
                url
                homepageUrl
                stargazerCount
                forkCount
                diskUsage
                updatedAt
                owner {
                  login
                }
                primaryLanguage {
                  name
                  color
                }
                languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
                  nodes {
                    name
                    color
                  }
                }
                repositoryTopics(first: 10) {
                  nodes {
                    topic {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
    { username: githubEnv.username }
  );

  const nodes = data.user?.pinnedItems?.nodes ?? [];

  if (nodes.length === 0) {
    return [];
  }

  return nodes
    .filter((node): node is GitHubGraphQlRepositoryNode => Boolean(node))
    .map(mapPinnedRepository);
};

const encodePathSegments = (path: string): string => {
  if (path.length === 0) {
    return "";
  }

  return path
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
};

const buildRepoPath = (owner: string, repo: string, path: string): string => {
  const trimmedPath = path.trim();
  if (trimmedPath.length === 0) {
    return `/repos/${owner}/${repo}/contents`;
  }
  const normalized = trimmedPath.replace(/^\/+/, "").replace(/\/+$/, "");
  const encoded = encodePathSegments(normalized);
  return `/repos/${owner}/${repo}/contents/${encoded}`;
};

const fetchRepositoryContentsLive = async (
  owner: string,
  repo: string,
  path: string,
  ref: string | null
): Promise<GitHubContentEntry[]> => {
  const response = await githubRestFetch(buildRepoPath(owner, repo, path), { ref });
  const payload = await response.json() as GitHubContentPayload | GitHubContentPayload[];

  if (Array.isArray(payload)) {
    return payload.map(mapContentEntry);
  }

  if (payload.type !== "dir") {
    throw new Error(`Requested path does not point to a directory: ${payload.path}`);
  }

  return [];
};

const fetchRepositoryFileLive = async (
  owner: string,
  repo: string,
  path: string,
  ref: string | null
): Promise<GitHubFileContent> => {
  const response = await githubRestFetch(buildRepoPath(owner, repo, path), { ref });
  const payload = await response.json() as GitHubFilePayload;

  if (payload.type !== "file") {
    throw new Error(`Requested path does not point to a file: ${payload.path}`);
  }

  if (typeof payload.content !== "string" || payload.encoding !== "base64") {
    throw new Error(`GitHub file payload for ${payload.path} is missing base64 content`);
  }

  return {
    path: payload.path,
    sha: payload.sha,
    size: payload.size,
    content: decodeBase64(payload.content),
    url: payload.url,
    htmlUrl: payload.html_url ?? null,
    downloadUrl: payload.download_url ?? null,
  };
};

const fetchRepositoryReadmeLive = async (
  owner: string,
  repo: string,
  ref: string | null
): Promise<GitHubReadme> => {
  const response = await githubRestFetch(`/repos/${owner}/${repo}/readme`, { ref });
  const payload = await response.json() as GitHubReadmePayload;

  if (typeof payload.content !== "string" || payload.encoding !== "base64") {
    throw new Error(`GitHub README payload for ${owner}/${repo} is missing base64 content`);
  }

  return {
    path: payload.path,
    sha: payload.sha,
    size: payload.size,
    content: decodeBase64(payload.content),
    url: payload.url,
    htmlUrl: payload.html_url ?? null,
    downloadUrl: payload.download_url ?? null,
  };
};

const getCachedPinnedRepositories = createCachedFetcher(fetchPinnedRepositoriesLive, PINNED_CACHE_TTL_MS);

const getCachedRepositoryContents = createCachedFetcher(fetchRepositoryContentsLive, CONTENTS_CACHE_TTL_MS);

const getCachedRepositoryFile = createCachedFetcher(fetchRepositoryFileLive, FILE_CACHE_TTL_MS);

const getCachedRepositoryReadme = createCachedFetcher(fetchRepositoryReadmeLive, README_CACHE_TTL_MS);

export const fetchGitHubPinnedRepositories = async (): Promise<GitHubPinnedRepository[]> =>
  getCachedPinnedRepositories();

export const fetchGitHubRepositoryContents = async (
  repository: GitHubRepositoryIdentifier,
  path: string,
  ref: string | null
): Promise<GitHubContentEntry[]> => getCachedRepositoryContents(repository.owner, repository.name, path, ref);

export const fetchGitHubRepositoryFile = async (
  repository: GitHubRepositoryIdentifier,
  path: string,
  ref: string | null
): Promise<GitHubFileContent> => getCachedRepositoryFile(repository.owner, repository.name, path, ref);

export const fetchGitHubRepositoryReadme = async (
  repository: GitHubRepositoryIdentifier,
  ref: string | null
): Promise<GitHubReadme> => getCachedRepositoryReadme(repository.owner, repository.name, ref);

export const verifyGitHubConnection = async (): Promise<void> => {
  await fetchPinnedRepositoriesLive();
};


