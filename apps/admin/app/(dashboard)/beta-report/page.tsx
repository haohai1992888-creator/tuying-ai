"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface BetaReport {
  generatedAt: string;
  userCount: number;
  betaUserCount: number;
  activeRate: number;
  paymentIntentRate: number;
  modelCost: { gpt: number; seedream: number; gemini: number; total: number };
  topIssues: Array<{ category: string; count: number }>;
  topTemplates: Array<{ name: string; usageCount: number }>;
  topFeatures: Array<{ label: string; count: number }>;
}

export default function BetaReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<BetaReport | null>(null);

  useEffect(() => {
    apiFetch<BetaReport>("/api/admin/beta/report").then((res) => {
      if (!res.success) {
        router.push("/login");
        return;
      }
      setReport(res.data ?? null);
    });
  }, [router]);

  if (!report) return <div>加载中...</div>;

  return (
    <div>
      <h1>Beta Report</h1>
      <p style={{ color: "#64748b" }}>生成时间: {new Date(report.generatedAt).toLocaleString()}</p>

      <div className="stats-grid" style={{ marginTop: 20 }}>
        <div className="stat-card">
          <div className="stat-value">{report.betaUserCount}</div>
          <div className="stat-label">内测用户</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{report.activeRate}%</div>
          <div className="stat-label">活跃率</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{report.paymentIntentRate}%</div>
          <div className="stat-label">付费意愿</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${report.modelCost.total}</div>
          <div className="stat-label">模型成本</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3>问题排行</h3>
          <ul>
            {report.topIssues.map((i) => (
              <li key={i.category}>{i.category}: {i.count}</li>
            ))}
          </ul>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h3>模板排行</h3>
          <ul>
            {report.topTemplates.map((t) => (
              <li key={t.name}>{t.name}: {t.usageCount}</li>
            ))}
          </ul>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h3>功能排行</h3>
          <ul>
            {report.topFeatures.map((f) => (
              <li key={f.label}>{f.label}: {f.count}</li>
            ))}
          </ul>
        </div>
      </div>

      <button
        className="btn"
        style={{ marginTop: 24 }}
        onClick={() => {
          const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `beta-report-${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }}
      >
        导出 Beta Report (JSON)
      </button>
    </div>
  );
}
