import { Hono } from "hono";

import type { DiscordPresence } from "../services/discord";
import { fetchDiscordPresence } from "../services/discord";

export const discordRoutes = new Hono();

discordRoutes.get("/presence", async (c) => {
  try {
    const presence = await fetchDiscordPresence();

    return c.json<{ presence: DiscordPresence }>({ presence });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`🟣 [discord] Failed to load presence: ${message}`);

    return c.json({ error: "Failed to fetch Discord presence" }, 502);
  }
});


