import { betterAuth } from "better-auth";
import { Pool } from "pg";

import { appEnv, authEnv, databaseEnv } from "../config/env";

const pool = new Pool({ connectionString: databaseEnv.connectionString });

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, "");

export const auth = betterAuth({
  baseURL: `${normalizeBaseUrl(appEnv.apiBaseUrl)}/auth`,
  basePath: "/auth",
  secret: authEnv.secret,
  trustedOrigins: authEnv.trustedOrigins,
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
});

export const initializeAuth = async (): Promise<void> => {
  const context = await auth.$context;
  await context.runMigrations();
};
