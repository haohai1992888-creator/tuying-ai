"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface TaskRow {
  id: string;
  userId: string;
  taskType: string;
  status: string;
  cost: number;
  createdAt: string;
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskRow[]>([]);

  useEffect(() => {
    apiFetch<TaskRow[]>("/api/admin/tasks").then((res) => {
      if (!res.success) {
        router.push("/login");
        return;
      }
      setTasks(res.data ?? []);
    });
  }, [router]);

  return (
    <div>
      <h1>任务管理</h1>
      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>用户</th>
            <th>类型</th>
            <th>状态</th>
            <th>消耗</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.id.slice(0, 8)}...</td>
              <td>{task.userId.slice(0, 8)}...</td>
              <td>{task.taskType}</td>
              <td>{task.status}</td>
              <td>{task.cost}</td>
              <td>{new Date(task.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
