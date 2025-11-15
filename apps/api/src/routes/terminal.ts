import { Hono, type Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { CookieOptions } from "hono/utils/cookie";
import { terminalSessionEnv, terminalModerationEnv } from "../config/env";
import {
  ensureTerminalSession,
  incrementTerminalSessionTextCount,
  loadTerminalSession,
  type TerminalSession,
} from "../services/terminal-session";
import { moderateTerminalMessage } from "../services/terminal-processor";
import {
  fetchRecentTerminalMessages,
  persistTerminalMessage,
  type TerminalMessageRecord,
} from "../services/terminal-message-store";

const terminalRoutes = new Hono();
const secureCookies = process.env.NODE_ENV === "production";

type SessionPayload = {
  id: string;
  textCount: number;
  textLimit: number;
  createdAt: string;
  expiresAt: string;
};

const toSessionPayload = (session: TerminalSession): SessionPayload => ({
  id: session.id,
  textCount: session.textCount,
  textLimit: session.textLimit,
  createdAt: session.createdAt,
  expiresAt: session.expiresAt,
});

const toMessagePayload = (
  record: TerminalMessageRecord,
): Pick<TerminalMessageRecord, "id" | "textDefault" | "textEn" | "textDe" | "createdAt"> => ({
  id: record.id,
  textDefault: record.textDefault,
  textEn: record.textEn,
  textDe: record.textDe,
  createdAt: record.createdAt,
});

const setSessionCookie = (c: Context, sessionId: string): void => {
  const resolvedSameSite = terminalSessionEnv.cookieSameSite ?? (secureCookies ? "None" : "Lax");
  const enforceSecureFlag = resolvedSameSite === "None" || resolvedSameSite === "none";

  const options: CookieOptions = {
    httpOnly: true,
    secure: enforceSecureFlag ? true : secureCookies,
    sameSite: resolvedSameSite,
    path: "/",
    maxAge: terminalSessionEnv.ttlSeconds,
  };

  if (terminalSessionEnv.cookieDomain) {
    options.domain = terminalSessionEnv.cookieDomain;
  }

  setCookie(c, terminalSessionEnv.cookieName, sessionId, options);
};

terminalRoutes.get("/session", async (c) => {
  const existingSessionId = getCookie(c, terminalSessionEnv.cookieName) ?? null;
  const { session, isNew } = await ensureTerminalSession(existingSessionId);

  if (isNew || existingSessionId !== session.id) {
    setSessionCookie(c, session.id);
  }

  return c.json(toSessionPayload(session));
});

terminalRoutes.post("/message", async (c) => {
  const requestBody = await c.req.json<{ message?: unknown }>().catch(() => null);

  if (!requestBody || typeof requestBody.message !== "string") {
    return c.json({ error: "Message body must be provided" }, 400);
  }

  const message = requestBody.message.trim();

  if (message.length === 0) {
    return c.json({ error: "Message must not be empty" }, 400);
  }

  if (message.length > 500) {
    return c.json({ error: "Message must be 500 characters or fewer" }, 400);
  }

  const existingSessionId = getCookie(c, terminalSessionEnv.cookieName);

  if (!existingSessionId) {
    return c.json({ error: "Terminal session cookie missing" }, 401);
  }

  const session = await loadTerminalSession(existingSessionId);

  if (!session) {
    return c.json({ error: "Terminal session not initialized" }, 401);
  }

  setSessionCookie(c, session.id);

  const { session: updatedSession, isLimitExceeded } = await incrementTerminalSessionTextCount(session.id);

  if (isLimitExceeded) {
    return c.json(
      {
        error: "Rate limit exceeded",
        session: toSessionPayload(updatedSession),
      },
      429
    );
  }

  try {
    if (terminalModerationEnv.debugVerbose) {
      console.debug("[terminal-route] Incoming terminal message", {
        sessionId: updatedSession.id,
        message,
      });
    }

    const moderationResult = await moderateTerminalMessage({
      message,
      session: updatedSession,
    });

    if (!moderationResult.allowed) {
      return c.json({
        status: "rejected",
        reason: moderationResult.reason,
        session: toSessionPayload(updatedSession),
      });
    }

    const storedMessage = await persistTerminalMessage({
      sessionId: updatedSession.id,
      textDefault: moderationResult.textDefault,
      textEn: moderationResult.textEn,
      textDe: moderationResult.textDe,
    });

    if (terminalModerationEnv.debugVerbose) {
      console.debug("[terminal-route] Stored moderated message", {
        sessionId: updatedSession.id,
        messageId: storedMessage.id,
      });
    }

    return c.json({
      status: "processed",
      reason: moderationResult.reason,
      session: toSessionPayload(updatedSession),
      message: toMessagePayload(storedMessage),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown processing failure";
    console.error(`Terminal message processing failed: ${errorMessage}`);
    if (terminalModerationEnv.debugVerbose) {
      console.debug("[terminal-route] Moderation failure details", {
        sessionId: updatedSession.id,
        error: errorMessage,
      });
    }
    return c.json(
      {
        error: "Processing failed",
        session: toSessionPayload(updatedSession),
      },
      500
    );
  }
});

terminalRoutes.get("/messages", async (c) => {
  const limitParam = c.req.query("limit") ?? null;

  if (limitParam && Number.isNaN(Number.parseInt(limitParam, 10))) {
    return c.json({ error: "Limit must be a number" }, 400);
  }

  const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : 50;
  const limit = Number.isNaN(parsedLimit) || parsedLimit <= 0 ? 50 : parsedLimit;

  const messages = await fetchRecentTerminalMessages(limit);

  return c.json({
    items: messages.map((record) => toMessagePayload(record)),
  });
});

export { terminalRoutes };

