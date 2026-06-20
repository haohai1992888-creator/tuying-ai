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

const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function DataCenterPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<"overview" | "features" | "models" | "users" | "templates">("overview");

  useEffect(() => {
    apiFetch<DashboardData>("/api/admin/analytics").then((res) => {
      if (!res.success) {
        router.push("/login");
        return;
      }
      setData(res.data ?? null);
    });
  }, [router]);

  if (!data) return <div>加载中...</div>;

  const o = data.overview;
  const profitMargin =
    o.todayRevenue > 0 ? Math.round((o.todayProfit / o.todayRevenue) * 1000) / 10 : 0;
  const modelShare = data.models.map((m) => ({
    model: m.model,
    percent:
      data.models.reduce((s, x) => s + x.calls, 0) > 0
        ? Math.round((m.calls / data.models.reduce((s, x) => s + x.calls, 0)) * 100)
        : 0,
  }));

  return (
    <div>
      <h1>数据中心</h1>
      <p style={{ color: "#64748b", marginTop: 8 }}>收入 · 成本 · 模型 · 用户 · 模板分析</p>

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        {(["overview", "features", "models", "users", "templates"] as const).map((t) => (
          <button
            key={t}
            className="btn"
            style={{ background: tab === t ? "#6366f1" : undefined, color: tab === t ? "#fff" : undefined }}
            onClick={() => setTab(t)}
          >
            {t === "overview" && "总览"}
            {t === "features" && "功能分析"}
            {t === "models" && "模型分析"}
            {t === "users" && "用户分析"}
            {t === "templates" && "模板热度"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="stats-grid" style={{ marginTop: 20 }}>
            <div className="stat-card">
              <div className="stat-value">¥{o.todayRevenue.toFixed(2)}</div>
              <div className="stat-label">今日收入</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">${o.todayCost.toFixed(2)}</div>
              <div className="stat-label">今日成本</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">¥{o.todayProfit.toFixed(2)}</div>
              <div className="stat-label">今日利润</div>
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
              <div className="stat-value">{profitMargin}%</div>
              <div className="stat-label">利润率</div>
            </div>
          </div>

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

          <h2 style={{ marginTop: 32 }}>商业洞察</h2>
          <ul style={{ marginTop: 12, lineHeight: 1.8 }}>
            <li>最赚钱功能：<strong>{data.insights.mostProfitableFeature}</strong></li>
            <li>最贵模型：<strong>{data.insights.mostExpensiveModel}</strong></li>
            <li>最高价值用户：<strong>{data.insights.highestValueUser}</strong></li>
            <li>AI 视频是否盈利：{data.insights.videoProfitable ? "是 ✓" : "否 ✗"}</li>
            <li>批量任务是否盈利：{data.insights.batchProfitable ? "是 ✓" : "否 ✗"}</li>
          </ul>
        </>
      )}

      {tab === "features" && (
        <table className="table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>功能模块</th>
              <th>使用次数</th>
              <th>收入</th>
              <th>成本</th>
              <th>利润</th>
            </tr>
          </thead>
          <tbody>
            {data.features.map((f) => (
              <tr key={f.module}>
                <td>{f.module}</td>
                <td>{f.usage}</td>
                <td>¥{f.revenue.toFixed(2)}</td>
                <td>${f.cost.toFixed(2)}</td>
                <td style={{ color: f.profit >= 0 ? "#16a34a" : "#dc2626" }}>¥{f.profit.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "models" && (
        <table className="table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>模型</th>
              <th>调用</th>
              <th>成功</th>
              <th>失败</th>
              <th>成功率</th>
              <th>成本</th>
            </tr>
          </thead>
          <tbody>
            {data.models.map((m) => (
              <tr key={m.model}>
                <td>{m.model}</td>
                <td>{m.calls}</td>
                <td>{m.success}</td>
                <td>{m.fail}</td>
                <td>{m.successRate}%</td>
                <td>${m.cost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "users" && (
        <table className="table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>用户</th>
              <th>生成次数</th>
              <th>收入</th>
              <th>成本</th>
              <th>利润</th>
            </tr>
          </thead>
          <tbody>
            {data.topUsers.map((u) => (
              <tr key={u.userId}>
                <td>{u.userLabel}</td>
                <td>{u.generateCount}</td>
                <td>¥{u.revenue.toFixed(2)}</td>
                <td>${u.cost.toFixed(2)}</td>
                <td>¥{u.profit.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "templates" && (
        <table className="table" style={{ marginTop: 16 }}>
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
      )}
    </div>
  );
}
