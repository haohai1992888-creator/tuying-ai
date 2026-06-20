"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface CostCenter {
  gptCost: number;
  seedreamCost: number;
  geminiCost: number;
  totalCost: number;
  userRanking: Array<{ userLabel: string; cost: number; generateCount: number }>;
}

interface BehaviorStats {
  topFeatures: Array<{ module: string; action: string; count: number }>;
}

export default function CostCenterPage() {
  const router = useRouter();
  const [cost, setCost] = useState<CostCenter | null>(null);
  const [behavior, setBehavior] = useState<BehaviorStats | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<CostCenter>("/api/admin/beta/cost-center"),
      apiFetch<BehaviorStats>("/api/admin/beta/behavior"),
    ]).then(([costRes, behaviorRes]) => {
      if (!costRes.success) {
        router.push("/login");
        return;
      }
      setCost(costRes.data ?? null);
      setBehavior(behaviorRes.data ?? null);
    });
  }, [router]);

  if (!cost) return <div>加载中...</div>;

  return (
    <div>
      <h1>Cost Center</h1>
      <div className="stats-grid" style={{ marginTop: 20 }}>
        <div className="stat-card">
          <div className="stat-value">${cost.gptCost}</div>
          <div className="stat-label">GPT 成本</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${cost.seedreamCost}</div>
          <div className="stat-label">Seedream 成本</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${cost.geminiCost}</div>
          <div className="stat-label">Gemini 成本</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${cost.totalCost}</div>
          <div className="stat-label">总成本</div>
        </div>
      </div>

      <h2 style={{ marginTop: 24 }}>成本排行榜</h2>
      <table className="table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>用户</th>
            <th>成本</th>
            <th>生成次数</th>
          </tr>
        </thead>
        <tbody>
          {cost.userRanking.map((u) => (
            <tr key={u.userLabel}>
              <td>{u.userLabel}</td>
              <td>${u.cost}</td>
              <td>{u.generateCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: 24 }}>Top10 功能行为</h2>
      <table className="table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>模块</th>
            <th>行为</th>
            <th>次数</th>
          </tr>
        </thead>
        <tbody>
          {(behavior?.topFeatures ?? []).map((f, i) => (
            <tr key={i}>
              <td>{f.module}</td>
              <td>{f.action}</td>
              <td>{f.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
