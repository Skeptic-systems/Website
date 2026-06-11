import { Hono } from "hono";

import type {
  PelicanActiveServer,
  PelicanServerResources,
  PelicanServersOverview,
} from "../services/pelican";
import {
  fetchPelicanActiveServers,
  fetchPelicanServerResources,
  fetchPelicanServersOverview,
  fetchPelicanTotalServers,
} from "../services/pelican";

export const pelicanRoutes = new Hono();

pelicanRoutes.get("/active-server", async (c) => {
  try {
    const servers = await fetchPelicanActiveServers();
    return c.json<{ servers: PelicanActiveServer[] }>({ servers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`🟥 [pelican] Failed to load active servers: ${message}`);
    return c.json({ error: "Failed to load active Pelican servers" }, 502);
  }
});

pelicanRoutes.get("/total-number", async (c) => {
  try {
    const total = await fetchPelicanTotalServers();
    return c.json<{ total: number }>({ total });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`🟥 [pelican] Failed to load server count: ${message}`);
    return c.json({ error: "Failed to load total Pelican server count" }, 502);
  }
});

pelicanRoutes.get("/servers/overview", async (c) => {
  try {
    const overview = await fetchPelicanServersOverview();
    return c.json<{ overview: PelicanServersOverview }>({ overview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`🟥 [pelican] Failed to load server overview: ${message}`);
    return c.json({ error: "Failed to load Pelican server overview" }, 502);
  }
});

pelicanRoutes.get("/servers/:identifier/resources", async (c) => {
  const identifier = c.req.param("identifier");

  if (typeof identifier !== "string") {
    return c.json({ error: "Invalid server identifier" }, 400);
  }

  const trimmed = identifier.trim();

  if (trimmed.length === 0 || trimmed.startsWith(":") || trimmed === "identifier") {
    return c.json(
      {
        error: "Server identifier placeholder must be replaced",
        hint: "Fetch identifiers from /pelican/servers/overview or the Pelican panel.",
      },
      400
    );
  }

  try {
    const resources = await fetchPelicanServerResources(trimmed);
    return c.json<{ resources: PelicanServerResources }>({ resources });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`🟥 [pelican] Failed to fetch resources for ${trimmed}: ${message}`);

    return c.json({ error: "Failed to fetch Pelican server resources" }, 502);
  }
});


