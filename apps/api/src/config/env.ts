import { config as loadEnv } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = resolve(currentDir, "../../../../.env");

const envLoadResult = loadEnv({ path: rootEnvPath });

if (envLoadResult.error && (envLoadResult.error as { code?: string }).code !== "ENOENT") {
  throw envLoadResult.error;
}

const readEnv = (key: string): string => {
  const value = process.env[key];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

const readOptionalEnv = (key: string): string | null => {
  const value = process.env[key];

  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  return value;
};

const parseBooleanEnv = (value: string | null): boolean => {
  if (value === null) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
};

type CookieSameSite = "Strict" | "Lax" | "None";

const parseCookieSameSite = (value: string | null): CookieSameSite | null => {
  if (value === null) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "strict") {
    return "Strict";
  }

  if (normalized === "lax") {
    return "Lax";
  }

  if (normalized === "none") {
    return "None";
  }

  throw new Error(`Invalid SameSite directive: ${value}`);
};

const readNumericEnv = (key: string): number => {
  const rawValue = readEnv(key);
  const parsedValue = Number.parseInt(rawValue, 10);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }

  return parsedValue;
};

const readCsvEnv = (key: string, fallback: string[] = []): string[] => {
  const rawValue = readOptionalEnv(key);

  if (!rawValue) {
    return fallback;
  }

  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
};

const defaultAllowedOrigins = ["http://localhost:3000"];
const allowedOrigins = readCsvEnv("ALLOWED_ORIGINS", defaultAllowedOrigins);
const apiBaseUrl = readEnv("NEXT_PUBLIC_API_URL");

const resolveTrustedOrigins = (origins: string[], fallback: string): string[] => {
  const filtered = origins.filter((origin) => origin !== "*");
  return filtered.length > 0 ? filtered : [fallback];
};

export const databaseEnv = {
  connectionString: readEnv("DATABASE_URL"),
  host: readEnv("DATABASE_HOST"),
  port: readNumericEnv("DATABASE_PORT"),
  name: readEnv("DATABASE_NAME"),
  user: readEnv("DATABASE_USER"),
  password: readEnv("DATABASE_PASSWORD"),
};

export const redisEnv = {
  host: readEnv("REDIS_HOST"),
  port: readNumericEnv("REDIS_PORT"),
  password: readOptionalEnv("REDIS_PASSWORD"),
};

export const terminalSessionEnv = {
  cookieName: readEnv("TERMINAL_SESSION_COOKIE_NAME"),
  ttlSeconds: readNumericEnv("TERMINAL_SESSION_TTL_SECONDS"),
  textLimit: readNumericEnv("TERMINAL_SESSION_TEXT_LIMIT"),
  cookieDomain: readOptionalEnv("TERMINAL_SESSION_COOKIE_DOMAIN"),
  cookieSameSite: parseCookieSameSite(readOptionalEnv("TERMINAL_SESSION_COOKIE_SAME_SITE")),
};

export const terminalModerationEnv = {
  openAIApiKey: readEnv("OPENAI_API_KEY"),
  model: readEnv("TERMINAL_OPENAI_MODEL"),
  debugVerbose: parseBooleanEnv(readOptionalEnv("TERMINAL_AI_DEBUG")),
};

export const terminalRetentionEnv = {
  retentionDays: readNumericEnv("TERMINAL_RETENTION_DAYS"),
};

export const spotifyEnv = {
  clientId: readEnv("SPOTIFY_CLIENT_ID"),
  clientSecret: readEnv("SPOTIFY_CLIENT_SECRET"),
  refreshToken: readEnv("SPOTIFY_REFRESH_TOKEN"),
};

export const discordEnv = {
  userId: readEnv("DISCORD_USER_ID"),
  apiBaseUrl: readOptionalEnv("LANYARD_API_BASE_URL") ?? "https://api.lanyard.rest",
};

export const pterodactylEnv = {
  apiBaseUrl: readEnv("PTERODACTYL_API_URL"),
  apiKey: readEnv("PTERODACTYL_API_KEY"),
  siteIdentifier: readOptionalEnv("PTERODACTYL_SITE_IDENTIFIER"),
};

export const jellyfinEnv = {
  apiBaseUrl: readEnv("JELLYFIN_BASE_URL"),
  apiKey: readEnv("JELLYFIN_API_KEY"),
  clientName: readOptionalEnv("JELLYFIN_CLIENT_NAME"),
  deviceName: readOptionalEnv("JELLYFIN_DEVICE_NAME"),
  deviceId: readOptionalEnv("JELLYFIN_DEVICE_ID"),
  appVersion: readOptionalEnv("JELLYFIN_APP_VERSION"),
};

export const githubEnv = {
  token: readEnv("GITHUB_TOKEN"),
  username: readEnv("GITHUB_USERNAME"),
};

export const appEnv = {
  apiBaseUrl,
  allowedOrigins,
};

export const authEnv = {
  secret: readEnv("BETTER_AUTH_SECRET"),
  trustedOrigins: resolveTrustedOrigins(allowedOrigins, apiBaseUrl),
  cookieDomain: terminalSessionEnv.cookieDomain,
};

