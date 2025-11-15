import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { appEnv } from "./config/env";
import { discordRoutes } from "./routes/discord";
import { githubRoutes } from "./routes/github";
import { pterodactylRoutes } from "./routes/pterodactyl";
import { jellyfinRoutes } from "./routes/jellyfin";
import { spotifyRoutes } from "./routes/spotify";
import { terminalRoutes } from "./routes/terminal";
import { verifyDiscordConnection } from "./services/discord";
import { verifyGitHubConnection } from "./services/github";
import { verifyPterodactylConnection } from "./services/pterodactyl";
import { verifyJellyfinConnection } from "./services/jellyfin";
import { verifySpotifyConnection } from "./services/spotify";
import { verifyRedisConnection } from "./services/redis";
import { initializeTerminalPersistence } from "./services/terminal-persistence";

const app = new Hono();

app.use("*", logger());

const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0) ?? ["http://localhost:3000"];

const corsOrigin = allowedOrigins.includes("*") ? "*" : allowedOrigins;

app.use(
  "*",
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.get("/", (c) => {
  return c.json({ message: "API is running" });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.route("/github", githubRoutes);
app.route("/spotify", spotifyRoutes);
app.route("/discord", discordRoutes);
app.route("/pterodactyl", pterodactylRoutes);
app.route("/jellyfin", jellyfinRoutes);
app.route("/terminal", terminalRoutes);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const registeredRoutes = [
  { method: "GET", path: "/", description: "API status" },
  { method: "GET", path: "/health", description: "Health check" },
  { method: "GET", path: "/github/pinned", description: "GitHub pinned repositories" },
  {
    method: "GET",
    path: "/github/repos/:repo/contents",
    description: "GitHub repository directory contents",
  },
  {
    method: "GET",
    path: "/github/repos/:repo/file",
    description: "GitHub repository file content",
  },
  {
    method: "GET",
    path: "/github/repos/:repo/readme",
    description: "GitHub repository README",
  },
  { method: "GET", path: "/spotify/top-tracks", description: "Spotify top tracks" },
  {
    method: "GET",
    path: "/spotify/currently-playing",
    description: "Spotify currently playing track",
  },
  {
    method: "GET",
    path: "/discord/presence",
    description: "Discord presence",
  },
  {
    method: "GET",
    path: "/pterodactyl/servers/:identifier/resources",
    description: "Pterodactyl server resources",
  },
  {
    method: "GET",
    path: "/pterodactyl/active-server",
    description: "Active Pterodactyl servers",
  },
  {
    method: "GET",
    path: "/pterodactyl/total-number",
    description: "Total Pterodactyl servers",
  },
  {
    method: "GET",
    path: "/jellyfin/overview",
    description: "Jellyfin overview statistics",
  },
  {
    method: "GET",
    path: "/jellyfin/active-sessions",
    description: "Jellyfin active sessions",
  },
  {
    method: "GET",
    path: "/terminal/session",
    description: "Ensure terminal session cookie",
  },
  {
    method: "POST",
    path: "/terminal/message",
    description: "Submit terminal message for moderation",
  },
  {
    method: "GET",
    path: "/terminal/messages",
    description: "Fetch recent terminal messages",
  },
] as const;

const getBaseUrl = (): string => appEnv.apiBaseUrl;

const logRegisteredRoutes = (baseUrl: string): void => {
  console.log("📚 Available endpoints:");
  for (const route of registeredRoutes) {
    console.log(`- [${route.method}] ${baseUrl}${route.path} (${route.description})`);
  }
};

const runStartupChecks = async (): Promise<void> => {
  const baseUrl = getBaseUrl();

  try {
    await verifyGitHubConnection();
    console.log("🐙 GitHub connection verified");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`⚠️ GitHub connection check failed: ${message}`);
  }

  try {
    await verifySpotifyConnection();
    console.log("🎧 Spotify connection verified");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`⚠️ Spotify connection check failed: ${message}`);
  } finally {
    logRegisteredRoutes(baseUrl);
  }

  try {
    await verifyRedisConnection();
    console.log("🟥 Redis cache reachable");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`⚠️ Redis connection check failed: ${message}`);
  }

  try {
    await verifyDiscordConnection();
    console.log("🟣 Discord presence reachable");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`⚠️ Discord presence check failed: ${message}`);
  }

  try {
    await verifyPterodactylConnection();
    console.log("🟥 Pterodactyl panel reachable");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`⚠️ Pterodactyl connection check failed: ${message}`);
  }

  try {
    await verifyJellyfinConnection();
    console.log("🟦 Jellyfin server reachable");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`⚠️ Jellyfin connection check failed: ${message}`);
  }
};

void runStartupChecks();
void initializeTerminalPersistence();

console.log(`🚀 Server running on ${getBaseUrl()}`);

export default {
  port,
  fetch: app.fetch,
};
