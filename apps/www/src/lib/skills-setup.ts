export const SKILLS_SETUP_REGISTRY_URL = "https://www.skills.sh/";
export const SKILLS_SETUP_DOWNLOAD_PATH = "/downloads/central-agent-skills.ps1";
export const SKILLS_SETUP_FILENAME = "central-agent-skills.ps1";

export const SKILLS_SETUP_COMMANDS = [
  {
    id: "openSkills",
    command: "open-skills",
  },
  {
    id: "skills",
    command: "skills",
  },
  {
    id: "showSkills",
    command: "show-skills",
  },
  {
    id: "addSkill",
    command: "add-skill",
  },
] as const;

export const SKILLS_SETUP_AGENT_TARGETS = [
  ".claude/skills",
  ".cursor/skills",
  ".codex/skills",
  ".openai/skills",
  ".opencode/skills",
  ".gemini/skills",
  ".continue/skills",
  ".aider/skills",
  ".cline/skills",
  ".roo/skills",
  ".windsurf/skills",
] as const;

export const SKILLS_SETUP_PROFILE_TARGETS = [
  "Documents/WindowsPowerShell/profile.ps1",
  "Documents/PowerShell/profile.ps1",
] as const;

export type SkillsSetupCommand = (typeof SKILLS_SETUP_COMMANDS)[number];
