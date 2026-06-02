import { redirect } from "next/navigation";

import { getFirstSkillSlug } from "@/lib/skills.server";

export default async function SkillsIndexPage() {
  const firstSlug = await getFirstSkillSlug();

  if (!firstSlug) {
    redirect("/vault");
  }

  redirect(`/skills/${encodeURIComponent(firstSlug)}`);
}
