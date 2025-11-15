import { sql } from "drizzle-orm";
import { db } from "../db";

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
  await ensureUsersTable();
  await ensureAiModerationEntriesTable();
  await ensureTerminalTables();
};

