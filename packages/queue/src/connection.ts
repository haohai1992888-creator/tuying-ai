export const TASK_QUEUE_NAME = "acs-task";

export function isRedisQueueEnabled(): boolean {
  return process.env.USE_REDIS_QUEUE === "true" || process.env.USE_REDIS_QUEUE === "1";
}

export function isMemoryQueueEnabled(): boolean {
  return process.env.USE_MEMORY_QUEUE === "true" || process.env.USE_MEMORY_QUEUE === "1";
}

export function isQueueEnabled(): boolean {
  return isRedisQueueEnabled() || isMemoryQueueEnabled();
}

export function getRedisConnectionOptions(): { url: string; maxRetriesPerRequest: null } {
  return {
    url: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
    maxRetriesPerRequest: null,
  };
}

export async function closeRedisConnection(): Promise<void> {
  // BullMQ manages connections per Queue/Worker instance
}
