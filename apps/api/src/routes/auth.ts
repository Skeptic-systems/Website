import { Hono } from "hono";

import { auth } from "../services/auth";

const authRoutes = new Hono();

authRoutes.all("/", async (c) => {
  const response = await auth.handler(c.req.raw);
  return response;
});

authRoutes.all("/*", async (c) => {
  const response = await auth.handler(c.req.raw);
  return response;
});

export { authRoutes };

