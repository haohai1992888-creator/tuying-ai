import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

interface UserSummary {
  todayGenerateCount: number;
  todayCost: number;
  todayRevenue: number;
  remainingPoints: number;
  recentEvents: Array<{ eventType: string; module: string; action: string; createdAt: string }>;
  modelUsage: Array<{ model: string; calls: number; successRate: number }>;
}

export default function DataPage() {
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<{ summary: UserSummary }>("/api/analytics/me").then((res) => {
      if (!res.ok) {
        setError(res.error ?? "加载失败");
        return;
      }
      setSummary(res.data?.summary ?? null);
    });
  }, []);

  if (error) return <main className="container"><div className="card"><p style={{ color: "#dc2626" }}>{error}</p></div></main>;
  if (!summary) return <main className="container"><div className="card">加载中...</div></main>;

  return (
    <main className="container">
      <div className="card">
        <h1>我的数据</h1>
        <p style={{ color: "#64748b", marginBottom: 16 }}>今日使用情况与模型统计</p>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
          <div className="stat-card">
            <div className="stat-value">{summary.todayGenerateCount}</div>
            <div className="stat-label">今日生成</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{summary.remainingPoints}</div>
            <div className="stat-label">剩余积分</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">¥{summary.todayRevenue.toFixed(2)}</div>
            <div className="stat-label">今日消费</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">${summary.todayCost.toFixed(2)}</div>
            <div className="stat-label">估算成本</div>
          </div>
        </div>

        <h2 style={{ marginTop: 24 }}>模型使用</h2>
        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>模型</th>
              <th>调用</th>
              <th>成功率</th>
            </tr>
          </thead>
          <tbody>
            {summary.modelUsage.length === 0 ? (
              <tr><td colSpan={3} style={{ color: "#94a3b8" }}>暂无数据</td></tr>
            ) : (
              summary.modelUsage.map((m) => (
                <tr key={m.model}>
                  <td>{m.model}</td>
                  <td>{m.calls}</td>
                  <td>{m.successRate}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <h2 style={{ marginTop: 24 }}>最近活动</h2>
        <ul style={{ marginTop: 12, lineHeight: 1.8 }}>
          {summary.recentEvents.slice(0, 10).map((e, i) => (
            <li key={i}>
              {e.eventType} · {e.module}/{e.action} · {new Date(e.createdAt).toLocaleString()}
            </li>
          ))}
          {summary.recentEvents.length === 0 && <li style={{ color: "#94a3b8" }}>暂无记录</li>}
        </ul>
      </div>
    </main>
  );
}
