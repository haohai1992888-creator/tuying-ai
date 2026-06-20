import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../services/api";

interface Task {
  id: string;
  taskType: string;
  status: string;
  cost: number;
  createdAt: string;
  workflowRun?: { status: string; workflowId: string } | null;
}

const TASK_TYPES = ["scene_image", "white_background", "poster", "model_image"];

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "排队中",
    PROCESSING: "执行中",
    SUCCESS: "完成",
    FAILED: "失败",
    RUNNING: "执行中",
  };
  return map[status] ?? status;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskType, setTaskType] = useState("scene_image");

  const load = useCallback(async () => {
    const res = await apiFetch<Task[]>("/api/tasks");
    setTasks(res.data ?? []);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [load]);

  async function createTask() {
    await apiFetch("/api/tasks/create", {
      method: "POST",
      body: JSON.stringify({ taskType }),
    });
    load();
  }

  return (
    <main className="container">
      <div className="card">
        <h1>任务 / 工作流状态</h1>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <select className="input" style={{ marginBottom: 0 }} value={taskType} onChange={(e) => setTaskType(e.target.value)}>
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button className="btn" onClick={createTask}>创建</button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>类型</th>
              <th>任务状态</th>
              <th>工作流</th>
              <th>工作流状态</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.taskType}</td>
                <td>{statusLabel(task.status)}</td>
                <td>{task.workflowRun?.workflowId ?? "-"}</td>
                <td>{task.workflowRun ? statusLabel(task.workflowRun.status) : "-"}</td>
                <td>{new Date(task.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
