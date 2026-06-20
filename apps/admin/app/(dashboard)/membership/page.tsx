"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface MemberRow {
  userId: string;
  userLabel?: string;
  effectivePlan: string;
  vipExpireAt: string | null;
  points: number;
}

interface MembershipStats {
  totalUsers: number;
  freeCount: number;
  vipCount: number;
  enterpriseCount: number;
  activeMembers: number;
  renewalRate: number;
  revenue: number;
  conversionRate: number;
}

export default function MembershipAdminPage() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [stats, setStats] = useState<MembershipStats | null>(null);
  const [userId, setUserId] = useState("");
  const [plan, setPlan] = useState("VIP");
  const [days, setDays] = useState(30);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<MemberRow[]>("/api/admin/memberships"),
      apiFetch<MembershipStats>("/api/admin/membership/stats"),
    ]).then(([mRes, sRes]) => {
      if (!mRes.success || !sRes.success) {
        router.push("/login");
        return;
      }
      setMembers(mRes.data ?? []);
      setStats(sRes.data ?? null);
    });
  }, [router]);

  async function grant() {
    if (!userId.trim()) return;
    const res = await apiFetch(`/api/admin/memberships/${userId.trim()}/grant`, {
      method: "POST",
      body: JSON.stringify({ plan, days, grantPoints: true }),
    });
    setMessage(res.success ? "赠送成功" : res.message ?? "失败");
    if (res.success) {
      const list = await apiFetch<MemberRow[]>("/api/admin/memberships");
      setMembers(list.data ?? []);
    }
  }

  async function extend(targetUserId: string) {
    const res = await apiFetch(`/api/admin/memberships/${targetUserId}/extend`, {
      method: "POST",
      body: JSON.stringify({ days: 30 }),
    });
    setMessage(res.success ? "已延长 30 天" : res.message ?? "失败");
  }

  async function cancel(targetUserId: string) {
    const res = await apiFetch(`/api/admin/memberships/${targetUserId}/cancel`, { method: "POST" });
    setMessage(res.success ? "已取消会员" : res.message ?? "失败");
  }

  return (
    <div>
      <h1>会员管理</h1>
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
          <div className="card" style={{ padding: 12 }}>会员总数：{stats.activeMembers}</div>
          <div className="card" style={{ padding: 12 }}>VIP：{stats.vipCount} / 企业：{stats.enterpriseCount}</div>
          <div className="card" style={{ padding: 12 }}>订阅收入：¥{stats.revenue.toFixed(2)}</div>
          <div className="card" style={{ padding: 12 }}>转化率：{stats.conversionRate}% · 续费率：{stats.renewalRate}%</div>
        </div>
      )}

      <section style={{ marginTop: 24 }}>
        <h2>赠送会员</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <input placeholder="用户 ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <select value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="VIP">VIP</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
          <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ width: 80 }} />
          <button className="btn" onClick={() => void grant()}>赠送</button>
        </div>
        {message && <p style={{ marginTop: 8 }}>{message}</p>}
      </section>

      <table className="table" style={{ marginTop: 24 }}>
        <thead>
          <tr>
            <th>用户</th>
            <th>等级</th>
            <th>到期</th>
            <th>积分</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {members.map((row) => (
            <tr key={row.userId}>
              <td>{row.userLabel ?? row.userId.slice(0, 8)}</td>
              <td>{row.effectivePlan}</td>
              <td>{row.vipExpireAt ? new Date(row.vipExpireAt).toLocaleDateString() : "—"}</td>
              <td>{row.points}</td>
              <td>
                <button className="btn btn-secondary" onClick={() => void extend(row.userId)}>延长</button>
                <button className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => void cancel(row.userId)}>取消</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
