import { Hono } from "hono";

import type { JellyfinActiveSession, JellyfinOverview } from "../services/jellyfin";
import { fetchJellyfinActiveSessions, fetchJellyfinOverview } from "../services/jellyfin";

export const jellyfinRoutes = new Hono();

jellyfinRoutes.get("/overview", async (c) => {
  try {
    const overview = await fetchJellyfinOverview();

    return c.json<{ overview: JellyfinOverview }>({ overview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`🟦 [jellyfin] Failed to load overview: ${message}`);

    return c.json({ error: "Failed to load Jellyfin overview" }, 502);
  }
});

jellyfinRoutes.get("/active-sessions", async (c) => {
  try {
    const sessions = await fetchJellyfinActiveSessions();

    return c.json<{ sessions: JellyfinActiveSession[]; count: number }>({
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`🟦 [jellyfin] Failed to load active sessions: ${message}`);

    return c.json({ error: "Failed to load Jellyfin sessions" }, 502);
  }
});






