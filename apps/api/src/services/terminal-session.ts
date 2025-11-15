import { randomUUID } from "node:crypto";
import { eq, gt, lt } from "drizzle-orm";
import { db } from "../db";
import { redis } from "../lib/redis";
import { terminalSessionEnv } from "../config/env";
import { terminalSessions } from "../db/schema";

const SESSION_PREFIX = "terminal:session:";
const { ttlSeconds, textLimit } = terminalSessionEnv;
const TTL_MILLISECONDS = ttlSeconds * 1000;

type TerminalSession = {
  id: string;
  textCount: number;
  textLimit: number;
  createdAt: string;
  expiresAt: string;
};

type DbTerminalSession = typeof terminalSessions.$inferSelect;

const buildSessionKey = (sessionId: string): string => `${SESSION_PREFIX}${sessionId}`;

const parseSession = (sessionId: string, data: Record<string, string>): TerminalSession | null => {
  if (Object.keys(data).length === 0) {
    return null;
  }

  const textCountValue = Number.parseInt(data.textCount, 10);
  const textLimitValue = Number.parseInt(data.textLimit, 10);

  if (Number.isNaN(textCountValue) || Number.isNaN(textLimitValue)) {
    return null;
  }

  return {
    id: sessionId,
    textCount: textCountValue,
    textLimit: textLimitValue,
    createdAt: data.createdAt,
    expiresAt: data.expiresAt,
  };
};

const fromDbSession = (row: DbTerminalSession): TerminalSession => ({
  id: row.id,
  textCount: row.textCount,
  textLimit: row.textLimit,
  createdAt: row.createdAt.toISOString(),
  expiresAt: row.expiresAt.toISOString(),
});

const refreshSessionExpiry = (session: TerminalSession): TerminalSession => {
  return {
    ...session,
    expiresAt: new Date(Date.now() + TTL_MILLISECONDS).toISOString(),
  };
};

const normalizeSession = (session: TerminalSession): TerminalSession => {
  return refreshSessionExpiry({
    ...session,
    textLimit,
    textCount: Math.min(session.textCount, textLimit),
  });
};

const cacheSession = async (session: TerminalSession): Promise<void> => {
  const key = buildSessionKey(session.id);

  await redis.hset(key, {
    textCount: session.textCount.toString(),
    textLimit: session.textLimit.toString(),
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  });
  await redis.expire(key, ttlSeconds);
};

const upsertSessionRecord = async (session: TerminalSession): Promise<void> => {
  const now = new Date();

  await db
    .insert(terminalSessions)
    .values({
      id: session.id,
      textCount: session.textCount,
      textLimit: session.textLimit,
      createdAt: new Date(session.createdAt),
      updatedAt: now,
      expiresAt: new Date(session.expiresAt),
    })
    .onConflictDoUpdate({
      target: terminalSessions.id,
      set: {
        textCount: session.textCount,
        textLimit: session.textLimit,
        updatedAt: now,
        expiresAt: new Date(session.expiresAt),
      },
    });
};

const syncSessionState = async (session: TerminalSession): Promise<void> => {
  await Promise.all([cacheSession(session), upsertSessionRecord(session)]);
};

const fetchSessionFromDb = async (sessionId: string): Promise<TerminalSession | null> => {
  const row = await db.query.terminalSessions.findFirst({
    where: eq(terminalSessions.id, sessionId),
  });

  return row ? fromDbSession(row) : null;
};

const deleteSessionRecord = async (sessionId: string): Promise<void> => {
  const key = buildSessionKey(sessionId);
  await redis.del(key);
  await db.delete(terminalSessions).where(eq(terminalSessions.id, sessionId));
};

const createSession = async (): Promise<TerminalSession> => {
  const id = randomUUID();
  const now = new Date();
  const session: TerminalSession = {
    id,
    textCount: 0,
    textLimit,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TTL_MILLISECONDS).toISOString(),
  };

  await syncSessionState(session);
  return session;
};

export const fetchTerminalSession = async (sessionId: string): Promise<TerminalSession | null> => {
  const key = buildSessionKey(sessionId);
  const data = await redis.hgetall(key);

  return parseSession(sessionId, data);
};

export const ensureTerminalSession = async (
  sessionId: string | null
): Promise<{ session: TerminalSession; isNew: boolean }> => {
  if (sessionId) {
    const existingSession = await loadTerminalSession(sessionId);

    if (existingSession) {
      return { session: existingSession, isNew: false };
    }
  }

  const session = await createSession();
  return { session, isNew: true };
};

export const incrementTerminalSessionTextCount = async (
  sessionId: string
): Promise<{ session: TerminalSession; isLimitExceeded: boolean }> => {
  const key = buildSessionKey(sessionId);
  const session = await loadTerminalSession(sessionId);

  if (!session) {
    throw new Error("Terminal session not found before increment");
  }

  const normalizedSession = normalizeSession(session);
  await cacheSession(normalizedSession);

  const nextCount = await redis.hincrby(key, "textCount", 1);

  if (nextCount > normalizedSession.textLimit) {
    const limitedSession = refreshSessionExpiry({
      ...normalizedSession,
      textCount: normalizedSession.textLimit,
    });
    await syncSessionState(limitedSession);
    return { session: limitedSession, isLimitExceeded: true };
  }

  const updatedSession: TerminalSession = {
    ...normalizedSession,
    textCount: nextCount,
  };

  const refreshed = refreshSessionExpiry(updatedSession);
  await syncSessionState(refreshed);
  return { session: refreshed, isLimitExceeded: false };
};

export const rebuildTerminalSessionCache = async (): Promise<void> => {
  const activeSessions = await db
    .select()
    .from(terminalSessions)
    .where(gt(terminalSessions.expiresAt, new Date()));

  const keys = await redis.keys(`${SESSION_PREFIX}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }

  for (const row of activeSessions) {
    const session = normalizeSession(fromDbSession(row));
    await syncSessionState(session);
  }
};

export const pruneTerminalSessions = async (cutoff: Date): Promise<void> => {
  await db.delete(terminalSessions).where(lt(terminalSessions.expiresAt, cutoff));
};

export type { TerminalSession };

export const loadTerminalSession = async (sessionId: string): Promise<TerminalSession | null> => {
  let session = await fetchTerminalSession(sessionId);

  if (!session) {
    session = await fetchSessionFromDb(sessionId);
  }

  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await deleteSessionRecord(session.id);
    return null;
  }

  const normalized = normalizeSession(session);
  await syncSessionState(normalized);
  return normalized;
};

