export type SkillHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type SkillFrontmatter = {
  title: string;
  tags: string[];
  created: string;
  updated: string;
  summary: string;
  aliases: string[];
};

export type SkillListItem = {
  slug: string;
  filename: string;
  title: string;
  summary: string;
};

export type SkillDocument = SkillListItem & {
  raw: string;
  body: string;
  frontmatter: SkillFrontmatter;
  headings: SkillHeading[];
};

const slugifyHeading = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

export const buildSkillSlug = (filename: string): string => {
  const base = filename.replace(/\.md$/i, "");
  return base
    .replace(/\s*\(\d+\)\s*$/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
};

export const normalizeSkillSlug = (value: string): string =>
  decodeURIComponent(value).trim().toLowerCase();

const parseScalar = (line: string): string => line.split(":").slice(1).join(":").trim();

const parseStringArray = (value: string): string[] => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    return [];
  }

  return trimmed
    .slice(1, -1)
    .split(",")
    .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ""))
    .filter((entry) => entry.length > 0);
};

const parseFrontmatterBlock = (block: string): SkillFrontmatter => {
  const lines = block.split("\n");
  const frontmatter: SkillFrontmatter = {
    title: "",
    tags: [],
    created: "",
    updated: "",
    summary: "",
    aliases: [],
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }

    if (trimmed.startsWith("title:")) {
      frontmatter.title = parseScalar(trimmed);
      continue;
    }

    if (trimmed.startsWith("tags:")) {
      frontmatter.tags = parseStringArray(parseScalar(trimmed));
      continue;
    }

    if (trimmed.startsWith("created:")) {
      frontmatter.created = parseScalar(trimmed);
      continue;
    }

    if (trimmed.startsWith("updated:")) {
      frontmatter.updated = parseScalar(trimmed);
      continue;
    }

    if (trimmed.startsWith("summary:")) {
      frontmatter.summary = parseScalar(trimmed);
      continue;
    }

    if (trimmed.startsWith("aliases:")) {
      frontmatter.aliases = parseStringArray(parseScalar(trimmed));
    }
  }

  return frontmatter;
};

export const splitSkillMarkdown = (
  raw: string,
): { frontmatter: SkillFrontmatter; body: string } => {
  if (!raw.startsWith("---")) {
    return {
      frontmatter: {
        title: "",
        tags: [],
        created: "",
        updated: "",
        summary: "",
        aliases: [],
      },
      body: raw,
    };
  }

  const closingIndex = raw.indexOf("\n---", 3);
  if (closingIndex === -1) {
    return {
      frontmatter: {
        title: "",
        tags: [],
        created: "",
        updated: "",
        summary: "",
        aliases: [],
      },
      body: raw,
    };
  }

  const frontmatterBlock = raw.slice(3, closingIndex).trim();
  const body = raw.slice(closingIndex + 4).replace(/^\n/, "");

  return {
    frontmatter: parseFrontmatterBlock(frontmatterBlock),
    body,
  };
};

export const extractHeadings = (body: string): SkillHeading[] => {
  const headings: SkillHeading[] = [];
  const seen = new Map<string, number>();

  for (const line of body.split("\n")) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) {
      continue;
    }

    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    const baseId = slugifyHeading(text);
    const count = seen.get(baseId) ?? 0;
    seen.set(baseId, count + 1);
    const id = count === 0 ? baseId : `${baseId}-${count + 1}`;

    headings.push({ id, text, level });
  }

  return headings;
};

export const resolveWikiLinks = (body: string, knownSlugs: ReadonlySet<string>): string =>
  body.replace(/\[\[([^\]]+)\]\]/g, (_match, label: string) => {
    const slug = buildSkillSlug(`${label.trim()}.md`);
    if (knownSlugs.has(slug)) {
      return `[${label.trim()}](/skills/${encodeURIComponent(slug)})`;
    }
    return label.trim();
  });

export const buildSkillDownloadHref = (slug: string): string =>
  `/skills/${encodeURIComponent(slug)}.md`;

export const buildSkillPageHref = (slug: string): string =>
  `/skills/${encodeURIComponent(slug)}`;
