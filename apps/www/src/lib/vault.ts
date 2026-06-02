export type VaultToolKey = "certConverter" | "dockerCompose" | "crontabConverter";

export type VaultPalette = {
  glow: string;
  border: string;
  accent: string;
  halo: string;
};

export type VaultToolDefinition = {
  key: VaultToolKey;
  slug: string;
  palette: VaultPalette;
};

export const VAULT_TOOLS: readonly VaultToolDefinition[] = [
  {
    key: "certConverter",
    slug: "cert-converter",
    palette: {
      glow: "rgba(52, 211, 153, 0.2)",
      border: "rgba(52, 211, 153, 0.35)",
      accent: "text-emerald-500 dark:text-emerald-300",
      halo: "bg-emerald-500/20",
    },
  },
  {
    key: "dockerCompose",
    slug: "docker-run-to-compose",
    palette: {
      glow: "rgba(56, 189, 248, 0.2)",
      border: "rgba(56, 189, 248, 0.35)",
      accent: "text-sky-500 dark:text-sky-300",
      halo: "bg-sky-500/20",
    },
  },
  {
    key: "crontabConverter",
    slug: "crontab-converter",
    palette: {
      glow: "rgba(167, 139, 250, 0.2)",
      border: "rgba(167, 139, 250, 0.35)",
      accent: "text-violet-500 dark:text-violet-300",
      halo: "bg-violet-500/20",
    },
  },
] as const;

export const normalizeVaultSlug = (value: string): string =>
  decodeURIComponent(value).trim().toLowerCase();

export const getVaultToolBySlug = (slug: string): VaultToolDefinition | null => {
  const normalized = normalizeVaultSlug(slug);
  return VAULT_TOOLS.find((tool) => tool.slug === normalized) ?? null;
};

export const buildVaultToolHref = (tool: VaultToolDefinition): string =>
  `/vault/${encodeURIComponent(tool.slug)}`;
