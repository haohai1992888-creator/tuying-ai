"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface FeedbackItem {
  id: string;
  userLabel: string;
  category: string;
  content: string;
  status: string;
  adminReply: string | null;
  taskId: string | null;
  model: string | null;
  error: string | null;
  createdAt: string;
}

export default function FeedbackPage() {
  const router = useRouter();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [reply, setReply] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function load() {
    const res = await apiFetch<FeedbackItem[]>("/api/admin/beta/feedback");
    if (!res.success) {
      router.push("/login");
      return;
    }
    setItems(res.data ?? []);
  }

  useEffect(() => {
    load();
  }, [router]);

  async function sendReply(id: string) {
    const res = await apiFetch(`/api/admin/beta/feedback/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ adminReply: reply[id] ?? "" }),
    });
    setMessage(res.success ? "已回复" : (res.message ?? "失败"));
    load();
  }

  async function close(id: string) {
    const res = await apiFetch(`/api/admin/beta/feedback/${id}/close`, { method: "POST" });
    setMessage(res.success ? "已关闭" : (res.message ?? "失败"));
    load();
  }

  return (
    <div>
      <h1>Feedback</h1>
      <p style={{ color: "#64748b" }}>BUG · 建议 · 模型问题 · 功能需求</p>
      {message && <p>{message}</p>}

      {items.map((item) => (
        <div key={item.id} className="card" style={{ marginTop: 16, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{item.category}</strong>
            <span>{item.status}</span>
          </div>
          <p style={{ marginTop: 8 }}>{item.content}</p>
          <p style={{ fontSize: 12, color: "#64748b" }}>
            {item.userLabel} · {new Date(item.createdAt).toLocaleString()}
            {item.taskId && ` · task: ${item.taskId}`}
            {item.model && ` · model: ${item.model}`}
          </p>
          {item.error && <pre style={{ fontSize: 12, background: "#fef2f2", padding: 8 }}>{item.error}</pre>}
          {item.adminReply && <p style={{ marginTop: 8 }}>回复: {item.adminReply}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input
              className="input"
              placeholder="管理员回复"
              value={reply[item.id] ?? ""}
              onChange={(e) => setReply({ ...reply, [item.id]: e.target.value })}
            />
            <button className="btn btn-secondary" onClick={() => sendReply(item.id)}>回复</button>
            <button className="btn btn-secondary" onClick={() => close(item.id)}>关闭</button>
          </div>
        </div>
      ))}
    </div>
  );
}
