import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiModerationEntries = pgTable("ai_moderation_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  textDefault: text("text_default").notNull(),
  textEn: text("text_en"),
  textDe: text("text_de"),
});

export const terminalSessions = pgTable("terminal_sessions", {
  id: text("id").primaryKey(),
  textCount: integer("text_count").notNull(),
  textLimit: integer("text_limit").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const terminalMessages = pgTable("terminal_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => terminalSessions.id, { onDelete: "cascade" }),
  textDefault: text("text_default").notNull(),
  textEn: text("text_en"),
  textDe: text("text_de"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});











