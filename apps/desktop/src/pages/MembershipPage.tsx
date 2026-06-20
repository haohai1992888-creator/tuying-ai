import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../services/api";

interface Membership {
  effectivePlan: string;
  plan: string;
  vipExpireAt: string | null;
  points: number;
  benefits: { label: string; dailySignInPoints: number; maxConcurrency: number };
}

interface SubscriptionPlan {
  id: string;
  name: string;
  planCode: string;
  price: number;
  points: number;
  duration: number;
}

const PLAN_LABELS: Record<string, string> = {
  FREE: "免费版",
  VIP: "VIP 版",
  ENTERPRISE: "企业版",
};

export default function MembershipPage() {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const [mRes, pRes] = await Promise.all([
      apiFetch<Membership>("/api/membership"),
      apiFetch<SubscriptionPlan[]>("/api/membership/plans"),
    ]);
    setMembership(mRes.data ?? null);
    setPlans(pRes.data ?? []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function onCheckIn() {
    setError("");
    setMessage("");
    const res = await apiFetch<{ points: number; balance: number }>("/api/membership/check-in", {
      method: "POST",
    });
    if (!res.ok) {
      setError(res.error ?? "签到失败");
      return;
    }
    setMessage(`签到成功，获得 ${res.data?.points ?? 0} 积分`);
    await refresh();
  }

  async function onSubscribe(planId: string, action: "subscribe" | "upgrade" = "subscribe") {
    setLoading(true);
    setError("");
    setMessage("");
    const res = await apiFetch<{ orderNo: string; payUrl?: string; points?: number }>(
      "/api/membership/subscribe",
      {
        method: "POST",
        body: JSON.stringify({ planId, paymentMethod: "WECHAT", action }),
      }
    );
    if (!res.ok || !res.data) {
      setLoading(false);
      setError(res.error ?? "创建订单失败");
      return;
    }

    const payUrl = res.data.payUrl ?? "";
    if (payUrl.includes("/api/membership/mock-pay")) {
      const url = new URL(payUrl);
      const mockRes = await apiFetch<{ message: string }>(`${url.pathname}${url.search}`, {
        method: "POST",
      });
      setLoading(false);
      if (!mockRes.ok) {
        setError(mockRes.error ?? "支付失败");
        return;
      }
      setMessage(mockRes.data?.message ?? "会员开通成功");
      await refresh();
      return;
    }

    setLoading(false);
    if (payUrl) window.open(payUrl, "_blank");
  }

  return (
    <div className="page">
      <h1>会员中心</h1>
      <p style={{ color: "#64748b" }}>
        查看等级、到期时间与权益，<Link to="/membership/compare">对比各版本权益</Link>
      </p>

      {membership && (
        <section className="card" style={{ marginTop: 16, padding: 16 }}>
          <h2>当前会员</h2>
          <p>等级：{PLAN_LABELS[membership.effectivePlan] ?? membership.effectivePlan}</p>
          <p>到期时间：{membership.vipExpireAt ? new Date(membership.vipExpireAt).toLocaleString() : "—"}</p>
          <p>剩余积分：{membership.points}</p>
          <p>每日签到：+{membership.benefits.dailySignInPoints} 积分</p>
          <p>最大并发：{membership.benefits.maxConcurrency}</p>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => void onCheckIn()}>
              每日签到
            </button>
          </div>
        </section>
      )}

      {message && <p style={{ color: "#16a34a", marginTop: 12 }}>{message}</p>}
      {error && <p style={{ color: "#dc2626", marginTop: 12 }}>{error}</p>}

      <section style={{ marginTop: 24 }}>
        <h2>升级会员</h2>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {plans.map((plan) => (
            <div key={plan.id} className="card" style={{ padding: 16 }}>
              <strong>{plan.name}</strong>
              <p>¥{plan.price}/月 · 赠 {plan.points} 积分 · {plan.duration} 天</p>
              <button
                className="btn"
                disabled={loading}
                onClick={() =>
                  void onSubscribe(
                    plan.id,
                    membership?.effectivePlan === "VIP" && plan.planCode === "ENTERPRISE"
                      ? "upgrade"
                      : "subscribe"
                  )
                }
              >
                {membership?.effectivePlan === plan.planCode ? "续费" : "开通"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
