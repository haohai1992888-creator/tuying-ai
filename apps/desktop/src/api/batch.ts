import { getToken } from "../store/auth";

const BATCH_API_BASE =
  import.meta.env.VITE_BATCH_API_BASE ??
  import.meta.env.VITE_TASK_API_BASE ??
  import.meta.env.VITE_API_BASE ??
  "http://localhost:3001";

export interface BatchRecord {
  id: string;
  userId: string;
  total: number;
  completed: number;
  failed: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  tasks?: Array<{
    id: string;
    prompt: string;
    status: string;
    outputUrl: string | null;
  }>;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function createBatch(
  prompts: string[],
  options?: { type?: string; model?: string }
): Promise<BatchRecord> {
  const res = await fetch(`${BATCH_API_BASE}/api/batch/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      prompts,
      type: options?.type ?? "scene",
      model: options?.model ?? "auto",
    }),
  });

  const json = (await res.json()) as BatchRecord & { message?: string };
  if (!res.ok) {
    throw new Error(json.message ?? "创建批量任务失败");
  }

  return json;
}

export async function runBatch(id: string): Promise<{ success: boolean; batch: BatchRecord | null }> {
  const res = await fetch(`${BATCH_API_BASE}/api/batch/run/${id}`, {
    method: "POST",
    headers: authHeaders(),
  });

  const json = (await res.json()) as {
    success?: boolean;
    batch?: BatchRecord | null;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(json.message ?? "批量执行失败");
  }

  return { success: json.success ?? true, batch: json.batch ?? null };
}

export async function getBatch(id: string): Promise<BatchRecord> {
  const res = await fetch(`${BATCH_API_BASE}/api/batch/${id}`, {
    headers: authHeaders(),
  });

  const json = (await res.json()) as BatchRecord & { message?: string };
  if (!res.ok) {
    throw new Error(json.message ?? "获取批量任务失败");
  }

  return json;
}
