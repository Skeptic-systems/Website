import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SkillsBrowser } from "@/components/pages/skills-browser";
import { getSkillBySlug, listSkills, normalizeSkillSlug } from "@/lib/skills.server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const skill = await getSkillBySlug(normalizeSkillSlug(slug));

  if (!skill) {
    return {
      title: "AI Skills | Skeptic Systems",
    };
  }

  return {
    title: `${skill.frontmatter.title} | AI Skills`,
    description: skill.summary.length > 0 ? skill.summary : "Cursor-ready skill markdown from the vault.",
  };
}

export default async function SkillDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalized = normalizeSkillSlug(slug);
  const [skills, activeSkill] = await Promise.all([listSkills(), getSkillBySlug(normalized)]);

  if (!activeSkill) {
    notFound();
  }

  return <SkillsBrowser skills={skills} activeSkill={activeSkill} />;
}
