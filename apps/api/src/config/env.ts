const readEnv = (key: string): string => {
  const value = process.env[key];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

export const spotifyEnv = {
  clientId: readEnv("SPOTIFY_CLIENT_ID"),
  clientSecret: readEnv("SPOTIFY_CLIENT_SECRET"),
  refreshToken: readEnv("SPOTIFY_REFRESH_TOKEN"),
};

