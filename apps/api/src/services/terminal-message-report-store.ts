import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "../db";
import { terminalMessageReports, terminalMessages } from "../db/schema";

const reportReasonValues = ["personal_information", "hate_speech", "other"] as const;

type TerminalReportReason = (typeof reportReasonValues)[number];

type TerminalMessageReportRecord = {
  id: string;
  messageId: string;
  sessionId: string;
  reason: TerminalReportReason;
  description: string;
  createdAt: string;
};

type CreateTerminalMessageReportInput = {
  messageId: string;
  sessionId: string;
  reason: TerminalReportReason;
  description: string;
};

type CreateTerminalMessageReportResult =
  | { status: "created"; report: TerminalMessageReportRecord; reportCount: number }
  | { status: "duplicate" }
  | { status: "not_found" };

const toTerminalMessageReportRecord = (
  row: typeof terminalMessageReports.$inferSelect,
): TerminalMessageReportRecord => ({
  id: row.id,
  messageId: row.messageId,
  sessionId: row.sessionId,
  reason: row.reason as TerminalReportReason,
  description: row.description,
  createdAt: row.createdAt.toISOString(),
});

export const readReportCounts = async (messageIds: string[]): Promise<Map<string, number>> => {
  if (messageIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      messageId: terminalMessageReports.messageId,
      count: sql<number>`COUNT(*)`,
    })
    .from(terminalMessageReports)
    .where(inArray(terminalMessageReports.messageId, messageIds))
    .groupBy(terminalMessageReports.messageId);

  return new Map(rows.map((row) => [row.messageId, Number(row.count)]));
};

export const createTerminalMessageReport = async (
  input: CreateTerminalMessageReportInput,
): Promise<CreateTerminalMessageReportResult> => {
  const message = await db.query.terminalMessages.findFirst({
    where: eq(terminalMessages.id, input.messageId),
  });

  if (!message) {
    return { status: "not_found" };
  }

  const existing = await db
    .select({ id: terminalMessageReports.id })
    .from(terminalMessageReports)
    .where(
      and(
        eq(terminalMessageReports.messageId, input.messageId),
        eq(terminalMessageReports.sessionId, input.sessionId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { status: "duplicate" };
  }

  const [created] = await db
    .insert(terminalMessageReports)
    .values({
      id: randomUUID(),
      messageId: input.messageId,
      sessionId: input.sessionId,
      reason: input.reason,
      description: input.description,
    })
    .returning();

  const reportCounts = await readReportCounts([input.messageId]);

  return {
    status: "created",
    report: toTerminalMessageReportRecord(created),
    reportCount: reportCounts.get(input.messageId) ?? 1,
  };
};

export const fetchReportsForMessages = async (
  messageIds: string[],
): Promise<Map<string, TerminalMessageReportRecord[]>> => {
  if (messageIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select()
    .from(terminalMessageReports)
    .where(inArray(terminalMessageReports.messageId, messageIds))
    .orderBy(desc(terminalMessageReports.createdAt));

  const grouped = new Map<string, TerminalMessageReportRecord[]>();

  for (const row of rows) {
    const record = toTerminalMessageReportRecord(row);
    const collection = grouped.get(record.messageId);

    if (collection) {
      collection.push(record);
    } else {
      grouped.set(record.messageId, [record]);
    }
  }

  return grouped;
};

export type {
  TerminalMessageReportRecord,
  TerminalReportReason,
  CreateTerminalMessageReportInput,
  CreateTerminalMessageReportResult,
};
export { reportReasonValues };



