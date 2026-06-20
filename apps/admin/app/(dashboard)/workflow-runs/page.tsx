"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface RunRow {
  id: string;
  workflowId: string;
  taskId: string;
  status: string;
  error: string | null;
  taskType: string;
  startedAt: string;
  nodeRuns: { nodeId: string; status: string }[];
}

export default function WorkflowRunsPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [message, setMessage] = useState("");

  async function loadRuns() {
    const res = await apiFetch<RunRow[]>("/api/admin/workflow-runs");
    if (!res.success) {
      router.push("/login");
      return;
    }
    setRuns(res.data ?? []);
  }

  useEffect(() => {
    loadRuns();
  }, [router]);

  async function retry(id: string) {
    const res = await apiFetch(`/api/admin/workflow-runs/${id}/retry`, { method: "POST" });
    setMessage(res.success ? "已重新入队" : (res.message ?? "重试失败"));
    loadRuns();
  }

  return (
    <div>
      <h1>工作流运行记录</h1>
      {message && <p>{message}</p>}
      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>工作流</th>
            <th>任务</th>
            <th>类型</th>
            <th>状态</th>
            <th>开始时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id}>
              <td>{run.workflowId}</td>
              <td>{run.taskId.slice(0, 8)}...</td>
              <td>{run.taskType}</td>
              <td>{run.status}</td>
              <td>{new Date(run.startedAt).toLocaleString()}</td>
              <td>
                {run.status === "FAILED" && (
                  <button className="btn btn-secondary" onClick={() => retry(run.id)}>
                    重新执行
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
