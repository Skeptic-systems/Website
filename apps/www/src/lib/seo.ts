import type { Metadata } from "next";

function getBaseUrl() {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  const url = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  
  if (!url) {
    // Fallback to ensure build doesn't fail if env vars are missing, 
    // but ideally this should come from env vars as requested.
    return "https://skeptic-systems.de"; 
  }
  
  return url;
}

const domain = getBaseUrl();
const previewImagePath = "/asstes/seo/preview400x400.png";
const previewWidth = 400;
const previewHeight = 400;

const baseOpenGraph: NonNullable<Metadata["openGraph"]> = {
  type: "website",
  url: domain,
  title: "Jonas – Full-stack Dev & Systems Integrator",
  description: "Hey, I'm Jonas — a full-stack dev and systems integrator shipping slick apps and keeping systems rock-solid.",
  siteName: "Skeptic Systems",
  images: [
    {
      url: previewImagePath,
      width: previewWidth,
      height: previewHeight,
      alt: "Skeptic Systems portfolio preview",
    },
  ],
};

const baseTitleText = toMetadataPlainText(baseOpenGraph.title) ?? "";

const baseTwitter: NonNullable<Metadata["twitter"]> = {
  card: "summary_large_image",
  title: baseTitleText,
  description: baseOpenGraph.description,
  images: [previewImagePath],
};

export const BASE_METADATA: Metadata = {
  metadataBase: new URL(domain),
  title: baseOpenGraph.title,
  description: baseOpenGraph.description,
  alternates: {
    canonical: domain,
  },
  icons: {
    icon: "/asstes/favicon.ico",
  },
  openGraph: baseOpenGraph,
  twitter: baseTwitter,
};

export interface SeoOverrides {
  title?: string;
  description?: string;
  path?: `/${string}` | "/";
  imagePath?: string;
}

export function buildMetadata(overrides: SeoOverrides = {}): Metadata {
  const { title, description, path, imagePath } = overrides;
  const image: string = imagePath ?? previewImagePath;
  const resolvedTitle = title ?? baseOpenGraph.title;
  const resolvedTitleText = toMetadataPlainText(resolvedTitle) ?? baseTitleText;
  const resolvedDescription = description ?? baseOpenGraph.description;
  const resolvedPath = path && path !== "/" ? path : "/";
  const canonicalUrl = path ? `${domain}${resolvedPath}` : domain;

  return {
    ...BASE_METADATA,
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: {
      ...BASE_METADATA.alternates,
      canonical: canonicalUrl,
    },
    openGraph: {
      ...BASE_METADATA.openGraph,
      url: canonicalUrl,
      title: resolvedTitle,
      description: resolvedDescription,
      images: [
        {
          url: image,
          width: previewWidth,
          height: previewHeight,
          alt: resolvedTitleText,
        },
      ],
    },
    twitter: {
      ...BASE_METADATA.twitter,
      title: resolvedTitleText,
      description: resolvedDescription,
      images: [image],
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




