export type AsyncState<T> = {
  status: "idle" | "loading" | "loaded" | "error";
  data: T | null;
  error: string | null;
};

export const createAsyncState = <T,>(): AsyncState<T> => ({
  status: "idle",
  data: null,
  error: null,
});

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

export type GitHubContentType = "file" | "dir" | "symlink" | "submodule";

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

export type GitHubReadme = {
  path: string;
  sha: string;
  size: number;
  content: string;
  url: string;
  htmlUrl: string | null;
  downloadUrl: string | null;
};

export type PinnedResponse = {
  repositories: GitHubPinnedRepository[];
};

export type ContentsResponse = {
  entries: GitHubContentEntry[];
};

export type ReadmeResponse = {
  readme: GitHubReadme;
};

export const DEFAULT_LANGUAGE_COLOR = "#14b8a6";

export const getAccentColor = (language: GitHubRepositoryLanguage | null): string =>
  language?.color ?? DEFAULT_LANGUAGE_COLOR;

export const buildRepositorySlug = (repository: GitHubPinnedRepository): string =>
  repository.name.trim().toLowerCase();

export const hexToRgba = (hex: string | null, alpha: number): string => {
  if (!hex) {
    return `rgba(20, 184, 166, ${alpha})`;
  }

  const sanitized = hex.replace("#", "");

  if (sanitized.length !== 6) {
    return `rgba(20, 184, 166, ${alpha})`;
  }

  const r = Number.parseInt(sanitized.slice(0, 2), 16);
  const g = Number.parseInt(sanitized.slice(2, 4), 16);
  const b = Number.parseInt(sanitized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const isAbsoluteUrl = (value: string): boolean => /^([a-z][a-z0-9+\-.]*:)?\/\//i.test(value);

export const resolveRelativeUrl = (base: string | null, value: string): string => {
  if (!value) {
    return value;
  }

  if (value.startsWith("#") || value.startsWith("data:") || isAbsoluteUrl(value)) {
    return value;
  }

  if (!base) {
    return value;
  }

  try {
    return new URL(value, base.endsWith("/") ? base : `${base}/`).toString();
  } catch {
    return value;
  }
};

export const formatUpdatedDate = (value: string, locale: string): string => {
  const formatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return formatter.format(new Date(value));
};

export const formatCount = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);


