import { sql } from "drizzle-orm";
import { terminalRetentionEnv } from "../config/env";
import { db } from "../db";
import { pruneTerminalMessages, rebuildTerminalMessageCache } from "./terminal-message-store";
import { pruneTerminalSessions, rebuildTerminalSessionCache } from "./terminal-session";

const DAY_IN_MILLISECONDS = 86_400_000;

const ensureTerminalTables = async (): Promise<void> => {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS terminal_sessions (
      id TEXT PRIMARY KEY,
      text_count INTEGER NOT NULL,
      text_limit INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS terminal_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES terminal_sessions(id) ON DELETE CASCADE,
      text_default TEXT NOT NULL,
      text_en TEXT,
      text_de TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS terminal_sessions_expires_idx ON terminal_sessions (expires_at);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS terminal_messages_created_idx ON terminal_messages (created_at DESC);
  `);
};

const performTerminalCleanup = async (): Promise<void> => {
  const retentionDays = terminalRetentionEnv.retentionDays;

  if (retentionDays <= 0) {
    return;
  }

  const cutoff = new Date(Date.now() - retentionDays * DAY_IN_MILLISECONDS);

  await pruneTerminalMessages(cutoff);
  await pruneTerminalSessions(cutoff);

  await rebuildTerminalSessionCache();
  await rebuildTerminalMessageCache();
};

const scheduleTerminalCleanup = (): void => {
  const retentionDays = terminalRetentionEnv.retentionDays;

  if (retentionDays <= 0) {
    return;
  }

  setInterval(() => {
    void performTerminalCleanup().catch((error) => {
      console.error("Terminal cleanup failed:", error);
    });
  }, DAY_IN_MILLISECONDS);
};

export const initializeTerminalPersistence = async (): Promise<void> => {
  try {
    await ensureTerminalTables();
    await rebuildTerminalSessionCache();
    await rebuildTerminalMessageCache();
    scheduleTerminalCleanup();
  } catch (error) {
    console.error("Failed to initialize terminal persistence:", error);
  }
};

export const cleanupTerminalPersistence = performTerminalCleanup;

