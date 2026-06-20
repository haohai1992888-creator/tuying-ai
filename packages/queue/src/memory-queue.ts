import type { TaskJobData } from "./task-queue";

type MemoryHandler = (taskId: string) => Promise<void>;

const pending: TaskJobData[] = [];
let handler: MemoryHandler | null = null;
let draining = false;

export function registerMemoryHandler(fn: MemoryHandler): void {
  handler = fn;
  void drainMemoryQueue();
}

export async function enqueueMemoryTask(taskId: string, userId?: string): Promise<void> {
  pending.push({ taskId, userId });
  void drainMemoryQueue();
}

async function drainMemoryQueue(): Promise<void> {
  if (draining || !handler) return;
  draining = true;
  try {
    while (pending.length > 0) {
      const job = pending.shift();
      if (!job) break;
      await handler(job.taskId);
    }
  } finally {
    draining = false;
    if (pending.length > 0) void drainMemoryQueue();
  }
}

export function getMemoryQueueDepth(): number {
  return pending.length;
}
