import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";

import { SkillsSetupPage } from "@/components/pages/skills-setup-page";
import { SKILLS_SETUP_FILENAME } from "@/lib/skills-setup";

export const metadata: Metadata = {
  title: "Agent Skills Setup | Skeptic Systems",
  description: "Set up a central .agents/skills directory with PowerShell shortcuts.",
};

export default async function SkillsSetupRoute() {
  const scriptPath = path.join(
    process.cwd(),
    "public",
    "downloads",
    SKILLS_SETUP_FILENAME,
  );
  const script = await readFile(scriptPath, "utf8");

  return <SkillsSetupPage script={script} />;
}
