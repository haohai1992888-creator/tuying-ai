"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface BatchRow {
  id: string;
  userId: string;
  userLabel?: string;
  taskType: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

function formatDuration(start: string, end: string | null): string {
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const sec = Math.max(0, Math.round((endMs - startMs) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  return `${min}m ${sec % 60}s`;
}

function successRate(row: BatchRow): string {
  if (row.totalCount === 0) return "-";
  const rate = Math.round((row.successCount / row.totalCount) * 100);
  return `${rate}%`;
}

export default function BatchMonitorPage() {
  const router = useRouter();
  const [rows, setRows] = useState<BatchRow[]>([]);

  useEffect(() => {
    apiFetch<BatchRow[]>("/api/admin/batch-tasks").then((res) => {
      if (!res.success) {
        router.push("/login");
        return;
      }
      setRows(res.data ?? []);
    });
  }, [router]);

  return (
    <div>
      <h1>批量任务监控</h1>
      <p style={{ color: "#64748b", marginTop: 8 }}>
        企业级 Batch Engine — 任务量、耗时与成功率
      </p>
      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>任务 ID</th>
            <th>用户</th>
            <th>类型</th>
            <th>数量</th>
            <th>成功</th>
            <th>失败</th>
            <th>状态</th>
            <th>耗时</th>
            <th>成功率</th>
            <th>创建时间</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.id.slice(0, 8)}…</td>
              <td>{row.userLabel ?? row.userId.slice(0, 8)}</td>
              <td>{row.taskType}</td>
              <td>{row.totalCount}</td>
              <td>{row.successCount}</td>
              <td>{row.failedCount}</td>
              <td>{row.status}</td>
              <td>{formatDuration(row.createdAt, row.completedAt)}</td>
              <td>{successRate(row)}</td>
              <td>{new Date(row.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
