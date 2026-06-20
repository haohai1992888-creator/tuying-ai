import { prisma } from "@acs/database";
import { BatchStatus, REDIS_QUEUES, TaskStatus } from "@acs/shared";
import { queueService } from "@acs/shared/redis";
import type { BatchQueuePayload } from "./types";

export class BatchRecoveryService {
  async pause(batchTaskId: string, userId: string): Promise<void> {
    await prisma.batchTask.updateMany({
      where: { id: batchTaskId, userId, status: { in: [BatchStatus.PENDING, BatchStatus.PROCESSING] } },
      data: { paused: true, status: BatchStatus.PAUSED },
    });
  }

  async resume(batchTaskId: string, userId: string): Promise<void> {
    const batch = await prisma.batchTask.updateMany({
      where: { id: batchTaskId, userId, status: BatchStatus.PAUSED },
      data: { paused: false, status: BatchStatus.PROCESSING },
    });
    if (batch.count === 0) throw new Error("无法继续：任务未暂停或不存在");

    await queueService.enqueue(REDIS_QUEUES.BATCH, {
      batchTaskId,
      userId,
    } satisfies BatchQueuePayload);

    const { batchEngine } = await import("./batch.service.js");
    void batchEngine.processBatchQueue();
  }

  async cancel(batchTaskId: string, userId: string): Promise<void> {
    await prisma.batchTask.updateMany({
      where: {
        id: batchTaskId,
        userId,
        status: { in: [BatchStatus.PENDING, BatchStatus.PROCESSING, BatchStatus.PAUSED] },
      },
      data: { status: BatchStatus.CANCELLED, paused: false, completedAt: new Date() },
    });

    await prisma.batchItem.updateMany({
      where: { batchTaskId, status: TaskStatus.PENDING },
      data: { status: TaskStatus.FAILED, error: "任务已取消" },
    });
  }

  async retryFailed(batchTaskId: string, userId: string): Promise<number> {
    const batch = await prisma.batchTask.findFirst({
      where: { id: batchTaskId, userId },
    });
    if (!batch) throw new Error("批量任务不存在");

    const result = await prisma.batchItem.updateMany({
      where: { batchTaskId, status: TaskStatus.FAILED },
      data: { status: TaskStatus.PENDING, error: null, outputUrl: null },
    });

    await prisma.batchTask.update({
      where: { id: batchTaskId },
      data: {
        status: BatchStatus.PROCESSING,
        paused: false,
        completedAt: null,
        failedCount: Math.max(0, batch.failedCount - result.count),
      },
    });

    await queueService.enqueue(REDIS_QUEUES.BATCH, {
      batchTaskId,
      userId,
    } satisfies BatchQueuePayload);

    const { batchEngine } = await import("./batch.service.js");
    void batchEngine.processBatchQueue();

    return result.count;
  }
}

export const batchRecoveryService = new BatchRecoveryService();
