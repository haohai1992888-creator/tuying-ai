import { getToken } from "../store/auth";

const DETAIL_API_BASE =
  import.meta.env.VITE_DETAIL_API_BASE ??
  import.meta.env.VITE_TASK_API_BASE ??
  import.meta.env.VITE_API_BASE ??
  "http://localhost:3001";

export const DETAIL_PRICING = {
  sellingPoints: 5,
  fiveImages: 20,
  fullPage: 50,
} as const;

export interface DetailTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  coverUrl: string;
  blockTypes?: string[];
  source?: string;
}

export interface DetailBlock {
  id: string;
  blockType: string;
  status: string;
  imageUrl: string | null;
  error: string | null;
}

export interface DetailTask {
  id: string;
  status: string;
  productName: string;
  resultUrl: string | null;
  cost: number;
  error: string | null;
  sellingPoints: string[];
  blocks?: DetailBlock[];
  platform?: string;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchDetailCategories(): Promise<string[]> {
  const res = await fetch(`${DETAIL_API_BASE}/api/detail/categories`, { headers: authHeaders() });
  const json = (await res.json()) as { categories?: string[]; message?: string };
  if (!res.ok) throw new Error(json.message ?? "获取分类失败");
  return json.categories ?? [];
}

export async function fetchDetailTemplates(category?: string): Promise<DetailTemplate[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const res = await fetch(`${DETAIL_API_BASE}/api/detail/templates${query}`, { headers: authHeaders() });
  const json = (await res.json()) as { templates?: DetailTemplate[]; message?: string };
  if (!res.ok) throw new Error(json.message ?? "获取模板失败");
  return json.templates ?? [];
}

export async function extractSellingPoints(input: {
  productName: string;
  sellingPoints?: string[];
}): Promise<string[]> {
  const res = await fetch(`${DETAIL_API_BASE}/api/detail/extract-selling-points`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as { sellingPoints?: string[]; message?: string };
  if (!res.ok) throw new Error(json.message ?? "卖点提取失败");
  return json.sellingPoints ?? [];
}

export async function generateDetailPage(input: {
  inputUrl: string;
  productName: string;
  templateId?: string;
  platform?: string;
  sellingPoints?: string[];
  mode?: "full" | "five";
}): Promise<DetailTask> {
  const path = input.mode === "five" ? "/api/detail/generate-five" : "/api/detail/generate";
  const res = await fetch(`${DETAIL_API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as { task?: DetailTask; message?: string };
  if (!res.ok || !json.task) throw new Error(json.message ?? "生成失败");
  return json.task;
}

export async function getDetailTask(id: string): Promise<DetailTask> {
  const res = await fetch(`${DETAIL_API_BASE}/api/detail/${id}`, { headers: authHeaders() });
  const json = (await res.json()) as { task?: DetailTask; message?: string };
  if (!res.ok || !json.task) throw new Error(json.message ?? "获取任务失败");
  return json.task;
}

export async function regenerateDetailBlock(taskId: string, blockId: string): Promise<DetailTask> {
  const res = await fetch(`${DETAIL_API_BASE}/api/detail/${taskId}/blocks/${blockId}/regenerate`, {
    method: "POST",
    headers: authHeaders(),
  });
  const json = (await res.json()) as { task?: DetailTask; message?: string };
  if (!res.ok || !json.task) throw new Error(json.message ?? "重新生成失败");
  return json.task;
}

export function exportHtmlUrl(taskId: string): string {
  return `${DETAIL_API_BASE}/api/detail/${taskId}/export/html`;
}

export async function fetchPsdStructure(taskId: string): Promise<object> {
  const res = await fetch(`${DETAIL_API_BASE}/api/detail/${taskId}/export/psd`, {
    headers: authHeaders(),
  });
  const json = (await res.json()) as object & { message?: string };
  if (!res.ok) throw new Error((json as { message?: string }).message ?? "导出失败");
  return json;
}
