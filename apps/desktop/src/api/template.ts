import { getToken } from "../store/auth";

const TEMPLATE_API_BASE =
  import.meta.env.VITE_TEMPLATE_API_BASE ??
  import.meta.env.VITE_TASK_API_BASE ??
  import.meta.env.VITE_API_BASE ??
  "http://localhost:3001";

export interface TemplateItem {
  id: string;
  title: string;
  name: string;
  description: string;
  category: string;
  cover: string;
  coverUrl: string;
  prompt?: string;
  model: string;
  points: number;
  usageCount: number;
  favoriteCount: number;
  favorited?: boolean;
  isVip?: boolean;
  promptVariables?: string[];
  taskType?: string;
}

export interface TaskResult {
  id: string;
  status: string;
  outputUrl: string | null;
  error: string | null;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch(`${TEMPLATE_API_BASE}/api/template/categories`, {
    headers: authHeaders(),
  });
  const json = (await res.json()) as string[] | { message?: string };
  if (!res.ok) {
    throw new Error(Array.isArray(json) ? "获取分类失败" : (json.message ?? "获取分类失败"));
  }
  return Array.isArray(json) ? json : [];
}

export async function fetchTemplates(params?: {
  category?: string;
  search?: string;
  favorites?: boolean;
}): Promise<TemplateItem[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  if (params?.favorites) query.set("favorites", "1");
  const res = await fetch(`${TEMPLATE_API_BASE}/api/templates?${query}`, {
    headers: authHeaders(),
  });
  const json = (await res.json()) as TemplateItem[] | { message?: string };
  if (!res.ok) {
    throw new Error(Array.isArray(json) ? "获取模板失败" : (json.message ?? "获取模板失败"));
  }
  return Array.isArray(json) ? json : [];
}

export async function fetchHotTemplates(): Promise<TemplateItem[]> {
  const res = await fetch(`${TEMPLATE_API_BASE}/api/template/hot`, {
    headers: authHeaders(),
  });
  const json = (await res.json()) as TemplateItem[] | { message?: string };
  if (!res.ok) {
    throw new Error(Array.isArray(json) ? "获取热门模板失败" : (json.message ?? "获取热门模板失败"));
  }
  return Array.isArray(json) ? json : [];
}

export async function fetchRecentTemplates(): Promise<TemplateItem[]> {
  const res = await fetch(`${TEMPLATE_API_BASE}/api/template/recent`, {
    headers: authHeaders(),
  });
  const json = (await res.json()) as TemplateItem[] | { message?: string };
  if (!res.ok) {
    throw new Error(Array.isArray(json) ? "获取最近使用失败" : (json.message ?? "获取最近使用失败"));
  }
  return Array.isArray(json) ? json : [];
}

export async function fetchTemplateDetail(id: string): Promise<TemplateItem> {
  const res = await fetch(`${TEMPLATE_API_BASE}/api/template/${id}`, {
    headers: authHeaders(),
  });
  const json = (await res.json()) as TemplateItem & { message?: string };
  if (!res.ok) {
    throw new Error(json.message ?? "获取模板详情失败");
  }
  return json;
}

export async function favoriteTemplate(id: string): Promise<void> {
  const res = await fetch(`${TEMPLATE_API_BASE}/api/templates/${id}/favorite`, {
    method: "POST",
    headers: authHeaders(),
  });
  const json = (await res.json()) as { message?: string };
  if (!res.ok) throw new Error(json.message ?? "收藏失败");
}

export async function unfavoriteTemplate(id: string): Promise<void> {
  const res = await fetch(`${TEMPLATE_API_BASE}/api/templates/${id}/favorite`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const json = (await res.json()) as { message?: string };
  if (!res.ok) throw new Error(json.message ?? "取消收藏失败");
}

export async function generateFromTemplate(input: {
  templateId: string;
  inputUrl: string;
  variables?: Record<string, string>;
}): Promise<{ task: TaskResult; renderedPrompt?: string }> {
  const res = await fetch(`${TEMPLATE_API_BASE}/api/templates/${input.templateId}/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      inputUrl: input.inputUrl,
      variables: input.variables,
      autoRun: true,
    }),
  });
  const json = (await res.json()) as { task?: TaskResult; renderedPrompt?: string; message?: string };
  if (!res.ok || !json.task) {
    throw new Error(json.message ?? "生成失败");
  }
  return { task: json.task, renderedPrompt: json.renderedPrompt };
}

export { TEMPLATE_API_BASE };
