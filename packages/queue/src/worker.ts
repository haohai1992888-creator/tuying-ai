import { Worker, type Job } from "bullmq";
import { TASK_QUEUE_NAME, getRedisConnectionOptions, isMemoryQueueEnabled, isRedisQueueEnabled } from "./connection";
import type { TaskJobData } from "./task-queue";
import { registerMemoryHandler } from "./memory-queue";

export type TaskWorkerHandler = (taskId: string) => Promise<void>;

export function startTaskWorker(handler: TaskWorkerHandler): Worker | null {
  if (isMemoryQueueEnabled() && !isRedisQueueEnabled()) {
    registerMemoryHandler(handler);
    console.log("[worker] memory queue started");
    return null;
  }

  if (!isRedisQueueEnabled()) {
    console.warn("[worker] USE_REDIS_QUEUE is disabled — worker not started");
    return null;
  }

  const worker = new Worker(
    TASK_QUEUE_NAME,
    async (job: Job<TaskJobData>) => {
      await handler(job.data.taskId);
    },
    {
      connection: getRedisConnectionOptions(),
      concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
    }
  );

  worker.on("completed", (job) => {
    console.log(`[worker] task ${job.data.taskId} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(`[worker] task ${job?.data.taskId} failed:`, error.message);
  });

  return worker;
}
