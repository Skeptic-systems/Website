import { Hono } from "hono";

import type { PterodactylActiveServer, PterodactylServerResources } from "../services/pterodactyl";
import {
  fetchPterodactylActiveServers,
  fetchPterodactylServerResources,
  fetchPterodactylTotalServers,
} from "../services/pterodactyl";

export const pterodactylRoutes = new Hono();

pterodactylRoutes.get("/active-server", async (c) => {
  try {
    const servers = await fetchPterodactylActiveServers();
    return c.json<{ servers: PterodactylActiveServer[] }>({ servers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`🟥 [pterodactyl] Failed to load active servers: ${message}`);
    return c.json({ error: "Failed to load active Pterodactyl servers" }, 502);
  }
});

pterodactylRoutes.get("/total-number", async (c) => {
  try {
    const total = await fetchPterodactylTotalServers();
    return c.json<{ total: number }>({ total });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`🟥 [pterodactyl] Failed to load server count: ${message}`);
    return c.json({ error: "Failed to load total Pterodactyl server count" }, 502);
  }
});

pterodactylRoutes.get("/servers/:identifier/resources", async (c) => {
  const identifier = c.req.param("identifier");

  if (typeof identifier !== "string") {
    return c.json({ error: "Invalid server identifier" }, 400);
  }

  const trimmed = identifier.trim();

  if (trimmed.length === 0 || trimmed.startsWith(":") || trimmed === "identifier") {
    return c.json(
      {
        error: "Server identifier placeholder must be replaced",
        hint: "Fetch identifiers from /pterodactyl/servers/overview or the Pterodactyl panel.",
      },
      400
    );
  }

  try {
    const resources = await fetchPterodactylServerResources(trimmed);
    return c.json<{ resources: PterodactylServerResources }>({ resources });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`🟥 [pterodactyl] Failed to fetch resources for ${trimmed}: ${message}`);

    return c.json({ error: "Failed to fetch Pterodactyl server resources" }, 502);
  }
});


