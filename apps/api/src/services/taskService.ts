import type { Task } from "@prisma/client";
import { TaskStatus } from "@acs/shared";
import { prisma } from "../db";
import { decodeTaskMeta, encodeTaskMeta, toDbTaskType } from "../types/task";
import { normalizeModel } from "../providers/providerFactory";

export interface CreateTaskInput {
  userId: string;
  type: string;
  prompt?: string;
  inputUrl?: string;
  model?: string;
  batchTaskId?: string;
}

export interface UpdateTaskInput {
  status?: TaskStatus;
  outputUrl?: string | null;
  prompt?: string;
  error?: string | null;
  model?: string;
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
  return prisma.task.create({
    data: {
      userId: data.userId,
      taskType: toDbTaskType(data.type),
      status: TaskStatus.PENDING,
      inputUrl: data.inputUrl ?? null,
      batchTaskId: data.batchTaskId ?? null,
      modelName: encodeTaskMeta(data.prompt ?? "", null, normalizeModel(data.model)),
    },
  });
}

export async function updateTask(id: string, data: UpdateTaskInput): Promise<Task> {
  const current = await prisma.task.findUnique({ where: { id } });
  if (!current) {
    throw new Error("任务不存在");
  }

  const meta = decodeTaskMeta(current.modelName);
  const nextMeta = encodeTaskMeta(
    data.prompt ?? meta.prompt,
    data.error !== undefined ? data.error : meta.error,
    data.model ?? meta.model
  );

  return prisma.task.update({
    where: { id },
    data: {
      ...(data.status ? { status: data.status } : {}),
      ...(data.outputUrl !== undefined ? { outputUrl: data.outputUrl } : {}),
      modelName: nextMeta,
    },
  });
}

export async function getTask(id: string): Promise<Task | null> {
  return prisma.task.findUnique({ where: { id } });
}
