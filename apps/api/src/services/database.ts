import { sql } from "drizzle-orm";
import { db } from "../db";

const DEFAULT_WAIT_RETRIES = 20;
const DEFAULT_WAIT_DELAY_MS = 1_500;

const pause = (duration: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

const waitForDatabaseAvailability = async (): Promise<void> => {
  for (let attempt = 1; attempt <= DEFAULT_WAIT_RETRIES; attempt++) {
    try {
      await db.execute(sql`select 1;`);
      return;
    } catch (error) {
      if (attempt === DEFAULT_WAIT_RETRIES) {
        throw new Error("Database unavailable after repeated attempts");
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn(
        `[database] Connection attempt ${attempt} failed: ${message}. Retrying in ${DEFAULT_WAIT_DELAY_MS}ms.`,
      );
      await pause(DEFAULT_WAIT_DELAY_MS);
    }
  }
};

const ensureUsersTable = async (): Promise<void> => {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
};

const ensureAiModerationEntriesTable = async (): Promise<void> => {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ai_moderation_entries (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      text_default TEXT NOT NULL,
      text_en TEXT,
      text_de TEXT
    );
  `);
};

export const ensureTerminalTables = async (): Promise<void> => {
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

export const initializeDatabase = async (): Promise<void> => {
  await waitForDatabaseAvailability();
  await ensureUsersTable();
  await ensureAiModerationEntriesTable();
  await ensureTerminalTables();
};

