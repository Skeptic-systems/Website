import { rebuildTerminalMessageCache } from "./terminal-message-store";
import { pruneTerminalSessions, rebuildTerminalSessionCache } from "./terminal-session";
import { ensureTerminalTables } from "./database";

const DAY_IN_MILLISECONDS = 86_400_000;
const SESSION_RETENTION_DAYS = 90;

const performSessionCleanup = async (): Promise<void> => {
  const cutoff = new Date(Date.now() - SESSION_RETENTION_DAYS * DAY_IN_MILLISECONDS);
  await pruneTerminalSessions(cutoff);
  await rebuildTerminalSessionCache();
};

const scheduleSessionCleanup = (): void => {
  setInterval(() => {
    void performSessionCleanup().catch((error) => {
      console.error("Terminal session cleanup failed:", error);
    });
  }, DAY_IN_MILLISECONDS);
};

export const initializeTerminalPersistence = async (): Promise<void> => {
  try {
    await ensureTerminalTables();
    await rebuildTerminalSessionCache();
    await rebuildTerminalMessageCache();
    scheduleSessionCleanup();
  } catch (error) {
    console.error("Failed to initialize terminal persistence:", error);
  }
};

