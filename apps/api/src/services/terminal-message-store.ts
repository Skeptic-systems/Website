import { randomUUID } from "node:crypto";
import { desc, lt } from "drizzle-orm";
import { db } from "../db";
import { terminalMessages } from "../db/schema";
import { redis } from "../lib/redis";

type TerminalMessageRecord = {
  id: string;
  sessionId: string;
  textDefault: string;
  textEn: string;
  textDe: string;
  createdAt: string;
};

type PersistTerminalMessageInput = {
  sessionId: string;
  textDefault: string;
  textEn: string;
  textDe: string;
};

type DbTerminalMessage = typeof terminalMessages.$inferSelect;

const TERMINAL_MESSAGE_LIST_KEY = "terminal:messages";
const TERMINAL_MESSAGE_MAX_ENTRIES = 100;
const TERMINAL_MESSAGE_TTL_SECONDS = 60 * 60 * 24 * 7;

const toTerminalMessageRecord = (row: DbTerminalMessage): TerminalMessageRecord => ({
  id: row.id,
  sessionId: row.sessionId,
  textDefault: row.textDefault,
  textEn: row.textEn ?? "",
  textDe: row.textDe ?? "",
  createdAt: row.createdAt.toISOString(),
});

const parseRecord = (payload: string): TerminalMessageRecord | null => {
  try {
    const parsed = JSON.parse(payload) as Partial<TerminalMessageRecord>;

    if (
      typeof parsed.id !== "string" ||
      typeof parsed.sessionId !== "string" ||
      typeof parsed.textDefault !== "string" ||
      typeof parsed.textEn !== "string" ||
      typeof parsed.textDe !== "string" ||
      typeof parsed.createdAt !== "string"
    ) {
      return null;
    }

    return {
      id: parsed.id,
      sessionId: parsed.sessionId,
      textDefault: parsed.textDefault,
      textEn: parsed.textEn,
      textDe: parsed.textDe,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
};

const cacheMessages = async (records: TerminalMessageRecord[]): Promise<void> => {
  await redis.del(TERMINAL_MESSAGE_LIST_KEY);

  if (records.length === 0) {
    return;
  }

  const pipeline = redis.multi();

  for (const record of [...records].reverse()) {
    pipeline.rpush(TERMINAL_MESSAGE_LIST_KEY, JSON.stringify(record));
  }

  pipeline.ltrim(TERMINAL_MESSAGE_LIST_KEY, -TERMINAL_MESSAGE_MAX_ENTRIES, -1);
  pipeline.expire(TERMINAL_MESSAGE_LIST_KEY, TERMINAL_MESSAGE_TTL_SECONDS);
  await pipeline.exec();
};

export const persistTerminalMessage = async (
  input: PersistTerminalMessageInput,
): Promise<TerminalMessageRecord> => {
  const record: TerminalMessageRecord = {
    id: randomUUID(),
    sessionId: input.sessionId,
    textDefault: input.textDefault,
    textEn: input.textEn,
    textDe: input.textDe,
    createdAt: new Date().toISOString(),
  };

  await db.insert(terminalMessages).values({
    id: record.id,
    sessionId: record.sessionId,
    textDefault: record.textDefault,
    textEn: record.textEn,
    textDe: record.textDe,
    createdAt: new Date(record.createdAt),
  });

  await redis
    .multi()
    .lpush(TERMINAL_MESSAGE_LIST_KEY, JSON.stringify(record))
    .ltrim(TERMINAL_MESSAGE_LIST_KEY, 0, TERMINAL_MESSAGE_MAX_ENTRIES - 1)
    .expire(TERMINAL_MESSAGE_LIST_KEY, TERMINAL_MESSAGE_TTL_SECONDS)
    .exec();

  return record;
};

export const fetchRecentTerminalMessages = async (
  limit: number,
): Promise<TerminalMessageRecord[]> => {
  if (limit <= 0) {
    return [];
  }

  const boundedLimit = Math.min(limit, TERMINAL_MESSAGE_MAX_ENTRIES);
  const rawEntries = await redis.lrange(
    TERMINAL_MESSAGE_LIST_KEY,
    0,
    boundedLimit - 1,
  );

  const parsedEntries = rawEntries
    .map((entry) => parseRecord(entry))
    .filter((entry): entry is TerminalMessageRecord => entry !== null);

  if (parsedEntries.length > 0) {
    return parsedEntries;
  }

  const rows = await db
    .select()
    .from(terminalMessages)
    .orderBy(desc(terminalMessages.createdAt))
    .limit(boundedLimit);

  if (rows.length === 0) {
    return [];
  }

  const records = rows.map(toTerminalMessageRecord);
  await cacheMessages(records);
  return records;
};

export const rebuildTerminalMessageCache = async (): Promise<void> => {
  const rows = await db
    .select()
    .from(terminalMessages)
    .orderBy(desc(terminalMessages.createdAt))
    .limit(TERMINAL_MESSAGE_MAX_ENTRIES);

  const records = rows.map(toTerminalMessageRecord);
  await cacheMessages(records);
};

export const pruneTerminalMessages = async (cutoff: Date): Promise<void> => {
  await db.delete(terminalMessages).where(lt(terminalMessages.createdAt, cutoff));
};

export type { TerminalMessageRecord, PersistTerminalMessageInput };