export type NameThemeKey =
  | "greek"
  | "norse"
  | "roman"
  | "egyptian"
  | "startrek"
  | "starwars"
  | "tolkien"
  | "dune"
  | "cyberpunk"
  | "cosmos";

export type AdRoleKey =
  | "dc"
  | "dns"
  | "dhcp"
  | "exchange"
  | "sql"
  | "file"
  | "backup"
  | "monitoring"
  | "firewall"
  | "proxy"
  | "web"
  | "hypervisor"
  | "nas"
  | "print"
  | "vpn"
  | "dev"
  | "test"
  | "client"
  | "admin";

export const AD_ROLES: readonly AdRoleKey[] = [
  "dc",
  "dns",
  "dhcp",
  "exchange",
  "sql",
  "file",
  "backup",
  "monitoring",
  "firewall",
  "proxy",
  "web",
  "hypervisor",
  "nas",
  "print",
  "vpn",
  "dev",
  "test",
  "client",
  "admin",
] as const;

/** How many hosts a role gets by default in a generated blueprint. */
export const AD_ROLE_DEFAULT_COUNT: Record<AdRoleKey, number> = {
  dc: 1,
  dns: 1,
  dhcp: 1,
  exchange: 1,
  sql: 1,
  file: 1,
  backup: 1,
  monitoring: 1,
  firewall: 1,
  proxy: 1,
  web: 1,
  hypervisor: 2,
  nas: 1,
  print: 1,
  vpn: 1,
  dev: 1,
  test: 1,
  client: 6,
  admin: 1,
};

/** Short host tags used by the "role tag" naming style (dc-zeus). */
export const AD_ROLE_TAG: Record<AdRoleKey, string> = {
  dc: "dc",
  dns: "dns",
  dhcp: "dhcp",
  exchange: "mail",
  sql: "sql",
  file: "fs",
  backup: "bkp",
  monitoring: "mon",
  firewall: "fw",
  proxy: "px",
  web: "web",
  hypervisor: "hv",
  nas: "nas",
  print: "prt",
  vpn: "vpn",
  dev: "dev",
  test: "lab",
  client: "cl",
  admin: "paw",
};

export type NameTheme = {
  key: NameThemeKey;
  /** Domain label candidates, combined with a TLD such as .local or .lan. */
  domains: readonly string[];
  /** Curated names that semantically match the role. */
  roles: Record<AdRoleKey, readonly string[]>;
  /** Large pool for free-form hostname generation. */
  pool: readonly string[];
};
