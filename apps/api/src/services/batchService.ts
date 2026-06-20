import { BatchStatus, TaskStatus } from "@acs/shared";
import { prisma } from "../db";
import { createTask } from "./taskService";

export async function createBatch(input: {
  userId: string;
  prompts: string[];
  type?: string;
  model?: string;
}) {
  const prompts = input.prompts.filter((p) => p.trim().length > 0);
  if (prompts.length === 0) {
    throw new Error("请提供至少一个 Prompt");
  }

  const batch = await prisma.batchTask.create({
    data: {
      userId: input.userId,
      taskType: input.type ?? "scene",
      totalCount: prompts.length,
      status: BatchStatus.PENDING,
      sourceType: "prompts",
    },
  });

  for (const prompt of prompts) {
    await createTask({
      userId: input.userId,
      type: input.type ?? "scene",
      prompt,
      model: input.model ?? "auto",
      batchTaskId: batch.id,
    });
  }

  return batch;
}

export async function getBatchForUser(batchId: string, userId: string) {
  return prisma.batchTask.findFirst({
    where: { id: batchId, userId },
    include: {
      tasks: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function updateProgress(batchId: string) {
  const tasks = await prisma.task.findMany({
    where: { batchTaskId: batchId },
  });

  const completed = tasks.filter((t) => t.status === TaskStatus.SUCCESS).length;
  const failed = tasks.filter((t) => t.status === TaskStatus.FAILED).length;
  const done = completed + failed;
  const total = tasks.length;

  let status: BatchStatus = BatchStatus.PROCESSING;
  if (done === total && total > 0) {
    if (failed === total) status = BatchStatus.FAILED;
    else if (failed > 0) status = BatchStatus.PARTIAL_SUCCESS;
    else status = BatchStatus.SUCCESS;
  } else if (done > 0) {
    status = BatchStatus.PROCESSING;
  }

  return prisma.batchTask.update({
    where: { id: batchId },
    data: {
      successCount: completed,
      failedCount: failed,
      status,
      completedAt: done === total && total > 0 ? new Date() : null,
    },
    include: {
      tasks: { orderBy: { createdAt: "asc" } },
    },
  });
}
