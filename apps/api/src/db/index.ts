import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { databaseEnv } from "../config/env";
import * as schema from "./schema";

const client = postgres(databaseEnv.connectionString);
export const db = drizzle(client, { schema });











