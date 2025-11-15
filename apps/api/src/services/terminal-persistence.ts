import { terminalRetentionEnv } from "../config/env";
import { pruneTerminalMessages, rebuildTerminalMessageCache } from "./terminal-message-store";
import { pruneTerminalSessions, rebuildTerminalSessionCache } from "./terminal-session";
import { ensureTerminalTables } from "./database";

const DAY_IN_MILLISECONDS = 86_400_000;

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

