import { prisma } from "@acs/database";
import { BatchStatus, TaskStatus } from "@acs/shared";
import type { BatchProgress } from "./types";

export class ProgressTracker {
  async getProgress(batchTaskId: string): Promise<BatchProgress | null> {
    const batch = await prisma.batchTask.findUnique({
      where: { id: batchTaskId },
      include: { items: true },
    });
    if (!batch) return null;

    const success = batch.items.filter((i) => i.status === TaskStatus.SUCCESS).length;
    const failed = batch.items.filter((i) => i.status === TaskStatus.FAILED).length;
    const processing = batch.items.filter(
      (i) => i.status === TaskStatus.PENDING || i.status === TaskStatus.PROCESSING
    ).length;

    const completed = success + failed;
    const etaSeconds =
      completed > 0 && processing > 0
        ? Math.round(((Date.now() - batch.createdAt.getTime()) / completed) * processing / 1000)
        : undefined;

    return {
      total: batch.totalCount,
      success,
      failed,
      processing,
      status: batch.status,
      resultZipUrl: batch.resultZipUrl,
      etaSeconds,
    };
  }

  async refreshBatchStatus(batchTaskId: string): Promise<void> {
    const batch = await prisma.batchTask.findUnique({
      where: { id: batchTaskId },
      include: { items: true },
    });
    if (!batch || batch.status === BatchStatus.CANCELLED || batch.paused) return;

    const success = batch.items.filter((i) => i.status === TaskStatus.SUCCESS).length;
    const failed = batch.items.filter((i) => i.status === TaskStatus.FAILED).length;
    const pending = batch.items.some(
      (i) => i.status === TaskStatus.PENDING || i.status === TaskStatus.PROCESSING
    );

    let status: BatchStatus = BatchStatus.PROCESSING;
    if (!pending) {
      if (success === batch.totalCount) status = BatchStatus.SUCCESS;
      else if (success > 0) status = BatchStatus.PARTIAL_SUCCESS;
      else status = BatchStatus.FAILED;
    }

    await prisma.batchTask.update({
      where: { id: batchTaskId },
      data: {
        successCount: success,
        failedCount: failed,
        status,
        completedAt: pending ? null : new Date(),
      },
    });
  }
}

export const progressTracker = new ProgressTracker();
