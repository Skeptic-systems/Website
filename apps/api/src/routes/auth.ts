import { APIError } from "better-auth";
import { count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";

import { db } from "../db";
import { users } from "../db/schema";
import { auth } from "../services/auth";
import { readAuthenticatedUser } from "../services/auth-guard";

const authRoutes = new Hono();

const ownerBootstrapSchema = z.object({
  firstName: z.string().min(1).max(64),
  lastName: z.string().min(1).max(64),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const manageableRoles = ["admin", "member"] as const;

const userCreationSchema = z.object({
  firstName: z.string().min(1).max(64),
  lastName: z.string().min(1).max(64),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(manageableRoles),
});

type UserRole = typeof users.$inferSelect["role"];

const privilegedRoles: ReadonlyArray<UserRole> = ["owner", "admin"];

const readOwnerExists = async (): Promise<boolean> => {
  const [result] = await db.select({ value: count() }).from(users).where(eq(users.role, "owner"));
  return (result?.value ?? 0) > 0;
};

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();
const normalizeEmail = (value: string): string => value.trim().toLowerCase();

const toUserPayload = (record: typeof users.$inferSelect) => ({
  id: record.id,
  firstName: record.firstName ?? "",
  lastName: record.lastName ?? "",
  name: record.name,
  email: record.email,
  role: record.role,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

type SignUpResponsePayload = {
  user?: {
    id?: string | null;
    email?: string | null;
    name?: string | null;
  };
};

const extractSignUpUser = (payload: unknown): SignUpResponsePayload["user"] | null => {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const castPayload = payload as SignUpResponsePayload;
  return castPayload.user ?? null;
};

const resolveStatusCode = (status: unknown, fallback: ContentfulStatusCode): ContentfulStatusCode => {
  if (typeof status === "number") {
    return status as ContentfulStatusCode;
  }
  return fallback;
};

const copySetCookieHeaders = (source: Headers, target: Headers): void => {
  source.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      target.append("Set-Cookie", value);
      return;
    }

    if (key.toLowerCase() === "content-length") {
      return;
    }

    target.set(key, value);
  });
};

authRoutes.post("/sign-out", async (c) => {
  try {
    const response = await auth.api.signOut({
      headers: c.req.raw.headers,
      asResponse: true,
    });
    return response;
  } catch (error) {
    if (error instanceof APIError) {
      return c.json({ error: error.message }, resolveStatusCode(error.status, 400));
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[auth] Sign-out failed: ${message}`);
    return c.json({ error: "Failed to sign out" }, 500);
  }
});

authRoutes.get("/me", async (c) => {
  try {
    const authenticated = await readAuthenticatedUser(c.req.raw);

    if (!authenticated) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json({ user: toUserPayload(authenticated.profile) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[auth] Failed to resolve current user: ${message}`);
    return c.json({ error: "Failed to resolve current user" }, 500);
  }
});

authRoutes.get("/users", async (c) => {
  try {
    const authenticated = await readAuthenticatedUser(c.req.raw);

    if (!authenticated) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (!privilegedRoles.includes(authenticated.profile.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const rows = await db.select().from(users).orderBy(desc(users.createdAt));
    return c.json({ users: rows.map((row) => toUserPayload(row)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[auth] Failed to list users: ${message}`);
    return c.json({ error: "Failed to list users" }, 500);
  }
});

authRoutes.post("/users", async (c) => {
  const payload = await c.req.json().catch(() => null);
  const parsed = userCreationSchema.safeParse(payload);

  if (!parsed.success) {
    return c.json({ error: "Invalid input payload" }, 400);
  }

  try {
    const authenticated = await readAuthenticatedUser(c.req.raw);

    if (!authenticated) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (!privilegedRoles.includes(authenticated.profile.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const trimmedFirstName = normalizeWhitespace(parsed.data.firstName);
    const trimmedLastName = normalizeWhitespace(parsed.data.lastName);
    const normalizedEmail = normalizeEmail(parsed.data.email);
    const trimmedPassword = parsed.data.password.trim();
    const displayName = normalizeWhitespace(`${trimmedFirstName} ${trimmedLastName}`);

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser) {
      return c.json({ error: "User already exists" }, 409);
    }

    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: displayName,
        email: normalizedEmail,
        password: trimmedPassword,
        rememberMe: false,
      },
    });

    if (!("response" in signUpResult)) {
      throw new Error("Unexpected authentication response");
    }

    const createdUser = extractSignUpUser(signUpResult.response);

    if (!createdUser || !createdUser.id) {
      throw new Error("Failed to resolve created user");
    }

    const [record] = await db
      .update(users)
      .set({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        role: parsed.data.role,
        name: displayName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, createdUser.id))
      .returning();

    if (!record) {
      throw new Error("Failed to persist created user");
    }

    return c.json({ user: toUserPayload(record) }, 201);
  } catch (error) {
    if (error instanceof APIError) {
      return c.json({ error: error.message }, resolveStatusCode(error.status, 400));
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[auth] Failed to create user: ${message}`);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

authRoutes.get("/bootstrap-owner", async (c) => {
  try {
    const ownerExists = await readOwnerExists();
    return c.json({ ownerExists });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[auth] Failed to read owner state: ${message}`);
    return c.json({ error: "Failed to read owner state" }, 500);
  }
});

authRoutes.post("/bootstrap-owner", async (c) => {
  const payload = await c.req.json().catch(() => null);
  const parsed = ownerBootstrapSchema.safeParse(payload);

  if (!parsed.success) {
    return c.json({ error: "Invalid input payload" }, 400);
  }

  try {
    const ownerExists = await readOwnerExists();

    if (ownerExists) {
      return c.json({ error: "Owner already initialized" }, 409);
    }

    const trimmedFirstName = normalizeWhitespace(parsed.data.firstName);
    const trimmedLastName = normalizeWhitespace(parsed.data.lastName);
    const normalizedEmail = normalizeEmail(parsed.data.email);
    const trimmedPassword = parsed.data.password.trim();
    const displayName = normalizeWhitespace(`${trimmedFirstName} ${trimmedLastName}`);

    let ownerUserId: string | null = null;
    let responseHeaders: Headers | null = null;
    let didCreateAuthUser = false;

    try {
      const signUpResult = await auth.api.signUpEmail({
        body: {
          name: displayName,
          email: normalizedEmail,
          password: trimmedPassword,
          rememberMe: true,
        },
        returnHeaders: true,
      });

      if (!("response" in signUpResult)) {
        throw new Error("Unexpected authentication response");
      }

      const ownerUser = extractSignUpUser(signUpResult.response);

      if (!ownerUser || !ownerUser.id) {
        throw new Error("Failed to resolve created owner user");
      }

      ownerUserId = ownerUser.id;
      responseHeaders = signUpResult.headers ?? null;
      didCreateAuthUser = true;
    } catch (error) {
      if (error instanceof APIError && error.status === 409) {
        const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

        if (!existing) {
          return c.json({ error: "User already exists" }, 409);
        }

        ownerUserId = existing.id;
      } else {
        throw error;
      }
    }

    if (!ownerUserId) {
      throw new Error("Failed to resolve owner user");
    }

    const [ownerRecord] = await db
      .update(users)
      .set({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        role: "owner",
        name: displayName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, ownerUserId))
      .returning();

    if (!ownerRecord) {
      throw new Error("Failed to persist owner record");
    }

    const response = c.json(
      {
        owner: toUserPayload(ownerRecord),
      },
      didCreateAuthUser ? 201 : 200
    );

    if (responseHeaders) {
      copySetCookieHeaders(responseHeaders, response.headers);
    }

    return response;
  } catch (error) {
    if (error instanceof APIError) {
      return c.json({ error: error.message }, resolveStatusCode(error.status, 400));
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[auth] Owner bootstrap failed: ${message}`);
    return c.json({ error: "Failed to create owner" }, 500);
  }
});

authRoutes.all("/sign-up/email", (c) => {
  return c.json({ error: "Direct sign-up requests are disabled" }, 403);
});

authRoutes.all("/", async (c) => {
  const response = await auth.handler(c.req.raw);
  return response;
});

authRoutes.all("/*", async (c) => {
  const response = await auth.handler(c.req.raw);
  return response;
});

export { authRoutes };

