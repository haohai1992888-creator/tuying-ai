import type { Task } from "@prisma/client";
import { decodeTaskMeta, fromDbTaskType } from "../types/task";

export interface TaskResponse {
  id: string;
  userId: string;
  type: string;
  model: string;
  status: string;
  prompt: string;
  inputUrl: string | null;
  outputUrl: string | null;
  error: string | null;
  createdAt: string;
}

export function toTaskResponse(task: Task): TaskResponse {
  const meta = decodeTaskMeta(task.modelName);

  return {
    id: task.id,
    userId: task.userId,
    type: fromDbTaskType(task.taskType),
    model: meta.model,
    status: task.status,
    prompt: meta.prompt,
    inputUrl: task.inputUrl,
    outputUrl: task.status === "FAILED" ? null : task.outputUrl,
    error: meta.error,
    createdAt: task.createdAt.toISOString(),
  };
}
