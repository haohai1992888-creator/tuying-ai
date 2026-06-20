import Redis from "ioredis";
import { getRedisConnectionOptions } from "./connection";
import { getQueueStats } from "./task-queue";

export async function pingRedis(): Promise<boolean> {
  try {
    const client = new Redis(getRedisConnectionOptions().url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
    });
    await client.connect();
    const pong = await client.ping();
    await client.quit();
    return pong === "PONG";
  } catch {
    return false;
  }
}

export async function getQueueHealth(): Promise<{
  enabled: boolean;
  mode: "redis" | "memory" | "disabled";
  waiting?: number;
  active?: number;
  failed?: number;
}> {
  const redisEnabled = process.env.USE_REDIS_QUEUE === "true" || process.env.USE_REDIS_QUEUE === "1";
  const memoryEnabled = process.env.USE_MEMORY_QUEUE === "true" || process.env.USE_MEMORY_QUEUE === "1";

  if (!redisEnabled && !memoryEnabled) {
    return { enabled: false, mode: "disabled" };
  }

  if (redisEnabled) {
    const stats = await getQueueStats();
    return {
      enabled: true,
      mode: "redis",
      waiting: stats?.waiting ?? 0,
      active: stats?.active ?? 0,
      failed: stats?.failed ?? 0,
    };
  }

  const stats = await getQueueStats();
  return {
    enabled: true,
    mode: "memory",
    waiting: stats?.waiting ?? 0,
    active: stats?.active ?? 0,
    failed: stats?.failed ?? 0,
  };
}
