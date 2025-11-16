import { redis } from "../lib/redis";

export const verifyRedisConnection = async (): Promise<void> => {
  await redis.ping();
};



