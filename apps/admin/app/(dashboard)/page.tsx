"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { apiFetch } from "@/lib/client";

interface DashboardData {
  overview: {
    todayRevenue: number;
    todayCost: number;
    todayProfit: number;
    todayActiveUsers: number;
    todayGenerateCount: number;
    dau: number;
    wau: number;
    mau: number;
    totalRevenue: number;
    arpu: number;
  };
  features: Array<{ module: string; usage: number; revenue: number; cost: number; profit: number }>;
  models: Array<{ model: string; calls: number; success: number; fail: number; successRate: number; cost: number }>;
  topUsers: Array<{ userId: string; userLabel: string; generateCount: number; revenue: number; cost: number; profit: number }>;
  templateHot: Array<{ templateId: string; name: string; usageCount: number; conversionRate: number }>;
  insights: {
    mostProfitableFeature: string;
    mostExpensiveModel: string;
    highestValueUser: string;
    videoProfitable: boolean;
    batchProfitable: boolean;
  };
}

interface DashboardResponse {
  dataCenter: DashboardData;
  betaStats?: {
    betaUserCount: number;
    activeBetaUsers: number;
    generateCount: number;
    avgCost: number;
    failureRate: number;
    modelShare: Array<{ model: string; percent: number; cost: number }>;
  };
  alerts: Array<{ id: string; message: string; level: string; createdAt: string }>;
}

const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [betaStats, setBetaStats] = useState<DashboardResponse["betaStats"] | null>(null);
  const [alerts, setAlerts] = useState<DashboardResponse["alerts"]>([]);

  useEffect(() => {
    apiFetch<DashboardResponse>("/api/admin/dashboard").then((res) => {
      if (!res.success) {
        router.push("/login");
        return;
      }
      setData(res.data?.dataCenter ?? null);
      setBetaStats(res.data?.betaStats ?? null);
      setAlerts(res.data?.alerts ?? []);
    });
  }, [router]);

  if (!data) return <div>加载中...</div>;

  const o = data.overview;
  const modelShare = data.models.map((m) => ({
    model: m.model,
    percent: m.calls > 0 ? Math.round((m.calls / data.models.reduce((s, x) => s + x.calls, 0)) * 100) : 0,
  }));

  return (
    <div>
      <h1>仪表盘</h1>
      <p style={{ color: "#64748b", marginTop: 8 }}>实时运营看板 · 收入 · 用户 · 任务 · 成本 · 内测</p>

      {betaStats && (
        <div className="stats-grid" style={{ marginTop: 20 }}>
          <div className="stat-card">
            <div className="stat-value">{betaStats.betaUserCount}</div>
            <div className="stat-label">Beta 用户数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{betaStats.activeBetaUsers}</div>
            <div className="stat-label">活跃用户</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{betaStats.generateCount}</div>
            <div className="stat-label">生成次数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">${betaStats.avgCost}</div>
            <div className="stat-label">平均成本</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{betaStats.failureRate}%</div>
            <div className="stat-label">失败率</div>
          </div>
        </div>
      )}

      <div className="stats-grid" style={{ marginTop: 20 }}>
        <div className="stat-card">
          <div className="stat-value">¥{o.todayRevenue.toFixed(0)}</div>
          <div className="stat-label">今日收入</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{o.todayGenerateCount}</div>
          <div className="stat-label">今日生成</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{o.dau}</div>
          <div className="stat-label">DAU</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">¥{o.todayCost.toFixed(0)}</div>
          <div className="stat-label">今日成本</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">¥{o.todayProfit.toFixed(0)}</div>
          <div className="stat-label">今日利润</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{o.arpu}</div>
          <div className="stat-label">ARPU</div>
        </div>
      </div>

      {alerts.length > 0 && (
        <>
          <h2 style={{ marginTop: 32 }}>预警</h2>
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {alerts.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: a.level === "critical" ? "#fef2f2" : "#fffbeb",
                  border: `1px solid ${a.level === "critical" ? "#fecaca" : "#fde68a"}`,
                }}
              >
                {a.message}
              </div>
            ))}
          </div>
        </>
      )}

      {modelShare.length > 0 && (
        <>
          <h2 style={{ marginTop: 32 }}>模型占比</h2>
          <div style={{ width: "100%", maxWidth: 420, height: 280, marginTop: 12 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={modelShare}
                  dataKey="percent"
                  nameKey="model"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => {
                    const name = String(entry.name ?? entry.payload?.model ?? "");
                    const pct = entry.percent != null ? Math.round(entry.percent * 100) : 0;
                    return `${name} ${pct}%`;
                  }}
                >
                  {modelShare.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <h2 style={{ marginTop: 32 }}>热门模板</h2>
      <table className="table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>模板</th>
            <th>使用次数</th>
            <th>转化率</th>
          </tr>
        </thead>
        <tbody>
          {data.templateHot.map((t) => (
            <tr key={t.templateId}>
              <td>{t.name}</td>
              <td>{t.usageCount}</td>
              <td>{t.conversionRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
