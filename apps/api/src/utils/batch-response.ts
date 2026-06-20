import type { BatchTask, Task } from "@prisma/client";
import { toTaskResponse } from "./task-response";

export interface BatchResponse {
  id: string;
  userId: string;
  total: number;
  completed: number;
  failed: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  tasks?: ReturnType<typeof toTaskResponse>[];
}

export function toBatchResponse(
  batch: BatchTask & { tasks?: Task[] }
): BatchResponse {
  return {
    id: batch.id,
    userId: batch.userId,
    total: batch.totalCount,
    completed: batch.successCount,
    failed: batch.failedCount,
    status: batch.status,
    createdAt: batch.createdAt.toISOString(),
    completedAt: batch.completedAt?.toISOString() ?? null,
    ...(batch.tasks ? { tasks: batch.tasks.map((task) => toTaskResponse(task)) } : {}),
  };
}
