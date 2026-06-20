import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  completeMockPay,
  createRechargeOrder,
  fetchBalance,
  fetchPlans,
  type RechargePlan,
} from "../api/payment";

const PAYMENT_METHODS = [
  { value: "wechat", label: "微信支付" },
  { value: "alipay", label: "支付宝" },
];

export default function RechargePage() {
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [balance, setBalance] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [channel, setChannel] = useState("wechat");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refreshBalance = useCallback(async () => {
    try {
      setBalance(await fetchBalance());
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取余额失败");
    }
  }, []);

  useEffect(() => {
    fetchPlans()
      .then((list) => {
        setPlans(list);
        if (list[0]) setSelectedPlan(list[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载套餐失败"));
    refreshBalance();
  }, [refreshBalance]);

  async function onPurchase() {
    if (!selectedPlan) {
      setError("请选择积分套餐");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const order = await createRechargeOrder({
        planId: selectedPlan,
        channel: channel as "wechat" | "alipay",
      });

      const payUrl = order.payUrl ?? order.codeUrl;
      if (payUrl?.includes("/api/payment/mock-pay")) {
        const mock = await completeMockPay(payUrl);
        setMessage(`充值成功，获得 ${mock.points || order.points} 积分`);
        await refreshBalance();
        return;
      }

      if (payUrl) {
        setMessage("订单已创建，请在新窗口完成支付");
        window.open(payUrl, "_blank", "noopener");
        return;
      }

      setError("未获取到支付链接");
    } catch (err) {
      setError(err instanceof Error ? err.message : "充值失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>充值中心</h1>
          <p>
            剩余积分：<strong>{balance}</strong>
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
            marginTop: 16,
          }}
        >
          {plans.map((plan) => (
            <button
              key={plan.id}
              className="card"
              style={{
                padding: 16,
                textAlign: "center",
                border: selectedPlan === plan.id ? "2px solid #2563eb" : "1px solid #e2e8f0",
                cursor: "pointer",
                background: selectedPlan === plan.id ? "#eff6ff" : "#fff",
              }}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div style={{ fontSize: 24, fontWeight: 700 }}>{plan.points}</div>
              <div style={{ color: "#64748b", marginBottom: 8 }}>积分</div>
              <div style={{ fontWeight: 600 }}>¥{plan.price}</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{plan.name}</div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>支付方式</label>
          <div style={{ display: "flex", gap: 12 }}>
            {PAYMENT_METHODS.map((m) => (
              <label key={m.value} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="radio"
                  name="channel"
                  value={m.value}
                  checked={channel === m.value}
                  onChange={() => setChannel(m.value)}
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <button className="btn" style={{ marginTop: 20, width: "100%" }} onClick={onPurchase} disabled={loading}>
          {loading ? "处理中..." : "立即购买"}
        </button>

        {error && <p style={{ color: "#dc2626", marginTop: 12 }}>{error}</p>}
        {message && (
          <p style={{ color: "#16a34a", marginTop: 12 }}>
            {message}{" "}
            <Link to="/points">查看积分记录</Link>
          </p>
        )}
      </div>
    </main>
  );
}
