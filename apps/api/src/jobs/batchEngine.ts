import type { Task } from "@prisma/client";
import { BatchStatus } from "@acs/shared";
import { prisma } from "../db";
import { updateProgress } from "../services/batchService";
import { WorkflowEngine } from "../workflows/workflowEngine";

const DEFAULT_CONCURRENCY = Number(process.env.BATCH_CONCURRENCY ?? 3);

export class BatchEngine {
  async execute(batchId: string, tasks: Task[]): Promise<void> {
    await prisma.batchTask.update({
      where: { id: batchId },
      data: { status: BatchStatus.PROCESSING },
    });

    const workflow = new WorkflowEngine();
    const concurrency = Math.max(1, Math.min(DEFAULT_CONCURRENCY, tasks.length));
    let cursor = 0;

    const worker = async () => {
      while (cursor < tasks.length) {
        const index = cursor;
        cursor += 1;
        const task = tasks[index];
        if (!task) continue;

        try {
          await workflow.execute(task);
        } catch {
          // WorkflowEngine 已更新 Task 失败状态
        }

        await updateProgress(batchId);
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
  }
}
