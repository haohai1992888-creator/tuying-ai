"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface ProviderStats {
  provider: string;
  label: string;
  callCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgDurationMs: number;
  pointsCost: number;
}

function formatMs(ms: number): string {
  if (ms <= 0) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function ModelMonitorPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ProviderStats[]>([]);

  useEffect(() => {
    apiFetch<ProviderStats[]>("/api/admin/model-usage").then((res) => {
      if (!res.success) {
        router.push("/login");
        return;
      }
      setStats(res.data ?? []);
    });
  }, [router]);

  return (
    <div>
      <h1>模型监控中心</h1>
      <p style={{ color: "#64748b", marginTop: 8 }}>
        基于 ModelUsage 记录：调用次数、成功率、耗时与积分消耗
      </p>
      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>模型</th>
            <th>调用次数</th>
            <th>成功</th>
            <th>失败</th>
            <th>成功率</th>
            <th>平均耗时</th>
            <th>积分消耗</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((row) => (
            <tr key={row.provider}>
              <td>{row.label}</td>
              <td>{row.callCount}</td>
              <td>{row.successCount}</td>
              <td>{row.failureCount}</td>
              <td>{row.successRate}%</td>
              <td>{formatMs(row.avgDurationMs)}</td>
              <td>{row.pointsCost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
