import { prisma } from "@acs/database";
import { pointService } from "@acs/points";
import {
  BatchStatus,
  getPointCost,
  REDIS_QUEUES,
  TaskStatus,
  TaskType,
} from "@acs/shared";
import { queueService } from "@acs/shared/redis";
import { workflowQueueWorker, workflowRegistry } from "@acs/workflow";
import { batchSplitter } from "./BatchSplitter";
import { concurrencyManager } from "./ConcurrencyManager";
import { progressTracker } from "./ProgressTracker";
import { resultPackager } from "./ResultPackager";
import type { BatchCreateInput, BatchProgress, BatchQueuePayload } from "./types";
import { BATCH_WORKFLOW_MAP } from "./types";

export interface BatchTaskDto {
  id: string;
  userId: string;
  taskType: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  status: BatchStatus;
  resultZipUrl: string | null;
  paused: boolean;
  createdAt: string;
  completedAt: string | null;
  progress?: BatchProgress;
}

export class BatchService {
  async createBatch(input: BatchCreateInput): Promise<BatchTaskDto> {
    const mapping = BATCH_WORKFLOW_MAP[input.taskType];
    if (!mapping) throw new Error(`不支持的批量任务类型: ${input.taskType}`);

    const items = batchSplitter.splitFromUrls(input.items);
    if (items.length === 0) throw new Error("请提供至少一张图片");

    const perItemCost = getPointCost(input.taskType as TaskType);
    const balance = await pointService.getBalance(input.userId);
    if (balance < perItemCost) {
      throw new Error(`积分不足，每张至少需要 ${perItemCost} 积分`);
    }

    const batch = await prisma.batchTask.create({
      data: {
        userId: input.userId,
        taskType: input.taskType,
        totalCount: items.length,
        status: BatchStatus.PENDING,
        options: (input.options ?? {}) as object,
        sourceType: input.sourceType ?? "files",
        items: {
          create: items.map((item, index) => ({
            inputUrl: item.inputUrl,
            itemIndex: index,
            status: TaskStatus.PENDING,
          })),
        },
      },
    });

    await queueService.enqueue(REDIS_QUEUES.BATCH, {
      batchTaskId: batch.id,
      userId: input.userId,
    } satisfies BatchQueuePayload);

    void this.processBatchQueue();

    return mapBatch(batch, { total: items.length, success: 0, failed: 0, processing: items.length, status: batch.status });
  }

  async listBatches(userId: string, limit = 20): Promise<BatchTaskDto[]> {
    const rows = await prisma.batchTask.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return Promise.all(
      rows.map(async (row) => {
        const progress = await progressTracker.getProgress(row.id);
        return mapBatch(row, progress ?? undefined);
      })
    );
  }

  async getBatch(userId: string, batchTaskId: string): Promise<BatchTaskDto | null> {
    const row = await prisma.batchTask.findFirst({
      where: { id: batchTaskId, userId },
    });
    if (!row) return null;
    const progress = await progressTracker.getProgress(batchTaskId);
    return mapBatch(row, progress ?? undefined);
  }

  async listAllBatches(limit = 50): Promise<Array<BatchTaskDto & { userLabel?: string }>> {
    const rows = await prisma.batchTask.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { nickname: true, email: true, phone: true } } },
    });

    return rows.map((row) => ({
      ...mapBatch(row),
      userLabel:
        row.user.nickname?.trim() ||
        row.user.email?.trim() ||
        row.user.phone?.trim() ||
        row.userId.slice(0, 8),
    }));
  }

  /** 处理 batch-queue — 按并发调度子任务 */
  async processBatchQueue(): Promise<void> {
    let payload = await queueService.dequeue<BatchQueuePayload>(REDIS_QUEUES.BATCH);
    while (payload) {
      await this.processBatch(payload.batchTaskId);
      payload = await queueService.dequeue<BatchQueuePayload>(REDIS_QUEUES.BATCH);
    }
  }

  async processBatch(batchTaskId: string): Promise<void> {
    const batch = await prisma.batchTask.findUnique({
      where: { id: batchTaskId },
      include: { user: true },
    });
    if (!batch || batch.paused || batch.status === BatchStatus.CANCELLED) return;

    if (batch.status === BatchStatus.PENDING) {
      await prisma.batchTask.update({
        where: { id: batchTaskId },
        data: { status: BatchStatus.PROCESSING },
      });
    }

    const slots = concurrencyManager.remainingSlotsForUser(batch.userId, batch.user);
    if (slots <= 0) {
      await queueService.enqueue(REDIS_QUEUES.BATCH, {
        batchTaskId,
        userId: batch.userId,
      });
      return;
    }

    const pendingItems = await prisma.batchItem.findMany({
      where: { batchTaskId, status: TaskStatus.PENDING },
      orderBy: { itemIndex: "asc" },
      take: slots,
    });

    const mapping = BATCH_WORKFLOW_MAP[batch.taskType];
    if (!mapping) return;

    const workflow = workflowRegistry.getByTaskType(mapping.workflowTaskType);
    if (!workflow) return;

    const options = (batch.options ?? {}) as Record<string, unknown>;
    const perItemCost = getPointCost(batch.taskType as TaskType);

    for (const item of pendingItems) {
      if (!concurrencyManager.canAcquireForUser(batch.userId, batch.user)) break;

      const balance = await pointService.getBalance(batch.userId);
      if (balance < perItemCost) {
        await prisma.batchItem.update({
          where: { id: item.id },
          data: { status: TaskStatus.FAILED, error: "积分不足" },
        });
        continue;
      }

      concurrencyManager.acquire(batch.userId);

      const task = await prisma.task.create({
        data: {
          userId: batch.userId,
          taskType: mapping.workflowTaskType,
          cost: perItemCost,
          inputUrl: item.inputUrl,
          batchTaskId: batch.id,
          batchItemId: item.id,
          status: TaskStatus.PENDING,
        },
      });

      await prisma.batchItem.update({
        where: { id: item.id },
        data: { status: TaskStatus.PROCESSING },
      });

      await queueService.enqueue(REDIS_QUEUES.IMAGE_GENERATE, {
        batchTaskId: batch.id,
        batchItemId: item.id,
        userId: batch.userId,
        taskId: task.id,
      });

      await workflowQueueWorker.enqueue({
        taskId: task.id,
        userId: batch.userId,
        workflowId: workflow.id,
        input: {
          taskType: mapping.workflowTaskType,
          inputUrl: item.inputUrl,
          cost: perItemCost,
          batchTaskId: batch.id,
          batchItemId: item.id,
          ...options,
        },
      });
    }

    void workflowQueueWorker.processAll();

    const stillPending = await prisma.batchItem.count({
      where: {
        batchTaskId,
        status: { in: [TaskStatus.PENDING, TaskStatus.PROCESSING] },
      },
    });

    if (stillPending > 0 && !batch.paused) {
      await queueService.enqueue(REDIS_QUEUES.BATCH, {
        batchTaskId,
        userId: batch.userId,
      });
    }
  }

  /** Workflow 完成后回调 — 更新进度、释放并发、打包 ZIP */
  async handleTaskComplete(input: {
    taskId: string;
    success: boolean;
    outputUrl?: string | null;
    error?: string;
  }): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: input.taskId },
      include: { batchItem: true },
    });
    if (!task?.batchTaskId || !task.batchItemId) return;

    concurrencyManager.release(task.userId);

    await prisma.batchItem.update({
      where: { id: task.batchItemId },
      data: {
        status: input.success ? TaskStatus.SUCCESS : TaskStatus.FAILED,
        outputUrl: input.outputUrl ?? null,
        error: input.error ?? null,
      },
    });

    await progressTracker.refreshBatchStatus(task.batchTaskId);

    const batch = await prisma.batchTask.findUnique({ where: { id: task.batchTaskId } });
    const pending = await prisma.batchItem.count({
      where: {
        batchTaskId: task.batchTaskId,
        status: { in: [TaskStatus.PENDING, TaskStatus.PROCESSING] },
      },
    });

    if (pending === 0 && batch && batch.status !== BatchStatus.CANCELLED) {
      try {
        await resultPackager.packageBatch(task.batchTaskId);
      } catch (err) {
        console.error("[batch] ZIP packaging failed:", err);
      }
    } else if (pending > 0 && batch && !batch.paused && batch.status !== BatchStatus.CANCELLED) {
      await queueService.enqueue(REDIS_QUEUES.BATCH, {
        batchTaskId: task.batchTaskId,
        userId: task.userId,
      });
      void this.processBatchQueue();
    }
  }
}

function mapBatch(
  row: {
    id: string;
    userId: string;
    taskType: string;
    totalCount: number;
    successCount: number;
    failedCount: number;
    status: string;
    resultZipUrl: string | null;
    paused: boolean;
    createdAt: Date;
    completedAt: Date | null;
  },
  progress?: BatchProgress
): BatchTaskDto {
  return {
    id: row.id,
    userId: row.userId,
    taskType: row.taskType,
    totalCount: row.totalCount,
    successCount: row.successCount,
    failedCount: row.failedCount,
    status: row.status as BatchStatus,
    resultZipUrl: row.resultZipUrl,
    paused: row.paused,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    progress,
  };
}

export const batchService = new BatchService();
export const batchEngine = batchService;
