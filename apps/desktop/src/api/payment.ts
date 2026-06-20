import { getToken } from "../store/auth";

const PAYMENT_API_BASE =
  import.meta.env.VITE_PAYMENT_API_BASE ??
  import.meta.env.VITE_TASK_API_BASE ??
  import.meta.env.VITE_API_BASE ??
  "http://localhost:3001";

export interface RechargePlan {
  id: string;
  name: string;
  price: number;
  points: number;
}

export interface CreateOrderResult {
  id: string;
  orderNo: string;
  amount: number;
  points: number;
  status: string;
  payUrl?: string;
  codeUrl?: string;
}

export interface PointLogRecord {
  id: string;
  type: string;
  amount: number;
  balance: number;
  remark: string | null;
  createdAt: string;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchBalance(): Promise<number> {
  const res = await fetch(`${PAYMENT_API_BASE}/api/user/balance`, {
    headers: authHeaders(),
  });
  const json = (await res.json()) as { balance?: number; message?: string };
  if (!res.ok) {
    throw new Error(json.message ?? "获取余额失败");
  }
  return json.balance ?? 0;
}

export async function fetchPlans(): Promise<RechargePlan[]> {
  const res = await fetch(`${PAYMENT_API_BASE}/api/payment/plans`, {
    headers: authHeaders(),
  });
  const json = (await res.json()) as RechargePlan[] | { message?: string };
  if (!res.ok) {
    throw new Error(Array.isArray(json) ? "获取套餐失败" : (json.message ?? "获取套餐失败"));
  }
  return Array.isArray(json) ? json : [];
}

export async function fetchPointLogs(): Promise<PointLogRecord[]> {
  const res = await fetch(`${PAYMENT_API_BASE}/api/user/points`, {
    headers: authHeaders(),
  });
  const json = (await res.json()) as PointLogRecord[] | { message?: string };
  if (!res.ok) {
    throw new Error(Array.isArray(json) ? "获取记录失败" : (json.message ?? "获取记录失败"));
  }
  return Array.isArray(json) ? json : [];
}

export async function createRechargeOrder(input: {
  planId: string;
  channel: "wechat" | "alipay" | "WECHAT" | "ALIPAY";
}): Promise<CreateOrderResult> {
  const channel = input.channel.toLowerCase();
  const res = await fetch(`${PAYMENT_API_BASE}/api/payment/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      planId: input.planId,
      channel,
    }),
  });

  const json = (await res.json()) as CreateOrderResult & { message?: string };
  if (!res.ok) {
    throw new Error(json.message ?? "创建订单失败");
  }
  return json;
}

export async function completeMockPay(payUrl: string): Promise<{ points: number }> {
  const url = payUrl.startsWith("http") ? new URL(payUrl) : new URL(payUrl, PAYMENT_API_BASE);
  const res = await fetch(`${PAYMENT_API_BASE}${url.pathname}${url.search}`, {
    method: "POST",
    headers: authHeaders(),
  });
  const json = (await res.json()) as { points?: number; message?: string };
  if (!res.ok) {
    throw new Error(json.message ?? "支付失败");
  }
  return { points: json.points ?? 0 };
}
