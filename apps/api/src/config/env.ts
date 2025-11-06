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

export const appEnv = {
  apiBaseUrl: readEnv("NEXT_PUBLIC_API_URL"),
};

