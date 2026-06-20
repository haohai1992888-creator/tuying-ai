import { Queue } from "bullmq";
import { REDIS_QUEUES } from "@acs/shared";
import {
  getRedisConnectionOptions,
  isMemoryQueueEnabled,
  isQueueEnabled,
  isRedisQueueEnabled,
  TASK_QUEUE_NAME,
} from "./connection";
import { enqueueMemoryTask, getMemoryQueueDepth } from "./memory-queue";

export interface TaskJobData {
  taskId: string;
  userId?: string;
}

let taskQueue: Queue | null = null;

export function getTaskQueue(): Queue | null {
  if (!isRedisQueueEnabled()) return null;
  if (!taskQueue) {
    taskQueue = new Queue(TASK_QUEUE_NAME, {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
  }
  return taskQueue;
}

export async function enqueueTask(taskId: string, userId?: string): Promise<boolean> {
  if (!isQueueEnabled()) return false;

  if (isMemoryQueueEnabled() && !isRedisQueueEnabled()) {
    await enqueueMemoryTask(taskId, userId);
    return true;
  }

  const queue = getTaskQueue();
  if (!queue) return false;

  await queue.add(
    REDIS_QUEUES.AI_TASK,
    { taskId, userId },
    { jobId: `task-${taskId}` }
  );
  return true;
}

export async function getQueueStats(): Promise<{ waiting: number; active: number; failed: number } | null> {
  if (isMemoryQueueEnabled() && !isRedisQueueEnabled()) {
    const waiting = getMemoryQueueDepth();
    return { waiting, active: 0, failed: 0 };
  }

  const queue = getTaskQueue();
  if (!queue) return null;

  const [waiting, active, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getFailedCount(),
  ]);

  return { waiting, active, failed };
}

export { isQueueEnabled, isMemoryQueueEnabled, isRedisQueueEnabled } from "./connection";
