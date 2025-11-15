import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(currentDir, "../src/config/terminal-context.md");
const targetDir = resolve(currentDir, "../dist");
const targetPath = resolve(targetDir, "terminal-context.md");

try {
  mkdirSync(targetDir, { recursive: true });
  cpSync(sourcePath, targetPath);
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Failed to copy terminal context: ${message}`);
  process.exit(1);
}

