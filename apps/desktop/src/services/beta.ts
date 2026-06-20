import { getAccessToken } from "./api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

interface ApiResult<T> {
  success: boolean;
  data?: T;
  message?: string;
}

async function betaFetch<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  return (await res.json()) as ApiResult<T>;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  startAt: string;
  endAt: string;
}

export interface IssueReportInput {
  content?: string;
  taskId?: string;
  model?: string;
  error?: string;
  prompt?: string;
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await betaFetch<Announcement[]>("/api/beta/announcements");
  return res.success ? (res.data ?? []) : [];
}

export async function redeemInviteCode(code: string): Promise<{ success: boolean; message?: string }> {
  const res = await betaFetch("/api/beta/invite/redeem", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  return { success: res.success, message: res.message };
}

export async function submitIssueReport(input: IssueReportInput): Promise<{ success: boolean; message?: string }> {
  const res = await betaFetch("/api/beta/issue-report", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return { success: res.success, message: res.message };
}

export async function submitFeedback(input: {
  category: "BUG" | "SUGGESTION" | "MODEL_ISSUE" | "FEATURE_REQUEST";
  content: string;
  taskId?: string;
  model?: string;
  error?: string;
  prompt?: string;
}): Promise<{ success: boolean; message?: string }> {
  const res = await betaFetch("/api/beta/feedback", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return { success: res.success, message: res.message };
}

export type BehaviorAction = "PAGE_VIEW" | "TEMPLATE_CLICK" | "IMAGE_GENERATE" | "IMAGE_EXPORT";

export async function trackBehavior(
  action: BehaviorAction,
  module: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const token = getAccessToken();
  if (!token) return;
  await betaFetch("/api/beta/behavior", {
    method: "POST",
    body: JSON.stringify({ action, module, metadata }),
  });
}
