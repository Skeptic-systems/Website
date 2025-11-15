import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const contextFilePath = resolve(currentDir, "terminal-context.md");

export const loadTerminalContext = async (): Promise<string> => {
  try {
    const rawContent = await readFile(contextFilePath, "utf8");
    const trimmedContent = rawContent.trim();

    if (trimmedContent.length === 0) {
      throw new Error("Terminal AI context file is empty");
    }

    return trimmedContent;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to load terminal AI context: ${message}`);
  }
};

