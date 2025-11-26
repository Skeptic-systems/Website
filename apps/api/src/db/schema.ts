import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "member"]);

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  image: text("image"),
  emailVerified: boolean("emailVerified").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: userRoleEnum("role").notNull().default("member"),
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

export const terminalReportReasonEnum = pgEnum("terminal_report_reason", [
  "personal_information",
  "hate_speech",
  "other",
]);

export const terminalMessageReports = pgTable(
  "terminal_message_reports",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id")
      .notNull()
      .references(() => terminalMessages.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    reason: terminalReportReasonEnum("reason").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueReporter: uniqueIndex("terminal_message_reports_message_session_idx").on(
      table.messageId,
      table.sessionId,
    ),
  }),
);











