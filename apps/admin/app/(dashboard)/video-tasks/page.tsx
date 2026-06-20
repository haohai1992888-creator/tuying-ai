"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface VideoTaskRow {
  id: string;
  userId: string;
  userLabel: string;
  provider: string;
  duration: number;
  status: string;
  progress: number;
  cost: number;
  videoUrl: string | null;
  durationMs: number | null;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function VideoTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<VideoTaskRow[]>([]);

  useEffect(() => {
    apiFetch<VideoTaskRow[]>("/api/admin/video-tasks").then((res) => {
      if (!res.success) {
        router.push("/login");
        return;
      }
      setTasks(res.data ?? []);
    });
  }, [router]);

  return (
    <div>
      <h1>视频任务中心</h1>
      <p style={{ color: "#64748b", marginTop: 8 }}>
        商品视频生成任务：用户、模型、耗时、积分与状态
      </p>
      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>任务 ID</th>
            <th>用户</th>
            <th>Provider</th>
            <th>时长</th>
            <th>状态</th>
            <th>进度</th>
            <th>耗时</th>
            <th>积分</th>
            <th>时间</th>
            <th>视频</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td title={task.id}>{task.id.slice(0, 8)}...</td>
              <td title={task.userId}>{task.userLabel}</td>
              <td>{task.provider}</td>
              <td>{task.duration}s</td>
              <td>{task.status}</td>
              <td>{task.progress}%</td>
              <td>{formatDuration(task.durationMs)}</td>
              <td>{task.cost}</td>
              <td>{new Date(task.createdAt).toLocaleString()}</td>
              <td>
                {task.videoUrl ? (
                  <a href={task.videoUrl} target="_blank" rel="noreferrer">
                    查看
                  </a>
                ) : (
                  task.error ?? "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
