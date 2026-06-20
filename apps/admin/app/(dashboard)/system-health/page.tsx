"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, API_BASE } from "@/lib/client";

interface HealthData {
  status: string;
  version: string;
  uptimeSec: number;
  checks: { db: boolean; redis: boolean; queue: { mode: string; enabled: boolean } };
  latencyMs: number;
}

export default function SystemHealthPage() {
  const router = useRouter();
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((r) => r.json())
      .then((body) => {
        if (!body.success) {
          router.push("/login");
          return;
        }
        setHealth(body.data as HealthData);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  if (!health) return <div>加载中...</div>;

  return (
    <div>
      <h1>System Health</h1>
      <div className="stats-grid" style={{ marginTop: 20 }}>
        <div className="stat-card">
          <div className="stat-value">{health.status}</div>
          <div className="stat-label">状态</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{health.version}</div>
          <div className="stat-label">版本</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{health.uptimeSec}s</div>
          <div className="stat-label">运行时间</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{health.latencyMs}ms</div>
          <div className="stat-label">延迟</div>
        </div>
      </div>

      <table className="table" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>检查项</th>
            <th>结果</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Database</td><td>{health.checks.db ? "OK" : "FAIL"}</td></tr>
          <tr><td>Redis</td><td>{health.checks.redis ? "OK" : "FAIL"}</td></tr>
          <tr><td>Queue</td><td>{health.checks.queue.mode} ({health.checks.queue.enabled ? "enabled" : "disabled"})</td></tr>
        </tbody>
      </table>
    </div>
  );
}
