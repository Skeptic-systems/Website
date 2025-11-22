import type { Metadata } from "next";

const DEFAULT_DOMAIN = "https://skeptic-systems.de";
const previewImagePath = "/asstes/seo/preview400x400.png";
const previewWidth = 400;
const previewHeight = 400;
const baseTitle = "Jonas – Full-stack Dev & Systems Integrator";
const baseDescription =
  "Hey, I'm Jonas — a full-stack dev and systems integrator shipping slick apps and keeping systems rock-solid.";

const baseOpenGraph = {
  type: "website",
  siteName: "Skeptic Systems",
} satisfies Partial<NonNullable<Metadata["openGraph"]>>;

const baseTwitter = {
  card: "summary_large_image",
} satisfies Partial<NonNullable<Metadata["twitter"]>>;

const baseIcons = {
  icon: "/asstes/favicon.ico",
} satisfies NonNullable<Metadata["icons"]>;

const baseTitleText = toMetadataPlainText(baseTitle) ?? "";

export interface SeoOverrides {
  title?: string;
  description?: string;
  path?: `/${string}` | "/";
  imagePath?: string;
}

export function buildMetadata(baseUrlInput?: string, overrides: SeoOverrides = {}): Metadata {
  const baseUrl = normalizeBaseUrl(baseUrlInput);
  const { title, description, path, imagePath } = overrides;
  const imageRelativePath: string = imagePath ?? previewImagePath;
  const resolvedTitle = title ?? baseTitle;
  const resolvedTitleText = toMetadataPlainText(resolvedTitle) ?? baseTitleText;
  const resolvedDescription = description ?? baseDescription;
  const canonicalUrl = buildCanonicalUrl(baseUrl, path);
  const imageUrl = buildAbsoluteUrl(baseUrl, imageRelativePath);

  return {
    metadataBase: new URL(baseUrl),
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    icons: baseIcons,
    openGraph: {
      ...baseOpenGraph,
      url: canonicalUrl,
      title: resolvedTitle,
      description: resolvedDescription,
      images: [
        {
          url: imageUrl,
          width: previewWidth,
          height: previewHeight,
          alt: resolvedTitleText,
        },
      ],
    },
    twitter: {
      ...baseTwitter,
      title: resolvedTitleText,
      description: resolvedDescription,
      images: [imageUrl],
    },
  };
}

function toMetadataPlainText(
  value: string | NonNullable<Metadata["title"]> | null | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && "default" in value && typeof value.default === "string") {
    return value.default;
  }

  return undefined;
}

function normalizeBaseUrl(value?: string | null): string {
  const fallback = DEFAULT_DOMAIN;

  if (!value) {
    return fallback;
  }

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return fallback;
  }
}

function ensureLeadingSlash(value: string): string {
  return value.startsWith("/") ? value : `/${value}`;
}

function buildCanonicalUrl(baseUrl: string, path?: `/${string}` | "/"): string {
  if (!path || path === "/") {
    return baseUrl;
  }

  return `${baseUrl}${ensureLeadingSlash(path)}`;
}

function buildAbsoluteUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${baseUrl}${ensureLeadingSlash(path)}`;
}




