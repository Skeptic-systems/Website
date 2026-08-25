import { TOLKIEN_THEME } from "@/lib/vault-tools/name-pool-fantasy";
import { GREEK_THEME } from "@/lib/vault-tools/name-pool-greek";
import { EGYPTIAN_THEME, NORSE_THEME, ROMAN_THEME } from "@/lib/vault-tools/name-pool-mythology";
import {
  COSMOS_THEME,
  CYBERPUNK_THEME,
  DUNE_THEME,
  STARTREK_THEME,
  STARWARS_THEME,
} from "@/lib/vault-tools/name-pool-scifi";
import {
  AD_ROLE_DEFAULT_COUNT,
  AD_ROLE_TAG,
  AD_ROLES,
  type AdRoleKey,
  type NameTheme,
  type NameThemeKey,
} from "@/lib/vault-tools/name-themes";

export type { AdRoleKey, NameThemeKey };
export { AD_ROLE_DEFAULT_COUNT, AD_ROLES };

/** NetBIOS computer names are capped at 15 characters. */
export const NETBIOS_MAX_LENGTH = 15;
/** A single DNS label may not exceed 63 characters. */
export const DNS_LABEL_MAX_LENGTH = 63;

export const DOMAIN_TLDS = ["local", "lan", "internal", "corp", "intra", "home"] as const;
export type DomainTld = (typeof DOMAIN_TLDS)[number];

export type NamingStyle = "pure" | "roleTag" | "indexed" | "roleTagIndexed";
export type NamingCase = "lower" | "upper" | "capital";
export type Separator = "-" | "_" | "";

const slugify = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const dedupe = (values: readonly string[]): readonly string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const slug = slugify(value);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    result.push(slug);
  }
  return result;
};

const normalizeTheme = (theme: NameTheme): NameTheme => {
  const roles = {} as Record<AdRoleKey, readonly string[]>;
  for (const role of AD_ROLES) {
    roles[role] = dedupe(theme.roles[role]);
  }
  return {
    key: theme.key,
    domains: dedupe(theme.domains),
    roles,
    pool: dedupe(theme.pool),
  };
};

export const NAME_THEMES: readonly NameTheme[] = [
  GREEK_THEME,
  NORSE_THEME,
  ROMAN_THEME,
  EGYPTIAN_THEME,
  TOLKIEN_THEME,
  STARTREK_THEME,
  STARWARS_THEME,
  DUNE_THEME,
  CYBERPUNK_THEME,
  COSMOS_THEME,
].map(normalizeTheme);

export const THEME_KEYS: readonly NameThemeKey[] = NAME_THEMES.map((theme) => theme.key);

export const getTheme = (key: NameThemeKey): NameTheme =>
  NAME_THEMES.find((theme) => theme.key === key) ?? NAME_THEMES[0];

export const getThemeSize = (key: NameThemeKey): number => getTheme(key).pool.length;

/** Deterministic PRNG so a seed always reproduces the same list. */
const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const createSeed = (): number => Math.floor(Math.random() * 0xffffffff);

const pad = (value: number, width: number): string => String(value).padStart(width, "0");

const applyCase = (value: string, casing: NamingCase): string => {
  if (casing === "upper") return value.toUpperCase();
  if (casing === "capital") return value.charAt(0).toUpperCase() + value.slice(1);
  return value.toLowerCase();
};

const joinParts = (parts: readonly string[], separator: Separator): string =>
  parts.filter((part) => part.length > 0).join(separator);

export type HostnameCheck = {
  length: number;
  netbiosSafe: boolean;
  dnsSafe: boolean;
};

export const checkHostname = (hostname: string): HostnameCheck => ({
  length: hostname.length,
  netbiosSafe: hostname.length > 0 && hostname.length <= NETBIOS_MAX_LENGTH,
  dnsSafe:
    hostname.length > 0 &&
    hostname.length <= DNS_LABEL_MAX_LENGTH &&
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(hostname),
});

/**
 * Draws unique names, exhausting each source before moving on to the next one,
 * so the curated role names always win over the generic pool. Falls back to a
 * numeric suffix once every source is used up.
 */
const drawNames = (
  sources: readonly (readonly string[])[],
  count: number,
  random: () => number,
  used: Set<string>
): string[] => {
  const picked: string[] = [];

  for (const source of sources) {
    const bag = source.filter((name) => !used.has(name));
    while (picked.length < count && bag.length > 0) {
      const index = Math.floor(random() * bag.length);
      const [name] = bag.splice(index, 1);
      if (!name) continue;
      used.add(name);
      picked.push(name);
    }
    if (picked.length >= count) break;
  }

  let overflow = 2;
  while (picked.length < count) {
    const base = picked[0] ?? sources[0]?.[0] ?? "host";
    const name = `${base}${overflow}`;
    overflow += 1;
    if (used.has(name)) continue;
    used.add(name);
    picked.push(name);
  }

  return picked;
};

export type HostnameOptions = {
  themes: readonly NameThemeKey[];
  count: number;
  prefix: string;
  separator: Separator;
  casing: NamingCase;
  numbered: boolean;
  indexWidth: number;
  startIndex: number;
};

export const DEFAULT_HOSTNAME_OPTIONS: HostnameOptions = {
  themes: ["greek"],
  count: 12,
  prefix: "",
  separator: "-",
  casing: "lower",
  numbered: false,
  indexWidth: 2,
  startIndex: 1,
};

export type GeneratedHostname = {
  id: string;
  hostname: string;
  base: string;
  themeKey: NameThemeKey;
  check: HostnameCheck;
};

export const generateHostnames = (options: HostnameOptions, seed: number): GeneratedHostname[] => {
  const random = mulberry32(seed);
  const themeKeys = options.themes.length > 0 ? options.themes : DEFAULT_HOSTNAME_OPTIONS.themes;
  const themes = themeKeys.map(getTheme);
  const prefix = slugify(options.prefix);
  const used = new Set<string>();
  const results: GeneratedHostname[] = [];

  const count = Math.max(1, Math.min(options.count, 250));
  for (let i = 0; i < count; i += 1) {
    const theme = themes[Math.floor(random() * themes.length)] ?? themes[0];
    const [base] = drawNames([theme.pool], 1, random, used);
    if (!base) break;

    const parts = [prefix, base];
    if (options.numbered) {
      parts.push(pad(options.startIndex + i, Math.max(1, options.indexWidth)));
    }

    const hostname = applyCase(joinParts(parts, options.separator), options.casing);
    results.push({
      id: `${theme.key}-${base}-${i}`,
      hostname,
      base,
      themeKey: theme.key,
      check: checkHostname(hostname),
    });
  }

  return results;
};

export type AdBlueprintOptions = {
  themeKey: NameThemeKey;
  domainLabel: string;
  tld: DomainTld;
  prefix: string;
  separator: Separator;
  casing: NamingCase;
  style: NamingStyle;
  indexWidth: number;
  roles: readonly AdRoleKey[];
  counts: Partial<Record<AdRoleKey, number>>;
};

/** The roles a fresh blueprint starts with; everything else is opt-in. */
export const DEFAULT_AD_ROLES: readonly AdRoleKey[] = AD_ROLES.filter((role) =>
  ["dc", "exchange", "firewall", "nas", "client"].includes(role)
);

export const DEFAULT_AD_OPTIONS: AdBlueprintOptions = {
  themeKey: "greek",
  domainLabel: "",
  tld: "local",
  prefix: "",
  separator: "-",
  casing: "lower",
  style: "pure",
  indexWidth: 2,
  roles: DEFAULT_AD_ROLES,
  counts: {},
};

export type AdBlueprintEntry = {
  id: string;
  roleKey: AdRoleKey;
  index: number;
  base: string;
  hostname: string;
  fqdn: string;
  check: HostnameCheck;
};

export type AdBlueprint = {
  themeKey: NameThemeKey;
  domainLabel: string;
  domain: string;
  netbios: string;
  netbiosSafe: boolean;
  entries: AdBlueprintEntry[];
};

const buildHostname = (
  base: string,
  roleKey: AdRoleKey,
  index: number,
  roleCount: number,
  options: AdBlueprintOptions
): string => {
  const withTag = options.style === "roleTag" || options.style === "roleTagIndexed";
  const withIndex =
    options.style === "indexed" || options.style === "roleTagIndexed" || roleCount > 1;

  const parts = [slugify(options.prefix)];
  if (withTag) parts.push(AD_ROLE_TAG[roleKey]);
  parts.push(base);
  if (withIndex) parts.push(pad(index, Math.max(1, options.indexWidth)));

  return applyCase(joinParts(parts, options.separator), options.casing);
};

export const generateAdBlueprint = (options: AdBlueprintOptions, seed: number): AdBlueprint => {
  const random = mulberry32(seed);
  const theme = getTheme(options.themeKey);
  const used = new Set<string>();

  const explicitLabel = slugify(options.domainLabel);
  const domainLabel =
    explicitLabel || theme.domains[Math.floor(random() * theme.domains.length)] || theme.key;
  const domain = `${domainLabel}.${options.tld}`;
  const netbios = domainLabel.toUpperCase().slice(0, NETBIOS_MAX_LENGTH);

  const roles = options.roles.length > 0 ? options.roles : AD_ROLES;
  const entries: AdBlueprintEntry[] = [];

  for (const roleKey of roles) {
    const roleCount = Math.max(
      1,
      Math.min(options.counts[roleKey] ?? AD_ROLE_DEFAULT_COUNT[roleKey], 50)
    );
    const bases = drawNames([theme.roles[roleKey], theme.pool], roleCount, random, used);

    bases.forEach((base, offset) => {
      const index = offset + 1;
      const hostname = buildHostname(base, roleKey, index, roleCount, options);
      entries.push({
        id: `${roleKey}-${base}-${index}`,
        roleKey,
        index,
        base,
        hostname,
        fqdn: `${hostname.toLowerCase()}.${domain}`,
        check: checkHostname(hostname),
      });
    });
  }

  return {
    themeKey: options.themeKey,
    domainLabel,
    domain,
    netbios,
    netbiosSafe: netbios.length > 0 && netbios.length <= NETBIOS_MAX_LENGTH,
    entries,
  };
};

export const hostnamesToText = (names: readonly GeneratedHostname[]): string =>
  names.map((entry) => entry.hostname).join("\n");

export const blueprintToText = (blueprint: AdBlueprint): string => {
  const lines = [`# ${blueprint.domain}`, `# NetBIOS: ${blueprint.netbios}`, ""];
  for (const entry of blueprint.entries) {
    lines.push(`${entry.roleKey.padEnd(11)} ${entry.hostname.padEnd(24)} ${entry.fqdn}`);
  }
  return lines.join("\n");
};

export const blueprintToCsv = (blueprint: AdBlueprint): string => {
  const lines = ["role,hostname,fqdn,netbios_safe"];
  for (const entry of blueprint.entries) {
    lines.push(
      `${entry.roleKey},${entry.hostname},${entry.fqdn},${entry.check.netbiosSafe ? "yes" : "no"}`
    );
  }
  return lines.join("\n");
};
