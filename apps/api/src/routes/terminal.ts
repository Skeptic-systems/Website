import { Hono, type Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { CookieOptions } from "hono/utils/cookie";
import { z } from "zod";
import { terminalSessionEnv, terminalModerationEnv } from "../config/env";
import {
  ensureTerminalSession,
  incrementTerminalSessionTextCount,
  loadTerminalSession,
  type TerminalSession,
} from "../services/terminal-session";
import { moderateTerminalMessage } from "../services/terminal-processor";
import {
  deleteTerminalMessageById,
  fetchRecentTerminalMessages,
  persistTerminalMessage,
  rebuildTerminalMessageCache,
  updateTerminalMessage,
  type TerminalMessageRecord,
} from "../services/terminal-message-store";
import { readAuthenticatedUser } from "../services/auth-guard";
import {
  createTerminalMessageReport,
  fetchReportsForMessages,
  reportReasonValues,
  type TerminalMessageReportRecord,
} from "../services/terminal-message-report-store";

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
): Pick<
  TerminalMessageRecord,
  "id" | "textDefault" | "textEn" | "textDe" | "createdAt" | "reportCount"
> => ({
  id: record.id,
  textDefault: record.textDefault,
  textEn: record.textEn,
  textDe: record.textDe,
  createdAt: record.createdAt,
  reportCount: record.reportCount,
});

const toAdminMessagePayload = (
  record: TerminalMessageRecord,
): Pick<
  TerminalMessageRecord,
  "id" | "sessionId" | "textDefault" | "textEn" | "textDe" | "createdAt" | "reportCount"
> => ({
  id: record.id,
  sessionId: record.sessionId,
  textDefault: record.textDefault,
  textEn: record.textEn,
  textDe: record.textDe,
  createdAt: record.createdAt,
  reportCount: record.reportCount,
});

const toReportPayload = (
  report: TerminalMessageReportRecord,
): Pick<TerminalMessageReportRecord, "id" | "reason" | "description" | "createdAt" | "sessionId"> => ({
  id: report.id,
  reason: report.reason,
  description: report.description,
  createdAt: report.createdAt,
  sessionId: report.sessionId,
});

const setSessionCookie = (c: Context, sessionId: string): void => {
  const resolvedSameSite = terminalSessionEnv.cookieSameSite ?? (secureCookies ? "None" : "Lax");
const enforceSecureFlag = resolvedSameSite === "None";

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

type UserRole = "owner" | "admin" | "member";

const privilegedRoles = new Set<UserRole>(["owner", "admin"]);

const terminalMessageUpdateSchema = z.object({
  textDefault: z.string().min(1).max(500),
  textEn: z.string().max(500),
  textDe: z.string().max(500),
});

const reportReasonEnum = z.enum(reportReasonValues);

const terminalMessageReportSchema = z.object({
  reason: reportReasonEnum,
  description: z.string().min(10).max(600),
});

const parseAdminLimit = (value: string | null): number => {
  if (!value) {
    return 50;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 50;
  }

  return Math.min(parsed, 200);
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

terminalRoutes.get("/admin/messages", async (c) => {
  const authenticated = await readAuthenticatedUser(c.req.raw);

  if (!authenticated) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!privilegedRoles.has(authenticated.profile.role)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const limit = parseAdminLimit(c.req.query("limit") ?? null);
  const messages = await fetchRecentTerminalMessages(limit);
  const reportMap = await fetchReportsForMessages(messages.map((record) => record.id));

  return c.json({
    items: messages.map((record) => ({
      ...toAdminMessagePayload(record),
      reports: (reportMap.get(record.id) ?? []).map((report) => toReportPayload(report)),
    })),
  });
});

terminalRoutes.patch("/admin/messages/:id", async (c) => {
  const authenticated = await readAuthenticatedUser(c.req.raw);

  if (!authenticated) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!privilegedRoles.has(authenticated.profile.role)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const messageId = c.req.param("id");

  if (!messageId) {
    return c.json({ error: "Message id is required" }, 400);
  }

  const payload = await c.req.json().catch(() => null);
  const parsed = terminalMessageUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return c.json({ error: "Invalid input payload" }, 400);
  }

  const sanitized = {
    textDefault: parsed.data.textDefault.trim(),
    textEn: parsed.data.textEn.trim(),
    textDe: parsed.data.textDe.trim(),
  };

  const updated = await updateTerminalMessage({
    id: messageId,
    ...sanitized,
  });

  if (!updated) {
    return c.json({ error: "Message not found" }, 404);
  }

  return c.json({ message: toAdminMessagePayload(updated) });
});

terminalRoutes.delete("/admin/messages/:id", async (c) => {
  const authenticated = await readAuthenticatedUser(c.req.raw);

  if (!authenticated) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!privilegedRoles.has(authenticated.profile.role)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const messageId = c.req.param("id");

  if (!messageId) {
    return c.json({ error: "Message id is required" }, 400);
  }

  const deleted = await deleteTerminalMessageById(messageId);

  if (!deleted) {
    return c.json({ error: "Message not found" }, 404);
  }

  return c.json({ deleted: true });
});

terminalRoutes.post("/messages/:id/report", async (c) => {
  const messageId = c.req.param("id");

  if (!messageId) {
    return c.json({ error: "Message id is required" }, 400);
  }

  const payload = await c.req.json().catch(() => null);
  const parsed = terminalMessageReportSchema.safeParse(payload);

  if (!parsed.success) {
    return c.json({ error: "Invalid input payload" }, 400);
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

  const createResult = await createTerminalMessageReport({
    messageId,
    sessionId: session.id,
    reason: parsed.data.reason,
    description: parsed.data.description.trim(),
  });

  if (createResult.status === "not_found") {
    return c.json({ error: "Message not found" }, 404);
  }

  if (createResult.status === "duplicate") {
    return c.json({ error: "Report already submitted" }, 409);
  }

  await rebuildTerminalMessageCache();

  return c.json(
    {
      reportCount: createResult.reportCount,
    },
    201,
  );
});

export { terminalRoutes };

