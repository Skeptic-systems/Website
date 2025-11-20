import type { Metadata } from "next";

const domain = "https://skeptic-systems.de";
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

const baseTwitter: NonNullable<Metadata["twitter"]> = {
  card: "summary_large_image",
  title: baseOpenGraph.title,
  description: baseOpenGraph.description,
  images: [previewImagePath],
};

export const BASE_METADATA: Metadata = {
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
          alt: resolvedTitle,
        },
      ],
    },
    twitter: {
      ...BASE_METADATA.twitter,
      title: resolvedTitle,
      description: resolvedDescription,
      images: [image],
    },
  };
}


