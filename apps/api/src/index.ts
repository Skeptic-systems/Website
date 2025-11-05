import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { spotifyRoutes } from "./routes/spotify";
import { verifySpotifyConnection } from "./services/spotify";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
  })
);

app.get("/", (c) => {
  return c.json({ message: "API is running" });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.route("/spotify", spotifyRoutes);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const registeredRoutes = [
  { method: "GET", path: "/", description: "API status" },
  { method: "GET", path: "/health", description: "Health check" },
  { method: "GET", path: "/spotify/top-tracks", description: "Spotify top tracks" },
  {
    method: "GET",
    path: "/spotify/currently-playing",
    description: "Spotify currently playing track",
  },
] as const;

const getBaseUrl = (): string => {
  const explicitUrl = process.env.API_BASE_URL;

  if (typeof explicitUrl === "string" && explicitUrl.length > 0) {
    return explicitUrl;
  }

  return `http://localhost:${port}`;
};

const logRegisteredRoutes = (baseUrl: string): void => {
  console.log("📚 Available endpoints:");
  for (const route of registeredRoutes) {
    console.log(`- [${route.method}] ${baseUrl}${route.path} (${route.description})`);
  }
};

const runStartupChecks = async (): Promise<void> => {
  const baseUrl = getBaseUrl();

  try {
    await verifySpotifyConnection();
    console.log("🎧 Spotify connection verified");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`⚠️ Spotify connection check failed: ${message}`);
  } finally {
    logRegisteredRoutes(baseUrl);
  }
};

void runStartupChecks();

console.log(`🚀 Server running on ${getBaseUrl()}`);

export default {
  port,
  fetch: app.fetch,
};
