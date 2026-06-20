"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface AiTaskRow {
  id: string;
  userId: string;
  userLabel: string;
  taskType: string;
  status: string;
  cost: number;
  pointsCost: number;
  modelName: string | null;
  workflowId: string | null;
  durationMs: number | null;
  createdAt: string;
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function AiTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<AiTaskRow[]>([]);

  useEffect(() => {
    apiFetch<AiTaskRow[]>("/api/admin/ai-tasks").then((res) => {
      if (!res.success) {
        router.push("/login");
        return;
      }
      setTasks(res.data ?? []);
    });
  }, [router]);

  return (
    <div>
      <h1>AI 任务管理</h1>
      <p style={{ color: "#64748b", marginTop: 8 }}>
        展示 GPT Image 等工作流任务：状态、模型、耗时与积分消耗
      </p>
      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>任务 ID</th>
            <th>用户</th>
            <th>工作流</th>
            <th>类型</th>
            <th>模型</th>
            <th>状态</th>
            <th>耗时</th>
            <th>积分</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td title={task.id}>{task.id.slice(0, 8)}...</td>
              <td title={task.userId}>{task.userLabel}</td>
              <td>{task.workflowId ?? "-"}</td>
              <td>{task.taskType}</td>
              <td>{task.modelName ?? "-"}</td>
              <td>{task.status}</td>
              <td>{formatDuration(task.durationMs)}</td>
              <td>{task.pointsCost}</td>
              <td>{new Date(task.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
