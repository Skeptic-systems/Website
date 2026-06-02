import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import {
  buildSkillSlug,
  extractHeadings,
  normalizeSkillSlug,
  resolveWikiLinks,
  splitSkillMarkdown,
  type SkillDocument,
  type SkillListItem,
} from "@/lib/skills.shared";

export type {
  SkillDocument,
  SkillFrontmatter,
  SkillHeading,
  SkillListItem,
} from "@/lib/skills.shared";

export {
  buildSkillDownloadHref,
  buildSkillPageHref,
  buildSkillSlug,
  normalizeSkillSlug,
} from "@/lib/skills.shared";

const SKILLS_PUBLIC_DIR = path.join(process.cwd(), "public", "skills");

const readSkillFile = async (
  filename: string,
  knownSlugs: ReadonlySet<string>,
): Promise<SkillDocument | null> => {
  const filePath = path.join(SKILLS_PUBLIC_DIR, filename);

  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return null;
  }

  const slug = buildSkillSlug(filename);
  const { frontmatter, body } = splitSkillMarkdown(raw);
  const resolvedBody = resolveWikiLinks(body, knownSlugs);
  const title = frontmatter.title.length > 0 ? frontmatter.title : slug;
  const summary = frontmatter.summary;

  return {
    slug,
    filename,
    title,
    summary,
    raw,
    body: resolvedBody,
    frontmatter: {
      ...frontmatter,
      title,
    },
    headings: extractHeadings(resolvedBody),
  };
};

const listSkillFilenames = async (): Promise<string[]> => {
  let entries: string[];
  try {
    entries = await readdir(SKILLS_PUBLIC_DIR);
  } catch {
    return [];
  }

  return entries.filter((entry) => entry.toLowerCase().endsWith(".md")).sort((left, right) => left.localeCompare(right));
};

export const listSkills = async (): Promise<SkillListItem[]> => {
  const filenames = await listSkillFilenames();
  const knownSlugs = new Set(filenames.map((filename) => buildSkillSlug(filename)));
  const skills: SkillListItem[] = [];

  for (const filename of filenames) {
    const document = await readSkillFile(filename, knownSlugs);
    if (!document) {
      continue;
    }

    skills.push({
      slug: document.slug,
      filename: document.filename,
      title: document.frontmatter.title,
      summary: document.summary,
    });
  }

  return skills.sort((left, right) => left.title.localeCompare(right.title));
};

export const getSkillBySlug = async (slug: string): Promise<SkillDocument | null> => {
  const normalized = normalizeSkillSlug(slug);
  const filenames = await listSkillFilenames();
  const knownSlugs = new Set(filenames.map((filename) => buildSkillSlug(filename)));

  for (const filename of filenames) {
    if (buildSkillSlug(filename) !== normalized) {
      continue;
    }

    return readSkillFile(filename, knownSlugs);
  }

  return null;
};

export const getFirstSkillSlug = async (): Promise<string | null> => {
  const skills = await listSkills();
  if (skills.length === 0) {
    return null;
  }

  return skills[0]?.slug ?? null;
};
