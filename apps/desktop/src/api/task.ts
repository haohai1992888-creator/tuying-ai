import { getToken } from "../store/auth";

const TASK_API_BASE =
  import.meta.env.VITE_TASK_API_BASE ??
  import.meta.env.VITE_FILE_API_BASE ??
  import.meta.env.VITE_API_BASE ??
  "http://localhost:3001";

export interface TaskPayload {
  type: string;
  prompt?: string;
  inputUrl?: string;
  model?: string;
}

export interface TaskRecord {
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

export async function createTask(data: TaskPayload): Promise<TaskRecord> {
  const token = getToken();
  const res = await fetch(`${TASK_API_BASE}/api/task/create`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const json = (await res.json()) as TaskRecord & { message?: string };
  if (!res.ok) {
    throw new Error(json.message ?? "创建任务失败");
  }

  return json;
}

export async function runTask(id: string): Promise<{ result: string; task: TaskRecord | null }> {
  const token = getToken();
  const res = await fetch(`${TASK_API_BASE}/api/task/run/${id}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const json = (await res.json()) as {
    result?: string;
    task?: TaskRecord | null;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(json.message ?? "执行任务失败");
  }

  return { result: json.result ?? "", task: json.task ?? null };
}

export async function getTask(id: string): Promise<TaskRecord> {
  const token = getToken();
  const res = await fetch(`${TASK_API_BASE}/api/task/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const json = (await res.json()) as TaskRecord & { message?: string };
  if (!res.ok) {
    throw new Error(json.message ?? "获取任务失败");
  }

  return json;
}
