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

