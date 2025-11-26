import { sql } from "drizzle-orm";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { databaseEnv } from "../config/env";
import { db } from "../db";

const DEFAULT_WAIT_RETRIES = 20;
const DEFAULT_WAIT_DELAY_MS = 1_500;

const TABLE_DEFINITIONS = {
  user: [
    "id",
    "name",
    "email",
    "image",
    "emailVerified",
    "createdAt",
    "updatedAt",
    "first_name",
    "last_name",
    "role",
  ],
  ai_moderation_entries: ["id", "user_id", "text_default", "text_en", "text_de"],
  terminal_sessions: ["id", "text_count", "text_limit", "created_at", "updated_at", "expires_at"],
  terminal_messages: ["id", "session_id", "text_default", "text_en", "text_de", "created_at"],
  terminal_message_reports: ["id", "message_id", "session_id", "reason", "description", "created_at"],
} as const;

const ENUM_DEFINITIONS = {
  user_role: ["owner", "admin", "member"],
  terminal_report_reason: ["personal_information", "hate_speech", "other"],
} as const;

type TableName = keyof typeof TABLE_DEFINITIONS;
type EnumName = keyof typeof ENUM_DEFINITIONS;

type ColumnDiffMap = Partial<Record<TableName, string[]>>;
type EnumDiffMap = Partial<Record<EnumName, string[]>>;

type SchemaInspection = {
  presentTables: ReadonlySet<TableName>;
  missingTables: TableName[];
  missingColumns: ColumnDiffMap;
  missingEnumTypes: EnumName[];
  missingEnumValues: EnumDiffMap;
};

type SchemaAction = "push" | "migrate" | "skip";

type SchemaDecision = {
  action: SchemaAction;
  reason: string;
};

const locateApiRoot = (): string => {
  let currentDir = dirname(fileURLToPath(import.meta.url));

  while (true) {
    const candidate = resolve(currentDir, "package.json");

    if (existsSync(candidate)) {
      return currentDir;
    }

    const parentDir = resolve(currentDir, "..");

    if (parentDir === currentDir) {
      throw new Error("Unable to locate API package root for database synchronization");
    }

    currentDir = parentDir;
  }
};

const resolveDrizzleBinary = (rootDir: string): string => {
  const binaryName = process.platform === "win32" ? "drizzle-kit.cmd" : "drizzle-kit";
  const binaryPath = resolve(rootDir, "node_modules", ".bin", binaryName);

  if (!existsSync(binaryPath)) {
    throw new Error(`drizzle-kit executable not found at ${binaryPath}`);
  }

  return binaryPath;
};

const API_ROOT = locateApiRoot();
const DRIZZLE_BINARY_PATH = resolveDrizzleBinary(API_ROOT);

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

const inspectEnumState = async (): Promise<{ missingEnumTypes: EnumName[]; missingEnumValues: EnumDiffMap }> => {
  const enumNames = Object.keys(ENUM_DEFINITIONS) as EnumName[];
  const missingEnumTypes: EnumName[] = [];
  const missingEnumValues: EnumDiffMap = {};

  for (const enumName of enumNames) {
    const existsResult = (await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = ${enumName}
      ) AS "exists";
    `)) as Array<{ exists: boolean }>;

    const enumExists = Boolean(existsResult[0]?.exists);

    if (!enumExists) {
      missingEnumTypes.push(enumName);
      continue;
    }

    const valueRows = (await db.execute(sql`
      SELECT e.enumlabel
      FROM pg_type AS t
      JOIN pg_enum AS e ON t.oid = e.enumtypid
      WHERE t.typname = ${enumName};
    `)) as Array<{ enumlabel: string }>;

    const actualValues = new Set(valueRows.map((row) => row.enumlabel));
    const expectedValues = ENUM_DEFINITIONS[enumName];
    const missingValues = expectedValues.filter((value) => !actualValues.has(value));

    if (missingValues.length > 0) {
      missingEnumValues[enumName] = missingValues;
    }
  }

  return {
    missingEnumTypes,
    missingEnumValues,
  };
};

const inspectSchema = async (): Promise<SchemaInspection> => {
  const tableNames = Object.keys(TABLE_DEFINITIONS) as TableName[];
  const presentTables = new Set<TableName>();
  const missingTables: TableName[] = [];
  const missingColumns: ColumnDiffMap = {};

  for (const tableName of tableNames) {
    const existsResult = (await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = ${tableName}
      ) AS "exists";
    `)) as Array<{ exists: boolean }>;

    const tableExists = Boolean(existsResult[0]?.exists);

    if (!tableExists) {
      missingTables.push(tableName);
      continue;
    }

    presentTables.add(tableName);

    const columnRows = (await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${tableName};
    `)) as Array<{ column_name: string }>;

    const actualColumns = new Set(columnRows.map((row) => row.column_name));
    const expectedColumns = TABLE_DEFINITIONS[tableName];
    const diff = expectedColumns.filter((column) => !actualColumns.has(column));

    if (diff.length > 0) {
      missingColumns[tableName] = diff;
    }
  }

  const enumInspection = await inspectEnumState();

  return {
    presentTables,
    missingTables,
    missingColumns,
    missingEnumTypes: enumInspection.missingEnumTypes,
    missingEnumValues: enumInspection.missingEnumValues,
  };
};

const summarizeSchemaDrift = (inspection: SchemaInspection): string => {
  const summaryParts: string[] = [];

  if (inspection.missingTables.length > 0) {
    summaryParts.push(`missing tables: ${inspection.missingTables.join(", ")}`);
  }

  for (const tableName of Object.keys(inspection.missingColumns) as TableName[]) {
    const columns = inspection.missingColumns[tableName];

    if (columns && columns.length > 0) {
      summaryParts.push(`${tableName} missing columns: ${columns.join(", ")}`);
    }
  }

  if (inspection.missingEnumTypes.length > 0) {
    summaryParts.push(`missing enums: ${inspection.missingEnumTypes.join(", ")}`);
  }

  for (const enumName of Object.keys(inspection.missingEnumValues) as EnumName[]) {
    const values = inspection.missingEnumValues[enumName];

    if (values && values.length > 0) {
      summaryParts.push(`${enumName} missing values: ${values.join(", ")}`);
    }
  }

  return summaryParts.join("; ");
};

const determineSchemaDecision = (inspection: SchemaInspection): SchemaDecision => {
  if (inspection.presentTables.size === 0) {
    return {
      action: "push",
      reason: "No managed tables found",
    };
  }

  const hasMissingTables = inspection.missingTables.length > 0;
  const hasMissingColumns = Object.keys(inspection.missingColumns).length > 0;
  const hasEnumIssues =
    inspection.missingEnumTypes.length > 0 || Object.keys(inspection.missingEnumValues).length > 0;

  if (hasMissingTables || hasMissingColumns || hasEnumIssues) {
    return {
      action: "migrate",
      reason: summarizeSchemaDrift(inspection) || "Schema drift detected",
    };
  }

  return {
    action: "skip",
    reason: "Schema already aligned",
  };
};

const runDrizzleSync = async (action: Exclude<SchemaAction, "skip">, reason: string): Promise<void> => {
  await new Promise<void>((resolveSync, rejectSync) => {
    console.log(`[database] Running drizzle-kit push (${action}) → ${reason}`);

    const child = spawn(DRIZZLE_BINARY_PATH, ["push", "--force"], {
      cwd: API_ROOT,
      env: {
        ...process.env,
        DATABASE_URL: databaseEnv.connectionString,
      },
      stdio: "inherit",
    });

    child.on("error", (error) => {
      rejectSync(error);
    });

    child.on("close", (exitCode) => {
      if (exitCode === 0) {
        resolveSync();
        return;
      }

      rejectSync(new Error(`drizzle-kit push exited with code ${exitCode ?? -1}`));
    });
  });
};

const synchronizeDatabaseSchema = async (): Promise<void> => {
  const inspection = await inspectSchema();
  const decision = determineSchemaDecision(inspection);

  if (decision.action === "skip") {
    console.log("[database] Schema already matches Drizzle definitions");
    return;
  }

  await runDrizzleSync(decision.action, decision.reason);

  const verification = await inspectSchema();
  const verificationDecision = determineSchemaDecision(verification);

  if (verificationDecision.action !== "skip") {
    throw new Error(`[database] Schema mismatch persists after ${decision.action}: ${verificationDecision.reason}`);
  }

  console.log("[database] Schema synchronized successfully");
};

const ensureUserProfileSchema = async (): Promise<void> => {
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member');
      END IF;
    END;
    $$;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum
          WHERE enumlabel = 'admin' AND enumtypid = 'user_role'::regtype
        ) THEN
          ALTER TYPE user_role ADD VALUE 'admin';
        END IF;
      END IF;
    END;
    $$;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user' AND column_name = 'first_name'
      ) THEN
        ALTER TABLE "user" ADD COLUMN first_name TEXT;
      END IF;
    END;
    $$;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user' AND column_name = 'last_name'
      ) THEN
        ALTER TABLE "user" ADD COLUMN last_name TEXT;
      END IF;
    END;
    $$;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user' AND column_name = 'createdAt'
      ) THEN
        ALTER TABLE "user" ADD COLUMN "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();
      END IF;
    END;
    $$;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user' AND column_name = 'updatedAt'
      ) THEN
        ALTER TABLE "user" ADD COLUMN "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();
      END IF;
    END;
    $$;
  `);

  await db.execute(sql`ALTER TABLE "user" ALTER COLUMN "createdAt" SET DEFAULT NOW();`);
  await db.execute(sql`ALTER TABLE "user" ALTER COLUMN "updatedAt" SET DEFAULT NOW();`);
  await db.execute(sql`UPDATE "user" SET "createdAt" = NOW() WHERE "createdAt" IS NULL;`);
  await db.execute(sql`UPDATE "user" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;`);

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user' AND column_name = 'role'
      ) THEN
        ALTER TABLE "user" ADD COLUMN role user_role NOT NULL DEFAULT 'member';
      END IF;
    END;
    $$;
  `);

  await db.execute(sql`
    ALTER TABLE "user"
    ALTER COLUMN role SET DEFAULT 'member';
  `);

  const legacyTableExistsResult = (await db.execute(sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    ) AS "exists";
  `)) as Array<{ exists: boolean }>;

  const legacyTableExists = legacyTableExistsResult[0]?.exists ?? false;

  if (legacyTableExists) {
    await db.execute(sql`
      UPDATE "user" AS u
      SET
        first_name = COALESCE(u.first_name, legacy.first_name),
        last_name = COALESCE(u.last_name, legacy.last_name),
        role = COALESCE(u.role, legacy.role)
      FROM users AS legacy
      WHERE legacy.auth_user_id = u.id;
    `);

    await db.execute(sql`DROP TABLE IF EXISTS users;`);
  }
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
  await synchronizeDatabaseSchema();
  await ensureUserProfileSchema();
  await ensureAiModerationEntriesTable();
  await ensureTerminalTables();
};

