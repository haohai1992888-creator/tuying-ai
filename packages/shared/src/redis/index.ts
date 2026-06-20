import { REDIS_KEYS, REDIS_QUEUES } from "../constants";

/** Redis 缓存服务骨架 — Phase 1 不连接真实 Redis */
export class CacheService {
  private readonly store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  userKey(userId: string): string {
    return REDIS_KEYS.user(userId);
  }

  pointsKey(userId: string): string {
    return REDIS_KEYS.points(userId);
  }

  taskKey(taskId: string): string {
    return REDIS_KEYS.task(taskId);
  }
}

/** Redis 队列服务骨架 — Phase 1 内存队列 */
export class QueueService {
  private readonly queues = new Map<string, unknown[]>();

  async enqueue(queueName: string, payload: unknown): Promise<void> {
    const queue = this.queues.get(queueName) ?? [];
    queue.push(payload);
    this.queues.set(queueName, queue);
  }

  async dequeue<T>(queueName: string): Promise<T | null> {
    const queue = this.queues.get(queueName) ?? [];
    const item = queue.shift();
    this.queues.set(queueName, queue);
    return (item as T) ?? null;
  }

  get aiTaskQueue(): string {
    return REDIS_QUEUES.AI_TASK;
  }

  get batchTaskQueue(): string {
    return REDIS_QUEUES.BATCH_TASK;
  }
}

export const cacheService = new CacheService();
export const queueService = new QueueService();
