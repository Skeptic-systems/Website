import Redis from "ioredis";
import { redisEnv } from "../config/env";

const redis = new Redis({
  host: redisEnv.host,
  port: redisEnv.port,
  password: redisEnv.password ?? undefined,
  enableAutoPipelining: true,
});

redis.on("error", (error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown Redis error";
  console.error(`Redis client error: ${message}`);
});

export { redis };








